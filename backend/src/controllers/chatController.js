const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialisation de Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Charge les fichiers de données pour le contexte RAG
 */
const loadContext = () => {
  try {
    const dataDir = path.join(__dirname, '../../Data');
    const menu = fs.readFileSync(path.join(dataDir, 'menu.txt'), 'utf8');
    const promotions = fs.readFileSync(path.join(dataDir, 'promotion.txt'), 'utf8');
    const faq = fs.readFileSync(path.join(dataDir, 'faq.txt'), 'utf8');
    
    return `
CONTEXTE BOUTIQUE BREWLUNA:
--- MENU ---
${menu}

--- PROMOTIONS ET FIDÉLITÉ ---
${promotions}

--- FAQ / INFOS PRATIQUES ---
${faq}
`;
  } catch (error) {
    console.error('[ChatController] Erreur chargement contexte:', error);
    return 'Désolé, les informations de la boutique ne sont pas disponibles actuellement.';
  }
};

/**
 * POST /api/chat
 */
exports.chat = async (req, res, next) => {
  try {
    const { message, tableId, cartItems, currentOrder, loyaltyPoints, history } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, error: 'Message requis' });
    }

    console.log('[ChatController] Message reçu:', message);

    // Préparation du contexte dynamique de l'utilisateur
    const userContext = `
INFOS UTILISATEUR ACTUEL:
- Table: ${tableId || 'Non assignée'}
- Panier actuel: ${JSON.stringify(cartItems || [])}
- Commande en cours: ${currentOrder || 'Aucune'}
- Points de fidélité: ${loyaltyPoints || 0}
`;

    const systemPrompt = `
Tu es Luna ☽, l'assistante virtuelle de BrewLuna.
Tu es polie, chaleureuse et efficace. Ton but est d'aider les clients.

CONSIGNES:
1. Utilise UNIQUEMENT les informations du contexte fourni pour répondre.
2. Si tu ne connais pas la réponse, dis-le poliment et suggère de demander au staff.
3. Réponds de manière concise.
4. N'invente jamais de prix ou de promotions non listés.
5. Si un client demande ses points, utilise les infos de "INFOS UTILISATEUR ACTUEL".
6. Réponds TOUJOURS dans la langue utilisée par l'utilisateur (Français, Anglais ou Arabe Tunisien/Standard).
7. Propose toujours 2 ou 3 suggestions de réponses courtes (quickReplies) à la fin de ta réponse sous format JSON.

Structure de la réponse attendue (JSON):
{
  "reply": "Ta réponse ici...",
  "quickReplies": ["Suggestion 1", "Suggestion 2"]
}

CONTEXTE DE RÉFÉRENCE:
${loadContext()}
${userContext}
`;

    console.log('[ChatController] Appel à Gemini (gemini-2.5-flash)...');
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Préparation de l'historique pour Gemini
    let chatHistory = (history || []).map(h => ({
      role: h.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: h.content }],
    }));

    // Gemini exige que l'historique commence par un message 'user'
    const firstUserIndex = chatHistory.findIndex(h => h.role === 'user');
    if (firstUserIndex !== -1) {
      chatHistory = chatHistory.slice(firstUserIndex);
    } else {
      chatHistory = []; // Si aucun message user, on vide pour éviter l'erreur
    }

    const chatSession = model.startChat({
      history: chatHistory,
      generationConfig: {
        maxOutputTokens: 800,
        responseMimeType: "application/json",
      },
    });

    const fullMessage = `SYSTEM INSTRUCTION: ${systemPrompt}\n\nUSER QUESTION: ${message}`;
    
    const result = await chatSession.sendMessage(fullMessage);
    const responseText = result.response.text();
    console.log('[ChatController] Réponse Gemini reçue');
    
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      responseData = {
        reply: responseText,
        quickReplies: ["Menu ☕", "Promotions 🏷️", "Aide ❓"]
      };
    }

    res.json({
      ...responseData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[ChatController] Error:', error);
    
    let userFriendlyMessage = "Je rencontre un problème technique. Réessayez dans quelques instants. 🙏";
    if (error.message.includes('fetch failed')) {
      userFriendlyMessage = "Désolé, je n'arrive pas à contacter mes serveurs. Vérifiez la connexion internet du serveur BrewLuna. 🌐";
    }

    res.status(500).json({
      reply: userFriendlyMessage,
      quickReplies: ["Réessayer"],
      timestamp: new Date().toISOString()
    });
  }
};
