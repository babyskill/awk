import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { loadGeminiApiKey } from '../../../../lib/short-maker/credentials.js';

export async function POST(req) {
  try {
    const body = await req.json();
    const { storyboard } = body;

    const apiKey = loadGeminiApiKey();
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API Key missing. Please run `awkit credentials setup`' }, { status: 400 });
    }

    const ai = new GoogleGenAI({ apiKey });

    // Build context from existing scenes
    let contextStr = "New App Promo Video Storyboard.\n";
    if (storyboard?.scenes && storyboard.scenes.length > 0) {
      contextStr += "Existing Scenes:\n";
      storyboard.scenes.forEach((s, idx) => {
        contextStr += `--- Scene ${idx + 1} ---\n`;
        contextStr += `Duration: ${s.duration}s\n`;
        contextStr += `Voiceover: ${s.script || s.tts_text || ''}\n`;
        contextStr += `Visual Prompt: ${s.prompt || s.video_prompt || s.image_prompt || ''}\n`;
        contextStr += `Transition to next: ${s.transition || 'none'}\n\n`;
      });
    }

    // Check for unified background setting
    const bgMode = storyboard?.bg_mode || 'per-scene';
    const bgValue = storyboard?.bg_value || '';
    const hasUnifiedBg = bgMode === 'unified' && bgValue;

    let bgInstruction = '';
    if (hasUnifiedBg) {
      bgInstruction = `\nCRITICAL BACKGROUND RULE: The project uses a UNIFIED background: "${bgValue}". You MUST NOT describe any background in the visual prompt. DO NOT mention any background, environment, setting, or location in the "prompt" field. Focus ONLY on the subject/person, their actions, lighting on the subject, and camera movements. The background will be composited separately.`;
    }

    const prompt = `
${contextStr}

You are an expert video director creating short-form promotional videos for apps (TikTok/Shorts style).
Based on the existing scenes above, generate the NEXT logic scene for this storyboard. It should flow naturally from the previous scene. If this is the very first scene, start with a strong hook.
${bgInstruction}

Requirements:
- The scene should be 3-5 seconds long.
- Provide a punchy, engaging voiceover script ("script").
- Provide a highly detailed visual prompt for an AI video generator like Veo 3 or Runway ("prompt"). The prompt MUST be cinematic, descriptive, without any text/logos, and shot in 16:9 vertical format (or horizontal if the context implies it). Focus on visual actions, lighting, and camera movements.${hasUnifiedBg ? ' Do NOT describe the background — it will be provided separately.' : ' Describe the full environment/background clearly.'}
- Provide the transition to the next scene ("transition"). Use one of: fade, crossfade, wipeleft, wiperight, slideleft, slideright, circlecrop, dissolve, pixelize, none.

Return ONLY a valid JSON object with the following keys, and NO markdown formatting (no \`\`\`json):
{
  "duration": number,
  "script": "Voiceover text here",
  "prompt": "Detailed cinematic visual prompt here${hasUnifiedBg ? ' (NO background description)' : ''}",
  "transition": "fade"
}
`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            temperature: 0.7,
            responseMimeType: 'application/json',
        }
    });

    const textPayload = response.text;
    const result = JSON.parse(textPayload);

    // Append unified background to the generated prompt
    if (hasUnifiedBg && result.prompt) {
      result.prompt = `${result.prompt}\n\nBackground: ${bgValue}`;
    }

    return NextResponse.json({ success: true, scene: result }, { status: 200 });

  } catch (error) {
    console.error('AI Scene Gen Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
