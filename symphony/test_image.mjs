import { GoogleGenAI } from '@google/genai';
import { loadGeminiApiKey } from './lib/short-maker/credentials.js';

async function main() {
  const apiKey = loadGeminiApiKey();
  const ai = new GoogleGenAI({ apiKey });
  
  const response = await ai.models.generateImages({
    model: 'imagen-4.0-generate-001',
    prompt: 'A cute cat playing with a ball',
    config: {
      numberOfImages: 1,
      aspectRatio: '1:1',
      outputMimeType: 'image/png'
    }
  });
  
  console.log("Success! Bytes length:", response.generatedImages[0].image.imageBytes.length);
}
main().catch(console.error);
