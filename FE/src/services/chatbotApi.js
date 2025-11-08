import axios from 'axios'

const CHATBOT_API_URL = process.env.REACT_APP_CHATBOT_API_URL || 'http://localhost:8088'

const chatbotApi = axios.create({
  baseURL: CHATBOT_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds timeout for AI responses
})

export const chatbotService = {
  sendMessage: async (message, conversationId = null) => {
    try {
      const response = await chatbotApi.post('/api/v1/chatbot/message', {
        message,
        conversation_id: conversationId,
      })
      return response.data
    } catch (error) {
      console.error('Error sending message to chatbot:', error)
      return {
        success: false,
        message: error.response?.data?.message || 'Có lỗi xảy ra khi gửi tin nhắn',
      }
    }
  },

  // Document management
  uploadDocument: async (file, title) => {
    try {
      const formData = new FormData()
      formData.append('document', file)
      if (title) {
        formData.append('title', title)
      }

      const response = await chatbotApi.post('/document/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return response.data
    } catch (error) {
      console.error('Error uploading document:', error)
      throw error
    }
  },

  listDocuments: async (limit = 10, offset = 0) => {
    try {
      const response = await chatbotApi.get('/document/list', {
        params: { limit, offset },
      })
      return response.data
    } catch (error) {
      console.error('Error listing documents:', error)
      throw error
    }
  },

  getDocument: async (id) => {
    try {
      const response = await chatbotApi.get(`/document/${id}`)
      return response.data
    } catch (error) {
      console.error('Error getting document:', error)
      throw error
    }
  },

  deleteDocument: async (id) => {
    try {
      const response = await chatbotApi.delete(`/document/${id}`)
      return response.data
    } catch (error) {
      console.error('Error deleting document:', error)
      throw error
    }
  },

  getDocumentChunks: async (id) => {
    try {
      const response = await chatbotApi.get(`/document/${id}/chunks`)
      return response.data
    } catch (error) {
      console.error('Error getting document chunks:', error)
      throw error
    }
  },
}
