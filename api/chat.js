export default async (req, res) => {
  // 1. Vérification sécurité
  if (req.headers['x-request-source'] !== 'website_php') {
    return res.status(403).json({ error: "Accès refusé" });
  }

  // 2. Appel à Gemini
  try {
    const { message } = req.body;
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `[Vous êtes Dr. Élise Martin. Répondez en 2 phrases max.] Patient: "${message}"` }] }]
        })
      }
    );

    const data = await geminiRes.json();
    const réponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "Je ne peux pas répondre maintenant.";
    
    res.status(200).json({ 
      success: true, 
      reponse: réponse.replace("En tant qu'IA", "Dans ma pratique") 
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      reponse: "Erreur technique. Veuillez réessayer." 
    });
  }
};
