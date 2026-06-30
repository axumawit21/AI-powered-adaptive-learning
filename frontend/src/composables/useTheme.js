import { ref, computed, watchEffect } from 'vue';

const THEME_KEY = 'henon-theme';

// Global state outside the function so it's shared across all usages
const theme = ref(getInitialTheme());

function getInitialTheme() {
  // Check localStorage first
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }
  // Check system preference
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
    return 'light';
  }
  return 'dark';
}

// Apply theme to document
function applyTheme(newTheme) {
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem(THEME_KEY, newTheme);
}

// Watch and apply theme changes
watchEffect(() => {
  applyTheme(theme.value);
});

export function useTheme() {
  const isDark = computed(() => theme.value === 'dark');
  const isLight = computed(() => theme.value === 'light');

  function toggleTheme() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark';
  }

  function setTheme(newTheme) {
    if (newTheme === 'light' || newTheme === 'dark') {
      theme.value = newTheme;
    }
  }

  return {
    theme,
    isDark,
    isLight,
    toggleTheme,
    setTheme,
  };
}
