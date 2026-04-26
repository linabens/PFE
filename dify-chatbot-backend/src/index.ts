import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import chatRoutes from './routes/chat.routes';
import guestChatRoutes from './routes/guest-chat.routes';
import { errorHandler } from './middlewares/error.middleware';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/auth', authRoutes);
app.use('/chat/guest', guestChatRoutes); // Guest (no auth) must come before /chat
app.use('/chat', chatRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Global Error Handler
app.use(errorHandler);

app.listen(port, () => {
  console.log(`[server]: Chatbot Backend Server is running at http://localhost:${port}`);
});
