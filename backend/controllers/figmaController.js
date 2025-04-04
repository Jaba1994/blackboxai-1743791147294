const { validationResult } = require('express-validator');
const figmaService = require('../utils/figmaService');
const Content = require('../models/Content');
const logger = require('../utils/logger');
const { APIError } = require('../middlewares/errorHandler');

class FigmaController {
    /**
     * Get Figma file data
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @param {NextFunction} next - Express next function
     */
    async getFile(req, res, next) {
        try {
            const { fileId } = req.params;

            if (!figmaService.isValidFileId(fileId)) {
                throw new APIError('Invalid Figma file ID', 400);
            }

            // Set access token from user's Figma integration
            if (!req.user.hasFigmaToken()) {
                throw new APIError('Figma integration not configured', 400);
            }
            figmaService.setAccessToken(req.user.figmaIntegration.accessToken);

            const fileData = await figmaService.getFile(fileId);

            logger.info('Figma file retrieved successfully', {
                fileId,
                userId: req.user._id
            });

            res.json({ file: fileData });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Get specific nodes from Figma file
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @param {NextFunction} next - Express next function
     */
    async getNodes(req, res, next) {
        try {
            const { fileId } = req.params;
            const { nodeIds } = req.body;

            if (!figmaService.isValidFileId(fileId)) {
                throw new APIError('Invalid Figma file ID', 400);
            }

            figmaService.setAccessToken(req.user.figmaIntegration.accessToken);
            const nodesData = await figmaService.getNodes(fileId, nodeIds);

            logger.info('Figma nodes retrieved successfully', {
                fileId,
                nodeCount: nodeIds.length,
                userId: req.user._id
            });

            res.json({ nodes: nodesData });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Get images for Figma nodes
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @param {NextFunction} next - Express next function
     */
    async getImages(req, res, next) {
        try {
            const { fileId } = req.params;
            const { nodeIds, format = 'png', scale = 2 } = req.body;

            figmaService.setAccessToken(req.user.figmaIntegration.accessToken);
            const images = await figmaService.getImages(fileId, nodeIds, { format, scale });

            logger.info('Figma images retrieved successfully', {
                fileId,
                format,
                imageCount: nodeIds.length,
                userId: req.user._id
            });

            res.json({ images });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Get comments from Figma file
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @param {NextFunction} next - Express next function
     */
    async getComments(req, res, next) {
        try {
            const { fileId } = req.params;

            figmaService.setAccessToken(req.user.figmaIntegration.accessToken);
            const comments = await figmaService.getComments(fileId);

            logger.info('Figma comments retrieved successfully', {
                fileId,
                userId: req.user._id
            });

            res.json({ comments });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Post comment to Figma file
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @param {NextFunction} next - Express next function
     */
    async postComment(req, res, next) {
        try {
            const { fileId } = req.params;
            const { message, position } = req.body;

            figmaService.setAccessToken(req.user.figmaIntegration.accessToken);
            const comment = await figmaService.postComment(fileId, message, position);

            logger.info('Figma comment posted successfully', {
                fileId,
                userId: req.user._id
            });

            res.json({ comment });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Extract design tokens from Figma file
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @param {NextFunction} next - Express next function
     */
    async extractDesignTokens(req, res, next) {
        try {
            const { fileId } = req.params;

            figmaService.setAccessToken(req.user.figmaIntegration.accessToken);
            const tokens = await figmaService.extractDesignTokens(fileId);

            logger.info('Design tokens extracted successfully', {
                fileId,
                userId: req.user._id
            });

            res.json({ tokens });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Sync design elements from Figma
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @param {NextFunction} next - Express next function
     */
    async syncDesignElements(req, res, next) {
        try {
            const { fileId, elements } = req.body;

            figmaService.setAccessToken(req.user.figmaIntegration.accessToken);

            // Get file data
            const fileData = await figmaService.getFile(fileId);

            // Process each element
            const syncResults = await Promise.all(elements.map(async element => {
                const nodeData = await figmaService.getNodes(fileId, [element.nodeId]);
                const imageData = await figmaService.getImages(fileId, [element.nodeId]);

                return {
                    nodeId: element.nodeId,
                    type: nodeData.nodes[element.nodeId].type,
                    name: nodeData.nodes[element.nodeId].name,
                    imageUrl: imageData.images[element.nodeId]
                };
            }));

            // Update content with synced elements
            if (req.body.contentId) {
                const content = await Content.findById(req.body.contentId);
                if (content) {
                    content.figmaElements = syncResults.map(result => ({
                        ...result,
                        fileId,
                        lastSync: new Date()
                    }));
                    await content.save();
                }
            }

            logger.info('Design elements synced successfully', {
                fileId,
                elementCount: elements.length,
                userId: req.user._id
            });

            res.json({
                message: 'Design elements synced successfully',
                elements: syncResults
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Get sync status
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @param {NextFunction} next - Express next function
     */
    async getSyncStatus(req, res, next) {
        try {
            const { syncId } = req.params;

            // In a real implementation, you would track sync status in a database
            const status = {
                id: syncId,
                status: 'completed',
                timestamp: new Date(),
                details: {
                    totalElements: 10,
                    syncedElements: 10,
                    errors: []
                }
            };

            res.json({ status });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Get team libraries
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @param {NextFunction} next - Express next function
     */
    async getTeamLibraries(req, res, next) {
        try {
            const { teamId } = req.params;

            figmaService.setAccessToken(req.user.figmaIntegration.accessToken);
            // This would be implemented in figmaService
            const libraries = await figmaService.getTeamLibraries(teamId);

            res.json({ libraries });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Get library components
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @param {NextFunction} next - Express next function
     */
    async getLibraryComponents(req, res, next) {
        try {
            const { fileId } = req.params;

            figmaService.setAccessToken(req.user.figmaIntegration.accessToken);
            // This would be implemented in figmaService
            const components = await figmaService.getLibraryComponents(fileId);

            res.json({ components });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Get styles from Figma file
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @param {NextFunction} next - Express next function
     */
    async getStyles(req, res, next) {
        try {
            const { fileId } = req.params;

            figmaService.setAccessToken(req.user.figmaIntegration.accessToken);
            // This would be implemented in figmaService
            const styles = await figmaService.getStyles(fileId);

            res.json({ styles });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Apply style to nodes
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @param {NextFunction} next - Express next function
     */
    async applyStyle(req, res, next) {
        try {
            const { fileId, nodeIds, styleId } = req.body;

            figmaService.setAccessToken(req.user.figmaIntegration.accessToken);
            // This would be implemented in figmaService
            const result = await figmaService.applyStyle(fileId, nodeIds, styleId);

            res.json({ result });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Get file versions
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @param {NextFunction} next - Express next function
     */
    async getFileVersions(req, res, next) {
        try {
            const { fileId } = req.params;

            figmaService.setAccessToken(req.user.figmaIntegration.accessToken);
            // This would be implemented in figmaService
            const versions = await figmaService.getFileVersions(fileId);

            res.json({ versions });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Restore file version
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @param {NextFunction} next - Express next function
     */
    async restoreVersion(req, res, next) {
        try {
            const { fileId, versionId } = req.params;

            figmaService.setAccessToken(req.user.figmaIntegration.accessToken);
            // This would be implemented in figmaService
            const result = await figmaService.restoreVersion(fileId, versionId);

            res.json({ result });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Export file
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @param {NextFunction} next - Express next function
     */
    async exportFile(req, res, next) {
        try {
            const { fileId, format } = req.body;

            figmaService.setAccessToken(req.user.figmaIntegration.accessToken);
            // This would be implemented in figmaService
            const exportUrl = await figmaService.exportFile(fileId, format);

            res.json({ exportUrl });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Create webhook
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @param {NextFunction} next - Express next function
     */
    async createWebhook(req, res, next) {
        try {
            const { event, endpoint } = req.body;

            figmaService.setAccessToken(req.user.figmaIntegration.accessToken);
            // This would be implemented in figmaService
            const webhook = await figmaService.createWebhook(event, endpoint);

            res.json({ webhook });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Delete webhook
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @param {NextFunction} next - Express next function
     */
    async deleteWebhook(req, res, next) {
        try {
            const { webhookId } = req.params;

            figmaService.setAccessToken(req.user.figmaIntegration.accessToken);
            // This would be implemented in figmaService
            await figmaService.deleteWebhook(webhookId);

            res.json({ message: 'Webhook deleted successfully' });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Get teams
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @param {NextFunction} next - Express next function
     */
    async getTeams(req, res, next) {
        try {
            figmaService.setAccessToken(req.user.figmaIntegration.accessToken);
            // This would be implemented in figmaService
            const teams = await figmaService.getTeams();

            res.json({ teams });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Get team projects
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @param {NextFunction} next - Express next function
     */
    async getTeamProjects(req, res, next) {
        try {
            const { teamId } = req.params;

            figmaService.setAccessToken(req.user.figmaIntegration.accessToken);
            // This would be implemented in figmaService
            const projects = await figmaService.getTeamProjects(teamId);

            res.json({ projects });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Search Figma files
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @param {NextFunction} next - Express next function
     */
    async search(req, res, next) {
        try {
            const { query } = req.query;

            figmaService.setAccessToken(req.user.figmaIntegration.accessToken);
            // This would be implemented in figmaService
            const results = await figmaService.search(query);

            res.json({ results });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Batch operation
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @param {NextFunction} next - Express next function
     */
    async batchOperation(req, res, next) {
        try {
            const { operations } = req.body;

            figmaService.setAccessToken(req.user.figmaIntegration.accessToken);
            // This would be implemented in figmaService
            const results = await figmaService.batchOperation(operations);

            res.json({ results });

        } catch (error) {
            next(error);
        }
    }
}

module.exports = new FigmaController();