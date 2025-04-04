import axios from '@/utils/axios';

class ContentService {
  /**
   * Generate new content
   * @param {Object} data - Content generation data
   * @returns {Promise} Generated content
   */
  async generateContent(data) {
    const response = await axios.post('/api/content/generate', data);
    return response.data;
  }

  /**
   * Improve existing content
   * @param {string} contentId - Content ID
   * @param {string} feedback - Improvement feedback
   * @returns {Promise} Improved content
   */
  async improveContent(contentId, feedback) {
    const response = await axios.post('/api/content/improve', {
      contentId,
      feedback
    });
    return response.data;
  }

  /**
   * Get content list
   * @param {Object} params - Query parameters
   * @returns {Promise} Content list
   */
  async listContent(params = {}) {
    const response = await axios.get('/api/content', { params });
    return response.data;
  }

  /**
   * Get single content
   * @param {string} id - Content ID
   * @returns {Promise} Content details
   */
  async getContent(id) {
    const response = await axios.get(`/api/content/${id}`);
    return response.data;
  }

  /**
   * Update content
   * @param {string} id - Content ID
   * @param {Object} data - Update data
   * @returns {Promise} Updated content
   */
  async updateContent(id, data) {
    const response = await axios.put(`/api/content/${id}`, data);
    return response.data;
  }

  /**
   * Delete content
   * @param {string} id - Content ID
   * @returns {Promise} Delete response
   */
  async deleteContent(id) {
    const response = await axios.delete(`/api/content/${id}`);
    return response.data;
  }

  /**
   * Publish content
   * @param {string} id - Content ID
   * @param {string[]} channels - Distribution channels
   * @returns {Promise} Publish response
   */
  async publishContent(id, channels) {
    const response = await axios.post(`/api/content/${id}/publish`, { channels });
    return response.data;
  }

  /**
   * Schedule content
   * @param {string} id - Content ID
   * @param {Object} schedule - Schedule data
   * @returns {Promise} Schedule response
   */
  async scheduleContent(id, schedule) {
    const response = await axios.post(`/api/content/${id}/schedule`, schedule);
    return response.data;
  }

  /**
   * Get content analytics
   * @param {string} id - Content ID
   * @param {Object} params - Query parameters
   * @returns {Promise} Content analytics
   */
  async getContentAnalytics(id, params = {}) {
    const response = await axios.get(`/api/content/${id}/analytics`, { params });
    return response.data;
  }

  /**
   * Sync content with Figma
   * @param {string} id - Content ID
   * @param {Object} data - Figma sync data
   * @returns {Promise} Sync response
   */
  async syncWithFigma(id, data) {
    const response = await axios.post(`/api/content/${id}/figma/sync`, data);
    return response.data;
  }

  /**
   * Get Figma elements
   * @param {string} id - Content ID
   * @returns {Promise} Figma elements
   */
  async getFigmaElements(id) {
    const response = await axios.get(`/api/content/${id}/figma/elements`);
    return response.data;
  }

  /**
   * Get content versions
   * @param {string} id - Content ID
   * @returns {Promise} Content versions
   */
  async getContentVersions(id) {
    const response = await axios.get(`/api/content/${id}/versions`);
    return response.data;
  }

  /**
   * Get specific content version
   * @param {string} id - Content ID
   * @param {number} version - Version number
   * @returns {Promise} Content version
   */
  async getContentVersion(id, version) {
    const response = await axios.get(`/api/content/${id}/versions/${version}`);
    return response.data;
  }

  /**
   * Restore content version
   * @param {string} id - Content ID
   * @param {number} version - Version number
   * @returns {Promise} Restore response
   */
  async restoreContentVersion(id, version) {
    const response = await axios.post(`/api/content/${id}/versions/${version}/restore`);
    return response.data;
  }

  /**
   * Bulk publish content
   * @param {string[]} contentIds - Content IDs
   * @param {string[]} channels - Distribution channels
   * @returns {Promise} Bulk publish response
   */
  async bulkPublishContent(contentIds, channels) {
    const response = await axios.post('/api/content/bulk/publish', {
      contentIds,
      channels
    });
    return response.data;
  }

  /**
   * Bulk archive content
   * @param {string[]} contentIds - Content IDs
   * @returns {Promise} Bulk archive response
   */
  async bulkArchiveContent(contentIds) {
    const response = await axios.post('/api/content/bulk/archive', { contentIds });
    return response.data;
  }
}

export default new ContentService();