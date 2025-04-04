const express = require('express');
const { body } = require('express-validator');
const figmaController = require('../controllers/figmaController');
const { authenticateToken } = require('../middlewares/authMiddleware');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Validation middleware
const fileValidation = [
    body('fileId')
        .notEmpty()
        .withMessage('Figma file ID is required')
        .matches(/^[\w-]+$/)
        .withMessage('Invalid Figma file ID format')
];

const nodeValidation = [
    body('nodeIds')
        .isArray()
        .withMessage('Node IDs must be an array')
        .notEmpty()
        .withMessage('At least one node ID is required')
];

// File operations
router.get(
    '/files/:fileId',
    figmaController.getFile
);

router.get(
    '/files/:fileId/nodes',
    [
        body('nodeIds')
            .isArray()
            .withMessage('Node IDs must be an array')
    ],
    figmaController.getNodes
);

// Image operations
router.get(
    '/files/:fileId/images',
    [
        body('nodeIds').isArray(),
        body('format')
            .optional()
            .isIn(['jpg', 'png', 'svg', 'pdf'])
            .withMessage('Invalid image format'),
        body('scale')
            .optional()
            .isFloat({ min: 0.01, max: 4 })
            .withMessage('Scale must be between 0.01 and 4')
    ],
    figmaController.getImages
);

// Comments
router.get(
    '/files/:fileId/comments',
    figmaController.getComments
);

router.post(
    '/files/:fileId/comments',
    [
        body('message')
            .notEmpty()
            .withMessage('Comment message is required'),
        body('position')
            .optional()
            .isObject()
            .withMessage('Position must be an object')
    ],
    figmaController.postComment
);

// Design tokens
router.get(
    '/files/:fileId/design-tokens',
    figmaController.extractDesignTokens
);

// Sync operations
router.post(
    '/sync',
    [
        ...fileValidation,
        body('elements')
            .isArray()
            .withMessage('Elements must be an array')
    ],
    figmaController.syncDesignElements
);

router.get(
    '/sync/status/:syncId',
    figmaController.getSyncStatus
);

// Component libraries
router.get(
    '/team/:teamId/libraries',
    figmaController.getTeamLibraries
);

router.get(
    '/libraries/:fileId/components',
    figmaController.getLibraryComponents
);

// Styles
router.get(
    '/files/:fileId/styles',
    figmaController.getStyles
);

router.post(
    '/styles/apply',
    [
        ...fileValidation,
        ...nodeValidation,
        body('styleId')
            .notEmpty()
            .withMessage('Style ID is required')
    ],
    figmaController.applyStyle
);

// Version control
router.get(
    '/files/:fileId/versions',
    figmaController.getFileVersions
);

router.post(
    '/files/:fileId/versions/:versionId/restore',
    figmaController.restoreVersion
);

// Export
router.post(
    '/export',
    [
        ...fileValidation,
        body('format')
            .isIn(['pdf', 'svg'])
            .withMessage('Invalid export format')
    ],
    figmaController.exportFile
);

// Webhooks
router.post(
    '/webhooks',
    [
        body('event')
            .isIn(['FILE_UPDATE', 'LIBRARY_PUBLISH', 'COMMENT'])
            .withMessage('Invalid webhook event'),
        body('endpoint')
            .isURL()
            .withMessage('Invalid webhook endpoint')
    ],
    figmaController.createWebhook
);

router.delete(
    '/webhooks/:webhookId',
    figmaController.deleteWebhook
);

// Team management
router.get(
    '/teams',
    figmaController.getTeams
);

router.get(
    '/team/:teamId/projects',
    figmaController.getTeamProjects
);

// Search
router.get(
    '/search',
    [
        body('query')
            .notEmpty()
            .withMessage('Search query is required')
    ],
    figmaController.search
);

// Batch operations
router.post(
    '/batch',
    [
        body('operations')
            .isArray()
            .withMessage('Operations must be an array')
            .notEmpty()
            .withMessage('At least one operation is required')
    ],
    figmaController.batchOperation
);

module.exports = router;