const { validationResult } = require('express-validator');
const Content = require('../models/Content');
const Analytics = require('../models/Analytics');
const aiService = require('../utils/aiService');
const figmaService = require('../utils/figmaService');
const logger = require('../utils/logger');
const { APIError } = require('../middlewares/errorHandler');

class ContentController {
    /**
     * Generate new content using AI
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @param {NextFunction} next - Express next function
     */
    async generateContent(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                throw new APIError('Validation error', 400, errors.array());
            }

            const { type, prompt, params } = req.body;

            // Generate content using AI service
            const generated = await aiService.generateContent(type, {
                ...params,
                prompt,
                tone: req.user.settings?.contentPreferences?.tone || 'professional'
            });

            // Create new content document
            const content = new Content({
                type,
                content: generated.content,
                metadata: {
                    prompt,
                    ...generated.metadata
                },
                author: req.user._id,
                company: req.user.company._id
            });

            await content.save();

            // Initialize analytics
            const analytics = new Analytics({
                contentId: content._id,
                company: req.user.company._id
            });

            await analytics.save();

            logger.info('Content generated successfully', {
                contentId: content._id,
                type,
                userId: req.user._id
            });

            res.status(201).json({
                message: 'Content generated successfully',
                content
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Improve existing content using AI and feedback
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @param {NextFunction} next - Express next function
     */
    async improveContent(req, res, next) {
        try {
            const { contentId, feedback } = req.body;

            const content = await Content.findById(contentId);
            if (!content) {
                throw new APIError('Content not found', 404);
            }

            // Check ownership
            if (content.author.toString() !== req.user._id.toString()) {
                throw new APIError('Unauthorized', 403);
            }

            // Improve content using AI
            const improvedContent = await aiService.improveContent(
                content.content,
                feedback
            );

            // Add revision
            await content.addRevision(
                req.user._id,
                improvedContent,
                `Improved based on feedback: ${feedback}`
            );

            logger.info('Content improved successfully', {
                contentId: content._id,
                userId: req.user._id
            });

            res.json({
                message: 'Content improved successfully',
                content
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * List content with filters and pagination
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @param {NextFunction} next - Express next function
     */
    async listContent(req, res, next) {
        try {
            const { type, status, page = 1, limit = 10 } = req.query;

            const query = {
                company: req.user.company._id,
                isArchived: false
            };

            if (type) query.type = type;
            if (status) query.status = status;

            const contents = await Content.find(query)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .populate('author', 'name email');

            const total = await Content.countDocuments(query);

            res.json({
                contents,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Get single content by ID
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @param {NextFunction} next - Express next function
     */
    async getContent(req, res, next) {
        try {
            const content = await Content.findById(req.params.id)
                .populate('author', 'name email');

            if (!content) {
                throw new APIError('Content not found', 404);
            }

            // Check company access
            if (content.company.toString() !== req.user.company._id.toString()) {
                throw new APIError('Unauthorized', 403);
            }

            // Increment views
            await Analytics.findOneAndUpdate(
                { contentId: content._id },
                {
                    $push: {
                        'metrics.views': {
                            timestamp: new Date(),
                            source: 'api',
                            userAgent: req.get('user-agent')
                        }
                    }
                }
            );

            res.json({ content });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Update content
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @param {NextFunction} next - Express next function
     */
    async updateContent(req, res, next) {
        try {
            const content = await Content.findById(req.params.id);
            if (!content) {
                throw new APIError('Content not found', 404);
            }

            // Check ownership
            if (content.author.toString() !== req.user._id.toString()) {
                throw new APIError('Unauthorized', 403);
            }

            const { content: newContent, status } = req.body;

            // Add revision before updating
            await content.addRevision(
                req.user._id,
                content.content,
                'Manual update'
            );

            // Update content
            content.content = newContent;
            if (status) content.status = status;

            await content.save();

            logger.info('Content updated successfully', {
                contentId: content._id,
                userId: req.user._id
            });

            res.json({
                message: 'Content updated successfully',
                content
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Delete (archive) content
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @param {NextFunction} next - Express next function
     */
    async deleteContent(req, res, next) {
        try {
            const content = await Content.findById(req.params.id);
            if (!content) {
                throw new APIError('Content not found', 404);
            }

            // Check ownership
            if (content.author.toString() !== req.user._id.toString()) {
                throw new APIError('Unauthorized', 403);
            }

            content.isArchived = true;
            await content.save();

            logger.info('Content archived successfully', {
                contentId: content._id,
                userId: req.user._id
            });

            res.json({ message: 'Content archived successfully' });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Publish content to specified channels
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @param {NextFunction} next - Express next function
     */
    async publishContent(req, res, next) {
        try {
            const { channels } = req.body;
            const content = await Content.findById(req.params.id);

            if (!content) {
                throw new APIError('Content not found', 404);
            }

            // Check ownership
            if (content.author.toString() !== req.user._id.toString()) {
                throw new APIError('Unauthorized', 403);
            }

            // Update distribution status for each channel
            content.distribution.channels = channels.map(channel => ({
                platform: channel,
                status: 'published',
                publishedAt: new Date()
            }));

            content.status = 'published';
            await content.save();

            logger.info('Content published successfully', {
                contentId: content._id,
                channels,
                userId: req.user._id
            });

            res.json({
                message: 'Content published successfully',
                content
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Schedule content for publishing
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @param {NextFunction} next - Express next function
     */
    async scheduleContent(req, res, next) {
        try {
            const { publishAt, timezone, channels } = req.body;
            const content = await Content.findById(req.params.id);

            if (!content) {
                throw new APIError('Content not found', 404);
            }

            // Check ownership
            if (content.author.toString() !== req.user._id.toString()) {
                throw new APIError('Unauthorized', 403);
            }

            content.distribution.schedule = {
                publishAt: new Date(publishAt),
                timezone
            };

            content.distribution.channels = channels.map(channel => ({
                platform: channel,
                status: 'pending'
            }));

            await content.save();

            logger.info('Content scheduled successfully', {
                contentId: content._id,
                publishAt,
                channels,
                userId: req.user._id
            });

            res.json({
                message: 'Content scheduled successfully',
                content
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Get content analytics
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @param {NextFunction} next - Express next function
     */
    async getContentAnalytics(req, res, next) {
        try {
            const { startDate, endDate } = req.query;
            
            const analytics = await Analytics.getByDateRange(
                req.params.id,
                startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                endDate ? new Date(endDate) : new Date()
            );

            if (!analytics) {
                throw new APIError('Analytics not found', 404);
            }

            res.json({ analytics });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Sync content with Figma
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @param {NextFunction} next - Express next function
     */
    async syncWithFigma(req, res, next) {
        try {
            const { fileId, nodeIds } = req.body;
            const content = await Content.findById(req.params.id);

            if (!content) {
                throw new APIError('Content not found', 404);
            }

            if (!req.user.hasFigmaToken()) {
                throw new APIError('Figma integration not configured', 400);
            }

            // Set Figma access token
            figmaService.setAccessToken(req.user.figmaIntegration.accessToken);

            // Get Figma file data
            const figmaData = await figmaService.getNodes(fileId, nodeIds);

            // Extract design tokens
            const designTokens = await figmaService.extractDesignTokens(fileId);

            // Update content with Figma elements
            content.figmaElements = nodeIds.map(nodeId => ({
                fileId,
                nodeId,
                type: figmaData.nodes[nodeId].type,
                name: figmaData.nodes[nodeId].name,
                lastSync: new Date()
            }));

            await content.save();

            logger.info('Content synced with Figma successfully', {
                contentId: content._id,
                fileId,
                userId: req.user._id
            });

            res.json({
                message: 'Content synced with Figma successfully',
                content,
                designTokens
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Get Figma elements for content
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @param {NextFunction} next - Express next function
     */
    async getFigmaElements(req, res, next) {
        try {
            const content = await Content.findById(req.params.id);
            if (!content) {
                throw new APIError('Content not found', 404);
            }

            res.json({ figmaElements: content.figmaElements });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Get content versions
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @param {NextFunction} next - Express next function
     */
    async getContentVersions(req, res, next) {
        try {
            const content = await Content.findById(req.params.id);
            if (!content) {
                throw new APIError('Content not found', 404);
            }

            res.json({ versions: content.revisions });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Get specific content version
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @param {NextFunction} next - Express next function
     */
    async getContentVersion(req, res, next) {
        try {
            const content = await Content.findById(req.params.id);
            if (!content) {
                throw new APIError('Content not found', 404);
            }

            const version = content.revisions.find(
                rev => rev.version === parseInt(req.params.version)
            );

            if (!version) {
                throw new APIError('Version not found', 404);
            }

            res.json({ version });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Restore content to specific version
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @param {NextFunction} next - Express next function
     */
    async restoreContentVersion(req, res, next) {
        try {
            const content = await Content.findById(req.params.id);
            if (!content) {
                throw new APIError('Content not found', 404);
            }

            const version = content.revisions.find(
                rev => rev.version === parseInt(req.params.version)
            );

            if (!version) {
                throw new APIError('Version not found', 404);
            }

            // Add current version to revisions before restoring
            await content.addRevision(
                req.user._id,
                content.content,
                `Restored to version ${req.params.version}`
            );

            // Restore content
            content.content = version.content;
            await content.save();

            logger.info('Content version restored successfully', {
                contentId: content._id,
                version: req.params.version,
                userId: req.user._id
            });

            res.json({
                message: 'Content version restored successfully',
                content
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Bulk publish content (admin only)
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @param {NextFunction} next - Express next function
     */
    async bulkPublishContent(req, res, next) {
        try {
            const { contentIds, channels } = req.body;

            const contents = await Content.find({
                _id: { $in: contentIds },
                company: req.user.company._id
            });

            if (!contents.length) {
                throw new APIError('No content found', 404);
            }

            // Update all contents
            await Promise.all(contents.map(async content => {
                content.distribution.channels = channels.map(channel => ({
                    platform: channel,
                    status: 'published',
                    publishedAt: new Date()
                }));
                content.status = 'published';
                return content.save();
            }));

            logger.info('Bulk content publish completed', {
                contentIds,
                channels,
                userId: req.user._id
            });

            res.json({
                message: 'Contents published successfully',
                count: contents.length
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Bulk archive content (admin only)
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @param {NextFunction} next - Express next function
     */
    async bulkArchiveContent(req, res, next) {
        try {
            const { contentIds } = req.body;

            const result = await Content.updateMany(
                {
                    _id: { $in: contentIds },
                    company: req.user.company._id
                },
                {
                    $set: { isArchived: true }
                }
            );

            logger.info('Bulk content archive completed', {
                contentIds,
                userId: req.user._id
            });

            res.json({
                message: 'Contents archived successfully',
                count: result.modifiedCount
            });

        } catch (error) {
            next(error);
        }
    }
}

module.exports = new ContentController();