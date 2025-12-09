import { GoogleGenAI } from "@google/genai";
import { Trade } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeTradeJournal = async (trades: Trade[]): Promise<string> => {
  if (trades.length === 0) {
    return "Aucune donnée de trade disponible pour l'analyse. Veuillez ajouter des trades.";
  }

  // Prepare a summarized version of trades to save tokens
  const tradeSummary = trades.slice(0, 50).map(t => ({
    date: t.date,
    pair: t.pair,
    type: t.type,
    pnl: t.pnl,
    setup: t.setup,
    notes: t.notes
  }));

  const prompt = `
    Agis comme un coach de trading professionnel senior (style TradeZella/Mike Bellafiore).
    Analyse les données de trading suivantes (format JSON) et fournis un feedback constructif en Français.
    
    Données:
    ${JSON.stringify(tradeSummary)}

    Concentre-toi sur :
    1. La psychologie (basée sur les notes et les résultats).
    2. La gestion du risque (taille des pertes vs gains).
    3. La consistance.
    4. Une recommandation actionnable pour la semaine prochaine.
    
    Réponds directement au trader avec un ton professionnel mais encourageant. Utilise le Markdown pour le formatage.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: "Tu es un expert en analyse de performance financière et psychologie du trading.",
        temperature: 0.7,
      }
    });

    return response.text || "Impossible de générer l'analyse.";
  } catch (error) {
    console.error("Erreur Gemini:", error);
    return "Une erreur est survenue lors de l'analyse IA. Vérifiez votre clé API.";
  }
};