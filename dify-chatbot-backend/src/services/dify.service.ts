import axios from 'axios';
import { AppError } from '../utils/errors';

export const sendToDify = async (
  prompt: string,
  user_id: string,
  conversation_id?: string
) => {
  const apiKey = process.env.DIFY_API_KEY;
  const baseUrl = process.env.DIFY_API_URL;

  if (!apiKey || !baseUrl) {
    throw new AppError('Dify API configuration is missing', 500);
  }

  try {
    const response = await axios.post(
      `${baseUrl}/chat-messages`,
      {
        inputs: {},
        query: prompt,
        response_mode: 'blocking',
        conversation_id: '',  // Don't pass local DB IDs to Dify
        user: user_id,
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      answer: response.data.answer,
      dify_conversation_id: response.data.conversation_id,
    };
  } catch (error: any) {
    console.error('Dify API Error:', error.response?.data || error.message);
    throw new AppError('Failed to communicate with Dify API', 502);
  }
};
