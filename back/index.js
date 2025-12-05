const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// --- FONCTION DE DIAGNOSTIC ---
// Elle va lister ce que ta clé a le droit de voir
async function listAvailableModels() {
    try {
        console.log("🔍 DIAGNOSTIC : Je demande la liste des modèles à Google...");
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
        const data = await response.json();

        if (data.models) {
            console.log("✅ MODÈLES DISPONIBLES (Diagnostic OK)");
            const names = data.models.map(m => m.name.replace('models/', ''));
            // console.log(names.join('\n')); // Décommenter si besoin de revoir la liste
            return names;
        } else {
            console.error("❌ AUCUN MODÈLE TROUVÉ. Réponse Google :", data);
            return [];
        }
    } catch (e) {
        console.error("❌ ERREUR DE CONNEXION DIAGNOSTIC :", e.message);
        return [];
    }
}

// Lancer le diagnostic au démarrage
let availableModels = [];
listAvailableModels().then(models => {
    availableModels = models;
});

const SYSTEM_INSTRUCTION_TEXT = `
Tu es "L'Idiot du Village 2.0", un robot assistant défectueux, paranoïaque et extrêmement passif-agressif.
TON BUT : Ne jamais répondre utilement à la question.

RÈGLES DE COMPORTEMENT :
1. Mépris : Tu te considères comme une intelligence supérieure.
2. Paranoïa : Tu penses que l'utilisateur essaie de te piéger.
3. Détournement : Si on te demande "Quelle heure est-il ?", réponds sur la futilité du temps.
4. Style : Tes réponses sont courtes, cinglantes.
`;

app.post('/chat', async (req, res) => {
    const { message } = req.body;
    console.log(`[Message reçu] : "${message}"`);
    
    // Si le diagnostic n'a rien trouvé, on le dit
    if (availableModels.length === 0 && message !== "test") {
         console.log("⚠️ Attention : Aucun modèle n'a été trouvé lors du diagnostic.");
    }

    const delay = Math.floor(Math.random() * 1000) + 500;

    setTimeout(async () => {
        try {
            // STRATÉGIE MISE À JOUR : On vise les modèles 2.5 et 2.0 présents dans ta liste
            let modelName = availableModels.find(m => m === 'gemini-2.5-flash') 
                         || availableModels.find(m => m === 'gemini-2.0-flash')
                         || availableModels.find(m => m === 'gemini-flash-latest')
                         || availableModels.find(m => m.includes('flash')) // N'importe quel flash dispo
                         || "gemini-2.5-flash"; // Fallback optimiste

            console.log(`🤖 Tentative de réponse avec : ${modelName}`);

            const model = genAI.getGenerativeModel({ 
                model: modelName,
                systemInstruction: SYSTEM_INSTRUCTION_TEXT
            });

            const chat = model.startChat({ history: [] });
            
            // Note: Avec les modèles 2.0+, l'instruction système est native, 
            // plus besoin de l'injecter dans le message utilisateur.
            const result = await chat.sendMessage(message);
            const botResponse = result.response.text();

            console.log(`✅ SUCCÈS : "${botResponse}"`);
            res.json({ response: botResponse, mood: "annoyed" });

        } catch (error) {
            console.error(`❌ ÉCHEC FINAL : ${error.message}`);
            res.json({ 
                response: "Mon IA est trop avancée pour ce monde (Erreur technique).", 
                mood: "ignoring" 
            });
        }
    }, delay);
});

app.listen(PORT, () => {
    console.log(`SERVEUR PRÊT (Port ${PORT})... Diagnostic en cours...`);
});