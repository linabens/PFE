import { z } from 'zod';

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const SendMessageSchema = z.object({
  conversation_id: z.string().uuid().optional(),
  content: z.string().min(1),
});

export const ChatHistoryQuerySchema = z.object({
  conversation_id: z.string().uuid(),
});
