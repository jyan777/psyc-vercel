<?php
session_start();

// ================= CONFIGURATION =================
define('BASE_URL', 'https://www.top-affaires.fr/psyc/');
define('VERCEL_API_URL', 'https://psyc-vercel.vercel.app/api/chat');
define('MODE_DEV', true); // À passer à false en production
define('LOG_FILE', __DIR__.'/chat_errors.log');

// ================= DONNÉES THÉRAPEUTE =================
$therapeute = [
    'nom' => "Dr. Élise Martin",
    'photo' => BASE_URL . "assets/img/psychologue1.jpg",
    'specialite' => "Psychologue clinicienne - 15 ans d'expérience"
];

// ================= TRAITEMENT API =================
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    header('Content-Type: application/json');
    
    try {
        // 1. Validation des données
        $input = json_decode(file_get_contents('php://input'), true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception("Erreur : Format JSON invalide");
        }

        $message = trim($input['message'] ?? '');
        if (empty($message)) {
            throw new Exception("Erreur : Message vide");
        }

        // 2. Configuration cURL
        $headers = [
            'Content-Type: application/json',
            'X-Request-Source: website_php' // Header critique
        ];

        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => VERCEL_API_URL,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode(['message' => $message]),
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_TIMEOUT => 30, // Timeout augmenté à 30s
            CURLOPT_SSL_VERIFYPEER => true
        ]);

        // 3. Journalisation (debug)
        if (MODE_DEV) {
            file_put_contents(LOG_FILE, date('[Y-m-d H:i:s]')." Requête envoyée à Vercel\n", FILE_APPEND);
        }

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        
        // 4. Gestion des erreurs
        if (curl_errno($ch)) {
            throw new Exception("Erreur cURL : " . curl_error($ch));
        }

        if ($httpCode !== 200) {
            throw new Exception("Erreur HTTP $httpCode : " . substr($response, 0, 500));
        }

        $data = json_decode($response, true);
        if (!isset($data['success'])) {
            throw new Exception("Réponse inattendue : " . substr($response, 0, 500));
        }

        echo $response;

    } catch (Exception $e) {
        // Journalisation et retour d'erreur
        $errorMessage = date('[Y-m-d H:i:s]')." ERREUR : " . $e->getMessage() . "\n";
        file_put_contents(LOG_FILE, $errorMessage, FILE_APPEND);

        http_response_code(500);
        echo json_encode([
            'success' => false,
            'reponse' => MODE_DEV 
                ? "Erreur technique : " . $e->getMessage() 
                : "Désolé, service temporairement indisponible. Veuillez réessayer."
        ]);
    } finally {
        if (isset($ch)) curl_close($ch);
    }
    exit;
}

// ================= AFFICHAGE HTML =================
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chat avec <?= htmlspecialchars($therapeute['nom'], ENT_QUOTES, 'UTF-8') ?></title>
    <link rel="stylesheet" href="<?= BASE_URL ?>assets/css/chat.css">
    <style>
        /* Styles optimisés */
        .chat-container {
            max-width: 800px;
            margin: 20px auto;
            padding: 20px;
            border: 1px solid #e0e0e0;
            border-radius: 10px;
            background: #f9f9f9;
        }
        .dev-banner {
            background: #ffcc00;
            color: #000;
            padding: 10px;
            text-align: center;
            font-weight: bold;
            margin-bottom: 20px;
        }
        .message {
            margin: 15px 0;
            padding: 12px;
            border-radius: 8px;
            line-height: 1.5;
        }
        .therapist-message {
            background: #e3f2fd;
            border-left: 4px solid #2196f3;
        }
        .user-message {
            background: #f5f5f5;
            border-left: 4px solid #9e9e9e;
            margin-left: 15%;
        }
        #message-form {
            display: flex;
            gap: 10px;
            margin-top: 20px;
        }
        #message-input {
            flex: 1;
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 6px;
            font-size: 16px;
        }
        #send-button {
            padding: 12px 24px;
            background: #4a6fa5;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
        }
        .typing-indicator:after {
            content: '...';
            animation: dots 1.5s infinite;
        }
        @keyframes dots {
            0%, 20% { content: '.'; }
            40% { content: '..'; }
            60% { content: '...'; }
        }
    </style>
