
import { GoogleGenAI } from "@google/genai";
import { Transaction } from "../types";

export const getFinancialInsights = async (transactions: Transaction[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const summary = transactions.map(t => `${t.date}: ${t.amount} in ${t.category} (${t.description})`).join('\n');
  
  const prompt = `
    Analyze these user transactions and provide 3 brief, actionable financial insights or observations.
    Keep it encouraging and professional. Max 100 words total.
    
    Transactions:
    ${summary || 'No transactions yet.'}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Could not generate insights at this time. Keep tracking your expenses!";
  }
};
