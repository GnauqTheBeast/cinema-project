import axios from 'axios'

const CHATBOT_API_URL = process.env.REACT_APP_CHATBOT_API_URL || 'http://localhost:8083/api/v1'

const chatbotApi = axios.create({
  baseURL: CHATBOT_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const chatbotService = {
  sendMessage: async (message, conversationId = null) => {
    try {
      const response = await chatbotApi.post('/chatbot/message', {
        message,
        conversation_id: conversationId,
      })
      return {
        success: true,
        data: response.data,
      }
    } catch (error) {
      console.error('Error sending message to chatbot:', error)
      return {
        success: false,
        message: error.response?.data?.message || 'Có lỗi xảy ra khi gửi tin nhắn',
      }
    }
  },
}
