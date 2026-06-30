import { ref } from 'vue';

// Global Singleton State
const grade = ref(null);
const subjects = ref([]);
const selectedSubject = ref(null);
const activeUnit = ref(null);
const activeSubtitle = ref(null);

export function useGlobalState() {
  return {
    grade,
    subjects,
    selectedSubject,
    activeUnit,
    activeSubtitle
  };
}
