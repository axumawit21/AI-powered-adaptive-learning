import api from './api';

const ttsService = {
  /**
   * Generate audio for a summary (auto-selects dialogue or teacher script)
   */
  generateAudio(summaryId) {
    return api.post(`/tts/generate/${summaryId}`);
  },

  /**
   * Generate teacher-style audio (single voice)
   */
  generateTeacherAudio(summaryId) {
    return api.post(`/tts/generate-teacher/${summaryId}`);
  },

  /**
   * Generate dialogue-style audio (male/female conversation)
   */
  generateDialogueAudio(summaryId) {
    return api.post(`/tts/generate-dialogue/${summaryId}`);
  },

  /**
   * Get audio URL for playback
   */
  getAudioUrl(filename) {
    const baseUrl = api.defaults.baseURL || 'http://localhost:3000';
    return `${baseUrl}/tts/audio/${filename}`;
  },

  /**
   * Get available voices
   */
  getVoices() {
    return api.get('/tts/voices');
  },
};

export default ttsService;
