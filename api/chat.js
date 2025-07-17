// api/chat.js - Version simplifiée pour diagnostic
export default async (req, res) => {
  // Autoriser les requêtes depuis votre site
  res.setHeader('Access-Control-Allow-Origin', 'https://www.top-affaires.fr');
  res.setHeader('Content-Type', 'application/json');

  // Mode simulation activable/désactivable
  const SIMULATION_MODE = true; // ← Mettez à false pour réactiver Gemini

  if (SIMULATION_MODE) {
    // Réponses simulées pour tester sans l'API Gemini
    const responses = [
      "Je suis actuellement en mode test. Tout fonctionne côté serveur !",
      "Cette réponse simulée confirme que Vercel répond correctement.",
      "Le problème ne vient pas du déploiement Vercel."
    ];

    // Simulation délai humain (1 à 3 secondes)
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    return res.status(200).json({
      success: true,
      reponse: responses[Math.floor(Math.random() * responses.length)]
    });
  }

  // Code original (à n'utiliser que si SIMULATION_MODE = false)
  try {
    const { message } = req.body;
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `[Votre prompt habituel] Patient : "${message}"`
            }]
          }]
        })
      }
    );

    const data = await response.json();
    const reponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "Pas de réponse";

    return res.status(200).json({
      success: true,
      reponse: reponse.replace("En tant qu'IA", "Dans ma pratique")
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      reponse: "Erreur technique (mode réel)"
    });
  }
};
