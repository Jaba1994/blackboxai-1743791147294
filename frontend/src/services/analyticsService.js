import axios from '@/utils/axios';

class AnalyticsService {
  /**
   * Get dashboard analytics
   * @param {Object} params - Query parameters
   * @returns {Promise} Dashboard analytics
   */
  async getDashboardAnalytics(params = {}) {
    const response = await axios.get('/api/analytics/dashboard', { params });
    return response.data;
  }

  /**
   * Get content performance analytics
   * @param {Object} params - Query parameters
   * @returns {Promise} Content performance data
   */
  async getContentPerformance(params = {}) {
    const response = await axios.get('/api/analytics/content/performance', { params });
    return response.data;
  }

  /**
   * Get engagement metrics
   * @param {Object} params - Query parameters
   * @returns {Promise} Engagement metrics
   */
  async getEngagementMetrics(params = {}) {
    const response = await axios.get('/api/analytics/engagement', { params });
    return response.data;
  }

  /**
   * Get sentiment analysis
   * @param {Object} params - Query parameters
   * @returns {Promise} Sentiment analysis data
   */
  async getSentimentAnalysis(params = {}) {
    const response = await axios.get('/api/analytics/sentiment', { params });
    return response.data;
  }

  /**
   * Get distribution analytics
   * @param {Object} params - Query parameters
   * @returns {Promise} Distribution analytics
   */
  async getDistributionAnalytics(params = {}) {
    const response = await axios.get('/api/analytics/distribution', { params });
    return response.data;
  }

  /**
   * Get time series data
   * @param {Object} params - Query parameters
   * @returns {Promise} Time series data
   */
  async getTimeSeriesData(params = {}) {
    const response = await axios.get('/api/analytics/timeseries', { params });
    return response.data;
  }

  /**
   * Get user activity
   * @param {Object} params - Query parameters
   * @returns {Promise} User activity data
   */
  async getUserActivity(params = {}) {
    const response = await axios.get('/api/analytics/user-activity', { params });
    return response.data;
  }

  /**
   * Get content type distribution
   * @param {Object} params - Query parameters
   * @returns {Promise} Content type distribution data
   */
  async getContentTypeDistribution(params = {}) {
    const response = await axios.get('/api/analytics/content-types', { params });
    return response.data;
  }

  /**
   * Get channel performance
   * @param {Object} params - Query parameters
   * @returns {Promise} Channel performance data
   */
  async getChannelPerformance(params = {}) {
    const response = await axios.get('/api/analytics/channel-performance', { params });
    return response.data;
  }

  /**
   * Export analytics
   * @param {Object} params - Query parameters
   * @returns {Promise} Export data
   */
  async exportAnalytics(params = {}) {
    const response = await axios.get('/api/analytics/export', { params });
    return response.data;
  }

  /**
   * Compare analytics between periods
   * @param {Object} params - Query parameters
   * @returns {Promise} Comparative analysis data
   */
  async compareAnalytics(params = {}) {
    const response = await axios.get('/api/analytics/compare', { params });
    return response.data;
  }

  /**
   * Get real-time analytics
   * @returns {Promise} Real-time analytics data
   */
  async getRealTimeAnalytics() {
    const response = await axios.get('/api/analytics/realtime');
    return response.data;
  }

  /**
   * Generate custom report
   * @param {Object} data - Report configuration
   * @returns {Promise} Custom report data
   */
  async generateCustomReport(data) {
    const response = await axios.post('/api/analytics/reports/custom', data);
    return response.data;
  }

  /**
   * Get analytics by date range
   * @param {string} startDate - Start date
   * @param {string} endDate - End date
   * @param {string} metric - Metric to analyze
   * @returns {Promise} Date range analytics
   */
  async getAnalyticsByDateRange(startDate, endDate, metric) {
    const response = await axios.get('/api/analytics/timeseries', {
      params: {
        startDate,
        endDate,
        metric
      }
    });
    return response.data;
  }

  /**
   * Get performance trends
   * @param {string} period - Time period (day, week, month)
   * @returns {Promise} Performance trends data
   */
  async getPerformanceTrends(period = 'week') {
    const response = await axios.get('/api/analytics/trends', {
      params: { period }
    });
    return response.data;
  }

  /**
   * Get content impact analysis
   * @param {string} contentId - Content ID
   * @returns {Promise} Content impact data
   */
  async getContentImpact(contentId) {
    const response = await axios.get(`/api/analytics/content/${contentId}/impact`);
    return response.data;
  }
}

export default new AnalyticsService();