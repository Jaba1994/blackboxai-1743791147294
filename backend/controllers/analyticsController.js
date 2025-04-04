const { validationResult } = require('express-validator');
const Content = require('../models/Content');
const Analytics = require('../models/Analytics');
const logger = require('../utils/logger');
const { APIError } = require('../middlewares/errorHandler');

class AnalyticsController {
    /**
     * Get dashboard analytics
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @param {NextFunction} next - Express next function
     */
    async getDashboardAnalytics(req, res, next) {
        try {
            const { startDate, endDate, type } = req.query;
            const query = {
                company: req.user.company._id
            };

            if (type) query.type = type;

            const dateRange = {
                $gte: startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                $lte: endDate ? new Date(endDate) : new Date()
            };

            // Get content metrics
            const contentMetrics = await Content.aggregate([
                { $match: query },
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 }
                    }
                }
            ]);

            // Get analytics metrics
            const analyticsMetrics = await Analytics.aggregate([
                {
                    $match: {
                        company: req.user.company._id,
                        'timeSeriesData.date': dateRange
                    }
                },
                {
                    $unwind: '$timeSeriesData'
                },
                {
                    $group: {
                        _id: null,
                        totalViews: { $sum: '$timeSeriesData.metrics.views' },
                        totalEngagement: {
                            $sum: {
                                $add: [
                                    '$timeSeriesData.metrics.likes',
                                    '$timeSeriesData.metrics.shares',
                                    '$timeSeriesData.metrics.comments'
                                ]
                            }
                        },
                        averageSentiment: { $avg: '$timeSeriesData.metrics.sentiment' }
                    }
                }
            ]);

            res.json({
                contentMetrics: this.formatContentMetrics(contentMetrics),
                analyticsMetrics: analyticsMetrics[0] || {
                    totalViews: 0,
                    totalEngagement: 0,
                    averageSentiment: 0
                }
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Get content performance analytics
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @param {NextFunction} next - Express next function
     */
    async getContentPerformance(req, res, next) {
        try {
            const { startDate, endDate, type, sortBy = 'views', limit = 10 } = req.query;

            const query = {
                company: req.user.company._id,
                'timeSeriesData.date': {
                    $gte: startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                    $lte: endDate ? new Date(endDate) : new Date()
                }
            };

            const contentQuery = type ? { type } : {};

            const analytics = await Analytics.aggregate([
                { $match: query },
                {
                    $lookup: {
                        from: 'contents',
                        localField: 'contentId',
                        foreignField: '_id',
                        as: 'content'
                    }
                },
                { $unwind: '$content' },
                { $match: { 'content': contentQuery } },
                {
                    $project: {
                        contentId: 1,
                        title: '$content.title',
                        type: '$content.type',
                        metrics: {
                            views: { $sum: '$timeSeriesData.metrics.views' },
                            engagement: {
                                $sum: {
                                    $add: [
                                        '$timeSeriesData.metrics.likes',
                                        '$timeSeriesData.metrics.shares',
                                        '$timeSeriesData.metrics.comments'
                                    ]
                                }
                            },
                            sentiment: { $avg: '$timeSeriesData.metrics.sentiment' }
                        }
                    }
                },
                { $sort: { [`metrics.${sortBy}`]: -1 } },
                { $limit: parseInt(limit) }
            ]);

            res.json({ performance: analytics });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Get engagement metrics
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @param {NextFunction} next - Express next function
     */
    async getEngagementMetrics(req, res, next) {
        try {
            const { startDate, endDate, channel } = req.query;

            const query = {
                company: req.user.company._id,
                'timeSeriesData.date': {
                    $gte: startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                    $lte: endDate ? new Date(endDate) : new Date()
                }
            };

            if (channel) {
                query['distribution.channels.platform'] = channel;
            }

            const metrics = await Analytics.aggregate([
                { $match: query },
                {
                    $unwind: '$timeSeriesData'
                },
                {
                    $group: {
                        _id: null,
                        likes: { $sum: '$timeSeriesData.metrics.likes' },
                        shares: { $sum: '$timeSeriesData.metrics.shares' },
                        comments: { $sum: '$timeSeriesData.metrics.comments' },
                        totalEngagement: {
                            $sum: {
                                $add: [
                                    '$timeSeriesData.metrics.likes',
                                    '$timeSeriesData.metrics.shares',
                                    '$timeSeriesData.metrics.comments'
                                ]
                            }
                        }
                    }
                }
            ]);

            res.json({
                engagement: metrics[0] || {
                    likes: 0,
                    shares: 0,
                    comments: 0,
                    totalEngagement: 0
                }
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Get sentiment analysis
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @param {NextFunction} next - Express next function
     */
    async getSentimentAnalysis(req, res, next) {
        try {
            const { startDate, endDate, type } = req.query;

            const query = {
                company: req.user.company._id,
                'timeSeriesData.date': {
                    $gte: startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                    $lte: endDate ? new Date(endDate) : new Date()
                }
            };

            const contentQuery = type ? { type } : {};

            const sentiment = await Analytics.aggregate([
                { $match: query },
                {
                    $lookup: {
                        from: 'contents',
                        localField: 'contentId',
                        foreignField: '_id',
                        as: 'content'
                    }
                },
                { $unwind: '$content' },
                { $match: { 'content': contentQuery } },
                {
                    $group: {
                        _id: null,
                        averageSentiment: { $avg: '$sentiment.overall.score' },
                        sentimentDistribution: {
                            $push: {
                                score: '$sentiment.overall.score',
                                timestamp: '$sentiment.overall.lastAnalyzed'
                            }
                        }
                    }
                }
            ]);

            res.json({
                sentiment: sentiment[0] || {
                    averageSentiment: 0,
                    sentimentDistribution: []
                }
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Get distribution analytics
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @param {NextFunction} next - Express next function
     */
    async getDistributionAnalytics(req, res, next) {
        try {
            const { startDate, endDate, channel } = req.query;

            const query = {
                company: req.user.company._id,
                'distribution.channels.publishedAt': {
                    $gte: startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                    $lte: endDate ? new Date(endDate) : new Date()
                }
            };

            if (channel) {
                query['distribution.channels.platform'] = channel;
            }

            const distribution = await Content.aggregate([
                { $match: query },
                { $unwind: '$distribution.channels' },
                {
                    $group: {
                        _id: '$distribution.channels.platform',
                        count: { $sum: 1 },
                        published: {
                            $sum: {
                                $cond: [
                                    { $eq: ['$distribution.channels.status', 'published'] },
                                    1,
                                    0
                                ]
                            }
                        },
                        pending: {
                            $sum: {
                                $cond: [
                                    { $eq: ['$distribution.channels.status', 'pending'] },
                                    1,
                                    0
                                ]
                            }
                        },
                        failed: {
                            $sum: {
                                $cond: [
                                    { $eq: ['$distribution.channels.status', 'failed'] },
                                    1,
                                    0
                                ]
                            }
                        }
                    }
                }
            ]);

            res.json({ distribution });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Get time series data
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @param {NextFunction} next - Express next function
     */
    async getTimeSeriesData(req, res, next) {
        try {
            const { startDate, endDate, metric, interval } = req.query;

            const query = {
                company: req.user.company._id,
                'timeSeriesData.date': {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                }
            };

            const timeSeries = await Analytics.aggregate([
                { $match: query },
                { $unwind: '$timeSeriesData' },
                {
                    $group: {
                        _id: {
                            $dateToString: {
                                format: this.getDateFormat(interval),
                                date: '$timeSeriesData.date'
                            }
                        },
                        value: { $sum: `$timeSeriesData.metrics.${metric}` }
                    }
                },
                { $sort: { '_id': 1 } }
            ]);

            res.json({ timeSeries });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Get user activity
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @param {NextFunction} next - Express next function
     */
    async getUserActivity(req, res, next) {
        try {
            const { startDate, endDate, userId } = req.query;

            const query = {
                company: req.user.company._id,
                createdAt: {
                    $gte: startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                    $lte: endDate ? new Date(endDate) : new Date()
                }
            };

            if (userId) {
                query.author = userId;
            }

            const activity = await Content.aggregate([
                { $match: query },
                {
                    $group: {
                        _id: '$author',
                        contentCreated: { $sum: 1 },
                        contentPublished: {
                            $sum: {
                                $cond: [{ $eq: ['$status', 'published'] }, 1, 0]
                            }
                        }
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'user'
                    }
                },
                { $unwind: '$user' },
                {
                    $project: {
                        name: '$user.name',
                        email: '$user.email',
                        contentCreated: 1,
                        contentPublished: 1
                    }
                }
            ]);

            res.json({ activity });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Get content type distribution
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @param {NextFunction} next - Express next function
     */
    async getContentTypeDistribution(req, res, next) {
        try {
            const { startDate, endDate } = req.query;

            const query = {
                company: req.user.company._id,
                createdAt: {
                    $gte: startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                    $lte: endDate ? new Date(endDate) : new Date()
                }
            };

            const distribution = await Content.aggregate([
                { $match: query },
                {
                    $group: {
                        _id: '$type',
                        count: { $sum: 1 }
                    }
                }
            ]);

            res.json({ distribution });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Get channel performance
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @param {NextFunction} next - Express next function
     */
    async getChannelPerformance(req, res, next) {
        try {
            const { startDate, endDate, channel } = req.query;

            const query = {
                company: req.user.company._id,
                'metrics.distribution.channels.lastUpdated': {
                    $gte: startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                    $lte: endDate ? new Date(endDate) : new Date()
                }
            };

            if (channel) {
                query['metrics.distribution.channels.platform'] = channel;
            }

            const performance = await Analytics.aggregate([
                { $match: query },
                { $unwind: '$metrics.distribution.channels' },
                {
                    $group: {
                        _id: '$metrics.distribution.channels.platform',
                        impressions: { $sum: '$metrics.distribution.channels.metrics.impressions' },
                        clicks: { $sum: '$metrics.distribution.channels.metrics.clicks' },
                        conversions: { $sum: '$metrics.distribution.channels.metrics.conversions' }
                    }
                }
            ]);

            res.json({ performance });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Export analytics
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @param {NextFunction} next - Express next function
     */
    async exportAnalytics(req, res, next) {
        try {
            const { startDate, endDate, format } = req.query;

            const query = {
                company: req.user.company._id,
                createdAt: {
                    $gte: startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                    $lte: endDate ? new Date(endDate) : new Date()
                }
            };

            const data = await Analytics.find(query)
                .populate({
                    path: 'contentId',
                    select: 'title type status'
                });

            const formattedData = this.formatExportData(data, format);

            res.json({ data: formattedData });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Compare analytics between two periods
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @param {NextFunction} next - Express next function
     */
    async compareAnalytics(req, res, next) {
        try {
            const { period1Start, period1End, period2Start, period2End, metric } = req.query;

            const getPeriodData = async (startDate, endDate) => {
                return Analytics.aggregate([
                    {
                        $match: {
                            company: req.user.company._id,
                            'timeSeriesData.date': {
                                $gte: new Date(startDate),
                                $lte: new Date(endDate)
                            }
                        }
                    },
                    {
                        $unwind: '$timeSeriesData'
                    },
                    {
                        $group: {
                            _id: null,
                            total: { $sum: `$timeSeriesData.metrics.${metric}` },
                            average: { $avg: `$timeSeriesData.metrics.${metric}` }
                        }
                    }
                ]);
            };

            const [period1Data, period2Data] = await Promise.all([
                getPeriodData(period1Start, period1End),
                getPeriodData(period2Start, period2End)
            ]);

            const comparison = {
                period1: period1Data[0] || { total: 0, average: 0 },
                period2: period2Data[0] || { total: 0, average: 0 },
                percentageChange: {
                    total: this.calculatePercentageChange(
                        period1Data[0]?.total || 0,
                        period2Data[0]?.total || 0
                    ),
                    average: this.calculatePercentageChange(
                        period1Data[0]?.average || 0,
                        period2Data[0]?.average || 0
                    )
                }
            };

            res.json({ comparison });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Get real-time analytics
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @param {NextFunction} next - Express next function
     */
    async getRealTimeAnalytics(req, res, next) {
        try {
            const lastHour = new Date(Date.now() - 60 * 60 * 1000);

            const realtime = await Analytics.aggregate([
                {
                    $match: {
                        company: req.user.company._id,
                        'metrics.views.timestamp': { $gte: lastHour }
                    }
                },
                {
                    $group: {
                        _id: {
                            $dateToString: {
                                format: '%Y-%m-%d-%H:%M',
                                date: '$metrics.views.timestamp'
                            }
                        },
                        activeUsers: { $addToSet: '$metrics.views.userId' },
                        views: { $sum: 1 }
                    }
                },
                { $sort: { '_id': 1 } }
            ]);

            res.json({ realtime });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Generate custom report
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @param {NextFunction} next - Express next function
     */
    async generateCustomReport(req, res, next) {
        try {
            const { metrics, dimensions, filters, sort } = req.body;

            const pipeline = [];

            // Match stage
            if (filters) {
                pipeline.push({ $match: filters });
            }

            // Group stage
            const groupStage = {
                _id: {},
                metrics: {}
            };

            dimensions.forEach(dim => {
                groupStage._id[dim] = `$${dim}`;
            });

            metrics.forEach(metric => {
                groupStage.metrics[metric] = {
                    $sum: `$${metric}`
                };
            });

            pipeline.push({ $group: groupStage });

            // Sort stage
            if (sort) {
                pipeline.push({ $sort: sort });
            }

            const report = await Analytics.aggregate(pipeline);

            res.json({ report });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Format content metrics
     * @param {Array} metrics - Content metrics array
     * @returns {Object} Formatted metrics
     */
    formatContentMetrics(metrics) {
        return metrics.reduce((acc, curr) => {
            acc[curr._id] = curr.count;
            return acc;
        }, {});
    }

    /**
     * Get date format for time series
     * @param {string} interval - Time interval
     * @returns {string} Date format
     */
    getDateFormat(interval) {
        switch (interval) {
            case 'hour':
                return '%Y-%m-%d-%H';
            case 'day':
                return '%Y-%m-%d';
            case 'week':
                return '%Y-%U';
            case 'month':
                return '%Y-%m';
            default:
                return '%Y-%m-%d';
        }
    }

    /**
     * Calculate percentage change
     * @param {number} oldValue - Old value
     * @param {number} newValue - New value
     * @returns {number} Percentage change
     */
    calculatePercentageChange(oldValue, newValue) {
        if (oldValue === 0) return newValue === 0 ? 0 : 100;
        return ((newValue - oldValue) / oldValue) * 100;
    }

    /**
     * Format export data
     * @param {Array} data - Analytics data
     * @param {string} format - Export format
     * @returns {Object} Formatted data
     */
    formatExportData(data, format) {
        switch (format) {
            case 'csv':
                // Format for CSV
                return data.map(item => ({
                    contentTitle: item.contentId?.title,
                    contentType: item.contentId?.type,
                    status: item.contentId?.status,
                    views: item.metrics.views.length,
                    engagement: item.metrics.engagement.likes.length +
                              item.metrics.engagement.shares.length +
                              item.metrics.engagement.comments.length,
                    sentiment: item.sentiment.overall.score,
                    createdAt: item.createdAt
                }));

            case 'pdf':
                // Format for PDF
                return {
                    summary: {
                        totalContent: data.length,
                        totalViews: data.reduce((sum, item) => sum + item.metrics.views.length, 0),
                        averageSentiment: data.reduce((sum, item) => sum + item.sentiment.overall.score, 0) / data.length
                    },
                    details: data
                };

            case 'json':
            default:
                // Return raw data for JSON
                return data;
        }
    }
}

module.exports = new AnalyticsController();