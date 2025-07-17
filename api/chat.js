import { v4 as uuidv4 } from 'uuid';

export default async (req, res) => {
    // Autoriser CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    try {
        const { message } = req.body;
        if (!message || typeof message !== 'string') {
            return res.status(400).json({ error: 'Message invalide' });
        }

        // Prompt optimisé
        const prompt = {
            contents: [{
                parts: [{
                    text: `Tu es Dr. Élise Martin, psychologue clinicienne. 
                           Réponds de manière professionnelle mais chaleureuse :
                           Patient : "${message.trim()}"
                           Consignes :
                           - Maximum 3 phrases
                           - Ton naturel et empathique
                           - Ne parle pas de ton statut d'IA
                           - Utilise "mon expérience clinique" plutôt que "mon algorithme"`
                }]
            }]
        };

        // Appel à l'API Gemini
        const apiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(prompt),
                timeout: 10000
            }
        );

        if (!apiResponse.ok) {
            throw new Error(`API Gemini a répondu avec le statut ${apiResponse.status}`);
        }

        const data = await apiResponse.json();
        const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text 
            || "Je n'ai pas pu générer de réponse.";

        // Simulation délai humain
        await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));

        return res.status(200).json({
            success: true,
            reponse: responseText
                .replace(/En tant qu'IA|mon algorithme/gi, match => 
                    match === "En tant qu'IA" ? "Dans ma pratique" : "mon expérience clinique")
        });

    } catch (error) {
        console.error("ERREUR API:", error);
        return res.status(500).json({
            success: false,
            reponse: process.env.NODE_ENV === 'development' 
                ? `Erreur technique: ${error.message}`
                : "Désolé, je rencontre une difficulté technique. Pouvez-vous reformuler ?"
        });
    }
};
