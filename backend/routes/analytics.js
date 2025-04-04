const express = require('express');
const { query } = require('express-validator');
const analyticsController = require('../controllers/analyticsController');
const { authenticateToken, checkRole } = require('../middlewares/authMiddleware');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Dashboard analytics
router.get(
    '/dashboard',
    [
        query('startDate').optional().isISO8601(),
        query('endDate').optional().isISO8601(),
        query('type').optional().isIn(['blog', 'social_post', 'email', 'design_doc', 'changelog', 'internal_comm'])
    ],
    analyticsController.getDashboardAnalytics
);

// Content performance
router.get(
    '/content/performance',
    [
        query('startDate').optional().isISO8601(),
        query('endDate').optional().isISO8601(),
        query('type').optional().isIn(['blog', 'social_post', 'email', 'design_doc', 'changelog', 'internal_comm']),
        query('sortBy').optional().isIn(['views', 'engagement', 'sentiment']),
        query('limit').optional().isInt({ min: 1, max: 50 })
    ],
    analyticsController.getContentPerformance
);

// Engagement metrics
router.get(
    '/engagement',
    [
        query('startDate').optional().isISO8601(),
        query('endDate').optional().isISO8601(),
        query('channel').optional().isIn(['website', 'twitter', 'linkedin', 'email', 'slack'])
    ],
    analyticsController.getEngagementMetrics
);

// Sentiment analysis
router.get(
    '/sentiment',
    [
        query('startDate').optional().isISO8601(),
        query('endDate').optional().isISO8601(),
        query('type').optional().isIn(['blog', 'social_post', 'email', 'design_doc', 'changelog', 'internal_comm'])
    ],
    analyticsController.getSentimentAnalysis
);

// Distribution analytics
router.get(
    '/distribution',
    [
        query('startDate').optional().isISO8601(),
        query('endDate').optional().isISO8601(),
        query('channel').optional().isIn(['website', 'twitter', 'linkedin', 'email', 'slack'])
    ],
    analyticsController.getDistributionAnalytics
);

// Time series data
router.get(
    '/timeseries',
    [
        query('startDate').optional().isISO8601(),
        query('endDate').optional().isISO8601(),
        query('metric').isIn(['views', 'engagement', 'sentiment']),
        query('interval').isIn(['hour', 'day', 'week', 'month'])
    ],
    analyticsController.getTimeSeriesData
);

// User activity
router.get(
    '/user-activity',
    [
        query('startDate').optional().isISO8601(),
        query('endDate').optional().isISO8601(),
        query('userId').optional().isMongoId()
    ],
    checkRole(['admin']),
    analyticsController.getUserActivity
);

// Content type distribution
router.get(
    '/content-types',
    [
        query('startDate').optional().isISO8601(),
        query('endDate').optional().isISO8601()
    ],
    analyticsController.getContentTypeDistribution
);

// Channel performance
router.get(
    '/channel-performance',
    [
        query('startDate').optional().isISO8601(),
        query('endDate').optional().isISO8601(),
        query('channel').optional().isIn(['website', 'twitter', 'linkedin', 'email', 'slack'])
    ],
    analyticsController.getChannelPerformance
);

// Export analytics
router.get(
    '/export',
    [
        query('startDate').optional().isISO8601(),
        query('endDate').optional().isISO8601(),
        query('format').isIn(['csv', 'json', 'pdf'])
    ],
    analyticsController.exportAnalytics
);

// Comparative analysis
router.get(
    '/compare',
    [
        query('period1Start').isISO8601(),
        query('period1End').isISO8601(),
        query('period2Start').isISO8601(),
        query('period2End').isISO8601(),
        query('metric').isIn(['views', 'engagement', 'sentiment'])
    ],
    analyticsController.compareAnalytics
);

// Real-time analytics
router.get(
    '/realtime',
    analyticsController.getRealTimeAnalytics
);

// Custom reports (admin only)
router.post(
    '/reports/custom',
    checkRole(['admin']),
    analyticsController.generateCustomReport
);

module.exports = router;