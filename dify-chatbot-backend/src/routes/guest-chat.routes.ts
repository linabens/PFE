import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../db/prisma';
import { sendToGemini } from '../services/gemini.service';
import { getProductByName, getAllProducts, getDashboardContext } from '../services/db.service';
import { z } from 'zod';

const router = Router();

const ADMIN_GUEST_ID = '00000000-0000-0000-0000-000000000000';

const GuestSendSchema = z.object({
  content: z.string().min(1).max(2000),
  conversation_id: z.string().uuid().optional().nullable(),
});

/**
 * Smart local responder — generates helpful responses using DB context
 * when the Gemini AI service is unavailable.
 */
async function generateLocalResponse(content: string): Promise<string> {
  const lower = content.toLowerCase();

  // Greeting
  if (/^(hi|hello|hey|bonjour|salut|good morning|good evening|yo|sup)\b/.test(lower)) {
    const stats = await getDashboardContext();
    if (stats) {
      return `Hello! 👋 Welcome to your Coffee Time assistant.\n\nHere's a quick snapshot of today:\n${stats}\n\nHow can I help you? Ask me about the menu, orders, revenue, or anything else!`;
    }
    return `Hello! 👋 Welcome to your Coffee Time assistant. How can I help you today?\n\nYou can ask about the menu, orders, revenue, products, or anything about your coffee shop!`;
  }

  // Menu / all products
  if (lower.includes('menu') || lower.includes('all products') || lower.includes('what do you have') || lower.includes('what do you serve') || lower.includes('show me') && lower.includes('product')) {
    const menuInfo = await getAllProducts();
    return `☕ Here's the current menu:\n\n${menuInfo}\n\nWould you like details on a specific item? Just ask!`;
  }

  // Price queries
  if (lower.includes('price') || lower.includes('cost') || lower.includes('how much')) {
    const match = lower.match(/(?:price of|cost of|how much is|how much does|how much for)\s+(?:a\s+|the\s+|an\s+)?([a-z\s]+?)(?:\?|$|\s+cost)/);
    const name = match?.[1]?.trim() || lower.replace(/price|cost|how much|is|does|for|a|the|an|\?/g, '').trim();
    if (name && name.length > 2) {
      const productInfo = await getProductByName(name);
      return `💰 ${productInfo}`;
    }
    const menuInfo = await getAllProducts();
    return `Here are all our products with prices:\n\n${menuInfo}`;
  }

  // Orders
  if (lower.includes('order') || lower.includes('orders') || lower.includes('my history') || lower.includes('pending')) {
    const stats = await getDashboardContext();
    if (stats) {
      return `📦 Here's the current order situation:\n\n${stats}\n\nFor detailed order management, check the Orders page in the dashboard.`;
    }
    return `📦 Order information is available on the Live Orders page of your dashboard.`;
  }

  // Dashboard / status / revenue / summary / analytics / sales / income
  if (lower.includes('today') || lower.includes('busy') || lower.includes('active') || lower.includes('status') || 
      lower.includes('revenue') || lower.includes('summary') || lower.includes('dashboard') || lower.includes('stats') ||
      lower.includes('sales') || lower.includes('income') || lower.includes('analytics') || lower.includes('performance') ||
      lower.includes('how are we doing') || lower.includes('how is the shop') || lower.includes('report')) {
    const stats = await getDashboardContext();
    if (stats) {
      return `📊 Here's your dashboard summary:\n\n${stats}\n\nFor detailed analytics, visit the Analytics page.`;
    }
    return `I couldn't fetch the dashboard data right now. Please make sure the main backend is running.`;
  }

  // Trending / popular / best sellers
  if (lower.includes('trending') || lower.includes('popular') || lower.includes('best seller') || lower.includes('top')) {
    const menuInfo = await getAllProducts();
    const trendingItems = menuInfo.split('\n').filter((line: string) => line.includes('🔥'));
    if (trendingItems.length > 0) {
      return `🔥 Here are the trending items:\n\n${trendingItems.join('\n')}\n\nThese are currently your most popular items!`;
    }
    return `No trending items flagged at the moment. Check the Products page to set trending items.`;
  }

  // Product keyword searches
  const coffeeWords = ['espresso', 'latte', 'cappuccino', 'mocha', 'coffee', 'tea', 'cake', 'muffin', 'croissant', 
    'americano', 'macchiato', 'frappe', 'frappé', 'chocolate', 'juice', 'smoothie', 'matcha', 'cold brew', 'iced',
    'oreo', 'vanilla', 'caramel', 'mango', 'citron', 'pain', 'ristretto', 'capucin'];
  const words = lower.split(/\s+/);
  const keyword = words.find((w: string) => coffeeWords.includes(w));
  if (keyword) {
    const productInfo = await getProductByName(keyword);
    return `☕ ${productInfo}`;
  }

  // Staff / employees
  if (lower.includes('staff') || lower.includes('employee') || lower.includes('team') || lower.includes('worker')) {
    return `👥 Staff management is available on the Staff Accounts page.\n\nFrom there you can:\n• Add new staff accounts\n• Set roles and permissions\n• Manage access levels\n\nNeed help with anything specific about staff?`;
  }

  // Tables / QR codes
  if (lower.includes('table') || lower.includes('qr') || lower.includes('floor') || lower.includes('seating')) {
    return `🪑 Table and QR code management is available on the Tables & QR Codes page.\n\nYou can:\n• View all tables and their status\n• Generate QR codes for each table\n• Manage floor layout\n\nAnything specific about tables?`;
  }

  // Loyalty / rewards / points
  if (lower.includes('loyalty') || lower.includes('reward') || lower.includes('points') || lower.includes('program')) {
    return `⭐ The Loyalty Program page lets you manage customer rewards.\n\nFeatures:\n• Set point earning rules\n• Create rewards tiers\n• Track customer loyalty status\n\nWant to know more about a specific loyalty feature?`;
  }

  // Promotions / discounts / offers
  if (lower.includes('promotion') || lower.includes('discount') || lower.includes('offer') || lower.includes('deal') || lower.includes('coupon')) {
    return `🏷️ Promotions can be managed from the Promotions page.\n\nYou can:\n• Create new promotions and discounts\n• Set start/end dates\n• Apply to specific products or categories\n\nWould you like tips on running effective promotions?`;
  }

  // Categories
  if (lower.includes('categor') || lower.includes('category')) {
    return `📂 Product categories are managed on the Categories page.\n\nYou can organize your menu into categories like:\n• Hot Drinks\n• Cold Drinks\n• Pastries & Food\n• Seasonal Specials\n\nNeed help organizing your menu?`;
  }

  // Assistance / help requests
  if (lower.includes('assistance') || lower.includes('help request') || lower.includes('customer call') || lower.includes('waiter')) {
    return `🔔 Customer assistance requests are tracked on the Assistance page.\n\nThis shows:\n• Pending help requests from tables\n• Response times\n• Customer service metrics\n\nCheck it regularly to maintain great service!`;
  }

  // Settings / configuration
  if (lower.includes('setting') || lower.includes('config') || lower.includes('system') || lower.includes('setup')) {
    return `⚙️ System settings can be found on the System Settings page.\n\nAvailable configurations:\n• General shop settings\n• Payment methods\n• Notification preferences\n• Integration settings\n\nWhat would you like to configure?`;
  }

  // How to / guide / tutorial
  if (lower.includes('how to') || lower.includes('how do i') || lower.includes('guide') || lower.includes('tutorial') || lower.includes('explain')) {
    return `📖 I can help you navigate the dashboard! Here's a quick guide:\n\n• **Dashboard** — Overview of today's performance\n• **Live Orders** — Track and manage active orders\n• **Products** — Add/edit menu items\n• **Categories** — Organize your menu\n• **Tables** — Manage floor layout & QR codes\n• **Revenue** — Financial reports\n• **Analytics** — Deep data insights\n• **Promotions** — Create deals & discounts\n• **Staff** — Manage team accounts\n\nWhat would you like to learn more about?`;
  }

  // Help / what can you do
  if (lower.includes('help') || lower.includes('what can you do') || lower.includes('features') || lower.includes('capabilities')) {
    return `I'm your Coffee Time assistant! Here's what I can help with:\n\n☕ **Menu** — "Show me the menu" or "What do you have?"\n💰 **Prices** — "How much is a latte?"\n📦 **Orders** — "Show me today's orders"\n📊 **Dashboard** — "Revenue summary" or "How's today going?"\n🔥 **Trending** — "What's trending?" or "Best sellers"\n🔍 **Products** — Mention any drink or food item\n👥 **Staff** — "Tell me about staff management"\n🪑 **Tables** — "How do QR codes work?"\n⭐ **Loyalty** — "Explain the loyalty program"\n🏷️ **Promos** — "How to create promotions?"\n📖 **Guide** — "How to use the dashboard?"\n\nJust ask anything! 😊`;
  }

  // Thank you / goodbye
  if (lower.includes('thank') || lower.includes('thanks') || lower.includes('merci') || lower.includes('great') || lower.includes('awesome') || lower.includes('perfect')) {
    return `You're welcome! ☕ Happy to help anytime. Let me know if you need anything else!`;
  }

  if (lower.includes('bye') || lower.includes('goodbye') || lower.includes('see you') || lower.includes('au revoir')) {
    return `Goodbye! 👋 Have a great day. I'll be here whenever you need me! ☕`;
  }

  // Coffee knowledge
  if (lower.includes('what is') || lower.includes('what\'s') || lower.includes('difference between') || lower.includes('tell me about')) {
    // Try to find a product match first
    for (const word of words) {
      if (word.length > 3) {
        const productInfo = await getProductByName(word);
        if (!productInfo.includes('No product named')) {
          return `☕ ${productInfo}`;
        }
      }
    }
    return `That's a great question! While I specialize in managing your Coffee Time dashboard and menu data, I can help with:\n\n• Product information from your menu\n• Business stats and analytics\n• Dashboard navigation\n• Feature explanations\n\nCould you rephrase your question related to the shop? Or try asking about a specific menu item or dashboard feature!`;
  }

  // Default fallback — still helpful
  return `I appreciate your question! 😊 Here are some things I can help with:\n\n• **"What's on the menu?"** — View all products\n• **"How much is [item]?"** — Check prices\n• **"Revenue summary"** — Today's business stats\n• **"What's trending?"** — Popular items\n• **"How to use [feature]?"** — Dashboard guide\n• **"Help"** — See all my capabilities\n\nTry one of these, or ask about any specific product or feature! ☕`;
}

