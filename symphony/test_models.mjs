import { GoogleGenAI } from '@google/genai';
import { loadGeminiApiKey } from './lib/short-maker/credentials.js';

async function main() {
  const apiKey = loadGeminiApiKey();
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.list();
  
  for await (const model of response) {
    if (model.name.includes('imagen') || model.name.includes('gemini-3')) {
        console.log("Found:", model.name);
    }
  }
}
main().catch(console.error);
