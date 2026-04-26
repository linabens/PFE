import { Router } from 'express';
import { sendMessage, getHistory } from '../controllers/chat.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate, validateQuery } from '../middlewares/validate.middleware';
import { SendMessageSchema, ChatHistoryQuerySchema } from '../models/schemas';

const router = Router();

router.use(authenticate);

router.post('/send', validate(SendMessageSchema), sendMessage);
router.get('/history', validateQuery(ChatHistoryQuerySchema), getHistory);

export default router;
