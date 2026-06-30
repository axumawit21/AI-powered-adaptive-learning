export function getSubjectMeta(subjectName) {
  if (!subjectName) return { icon: '', color: '#94a3b8' };
  
  const s = subjectName.toLowerCase();
  if (s.includes("math"))
    return {
      icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full"><path d="m15 6 3 3-3 3"/><path d="m18 9 H6"/><path d="m9 6-3 3 3 3"/><path d="m9 18-3-3 3-3"/><path d="m6 15h12"/><path d="m15 12 3 3-3 3"/></svg>',
      color: "#f472b6",
    }; // Pink
  if (s.includes("physics"))
    return {
      icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full"><path d="M11 2a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2H4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-5a2 2 0 0 1 2-2h5a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Z"/><path d="M22 6h-4"/><path d="M22 10h-4"/><path d="M22 14h-4"/><path d="M22 18h-4"/></svg>',
      color: "#6366f1",
    }; // Indigo
  if (s.includes("chem"))
    return {
      icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full"><path d="M4.5 3h15"/><path d="M6 3v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V3"/><path d="M6 14h12"/></svg>',
      color: "#10b981",
    }; // Emerald
  if (s.includes("bio"))
    return {
      icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full"><path d="M2 22c1.25 0 2.5-1.5 3.5-3s1.25-3 2.5-3 2.5 1.5 3.5 3 1.25 3 2.5 3 2.5-1.5 3.5-3 1.25-3 2.5-3 2.5 1.5 3.5 3 1.25 3 2.5 3"/><path d="M12 2v11"/></svg>',
      color: "#a78bfa",
    }; // Violet
  if (s.includes("history"))
    return {
      icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M8 7h6"/><path d="M8 11h8"/></svg>',
      color: "#fbbf24",
    }; // Amber
  if (s.includes("geography") || s.includes("earth"))
    return {
      icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>',
      color: "#22d3ee",
    }; // Cyan
  if (s.includes("english") || s.includes("lit"))
    return {
      icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H10"/><path d="M20 19.5v-15a2.5 2.5 0 0 0-2.5-2.5H14"/><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M8 2v15"/><path d="M12 2v15"/><path d="M16 2v15"/></svg>',
      color: "#f87171",
    }; // Red

  return {
    icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    color: "#94a3b8",
  }; // Default Slate
}
