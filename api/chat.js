// api/chat.js - Solution complète pour Vercel + Gemini
export default async function handler(req, res) {
  // ================= CONFIGURATION =================
  const ALLOWED_ORIGIN = 'https://www.top-affaires.fr';
  const REQUIRED_HEADER = 'website_php';
  const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

  // ================= SÉCURITÉ =================
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Content-Type', 'application/json');

  // Blocage des requêtes non autorisées
  if (req.headers['x-request-source'] !== REQUIRED_HEADER) {
    return res.status(403).json({
      success: false,
      reponse: "Accès refusé : header de sécurité manquant"
    });
  }

  // ================= MODE SIMULATION (OPTIONNEL) =================
  const SIMULATION_MODE = false; // ← Mettre à true pour tester sans Gemini

  if (SIMULATION_MODE) {
    const responses = [
      "Je suis actuellement en mode test. Tout fonctionne côté serveur !",
      "Cette réponse simulée confirme que Vercel répond correctement.",
      "Le problème ne vient pas du déploiement Vercel."
    ];

    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    return res.status(200).json({
      success: true,
      reponse: responses[Math.floor(Math.random() * responses.length)]
    });
  }

  // ================= MODE RÉEL (GEMINI) =================
  try {
    const { message } = req.body;
    
    // Validation du message
    if (!message || typeof message !== 'string') {
      throw new Error("Message invalide");
    }

    // Construction du prompt
    const prompt = `[Contexte: Vous êtes Dr. Élise Martin, psychologue. 
    Répondez avec empathie en 2-3 phrases maximum, de manière naturelle.
    Ne mentionnez jamais que vous êtes une IA.]
    Patient: "${message}"`;

    // Appel à l'API Gemini
    const response = await fetch(`${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      }),
      timeout: 10000 // 10 secondes max
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API Gemini: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    let reponse = data.candidates?.[0]?.content?.parts?.[0]?.text 
      || "Je n'ai pas pu générer de réponse.";

    // Nettoyage de la réponse
    reponse = reponse
      .replace("En tant qu'IA", "Dans ma pratique")
      .replace("Google AI", "Mon expérience clinique")
      .replace(/\n/g, ' '); // Suppression des sauts de ligne

    return res.status(200).json({
      success: true,
      reponse: reponse
    });

  } catch (error) {
    console.error("Erreur API:", error.message); // Log dans Vercel
    
    return res.status(500).json({
      success: false,
      reponse: process.env.NODE_ENV === 'development'
        ? `Erreur technique : ${error.message}`
        : "Désolé, service temporairement indisponible. Veuillez réessayer."
    });
  }
}
