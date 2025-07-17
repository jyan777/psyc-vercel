// api/proxy.js - Version avec debug complet
export default async (req, res) => {
    // ================= CONFIGURATION =================
    const SECRET_HEADER = 'website_php';
    const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";
    
    // ================= JOURNALISATION =================
    const log = (message) => {
        console.log(`[${new Date().toISOString()}] ${message}`);
    };

    // ================= VÉRIFICATION SÉCURITÉ =================
    log(`Requête reçue depuis: ${req.headers.origin || 'unknown'}`);
    log(`Headers reçus: ${JSON.stringify(req.headers, null, 2)}`);
    
    if (req.headers['x-request-source'] !== SECRET_HEADER) {
        log("Accès refusé: header manquant");
        return res.status(403).json({ 
            success: false, 
            reponse: "Accès refusé" 
        });
    }

    // ================= TRAITEMENT =================
    try {
        const { message } = req.body;
        log(`Message reçu: ${message}`);
        
        if (!message || typeof message !== 'string') {
            throw new Error("Message invalide");
        }

        // Construction du prompt
        const prompt = `[Contexte: Vous êtes Dr. Élise Martin, psychologue.
        Répondez naturellement en 2-3 phrases maximum.
        Ne mentionnez jamais que vous êtes une IA.]
        Patient: "${message}"`;

        log(`Envoi à Gemini: ${prompt.substring(0, 50)}...`);

        // Appel à l'API Gemini
        const startTime = Date.now();
        const response = await fetch(`${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            }),
            timeout: 10000
        });

        const latency = Date.now() - startTime;
        log(`Latence Gemini: ${latency}ms`);

        if (!response.ok) {
            const errorData = await response.json();
            log(`Erreur Gemini: ${JSON.stringify(errorData)}`);
            throw new Error(`Gemini: ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        log(`Réponse Gemini: ${JSON.stringify(data).substring(0, 100)}...`);

        // Nettoyage de la réponse
        let reponse = data.candidates?.[0]?.content?.parts?.[0]?.text 
            || "Je ne peux pas répondre pour le moment.";
        
        reponse = reponse
            .replace(/En tant qu'IA/gi, "Dans ma pratique")
            .replace(/Google AI/gi, "Mon expérience clinique")
            .replace(/\n/g, ' ');

        log(`Réponse finale: ${reponse.substring(0, 50)}...`);

        return res.status(200).json({ 
            success: true, 
            reponse 
        });

    } catch (error) {
        log(`ERREUR: ${error.message}`);
        return res.status(500).json({
            success: false,
            reponse: process.env.NODE_ENV === 'development'
                ? `Erreur technique: ${error.message}`
                : "Désolé, service temporairement indisponible"
        });
    }
};
