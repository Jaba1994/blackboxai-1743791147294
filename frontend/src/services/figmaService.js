import axios from '@/utils/axios';

class FigmaService {
  /**
   * Get Figma file data
   * @param {string} fileId - Figma file ID
   * @returns {Promise} File data
   */
  async getFile(fileId) {
    const response = await axios.get(`/api/figma/files/${fileId}`);
    return response.data;
  }

  /**
   * Get specific nodes from Figma file
   * @param {string} fileId - Figma file ID
   * @param {string[]} nodeIds - Node IDs
   * @returns {Promise} Node data
   */
  async getNodes(fileId, nodeIds) {
    const response = await axios.get(`/api/figma/files/${fileId}/nodes`, {
      params: { nodeIds }
    });
    return response.data;
  }

  /**
   * Get images for nodes
   * @param {string} fileId - Figma file ID
   * @param {string[]} nodeIds - Node IDs
   * @param {Object} options - Export options
   * @returns {Promise} Image URLs
   */
  async getImages(fileId, nodeIds, options = {}) {
    const response = await axios.get(`/api/figma/files/${fileId}/images`, {
      params: { nodeIds, ...options }
    });
    return response.data;
  }

  /**
   * Get comments from Figma file
   * @param {string} fileId - Figma file ID
   * @returns {Promise} Comments data
   */
  async getComments(fileId) {
    const response = await axios.get(`/api/figma/files/${fileId}/comments`);
    return response.data;
  }

  /**
   * Post comment to Figma file
   * @param {string} fileId - Figma file ID
   * @param {string} message - Comment message
   * @param {Object} position - Comment position
   * @returns {Promise} Comment data
   */
  async postComment(fileId, message, position) {
    const response = await axios.post(`/api/figma/files/${fileId}/comments`, {
      message,
      position
    });
    return response.data;
  }

  /**
   * Extract design tokens from Figma file
   * @param {string} fileId - Figma file ID
   * @returns {Promise} Design tokens
   */
  async extractDesignTokens(fileId) {
    const response = await axios.get(`/api/figma/files/${fileId}/design-tokens`);
    return response.data;
  }

  /**
   * Sync design elements
   * @param {Object} data - Sync data
   * @returns {Promise} Sync response
   */
  async syncDesignElements(data) {
    const response = await axios.post('/api/figma/sync', data);
    return response.data;
  }

  /**
   * Get sync status
   * @param {string} syncId - Sync ID
   * @returns {Promise} Sync status
   */
  async getSyncStatus(syncId) {
    const response = await axios.get(`/api/figma/sync/status/${syncId}`);
    return response.data;
  }

  /**
   * Get team libraries
   * @param {string} teamId - Team ID
   * @returns {Promise} Team libraries
   */
  async getTeamLibraries(teamId) {
    const response = await axios.get(`/api/figma/team/${teamId}/libraries`);
    return response.data;
  }

  /**
   * Get library components
   * @param {string} fileId - File ID
   * @returns {Promise} Library components
   */
  async getLibraryComponents(fileId) {
    const response = await axios.get(`/api/figma/libraries/${fileId}/components`);
    return response.data;
  }

  /**
   * Get styles from file
   * @param {string} fileId - File ID
   * @returns {Promise} Styles data
   */
  async getStyles(fileId) {
    const response = await axios.get(`/api/figma/files/${fileId}/styles`);
    return response.data;
  }

  /**
   * Apply style to nodes
   * @param {Object} data - Style application data
   * @returns {Promise} Application response
   */
  async applyStyle(data) {
    const response = await axios.post('/api/figma/styles/apply', data);
    return response.data;
  }

  /**
   * Get file versions
   * @param {string} fileId - File ID
   * @returns {Promise} File versions
   */
  async getFileVersions(fileId) {
    const response = await axios.get(`/api/figma/files/${fileId}/versions`);
    return response.data;
  }

  /**
   * Restore file version
   * @param {string} fileId - File ID
   * @param {string} versionId - Version ID
   * @returns {Promise} Restore response
   */
  async restoreVersion(fileId, versionId) {
    const response = await axios.post(
      `/api/figma/files/${fileId}/versions/${versionId}/restore`
    );
    return response.data;
  }

  /**
   * Export file
   * @param {Object} data - Export configuration
   * @returns {Promise} Export URL
   */
  async exportFile(data) {
    const response = await axios.post('/api/figma/export', data);
    return response.data;
  }

  /**
   * Create webhook
   * @param {Object} data - Webhook configuration
   * @returns {Promise} Webhook data
   */
  async createWebhook(data) {
    const response = await axios.post('/api/figma/webhooks', data);
    return response.data;
  }

  /**
   * Delete webhook
   * @param {string} webhookId - Webhook ID
   * @returns {Promise} Delete response
   */
  async deleteWebhook(webhookId) {
    const response = await axios.delete(`/api/figma/webhooks/${webhookId}`);
    return response.data;
  }

  /**
   * Get teams
   * @returns {Promise} Teams data
   */
  async getTeams() {
    const response = await axios.get('/api/figma/teams');
    return response.data;
  }

  /**
   * Get team projects
   * @param {string} teamId - Team ID
   * @returns {Promise} Team projects
   */
  async getTeamProjects(teamId) {
    const response = await axios.get(`/api/figma/team/${teamId}/projects`);
    return response.data;
  }

  /**
   * Search Figma files
   * @param {string} query - Search query
   * @returns {Promise} Search results
   */
  async search(query) {
    const response = await axios.get('/api/figma/search', {
      params: { query }
    });
    return response.data;
  }

  /**
   * Batch operation
   * @param {Object[]} operations - Array of operations
   * @returns {Promise} Operation results
   */
  async batchOperation(operations) {
    const response = await axios.post('/api/figma/batch', { operations });
    return response.data;
  }
}

export default new FigmaService();