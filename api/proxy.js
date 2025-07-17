export default async (req, res) => {
  const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";
  const API_KEY = process.env.GEMINI_API_KEY;

  // Blocage des requêtes non autorisées
  if (req.headers['x-request-source'] !== 'website_php') {
    return res.status(403).json({ error: "Accès refusé : header manquant" });
  }

  try {
    const response = await fetch(`${GEMINI_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: "Erreur proxy : " + error.message });
  }
};
