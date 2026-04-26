import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  Sparkles,
  Minimize2,
  Loader2,
  Coffee,
  Trash2,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const CHATBOT_API_URL = 'http://localhost:3001';

// Typing indicator dots animation
const TypingIndicator = () => (
  <div className="flex items-center gap-1 px-4 py-3">
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full bg-primary/60"
          animate={{ y: [0, -6, 0] }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.15,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  </div>
);

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [hasUnread, setHasUnread] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
      setHasUnread(false);
    }
  }, [isOpen]);


  const doSend = async (text: string) => {
    if (!text || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Build request body — only include conversation_id if we have one
      const body: Record<string, string> = { content: text };
      if (conversationId) {
        body.conversation_id = conversationId;
      }

      let res = await fetch(`${CHATBOT_API_URL}/chat/guest/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      // If we got a server error and were using a conversation_id,
      // retry without it (the old conversation may have been deleted)
      if (!res.ok && conversationId) {
        console.warn('Chat: retrying without stale conversation_id');
        setConversationId(null);
        res = await fetch(`${CHATBOT_API_URL}/chat/guest/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: text }),
        });
      }

      if (!res.ok) {
        const errBody = await res.text();
        console.error('Chat server error:', res.status, errBody);
        throw new Error(`Server responded with ${res.status}`);
      }

      const data = await res.json();

      if (data.success && data.data) {
        if (data.data.conversation_id) {
          setConversationId(data.data.conversation_id);
        }

        const aiMessage: ChatMessage = {
          id: data.data.message?.id || `ai-${Date.now()}`,
          role: 'assistant',
          content: data.data.message?.content || 'I couldn\'t process that. Please try again.',
          timestamp: new Date(data.data.message?.created_at || Date.now()),
        };

        setMessages((prev) => [...prev, aiMessage]);
        if (!isOpen) setHasUnread(true);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I\'m having trouble connecting right now. Please make sure the chatbot server is running and try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = () => doSend(input.trim());

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setConversationId(null);
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* Floating Action Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-[9999] w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-[hsl(var(--deep-roast))] text-white shadow-lg shadow-primary/30 flex items-center justify-center group transition-shadow hover:shadow-xl hover:shadow-primary/40"
            aria-label="Open chat assistant"
            id="chatbot-toggle-btn"
          >
            <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />

            {/* Unread badge */}
            {hasUnread && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full flex items-center justify-center"
              >
                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              </motion.span>
            )}

            {/* Ripple pulse effect */}
            <span className="absolute inset-0 rounded-2xl bg-primary/20 animate-ping opacity-30 pointer-events-none" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed bottom-6 right-6 z-[9999] w-[400px] h-[560px] max-h-[80vh] rounded-2xl overflow-hidden flex flex-col"
            style={{
              background: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              boxShadow: '0 25px 60px -12px rgba(0,0,0,0.25), 0 0 40px -10px hsla(var(--primary), 0.15)',
            }}
            id="chatbot-panel"
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4 shrink-0"
              style={{
                background: 'linear-gradient(135deg, hsl(var(--deep-roast)), hsl(var(--espresso)))',
              }}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                    <Coffee className="w-5 h-5 text-primary" />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[hsl(var(--deep-roast))]" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                    Brew Assistant
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  </h3>
                  <p className="text-[11px] text-white/50 font-medium">AI-powered • Always online</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={clearChat}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white"
                  title="Clear chat"
                  id="chatbot-clear-btn"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white"
                  title="Minimize"
                  id="chatbot-minimize-btn"
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white"
                  title="Close"
                  id="chatbot-close-btn"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scroll-smooth" id="chatbot-messages">
              {/* Welcome message if empty */}
              {messages.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex flex-col items-center justify-center h-full text-center px-6"
                >
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                    <Bot className="w-8 h-8 text-primary" />
                  </div>
                  <h4 className="text-lg font-display text-foreground mb-2">
                    Hi there! ☕
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                    I'm your Brew Assistant. Ask me about menu items, orders, revenue insights, or anything about your coffee shop!
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {['Show me today\'s orders', 'What\'s on the menu?', 'Revenue summary'].map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => doSend(suggestion)}
                        className="text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors font-medium"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Chat Messages */}
              {messages.map((msg, index) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index === messages.length - 1 ? 0.1 : 0 }}
                  className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center ${msg.role === 'user'
                        ? 'bg-primary/15 border border-primary/25'
                        : 'bg-[hsl(var(--deep-roast))] border border-[hsl(var(--muted-brown))]/30'
                      }`}
                  >
                    {msg.role === 'user' ? (
                      <User className="w-3.5 h-3.5 text-primary" />
                    ) : (
                      <Bot className="w-3.5 h-3.5 text-[hsl(var(--cream))]" />
                    )}
                  </div>

                  {/* Bubble */}
                  <div
                    className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${msg.role === 'user'
                        ? 'bg-gradient-to-br from-primary to-[hsl(var(--deep-roast))] text-white rounded-br-md'
                        : 'bg-muted/50 text-foreground border border-border/50 rounded-bl-md'
                      }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                    <p
                      className={`text-[10px] mt-1.5 ${msg.role === 'user' ? 'text-white/50 text-right' : 'text-muted-foreground/50'
                        }`}
                    >
                      {formatTime(msg.timestamp)}
                    </p>
                  </div>
                </motion.div>
              ))}

              {/* Typing indicator */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-2.5"
                >
                  <div className="w-7 h-7 rounded-lg bg-[hsl(var(--deep-roast))] border border-[hsl(var(--muted-brown))]/30 flex items-center justify-center shrink-0">
                    <Bot className="w-3.5 h-3.5 text-[hsl(var(--cream))]" />
                  </div>
                  <div className="bg-muted/50 border border-border/50 rounded-2xl rounded-bl-md">
                    <TypingIndicator />
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="shrink-0 px-4 py-3 border-t border-border/50 bg-card/80 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything about your shop..."
                  disabled={isLoading}
                  className="flex-1 h-10 px-4 rounded-xl bg-background border border-border/60 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 disabled:opacity-50 transition-all"
                  id="chatbot-input"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading}
                  className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-[hsl(var(--deep-roast))] text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-opacity shadow-md shadow-primary/20"
                  id="chatbot-send-btn"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </motion.button>
              </div>
              <p className="text-[10px] text-muted-foreground/40 text-center mt-2 font-medium">
                Powered by Brew AI • Coffee Time Dashboard
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
