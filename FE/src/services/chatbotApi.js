import axios from 'axios';

const CHATBOT_API_URL = process.env.REACT_APP_CHATBOT_API_URL || 'http://localhost:8083/api/v1';

const chatbotApi = axios.create({
  baseURL: CHATBOT_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// No authentication required for chatbot
chatbotApi.interceptors.request.use(
  (config) => {
    // Optionally add user info if logged in (for personalization)
    const user = localStorage.getItem('user');
    if (user) {
      config.headers['X-User-Info'] = user;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const chatbotService = {
  // Send message to chatbot
  sendMessage: async (message, conversationId = null) => {
    try {
      const response = await chatbotApi.post('/chatbot/message', {
        message,
        conversation_id: conversationId
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error sending message to chatbot:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Có lỗi xảy ra khi gửi tin nhắn'
      };
    }
  },

  // Get conversation history
  getConversationHistory: async (conversationId) => {
    try {
      const response = await chatbotApi.get(`/chatbot/conversation/${conversationId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error fetching conversation history:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Có lỗi xảy ra khi tải lịch sử trò chuyện'
      };
    }
  },

  // Start new conversation
  startConversation: async () => {
    try {
      const response = await chatbotApi.post('/chatbot/conversation');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error starting conversation:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Có lỗi xảy ra khi bắt đầu cuộc trò chuyện'
      };
    }
  },

  // Clear conversation
  clearConversation: async (conversationId) => {
    try {
      const response = await chatbotApi.delete(`/chatbot/conversation/${conversationId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error clearing conversation:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Có lỗi xảy ra khi xóa cuộc trò chuyện'
      };
    }
  }
};