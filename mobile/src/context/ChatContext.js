import React, { createContext, useContext, useState, useCallback } from 'react';
import { sendChatMessage, deleteChatHistory } from '../api/chatApi';

const ChatContext = createContext();

const WELCOME_MESSAGE = {
  id: 'welcome',
  role: 'assistant',
  content: "Bonjour ! Je suis l'assistant Coffee Time ☕. Je peux vous recommander des boissons, répondre à vos questions sur le menu, ou vous aider à choisir selon vos envies. Comment puis-je vous aider ?",
  timestamp: new Date(),
  sources: [],
};

const DEFAULT_QUICK_REPLIES = [
  "Qu'est-ce qui est populaire ? ☕",
  "Options véganes 🌱",
  "Quelque chose de glacé 🧊",
  "Suggère-moi un combo 🍽️",
];

export const ChatProvider = ({ children }) => {
  const [messages, setMessages]       = useState([WELCOME_MESSAGE]);
  const [isTyping, setIsTyping]       = useState(false);
  const [quickReplies, setQuickReplies] = useState(DEFAULT_QUICK_REPLIES);

  const sendMessage = useCallback(async (text) => {
    if (!text.trim()) return;

    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
      sources: [],
    };
    setMessages(prev => [...prev, userMsg].slice(-60));
    setIsTyping(true);

    try {
      const data = await sendChatMessage(text.trim());

      const botMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        sources: data.sources || [],
        confidence: data.confidence,
      };
      setMessages(prev => [...prev, botMsg].slice(-60));

      if (data.low_confidence) {
        setQuickReplies([
          "Voir tout le menu ☕",
          "Options véganes 🌱",
          "Boissons glacées 🧊",
          "Nos pâtisseries 🥐",
        ]);
      } else {
        setQuickReplies(DEFAULT_QUICK_REPLIES);
      }
    } catch (error) {
      const errorMsg = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: "Désolée, je rencontre un problème technique. Réessayez dans quelques instants. 🙏",
        timestamp: new Date(),
        sources: [],
      };
      setMessages(prev => [...prev, errorMsg].slice(-60));
    } finally {
      setIsTyping(false);
    }
  }, []);

  const clearChat = useCallback(async () => {
    try { await deleteChatHistory(); } catch { /* silent */ }
    setMessages([{ ...WELCOME_MESSAGE, timestamp: new Date() }]);
    setQuickReplies(DEFAULT_QUICK_REPLIES);
    setIsTyping(false);
  }, []);

  return (
    <ChatContext.Provider value={{ messages, isTyping, quickReplies, sendMessage, clearChat }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
};
