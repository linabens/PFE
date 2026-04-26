import React, { createContext, useContext, useState, useCallback } from 'react';
import { sendMessage as apiSendMessage } from '../services/chatService';
import { useSessionStore } from '../store/useSessionStore';
import { useCartStore } from '../store/useCartStore';
import { useOrderStore } from '../store/useOrderStore';
import { useLoyalty } from './LoyaltyContext';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Bonjour ! Je suis Luna ☽, votre assistante BrewLuna. Je peux vous aider avec notre menu, vos commandes, les promotions et votre programme de fidélité. Comment puis-je vous aider ?",
      timestamp: new Date(),
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [quickReplies, setQuickReplies] = useState([
    "Qu'est-ce qui est populaire ? ☕",
    "Promotions du jour 🏷️",
    "Suggère-moi un combo 🍽️",
    "Mes points ⭐"
  ]);

  // Récupération des données des autres stores/contextes
  const { tableId } = useSessionStore();
  const { items: cartItems } = useCartStore();
  const { currentOrderId } = useOrderStore();
  const { loyaltyUser } = useLoyalty();

  const sendMessage = useCallback(async (text) => {
    if (!text.trim()) return;

    // 1. Ajouter le message utilisateur
    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => {
      const newMessages = [...prev, userMsg];
      return newMessages.slice(-50); // Garder max 50 messages
    });

    // 2. Afficher l'indicateur de saisie
    setIsTyping(true);

    try {
      // Préparer l'historique (6 derniers messages)
      const history = messages.slice(-6).map(m => ({
        role: m.role,
        content: m.content
      }));

      // 3. Appeler l'API
      const response = await apiSendMessage({
        message: text,
        tableId,
        cartItems,
        currentOrder: currentOrderId,
        loyaltyPoints: loyaltyUser?.points || 0,
        history
      });

      // 4. Ajouter la réponse de Luna
      const lunaMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.reply,
        timestamp: new Date(response.timestamp || Date.now()),
      };

      setMessages(prev => {
        const newMessages = [...prev, lunaMsg];
        return newMessages.slice(-50);
      });

      // 5. Mettre à jour les suggestions
      if (response.quickReplies && Array.isArray(response.quickReplies)) {
        setQuickReplies(response.quickReplies);
      }
    } catch (error) {
      // Gestion des erreurs
      const errorMsg = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: "Je rencontre un problème technique. Réessayez dans quelques instants. 🙏",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg].slice(-50));
    } finally {
      setIsTyping(false);
    }
  }, [messages, tableId, cartItems, currentOrderId, loyaltyUser]);

  const clearChat = useCallback(() => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: "Bonjour ! Je suis Luna ☽, votre assistante BrewLuna. Je peux vous aider avec notre menu, vos commandes, les promotions et votre programme de fidélité. Comment puis-je vous aider ?",
        timestamp: new Date(),
      }
    ]);
    setQuickReplies([
      "Qu'est-ce qui est populaire ? ☕",
      "Promotions du jour 🏷️",
      "Suggère-moi un combo 🍽️",
      "Mes points ⭐"
    ]);
    setIsTyping(false);
  }, []);

  return (
    <ChatContext.Provider
      value={{
        messages,
        isTyping,
        quickReplies,
        sendMessage,
        clearChat
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
