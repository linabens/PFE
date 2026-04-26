import { API_BASE_URL } from '../utils/constants';

/**
 * Service pour communiquer avec l'API du chatbot Luna
 */
export const sendMessage = async ({
  message,
  tableId,
  cartItems,
  currentOrder,
  loyaltyPoints,
  history
}) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        tableId,
        cartItems,
        currentOrder,
        loyaltyPoints,
        history
      })
    });

    if (!response.ok) {
      throw new Error('Erreur réseau lors de la communication avec Luna');
    }

    const data = await response.json();
    // Attendus: { reply: string, quickReplies: string[], timestamp: string }
    return data;
  } catch (error) {
    console.error('[ChatService] Error:', error);
    throw error;
  }
};
