import { GoogleGenAI } from '@google/genai';
try {
  const ai = new GoogleGenAI({ apiKey: 'dummy' });
  console.log(Object.keys(ai.models));
} catch(e) { console.error(e) }
