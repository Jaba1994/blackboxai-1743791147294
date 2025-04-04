const axios = require('axios');
const logger = require('./logger');
const { APIError } = require('../middlewares/errorHandler');

class FigmaService {
    constructor() {
        this.baseUrl = 'https://api.figma.com/v1';
        this.axiosInstance = axios.create({
            baseURL: this.baseUrl,
            timeout: 10000
        });
    }

    /**
     * Set access token for Figma API requests
     * @param {string} accessToken - Figma access token
     */
    setAccessToken(accessToken) {
        this.axiosInstance.defaults.headers.common['X-Figma-Token'] = accessToken;
    }

    /**
     * Get file data from Figma
     * @param {string} fileId - Figma file ID
     * @returns {Promise<Object>} File data
     */
    async getFile(fileId) {
        try {
            const response = await this.axiosInstance.get(`/files/${fileId}`);
            return response.data;
        } catch (error) {
            logger.error('Error fetching Figma file:', {
                error: error.message,
                fileId
            });
            throw this.handleError(error);
        }
    }

    /**
     * Get specific nodes from a Figma file
     * @param {string} fileId - Figma file ID
     * @param {string[]} nodeIds - Array of node IDs
     * @returns {Promise<Object>} Node data
     */
    async getNodes(fileId, nodeIds) {
        try {
            const response = await this.axiosInstance.get(
                `/files/${fileId}/nodes?ids=${nodeIds.join(',')}`
            );
            return response.data;
        } catch (error) {
            logger.error('Error fetching Figma nodes:', {
                error: error.message,
                fileId,
                nodeIds
            });
            throw this.handleError(error);
        }
    }

    /**
     * Get image URLs for nodes
     * @param {string} fileId - Figma file ID
     * @param {string[]} nodeIds - Array of node IDs
     * @param {Object} options - Export options
     * @returns {Promise<Object>} Image URLs
     */
    async getImages(fileId, nodeIds, options = { format: 'png', scale: 2 }) {
        try {
            const response = await this.axiosInstance.get(
                `/images/${fileId}?ids=${nodeIds.join(',')}&format=${options.format}&scale=${options.scale}`
            );
            return response.data;
        } catch (error) {
            logger.error('Error fetching Figma images:', {
                error: error.message,
                fileId,
                nodeIds
            });
            throw this.handleError(error);
        }
    }

    /**
     * Get comments from a Figma file
     * @param {string} fileId - Figma file ID
     * @returns {Promise<Object>} Comments data
     */
    async getComments(fileId) {
        try {
            const response = await this.axiosInstance.get(`/files/${fileId}/comments`);
            return response.data;
        } catch (error) {
            logger.error('Error fetching Figma comments:', {
                error: error.message,
                fileId
            });
            throw this.handleError(error);
        }
    }

    /**
     * Post a comment on a Figma file
     * @param {string} fileId - Figma file ID
     * @param {string} message - Comment message
     * @param {Object} position - Comment position
     * @returns {Promise<Object>} Comment data
     */
    async postComment(fileId, message, position) {
        try {
            const response = await this.axiosInstance.post(`/files/${fileId}/comments`, {
                message,
                client_meta: { ...position }
            });
            return response.data;
        } catch (error) {
            logger.error('Error posting Figma comment:', {
                error: error.message,
                fileId
            });
            throw this.handleError(error);
        }
    }

    /**
     * Extract design tokens from Figma file
     * @param {string} fileId - Figma file ID
     * @returns {Promise<Object>} Design tokens
     */
    async extractDesignTokens(fileId) {
        try {
            const fileData = await this.getFile(fileId);
            
            const tokens = {
                colors: new Set(),
                typography: new Set(),
                spacing: new Set(),
                effects: new Set()
            };

            // Recursive function to traverse nodes
            const traverseNodes = (node) => {
                // Extract colors
                if (node.fills) {
                    node.fills.forEach(fill => {
                        if (fill.type === 'SOLID') {
                            tokens.colors.add(this.rgbToHex(fill.color));
                        }
                    });
                }

                // Extract typography
                if (node.style) {
                    tokens.typography.add(JSON.stringify({
                        fontFamily: node.style.fontFamily,
                        fontSize: node.style.fontSize,
                        fontWeight: node.style.fontWeight,
                        lineHeight: node.style.lineHeight
                    }));
                }

                // Extract spacing
                if (node.paddingTop !== undefined) {
                    tokens.spacing.add(JSON.stringify({
                        padding: {
                            top: node.paddingTop,
                            right: node.paddingRight,
                            bottom: node.paddingBottom,
                            left: node.paddingLeft
                        }
                    }));
                }

                // Extract effects
                if (node.effects) {
                    node.effects.forEach(effect => {
                        tokens.effects.add(JSON.stringify(effect));
                    });
                }

                // Traverse children
                if (node.children) {
                    node.children.forEach(traverseNodes);
                }
            };

            traverseNodes(fileData.document);

            // Convert Sets to Arrays and parse JSON strings
            return {
                colors: Array.from(tokens.colors),
                typography: Array.from(tokens.typography).map(JSON.parse),
                spacing: Array.from(tokens.spacing).map(JSON.parse),
                effects: Array.from(tokens.effects).map(JSON.parse)
            };

        } catch (error) {
            logger.error('Error extracting design tokens:', {
                error: error.message,
                fileId
            });
            throw this.handleError(error);
        }
    }

    /**
     * Convert RGB color to hex
     * @param {Object} color - RGB color object
     * @returns {string} Hex color
     */
    rgbToHex(color) {
        const r = Math.round(color.r * 255);
        const g = Math.round(color.g * 255);
        const b = Math.round(color.b * 255);
        return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    }

    /**
     * Handle Figma API errors
     * @param {Error} error - Error object
     * @returns {Error} Formatted error
     */
    handleError(error) {
        if (error.response) {
            const status = error.response.status;
            const message = error.response.data.error || 'Unknown Figma API error';

            switch (status) {
                case 401:
                    return new APIError('Unauthorized: Invalid Figma access token', 401);
                case 403:
                    return new APIError('Forbidden: Insufficient permissions', 403);
                case 404:
                    return new APIError('Not found: Invalid file or node ID', 404);
                case 429:
                    return new APIError('Too many requests: Rate limit exceeded', 429);
                default:
                    return new APIError(`Figma API Error: ${message}`, status);
            }
        }

        return new APIError('Error connecting to Figma API', 500);
    }

    /**
     * Validate Figma file ID format
     * @param {string} fileId - Figma file ID
     * @returns {boolean} Is valid
     */
    isValidFileId(fileId) {
        return /^[\w-]+$/.test(fileId);
    }
}

// Export singleton instance
module.exports = new FigmaService();