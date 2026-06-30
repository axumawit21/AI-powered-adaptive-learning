import { ref, watch, onUnmounted } from 'vue';
import axios from 'axios'; // This imports the default axios, but we want the one with interceptors if we exported it. 
// Actually, api/http.js exports initAxios but not the axios instance itself. 
// However, axios is a singleton usually. But wait, initAxios sets defaults on the global axios object?
// Let's check api/http.js again. Yes, it imports axios and sets defaults.
// So importing axios here *should* work if initAxios was called.
// But better to use the relative path if we want to be sure, or just rely on the global config.
// Let's assume initAxios is called in main.js.

import { useAuth } from './useAuth';

export function useProgress() {
  const { user } = useAuth();
  const timer = ref(null);

  function startTracking(bookId, gradeId, subjectId, gradeTitle, subjectTitle) {
    stopTracking();
    if (!user.value || !bookId) return;

    // Track every 1 minute (60000 ms)
    timer.value = setInterval(async () => {
      try {
        // Use relative URL, axios base URL handles the rest
        await axios.patch('/progress/add-time', {
          bookId: bookId,
          gradeId: gradeId,
          subjectId: subjectId,
          gradeTitle: gradeTitle,
          subjectTitle: subjectTitle,
          minutes: 1
        });
        console.log(`Tracked 1 minute for book ${bookId}`);
      } catch (err) {
        console.error('Error tracking progress:', err);
      }
    }, 60000);
  }

  function stopTracking() {
    if (timer.value) {
      clearInterval(timer.value);
      timer.value = null;
    }
  }

  async function getProgress(bookId) {
    if (!user.value || !bookId) return [];
    try {
      const res = await axios.get(`/progress/weekly/${bookId}`);
      return res.data;
    } catch (err) {
      console.error('Error fetching progress:', err);
      return [];
    }
  }

  onUnmounted(() => {
    stopTracking();
  });

  return {
    startTracking,
    stopTracking,
    getProgress
  };
}
