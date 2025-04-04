const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const logger = require('../utils/logger');
const { APIError } = require('../middlewares/errorHandler');
const figmaService = require('../utils/figmaService');

class AuthController {
    /**
     * Register a new user
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @param {NextFunction} next - Express next function
     */
    async register(req, res, next) {
        try {
            // Validate request
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                throw new APIError('Validation error', 400, errors.array());
            }

            const { email, password, name, company } = req.body;

            // Check if user already exists
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                throw new APIError('User already exists', 409);
            }

            // Create new user
            const user = new User({
                email,
                password, // Will be hashed by pre-save middleware
                name,
                company
            });

            await user.save();

            // Generate tokens
            const { accessToken, refreshToken } = this.generateTokens(user);

            logger.info('User registered successfully', { userId: user._id });

            res.status(201).json({
                message: 'User registered successfully',
                user: user.toJSON(),
                accessToken,
                refreshToken
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Login user
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @param {NextFunction} next - Express next function
     */
    async login(req, res, next) {
        try {
            const { email, password } = req.body;

            // Find user
            const user = await User.findOne({ email });
            if (!user) {
                throw new APIError('Invalid credentials', 401);
            }

            // Check password
            const isValidPassword = await user.comparePassword(password);
            if (!isValidPassword) {
                throw new APIError('Invalid credentials', 401);
            }

            // Update last login
            user.lastLogin = new Date();
            await user.save();

            // Generate tokens
            const { accessToken, refreshToken } = this.generateTokens(user);

            logger.info('User logged in successfully', { userId: user._id });

            res.json({
                message: 'Login successful',
                user: user.toJSON(),
                accessToken,
                refreshToken
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Logout user
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     */
    async logout(req, res) {
        // In a production environment, you might want to invalidate the refresh token
        // by storing it in a blacklist or database
        logger.info('User logged out successfully', { userId: req.user._id });
        
        res.json({ message: 'Logout successful' });
    }

    /**
     * Refresh access token
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @param {NextFunction} next - Express next function
     */
    async refreshToken(req, res, next) {
        try {
            const { refreshToken } = req.body;
            if (!refreshToken) {
                throw new APIError('Refresh token is required', 400);
            }

            // Verify refresh token
            const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
            
            // Get user
            const user = await User.findById(decoded.userId);
            if (!user) {
                throw new APIError('User not found', 404);
            }

            // Generate new tokens
            const tokens = this.generateTokens(user);

            res.json({
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken
            });

        } catch (error) {
            if (error instanceof jwt.JsonWebTokenError) {
                next(new APIError('Invalid refresh token', 401));
            } else {
                next(error);
            }
        }
    }

    /**
     * Get user profile
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     */
    async getProfile(req, res) {
        res.json({ user: req.user.toJSON() });
    }

    /**
     * Update user profile
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @param {NextFunction} next - Express next function
     */
    async updateProfile(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                throw new APIError('Validation error', 400, errors.array());
            }

            const allowedUpdates = ['name', 'company'];
            const updates = Object.keys(req.body)
                .filter(key => allowedUpdates.includes(key))
                .reduce((obj, key) => {
                    obj[key] = req.body[key];
                    return obj;
                }, {});

            const user = await User.findByIdAndUpdate(
                req.user._id,
                updates,
                { new: true, runValidators: true }
            );

            logger.info('User profile updated', { userId: user._id });

            res.json({
                message: 'Profile updated successfully',
                user: user.toJSON()
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Generate API key
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @param {NextFunction} next - Express next function
     */
    async generateApiKey(req, res, next) {
        try {
            const apiKey = req.user.generateApiKey();
            await req.user.save();

            logger.info('API key generated', { userId: req.user._id });

            res.json({
                message: 'API key generated successfully',
                apiKey
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Revoke API key
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @param {NextFunction} next - Express next function
     */
    async revokeApiKey(req, res, next) {
        try {
            req.user.apiKey = undefined;
            await req.user.save();

            logger.info('API key revoked', { userId: req.user._id });

            res.json({ message: 'API key revoked successfully' });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Connect Figma account
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @param {NextFunction} next - Express next function
     */
    async connectFigma(req, res, next) {
        try {
            const { accessToken } = req.body;
            if (!accessToken) {
                throw new APIError('Figma access token is required', 400);
            }

            // Verify token by making a test API call
            figmaService.setAccessToken(accessToken);
            await figmaService.getFile('test');

            // Save Figma integration details
            req.user.figmaIntegration = {
                accessToken,
                lastSync: new Date()
            };
            await req.user.save();

            logger.info('Figma account connected', { userId: req.user._id });

            res.json({ message: 'Figma account connected successfully' });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Disconnect Figma account
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @param {NextFunction} next - Express next function
     */
    async disconnectFigma(req, res, next) {
        try {
            req.user.figmaIntegration = undefined;
            await req.user.save();

            logger.info('Figma account disconnected', { userId: req.user._id });

            res.json({ message: 'Figma account disconnected successfully' });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Update user settings
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @param {NextFunction} next - Express next function
     */
    async updateSettings(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                throw new APIError('Validation error', 400, errors.array());
            }

            req.user.settings = {
                ...req.user.settings,
                ...req.body.settings
            };
            await req.user.save();

            logger.info('User settings updated', { userId: req.user._id });

            res.json({
                message: 'Settings updated successfully',
                settings: req.user.settings
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Generate access and refresh tokens
     * @param {User} user - User document
     * @returns {Object} Access and refresh tokens
     */
    generateTokens(user) {
        const accessToken = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        const refreshToken = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        return { accessToken, refreshToken };
    }
}

module.exports = new AuthController();