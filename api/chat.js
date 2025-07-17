// api/chat.js - Version sécurisée et optimisée
export default async (req, res) => {
    // 1. Configuration
    const ALLOWED_ORIGIN = 'https://www.top-affaires.fr';
    const SECRET_HEADER = 'website_php';
    const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

    // 2. Sécurité
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
    res.setHeader('Content-Type', 'application/json');

    if (req.headers['x-request-source'] !== SECRET_HEADER) {
        console.warn("Tentative d'accès non autorisée depuis :", req.headers.origin);
        return res.status(403).json({ 
            success: false, 
            reponse: "Accès refusé : header de sécurité manquant" 
        });
    }

    // 3. Traitement du message
    try {
        const { message } = req.body;
        if (!message || typeof message !== 'string') {
            throw new Error("Message invalide");
        }

        // 4. Appel à Gemini
        const prompt = `[Contexte: Vous êtes Dr. Élise Martin, psychologue. 
        Répondez avec empathie en 2-3 phrases maximum.
        Ne mentionnez jamais que vous êtes une IA.]
        Patient: "${message}"`;

        const response = await fetch(`${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            }),
            timeout: 10000 // 10s max
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Gemini: ${errorData.error?.message || "Erreur inconnue"}`);
        }

        const data = await response.json();
        let reponse = data.candidates?.[0]?.content?.parts?.[0]?.text 
            || "Je ne peux pas répondre pour le moment.";

        // 5. Nettoyage de la réponse
        reponse = reponse
            .replace(/En tant qu'IA/gi, "Dans ma pratique")
            .replace(/Google AI/gi, "Mon expérience clinique")
            .replace(/\n/g, ' ');

        return res.status(200).json({ 
            success: true, 
            reponse 
        });

    } catch (error) {
        console.error("ERREUR API:", error.message);
        return res.status(500).json({
            success: false,
            reponse: process.env.NODE_ENV === 'development'
                ? `Erreur technique : ${error.message}`
                : "Désolé, service temporairement indisponible"
        });
    }
};
