// Utilisez ES modules syntax
import { v4 as uuidv4 } from 'uuid';

export default async (req, res) => {
  // 1. Vérification méthode
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  // 2. Traitement du message
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message vide' });
  }

  // 3. Appel à Gemini API
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `[VOTRE PROMPT ICI] Patient : "${message}"`
            }]
          }]
        })
      }
    );

    const data = await response.json();
    const reponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "Je ne peux pas répondre pour le moment.";

    // 4. Réponse simulée humaine
    await new Promise(resolve => setTimeout(resolve, 1500)); // Délai de 1.5s

    return res.status(200).json({
      success: true,
      reponse: reponse.replace("En tant qu'IA", "Dans ma pratique")
    });

  } catch (error) {
    console.error("Erreur API:", error);
    return res.status(500).json({
      success: false,
      reponse: "Problème de connexion. Réessayez plus tard."
    });
  }
};
