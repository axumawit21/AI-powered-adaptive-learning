import api from './api';

/**
 * Content Moderation Service
 * Handles all API calls for content moderation in the admin panel
 */

export const contentModerationService = {
  /**
   * Get all content with optional filters
   */
  getContent(params = {}) {
    return api.get('/content-moderation', { params });
  },

  /**
   * Get content moderation statistics
   */
  getStats() {
    return api.get('/content-moderation/stats');
  },

  /**
   * Get single content item by type and id
   */
  getContentById(type, id) {
    return api.get(`/content-moderation/${type}/${id}`);
  },

  /**
   * Update question content
   */
  updateQuestion(id, data) {
    return api.patch(`/content-moderation/question/${id}`, data);
  },

  /**
   * Update summary content
   */
  updateSummary(id, data) {
    return api.patch(`/content-moderation/summary/${id}`, data);
  },

  /**
   * Update presentation content
   */
  updatePresentation(id, data) {
    return api.patch(`/content-moderation/presentation/${id}`, data);
  },

  /**
   * Approve content
   */
  approveContent(type, id, comment = '', reviewedBy = '') {
    return api.post(`/content-moderation/${type}/${id}/approve`, { comment, reviewedBy });
  },

  /**
   * Suspend content
   */
  suspendContent(type, id, comment = '', reviewedBy = '') {
    return api.post(`/content-moderation/${type}/${id}/suspend`, { comment, reviewedBy });
  },

  /**
   * Bulk approve content
   */
  bulkApprove(type, ids, reviewedBy = '') {
    return api.post(`/content-moderation/${type}/bulk-approve`, { ids, reviewedBy });
  },

  /**
   * Bulk suspend content
   */
  bulkSuspend(type, ids, reviewedBy = '') {
    return api.post(`/content-moderation/${type}/bulk-suspend`, { ids, reviewedBy });
  }
};

export default contentModerationService;
