const express = require('express');
const { body, query } = require('express-validator');
const contentController = require('../controllers/contentController');
const { authenticateToken, checkRole } = require('../middlewares/authMiddleware');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Validation middleware
const contentGenerationValidation = [
    body('type')
        .isIn(['blog', 'social_post', 'email', 'design_doc', 'changelog', 'internal_comm'])
        .withMessage('Invalid content type'),
    body('prompt')
        .notEmpty()
        .withMessage('Prompt is required')
        .isLength({ max: 1000 })
        .withMessage('Prompt must not exceed 1000 characters'),
    body('params')
        .optional()
        .isObject()
        .withMessage('Params must be an object')
];

const contentUpdateValidation = [
    body('content')
        .notEmpty()
        .withMessage('Content is required'),
    body('status')
        .optional()
        .isIn(['draft', 'published', 'archived'])
        .withMessage('Invalid status')
];

// Content generation routes
router.post(
    '/generate',
    contentGenerationValidation,
    contentController.generateContent
);

router.post(
    '/improve',
    [
        body('contentId').notEmpty().withMessage('Content ID is required'),
        body('feedback').notEmpty().withMessage('Feedback is required')
    ],
    contentController.improveContent
);

// Content management routes
router.get(
    '/',
    [
        query('type').optional().isIn(['blog', 'social_post', 'email', 'design_doc', 'changelog', 'internal_comm']),
        query('status').optional().isIn(['draft', 'published', 'archived']),
        query('page').optional().isInt({ min: 1 }),
        query('limit').optional().isInt({ min: 1, max: 50 })
    ],
    contentController.listContent
);

router.get(
    '/:id',
    contentController.getContent
);

router.put(
    '/:id',
    contentUpdateValidation,
    contentController.updateContent
);

router.delete(
    '/:id',
    contentController.deleteContent
);

// Content distribution routes
router.post(
    '/:id/publish',
    [
        body('channels')
            .isArray()
            .withMessage('Channels must be an array')
            .notEmpty()
            .withMessage('At least one channel is required'),
        body('channels.*')
            .isIn(['website', 'twitter', 'linkedin', 'email', 'slack'])
            .withMessage('Invalid channel')
    ],
    contentController.publishContent
);

router.post(
    '/:id/schedule',
    [
        body('publishAt')
            .isISO8601()
            .withMessage('Invalid date format'),
        body('timezone')
            .matches(/^[A-Za-z_/]+$/)
            .withMessage('Invalid timezone format'),
        body('channels')
            .isArray()
            .withMessage('Channels must be an array')
    ],
    contentController.scheduleContent
);

// Content analytics routes
router.get(
    '/:id/analytics',
    [
        query('startDate').optional().isISO8601(),
        query('endDate').optional().isISO8601()
    ],
    contentController.getContentAnalytics
);

// Figma integration routes
router.post(
    '/:id/figma/sync',
    [
        body('fileId').notEmpty().withMessage('Figma file ID is required'),
        body('nodeIds').optional().isArray()
    ],
    contentController.syncWithFigma
);

router.get(
    '/:id/figma/elements',
    contentController.getFigmaElements
);

// Version control routes
router.get(
    '/:id/versions',
    contentController.getContentVersions
);

router.get(
    '/:id/versions/:version',
    contentController.getContentVersion
);

router.post(
    '/:id/versions/:version/restore',
    contentController.restoreContentVersion
);

// Bulk operations (admin only)
router.post(
    '/bulk/publish',
    checkRole(['admin']),
    [
        body('contentIds')
            .isArray()
            .withMessage('Content IDs must be an array')
            .notEmpty()
            .withMessage('At least one content ID is required'),
        body('channels')
            .isArray()
            .withMessage('Channels must be an array')
            .notEmpty()
            .withMessage('At least one channel is required')
    ],
    contentController.bulkPublishContent
);

router.post(
    '/bulk/archive',
    checkRole(['admin']),
    [
        body('contentIds')
            .isArray()
            .withMessage('Content IDs must be an array')
            .notEmpty()
            .withMessage('At least one content ID is required')
    ],
    contentController.bulkArchiveContent
);

// Export router
module.exports = router;