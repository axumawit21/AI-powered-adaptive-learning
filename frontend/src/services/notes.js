import axios from 'axios';

export const notesService = {
  // CRUD operations
  getAllNotes: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.subject) params.append('subject', filters.subject);
    if (filters.hasReminder !== undefined) params.append('hasReminder', filters.hasReminder);
    if (filters.isPinned !== undefined) params.append('isPinned', filters.isPinned);
    if (filters.isArchived !== undefined) params.append('isArchived', filters.isArchived);
    if (filters.search) params.append('search', filters.search);
    
    return axios.get(`notes?${params.toString()}`);
  },

  getNote: (id) => axios.get(`notes/${id}`),

  createNote: (data) => axios.post('notes', data),

  updateNote: (id, data) => axios.put(`notes/${id}`, data),

  deleteNote: (id) => axios.delete(`notes/${id}`),

  // Actions
  togglePin: (id) => axios.put(`notes/${id}/pin`),

  toggleArchive: (id) => axios.put(`notes/${id}/archive`),

  snoozeReminder: (id, minutes = 10) => 
    axios.put(`notes/${id}/snooze`, { minutes }),

  getActiveReminders: () => axios.get('notes/reminders/active'),
};
