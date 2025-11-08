import { Request, Response } from 'express';
import { ChatService } from '../services';
import { QuestionRequest } from '../types';
import { logger } from '../utils/logger';
import crypto from 'crypto';

interface ConversationMessage {
  message: string;
  conversation_id?: string | null;
}

export class ChatHandler {
  private chatService: ChatService;

  constructor({ chatService }: { chatService: ChatService }) {
    this.chatService = chatService;
  }

  askQuestion = async (req: Request, res: Response): Promise<void> => {
    try {
      const { question } = req.body as QuestionRequest;

      if (!question) {
        res.status(400).json({
          error: 'Câu hỏi không được để trống',
        });
        return;
      }

      const response = await this.chatService.processQuestion(question);

      res.status(200).json(response);
    } catch (error) {
      logger.error('Error processing question', { error });
      res.status(500).json({
        error: `Có lỗi xảy ra khi xử lý câu hỏi: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  };

  // New endpoint for chatbot with conversation support
  sendMessage = async (req: Request, res: Response): Promise<void> => {
    try {
      const { message, conversation_id } = req.body as ConversationMessage;

      if (!message || !message.trim()) {
        res.status(400).json({
          success: false,
          message: 'Tin nhắn không được để trống',
        });
        return;
      }

      // Generate conversation ID if not provided
      const conversationId = conversation_id || crypto.randomBytes(16).toString('hex');

      // Process the question
      const response = await this.chatService.processQuestion(message.trim());

      // Return response with conversation_id
      res.status(200).json({
        success: true,
        data: {
          response: response.answer,
          message: response.answer,
          conversation_id: conversationId,
          cached: response.cached,
        },
      });
    } catch (error) {
      logger.error('Error sending message', { error });
      res.status(500).json({
        success: false,
        message: `Có lỗi xảy ra: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  };
}
