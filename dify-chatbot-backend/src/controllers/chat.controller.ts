import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { prisma } from '../db/prisma';
import { sendToDify } from '../services/dify.service';
import { getProductByName, getAllProducts, getRealtimeOrders, getDashboardContext } from '../services/db.service';
import { AppError } from '../utils/errors';

export const sendMessage = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { content } = req.body;
    let { conversation_id } = req.body;
    const userId = req.user!.id;

    // 1. Verify or create conversation in DB
    if (!conversation_id) {
      const newConv = await prisma.conversation.create({
        data: { user_id: userId },
      });
      conversation_id = newConv.id;
    } else {
      const conv = await prisma.conversation.findUnique({ where: { id: conversation_id } });
      if (!conv || conv.user_id !== userId) {
        throw new AppError('Conversation not found or unauthorized', 404);
      }
    }

    // 2. Save User Message in DB
    await prisma.message.create({
      data: {
        conversation_id,
        role: 'user',
        content,
      },
    });

    // 3. Intent Analysis & DB Data Retrieval
    let dbContext = '';
    const lower = content.toLowerCase();

    // Menu / product queries
    if (lower.includes('menu') || lower.includes('all products') || lower.includes('what do you have') || lower.includes('what do you serve')) {
      const menuInfo = await getAllProducts();
      dbContext += `\n${menuInfo}`;
    } else if (lower.includes('price') || lower.includes('cost') || lower.includes('how much')) {
      // Try to extract product name
      const match = lower.match(/(?:price of|cost of|how much is|how much does)\s+(?:a\s+|the\s+)?([a-z\s]+?)(?:\?|$|\s+cost)/);
      const name = match?.[1]?.trim() || lower.replace(/price|cost|how much|is|does|a|the|\?/g, '').trim();
      if (name && name.length > 2) {
        const productInfo = await getProductByName(name);
        dbContext += `\nProduct Info: ${productInfo}`;
      } else {
        const menuInfo = await getAllProducts();
        dbContext += `\n${menuInfo}`;
      }
    } else if (lower.includes('live') || lower.includes('kitchen') || lower.includes('real time') || lower.includes('current orders') || (lower.includes('order') && (lower.includes('active') || lower.includes('status')))) {
      const ordersInfo = await getRealtimeOrders();
      dbContext += `\n${ordersInfo}`;
    } else if (lower.includes('today') || lower.includes('stats') || lower.includes('statistics') || lower.includes('performance') || lower.includes('revenue') || lower.includes('sales') || lower.includes('how are we doing')) {
      const stats = await getDashboardContext();
      if (stats) dbContext += `\n${stats}`;
    } else if (lower.includes('staff') || lower.includes('employee') || lower.includes('user')) {
      dbContext += `\nStaff Context: Use the Staff Accounts page to manage your team. You can add new staff, set roles (admin/staff), and track activity. Currently, there is 1 admin account active.`;
    } else if (lower.includes('table') || lower.includes('qr') || lower.includes('floor')) {
      dbContext += `\nTable Context: Your shop has 5 configured tables. Each table has a unique QR code for customers to scan and place orders. You can manage these on the Tables & QR Codes page.`;
    } else if (lower.includes('espresso') || lower.includes('latte') || lower.includes('cappuccino') ||
               lower.includes('mocha') || lower.includes('coffee') || lower.includes('tea') ||
               lower.includes('cake') || lower.includes('muffin') || lower.includes('croissant')) {
      // Product mentioned by common keywords
      const words = lower.split(/\s+/);
      const coffeeWords = ['espresso','latte','cappuccino','mocha','coffee','tea','cake','muffin','croissant','americano','macchiato','frappe'];
      const keyword = words.find((w: string) => coffeeWords.includes(w));
      if (keyword) {
        const productInfo = await getProductByName(keyword);
        dbContext += `\nProduct Info: ${productInfo}`;
      }
    }

    // Build Enriched Prompt
    const enrichedPrompt = dbContext
      ? `[Coffee Shop Dashboard Data]\n${dbContext.trim()}\n\n[User Question]\n${content}`
      : content;

    // 4. Send request to Dify with DB context
    const difyResponse = await sendToDify(enrichedPrompt, userId, conversation_id);

    // 5. Save AI Response
    const aiMessage = await prisma.message.create({
      data: {
        conversation_id,
        role: 'assistant',
        content: difyResponse.answer,
      },
    });

    // 6. Return response
    res.status(200).json({
      success: true,
      data: {
        conversation_id,
        message: aiMessage,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getHistory = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { conversation_id } = req.query;
    const userId = req.user!.id;

    const conv = await prisma.conversation.findUnique({
      where: { id: conversation_id as string },
    });

    if (!conv || conv.user_id !== userId) {
      throw new AppError('Conversation not found', 404);
    }

    const messages = await prisma.message.findMany({
      where: { conversation_id: conversation_id as string },
      orderBy: { created_at: 'asc' },
    });

    res.status(200).json({
      success: true,
      data: {
        conversation_id,
        messages,
      },
    });
  } catch (error) {
    next(error);
  }
};
