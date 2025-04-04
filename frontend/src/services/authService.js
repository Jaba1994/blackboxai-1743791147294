import axios from '@/utils/axios';

class AuthService {
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise} Registration response
   */
  async register(userData) {
    const response = await axios.post('/api/auth/register', userData);
    return response.data;
  }

  /**
   * Login user
   * @param {Object} credentials - Login credentials
   * @returns {Promise} Login response
   */
  async login(credentials) {
    const response = await axios.post('/api/auth/login', credentials);
    return response.data;
  }

  /**
   * Logout user
   * @returns {Promise} Logout response
   */
  async logout() {
    const response = await axios.post('/api/auth/logout');
    return response.data;
  }

  /**
   * Refresh access token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise} New tokens
   */
  async refreshToken(refreshToken) {
    const response = await axios.post('/api/auth/refresh-token', { refreshToken });
    return response.data;
  }

  /**
   * Get user profile
   * @returns {Promise} User profile
   */
  async getProfile() {
    const response = await axios.get('/api/auth/profile');
    return response.data;
  }

  /**
   * Update user profile
   * @param {Object} profileData - Profile update data
   * @returns {Promise} Updated profile
   */
  async updateProfile(profileData) {
    const response = await axios.put('/api/auth/profile', profileData);
    return response.data;
  }

  /**
   * Request password reset
   * @param {string} email - User email
   * @returns {Promise} Reset request response
   */
  async forgotPassword(email) {
    const response = await axios.post('/api/auth/forgot-password', { email });
    return response.data;
  }

  /**
   * Reset password
   * @param {string} token - Reset token
   * @param {string} password - New password
   * @returns {Promise} Reset response
   */
  async resetPassword(token, password) {
    const response = await axios.post('/api/auth/reset-password', {
      token,
      password
    });
    return response.data;
  }

  /**
   * Generate API key
   * @returns {Promise} API key response
   */
  async generateApiKey() {
    const response = await axios.post('/api/auth/api-key');
    return response.data;
  }

  /**
   * Revoke API key
   * @returns {Promise} Revoke response
   */
  async revokeApiKey() {
    const response = await axios.delete('/api/auth/api-key');
    return response.data;
  }

  /**
   * Connect Figma account
   * @param {string} accessToken - Figma access token
   * @returns {Promise} Connection response
   */
  async connectFigma(accessToken) {
    const response = await axios.post('/api/auth/figma/connect', { accessToken });
    return response.data;
  }

  /**
   * Disconnect Figma account
   * @returns {Promise} Disconnection response
   */
  async disconnectFigma() {
    const response = await axios.delete('/api/auth/figma/disconnect');
    return response.data;
  }

  /**
   * Update user settings
   * @param {Object} settings - User settings
   * @returns {Promise} Settings update response
   */
  async updateSettings(settings) {
    const response = await axios.put('/api/auth/settings', { settings });
    return response.data;
  }

  /**
   * Verify email address
   * @param {string} token - Verification token
   * @returns {Promise} Verification response
   */
  async verifyEmail(token) {
    const response = await axios.post('/api/auth/verify-email', { token });
    return response.data;
  }

  /**
   * Resend verification email
   * @returns {Promise} Resend response
   */
  async resendVerification() {
    const response = await axios.post('/api/auth/resend-verification');
    return response.data;
  }

  /**
   * Change password
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise} Password change response
   */
  async changePassword(currentPassword, newPassword) {
    const response = await axios.post('/api/auth/change-password', {
      currentPassword,
      newPassword
    });
    return response.data;
  }

  /**
   * Get login history
   * @returns {Promise} Login history
   */
  async getLoginHistory() {
    const response = await axios.get('/api/auth/login-history');
    return response.data;
  }

  /**
   * Enable two-factor authentication
   * @returns {Promise} 2FA setup data
   */
  async enable2FA() {
    const response = await axios.post('/api/auth/2fa/enable');
    return response.data;
  }

  /**
   * Disable two-factor authentication
   * @returns {Promise} Disable response
   */
  async disable2FA() {
    const response = await axios.post('/api/auth/2fa/disable');
    return response.data;
  }

  /**
   * Verify two-factor authentication code
   * @param {string} code - 2FA code
   * @returns {Promise} Verification response
   */
  async verify2FA(code) {
    const response = await axios.post('/api/auth/2fa/verify', { code });
    return response.data;
  }
}

export default new AuthService();