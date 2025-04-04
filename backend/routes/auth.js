const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middlewares/authMiddleware');

const router = express.Router();

// Validation middleware
const registerValidation = [
    body('email')
        .isEmail()
        .withMessage('Please enter a valid email address'),
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Name is required'),
    body('company.name')
        .trim()
        .notEmpty()
        .withMessage('Company name is required')
];

const loginValidation = [
    body('email')
        .isEmail()
        .withMessage('Please enter a valid email address'),
    body('password')
        .notEmpty()
        .withMessage('Password is required')
];

// Routes
router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);
router.post('/logout', authenticateToken, authController.logout);
router.post('/refresh-token', authController.refreshToken);

// Password management
router.post('/forgot-password', 
    body('email').isEmail().withMessage('Please enter a valid email address'),
    authController.forgotPassword
);

router.post('/reset-password',
    body('token').notEmpty().withMessage('Reset token is required'),
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    authController.resetPassword
);

// User profile
router.get('/profile', authenticateToken, authController.getProfile);
router.put('/profile',
    authenticateToken,
    [
        body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
        body('company.name').optional().trim().notEmpty().withMessage('Company name cannot be empty'),
        body('company.position').optional().trim()
    ],
    authController.updateProfile
);

// API key management
router.post('/api-key', authenticateToken, authController.generateApiKey);
router.delete('/api-key', authenticateToken, authController.revokeApiKey);

// Figma integration
router.post('/figma/connect', authenticateToken, authController.connectFigma);
router.delete('/figma/disconnect', authenticateToken, authController.disconnectFigma);

// Settings
router.put('/settings',
    authenticateToken,
    [
        body('settings.contentPreferences.tone')
            .optional()
            .isIn(['professional', 'casual', 'friendly', 'formal'])
            .withMessage('Invalid tone preference'),
        body('settings.notifications').optional().isObject(),
        body('settings.notifications.*.enabled').optional().isBoolean()
    ],
    authController.updateSettings
);

module.exports = router;