</head>
<body>
    <?php if (MODE_DEV): ?>
    <div class="dev-banner">
        MODE DÉVELOPPEMENT ACTIF | 
        API: <?= htmlspecialchars(VERCEL_API_URL, ENT_QUOTES, 'UTF-8') ?> | 
        Dernière erreur : <span id="last-error">Aucune</span>
    </div>
    <?php endif; ?>

    <div class="chat-container">
        <div id="chat-messages">
            <div class="message therapist-message">
                <div class="therapist-header">
                    <img src="<?= htmlspecialchars($therapeute['photo'], ENT_QUOTES, 'UTF-8') ?>" 
                         alt="<?= htmlspecialchars($therapeute['nom'], ENT_QUOTES, 'UTF-8') ?>" 
                         style="width:50px;height:50px;border-radius:50%;object-fit:cover;">
                    <strong><?= htmlspecialchars($therapeute['nom'], ENT_QUOTES, 'UTF-8') ?> :</strong>
                </div>
                Bonjour, je suis <?= htmlspecialchars($therapeute['nom'], ENT_QUOTES, 'UTF-8') ?>. 
                Comment puis-je vous aider aujourd'hui ?
            </div>
        </div>
        
        <form id="message-form">
            <input type="text" id="message-input" placeholder="Votre message..." required>
            <button type="submit" id="send-button">Envoyer</button>
        </form>
    </div>

    <script>
    // Fonction d'échappement HTML
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    document.addEventListener('DOMContentLoaded', () => {
        const form = document.getElementById('message-form');
        const chatBox = document.getElementById('chat-messages');
        const input = document.getElementById('message-input');

        async function sendMessage() {
            const message = input.value.trim();
            if (!message) return;

            // Ajout du message utilisateur
            chatBox.innerHTML += `
                <div class="message user-message">
                    <strong>Vous :</strong> ${escapeHtml(message)}
                </div>
            `;
            input.value = '';
            scrollToBottom();

            // Indicateur "typing"
            const typingId = 'typing-' + Date.now();
            chatBox.innerHTML += `
                <div id="${typingId}" class="message therapist-message typing-indicator">
                    <strong><?= htmlspecialchars($therapeute['nom'], ENT_QUOTES, 'UTF-8') ?> :</strong> est en train d'écrire
                </div>
            `;
            scrollToBottom();

            try {
                const response = await fetch('<?= BASE_URL ?>chat.php', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'X-Request-Source': 'website_php' // Header critique
                    },
                    body: JSON.stringify({ message })
                });

                const data = await response.json();
                document.getElementById(typingId).remove();

                if (data.success) {
                    chatBox.innerHTML += `
                        <div class="message therapist-message">
                            <div class="therapist-header">
                                <img src="<?= htmlspecialchars($therapeute['photo'], ENT_QUOTES, 'UTF-8') ?>" 
                                     style="width:50px;height:50px;border-radius:50%;object-fit:cover;">
                                <strong><?= htmlspecialchars($therapeute['nom'], ENT_QUOTES, 'UTF-8') ?> :</strong>
                            </div>
                            ${escapeHtml(data.reponse)}
                        </div>
                    `;
                } else {
                    throw new Error(data.reponse || "Erreur inconnue");
                }
            } catch (error) {
                document.getElementById(typingId)?.remove();
                chatBox.innerHTML += `
                    <div class="message" style="color:#d32f2f;background:#ffebee;">
                        Erreur : ${escapeHtml(error.message)}
                    </div>
                `;
                <?php if (MODE_DEV): ?>
                document.getElementById('last-error').textContent = error.message;
                <?php endif; ?>
            } finally {
                scrollToBottom();
            }
        }

        function scrollToBottom() {
            chatBox.scrollTop = chatBox.scrollHeight;
        }

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            sendMessage();
        });

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        input.focus();
    });
    </script>
</body>
</html>
