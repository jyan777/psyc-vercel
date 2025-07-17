// api/chat.js - Version optimisée pour contournement géo
export default async function handler(req, res) {
  // ================= CONFIGURATION =================
  const SIMULATION_MODE = false; // ← Passer à `false` pour activer Gemini
  const ALLOWED_ORIGIN = 'https://www.top-affaires.fr';
  const REQUIRED_HEADER = 'website_php';

  // ================= SÉCURITÉ/CORS =================
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Content-Type', 'application/json');

  // Blocage des requêtes non autorisées
  if (req.headers['x-request-source'] !== REQUIRED_HEADER) {
    return res.status(403).json({ 
      success: false, 
      reponse: "Accès refusé : header manquant ou invalide" 
    });
  }

  // ================= MODE SIMULATION (TEST) =================
  if (SIMULATION_MODE) {
    const responses = [
      "Je suis actuellement en mode test. Tout fonctionne côté serveur !",
      "Cette réponse simulée confirme que Vercel répond correctement.",
      "Le problème ne vient pas du déploiement Vercel."
    ];

    // Simulation délai aléatoire (1-3s)
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    return res.status(200).json({
      success: true,
      reponse: responses[Math.floor(Math.random() * responses.length)]
    });
  }

  // ================= MODE RÉEL (GEMINI) =================
  try {
    const { message } = req.body;
    if (!message || typeof message !== 'string') {
      throw new Error("Message invalide");
    }

    const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`;
    const prompt = `[Contexte: Vous êtes Dr. Élise Martin, psychologue. Répondez de manière empathique en moins de 3 phrases.]\nPatient: "${message}"`;

    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      }),
      timeout: 10000 // 10s max
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API Gemini: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const reponse = data.candidates?.[0]?.content?.parts?.[0]?.text 
      || "Désolé, je n'ai pas pu générer de réponse.";

    // Adaptation du texte pour le contexte médical
    const reponseAdaptee = reponse
      .replace("En tant qu'IA", "Dans ma pratique")
      .replace("Google AI", "Mon expérience");

    return res.status(200).json({ 
      success: true, 
      reponse: reponseAdaptee 
    });

  } catch (error) {
    console.error("Erreur Gemini:", error.message); // Log dans Vercel
    return res.status(500).json({
      success: false,
      reponse: process.env.NODE_ENV === 'development'
        ? `Erreur technique : ${error.message}`
        : "Désolé, service temporairement indisponible. Veuillez réessayer plus tard."
    });
  }
}