/**
 * POST /chat/guest/send
 * Tries Gemini AI first, falls back to smart local responder.
 */
router.post('/send', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = GuestSendSchema.parse(req.body);
    const { content } = parsed;
    let conversation_id = parsed.conversation_id || undefined;

    // Ensure the admin guest user exists
    let guestUser = await prisma.user.findUnique({ where: { id: ADMIN_GUEST_ID } });
    if (!guestUser) {
      guestUser = await prisma.user.create({
        data: {
          id: ADMIN_GUEST_ID,
          email: 'admin-dashboard@coffeetime.local',
          password_hash: 'GUEST_NO_LOGIN',
        },
      });
    }

    // Verify or create conversation
    if (!conversation_id) {
      const newConv = await prisma.conversation.create({
        data: { user_id: ADMIN_GUEST_ID },
      });
      conversation_id = newConv.id;
    } else {
      const conv = await prisma.conversation.findUnique({ where: { id: conversation_id } });
      if (!conv) {
        const newConv = await prisma.conversation.create({
          data: { user_id: ADMIN_GUEST_ID },
        });
        conversation_id = newConv.id;
      }
    }

    // Save user message
    await prisma.message.create({
      data: { conversation_id, role: 'user', content },
    });

    // Try Gemini first, fall back to local responder
    let responseText: string;

    try {
      const history = await prisma.message.findMany({
        where: { conversation_id },
        orderBy: { created_at: 'asc' },
        take: 20,
      });

      const conversationHistory = history
        .slice(0, -1)
        .map((m) => ({ role: m.role, content: m.content }));

      responseText = await sendToGemini(content, conversationHistory);
      console.log('[Chatbot] Response from Gemini AI');
    } catch (geminiError) {
      console.log('[Chatbot] Gemini unavailable, using local responder');
      responseText = await generateLocalResponse(content);
    }

    // Save AI response
    const aiMessage = await prisma.message.create({
      data: { conversation_id, role: 'assistant', content: responseText },
    });

    res.status(200).json({
      success: true,
      data: { conversation_id, message: aiMessage },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /chat/guest/history?conversation_id=...
 */
router.get('/history', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { conversation_id } = req.query;
    if (!conversation_id || typeof conversation_id !== 'string') {
      return res.status(400).json({ success: false, error: 'conversation_id is required' });
    }

    const messages = await prisma.message.findMany({
      where: { conversation_id },
      orderBy: { created_at: 'asc' },
    });

    res.status(200).json({
      success: true,
      data: { conversation_id, messages },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
