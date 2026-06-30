import api from './api'

/**
 * Chat Service — wraps all /chat API endpoints
 * Used by useChatLogic.js and any component that needs chat features.
 */

/**
 * Ask a question scoped to a grade + subject + optional unit/subunit.
 * @param {Object} payload
 * @param {string} payload.grade          - Grade title (e.g. "Grade 11")
 * @param {string} payload.subject        - Subject title (e.g. "Biology")
 * @param {string} payload.question       - The student's question
 * @param {string} [payload.sessionId]    - Existing session ID (for conversation memory)
 * @param {number} [payload.selectedUnit] - Unit number (for scoped search)
 * @param {string} [payload.selectedSubunit] - Subunit number string (e.g. "2.3")
 * @param {string} [payload.unitTitle]    - Unit title (for title-based scoped search)
 * @param {string} [payload.subunitTitle] - Subunit title (for title-based scoped search)
 */
export const askQuestion = async (payload) => {
  const res = await api.post('/chat/ask', payload)
  return res.data
}

/**
 * Create a new chat session
 */
export const createSession = async ({ firstMessage, grade, subject } = {}) => {
  const res = await api.post('/chat/session', { firstMessage, grade, subject })
  return res.data
}

/**
 * Get all chat sessions for the current student
 */
export const getSessions = async () => {
  const res = await api.get('/chat/history')
  return res.data
}

/**
 * Get a specific session with all its messages
 */
export const getSession = async (sessionId) => {
  const res = await api.get(`/chat/${sessionId}`)
  return res.data
}

/**
 * Delete a chat session
 */
export const deleteSession = async (sessionId) => {
  const res = await api.delete(`/chat/${sessionId}`)
  return res.data
}

/**
 * Rename a chat session
 */
export const renameSession = async (sessionId, title) => {
  const res = await api.patch(`/chat/${sessionId}`, { title })
  return res.data
}

export default {
  askQuestion,
  createSession,
  getSessions,
  getSession,
  deleteSession,
  renameSession,
}
