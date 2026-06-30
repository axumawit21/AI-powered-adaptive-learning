import api from './api'

export const summarizeChapter = async (body) => {
  const res = await api.post('/summary/generate', body)
  return res.data
}

export const uploadSummaryAudio = async (formData) => {
  const res = await api.post('/summary/upload-audio', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return res.data;
}

export const updateSummaryAudio = async (summaryId, audioUrl) => {
  const res = await api.post('/summary/update-audio', { summaryId, audioUrl });
  return res.data;
}
