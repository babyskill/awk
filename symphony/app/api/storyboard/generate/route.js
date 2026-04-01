/**
 * Storyboard Generate API — Server-Sent Events endpoint.
 *
 * Handles interactive generation of images, videos, and audio
 * for individual scenes or batch operations.
 *
 * - Image/Video generation: delegates to gflow Python CLI via child_process.spawn
 * - Audio generation: uses native Node.js lucylab-tts.js
 * - Video mixing: uses native Node.js video-mixer.js
 *
 * All operations stream logs back to the client via SSE.
 */

import { spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { loadGeminiApiKey } from '../../../../lib/short-maker/credentials.js';
import { generateTts, generateAllTts } from '../../../../lib/short-maker/lucylab-tts.js';
import { mixVideo } from '../../../../lib/short-maker/video-mixer.js';

// Resolve short-maker-outputs directory relative to symphony workspace
function getProjectDir(projectId) {
  // Symphony runs from main-awf/symphony — outputs are at main-awf/short-maker-outputs/
  const base = path.resolve(process.cwd(), '..', 'short-maker-outputs', projectId);
  if (!fs.existsSync(base)) {
    throw new Error(`Project not found: ${projectId}`);
  }
  return base;
}

/**
 * Load storyboard.json for a project.
 */
function loadStoryboard(projectDir) {
  const sbPath = path.join(projectDir, 'storyboard.json');
  if (!fs.existsSync(sbPath)) {
    throw new Error('storyboard.json not found');
  }
  return JSON.parse(fs.readFileSync(sbPath, 'utf-8'));
}

/**
 * Backup an existing file by appending a timestamp.
 */
function backupFileIfExists(filePath, type, onLog) {
  if (fs.existsSync(filePath)) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `${filePath}.backup.${timestamp}`;
    fs.copyFileSync(filePath, backupPath);
    onLog(`[${type}] 💾 Backed up existing file to prevent overwrite: ${path.basename(backupPath)}`);
  }
}

/**
 * Run a Python CLI command (gflow) and stream stdout/stderr via SSE.
 */
function runPythonCli(command, args, onLog) {
  return new Promise((resolve, reject) => {
    let spawnCmd = command;
    let spawnArgs = args;
    const spawnEnv = { ...process.env };

    // Resolve gflow → python3 -m gflow.cli.main with correct PYTHONPATH
    const GFLOW_DIR = path.join(os.homedir(), '.gemini/antigravity/skills/short-maker/scripts/google-flow-cli');
    if (command === 'gflow' && fs.existsSync(GFLOW_DIR)) {
      spawnCmd = 'python3';
      spawnArgs = ['-m', 'gflow.cli.main', ...args];
      spawnEnv.PYTHONPATH = GFLOW_DIR + (spawnEnv.PYTHONPATH ? `:${spawnEnv.PYTHONPATH}` : '');
      onLog(`[CLI] Using gflow from ${GFLOW_DIR}`);
    }

    // Ensure common user paths are available
    const extraPaths = [
      path.join(os.homedir(), '.local/bin'),
      '/opt/homebrew/bin',
      '/usr/local/bin',
    ].join(':');
    spawnEnv.PATH = `${extraPaths}:${spawnEnv.PATH || ''}`;

    const proc = spawn(spawnCmd, spawnArgs, {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: spawnEnv,
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      const text = data.toString();
      stdout += text;
      for (const line of text.split('\n').filter(l => l.trim())) {
        onLog(line.trim());
      }
    });

    proc.stderr.on('data', (data) => {
      const text = data.toString();
      stderr += text;
      for (const line of text.split('\n').filter(l => l.trim())) {
        onLog(line.trim());
      }
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`Command exited with code ${code}: ${stderr.slice(-500)}`));
      }
    });

    proc.on('error', reject);
  });
}

async function generateImage({ projectDir, sceneIndex, prompt, aspectRatio = '16:9', seed }, onLog) {
  const sceneId = `scene-${String(sceneIndex + 1).padStart(2, '0')}`;
  const outDir = path.join(projectDir, 'storyboard');
  fs.mkdirSync(outDir, { recursive: true });

  // Load character + project settings for visual consistency
  let finalPrompt = prompt;
  const charRefPath = path.join(projectDir, 'character_ref.png');
  const hasCharRef = fs.existsSync(charRefPath);
  let charPrompt = '';
  let bgValue = '';
  try {
    const sb = loadStoryboard(projectDir);
    charPrompt = sb.character_prompt || '';
    if (sb.bg_mode === 'unified' && sb.bg_value) {
      bgValue = sb.bg_value;
    }
  } catch { /* ignore */ }

  // Inject character description into prompt
  if (charPrompt) {
    finalPrompt = `[IMPORTANT - MAIN CHARACTER: ${charPrompt}. This exact character MUST appear in this scene as the main subject. Keep their appearance, clothing, and style exactly consistent.]\n\n${prompt}`;
    onLog(`[Image] 🎭 Character prompt injected`);
  } else if (hasCharRef) {
    finalPrompt = `[IMPORTANT: The main character from the reference image MUST appear in this scene as the primary subject. Keep their appearance exactly consistent with the reference.]\n\n${prompt}`;
    onLog(`[Image] 🎭 Character reference image will be used`);
  }

  // Override background if unified mode is set
  if (bgValue) {
    finalPrompt = `[MANDATORY BACKGROUND — OVERRIDE ALL: The background for this scene MUST be: ${bgValue}. IGNORE and DISCARD any background, environment, setting, or location described in the scene prompt below. The subject should be placed against this exact background ONLY.]\n\n${finalPrompt}`;
    onLog(`[Image] 🎨 Background override: ${bgValue.slice(0, 60)}...`);
  }

  onLog(`[Image] Generating image for ${sceneId}...`);
  onLog(`[Image] Prompt: "${finalPrompt.slice(0, 120)}..."`);

  const outPath = path.join(outDir, `${sceneId}.png`);
  backupFileIfExists(outPath, 'Image', onLog);

  // Try gflow first — positional PROMPT, options use --aspect-ratio, -o, --num
  const args = [
    'generate-image',
    finalPrompt,
    '--aspect-ratio', aspectRatio === '16:9' ? '16:9' : aspectRatio,
    '-o', outPath,
    '--num', '1',
  ];
  if (seed) args.push('--seed', String(seed));

  try {
    await runPythonCli('gflow', args, onLog);
    onLog(`[Image] ✅ ${sceneId} image generated`);
    return { success: true, path: path.join(outDir, `${sceneId}.png`) };
  } catch (err) {
    if (!(err.message.includes('ENOENT') || err.message.includes('not found'))) {
      onLog(`[Image] ❌ Failed: ${err.message}`);
      return { success: false, error: err.message };
    }
    
    onLog(`[Image] ⚠️ gflow not found. Falling back to Gemini API...`);
    try {
      const apiKey = loadGeminiApiKey();
      if (!apiKey) throw new Error('No Gemini API key found in credentials.');
      const ai = new GoogleGenAI({ apiKey });

      // If character reference image exists → use Gemini multimodal to generate with reference
      if (hasCharRef) {
        onLog(`[Image] 🎭 Using Gemini multimodal with character_ref.png`);
        const refImageBytes = fs.readFileSync(charRefPath);
        const refBase64 = refImageBytes.toString('base64');

        try {
          const response = await ai.models.generateContent({
            model: 'gemini-3-pro-image-preview',
            contents: [
              {
                parts: [
                  { inlineData: { mimeType: 'image/png', data: refBase64 } },
                  { text: `You are an expert image generator. Look at this reference character image carefully. Now generate a NEW image for this scene that features this EXACT same person (same face, body type, clothing style, hair) in the following scenario:\n\n${prompt}\n\nGenerate a high-quality, photorealistic ${aspectRatio} image. The character MUST look exactly like the person in the reference image.` }
                ]
              }
            ],
            config: {
              responseModalities: ['image', 'text'],
            }
          });

          // Extract generated image from response
          const parts = response.candidates?.[0]?.content?.parts || [];
          const imagePart = parts.find(p => p.inlineData?.mimeType?.startsWith('image/'));
          if (imagePart) {
            fs.writeFileSync(outPath, Buffer.from(imagePart.inlineData.data, 'base64'));
            onLog(`[Image] ✅ ${sceneId} generated via Gemini multimodal (with character reference)`);
            return { success: true, path: outPath };
          } else {
            onLog(`[Image] ⚠️ Gemini multimodal returned no image, falling back to Imagen...`);
          }
        } catch (mmErr) {
          onLog(`[Image] ⚠️ Gemini multimodal failed (${mmErr.message}), falling back to Imagen...`);
        }
      }

      // Standard Imagen text-to-image (no reference image)
      const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: finalPrompt,
        config: {
          numberOfImages: 1,
          aspectRatio: aspectRatio,
          outputMimeType: 'image/png',
          personGeneration: 'allow_adult'
        }
      });

      const base64Str = response.generatedImages[0].image.imageBytes;
      fs.writeFileSync(outPath, Buffer.from(base64Str, 'base64'));
      onLog(`[Image] ✅ ${sceneId} image generated via Imagen API`);
      return { success: true, path: outPath };
    } catch (fbErr) {
      onLog(`[Image] ❌ Gemini fallback failed: ${fbErr.message}`);
      return { success: false, error: fbErr.message };
    }
  }
}

/**
 * Generate a video for a scene using gflow CLI.
 */
async function generateVideo({ projectDir, sceneIndex, prompt, aspectRatio = '16:9', seed }, onLog) {
  const sceneId = `scene-${String(sceneIndex + 1).padStart(2, '0')}`;
  const outDir = path.join(projectDir, 'segments');
  fs.mkdirSync(outDir, { recursive: true });

  // Check if scene image exists → prefer image-to-video for consistency
  const sceneImagePath = path.join(projectDir, 'storyboard', `${sceneId}.png`);
  const hasSceneImage = fs.existsSync(sceneImagePath);

  // Load character + background settings
  let finalPrompt = prompt;
  let bgValue = '';
  try {
    const sb = loadStoryboard(projectDir);
    if (sb.character_prompt) {
      finalPrompt = `[CHARACTER: ${sb.character_prompt}]\n\n${prompt}`;
      onLog(`[Video] 🎭 Character prompt injected`);
    }
    if (sb.bg_mode === 'unified' && sb.bg_value) {
      bgValue = sb.bg_value;
    }
  } catch { /* ignore */ }

  if (bgValue) {
    // Embed background naturally into prompt (avoid [BACKGROUND: ...] prefix — it triggers AUDIO_FILTERED)
    finalPrompt = `${finalPrompt}, ${bgValue}`;
    onLog(`[Video] 🎨 Background description appended to prompt`);
  }

  // Speech language setting — logged for reference but NOT injected into Veo prompt
  // because "Speaking in X" triggers AUDIO_GENERATION_FILTERED safety filter
  try {
    const sb2 = loadStoryboard(projectDir);
    const langMap = {
      en: 'English', vi: 'Vietnamese', ja: 'Japanese', ko: 'Korean',
      zh: 'Chinese', es: 'Spanish', fr: 'French', de: 'German', pt: 'Portuguese',
    };
    const speechLang = sb2.speech_language || 'en';
    if (speechLang !== 'none' && langMap[speechLang]) {
      onLog(`[Video] 🗣️ Speech language (for TTS): ${langMap[speechLang]}`);
    }
  } catch { /* ignore */ }

  onLog(`[Video] Generating video for ${sceneId}...`);
  onLog(`[Video] Prompt: "${finalPrompt.slice(0, 100)}..."`);
  onLog(`[Video] ⏳ This may take 1-3 minutes...`);

  const outPath = path.join(outDir, `${sceneId}.mp4`);
  backupFileIfExists(outPath, 'Video', onLog);

  // gflow CLI — auto-detect image-to-video vs text-to-video
  const aspectMap = { '16:9': 'landscape', '9:16': 'portrait', '1:1': 'square' };
  const args = [
    'generate-video',
    finalPrompt,
    '--aspect-ratio', aspectMap[aspectRatio] || aspectRatio,
    '-o', outPath,
  ];
  if (seed) args.push('--seed', String(seed));

  if (hasSceneImage) {
    args.push('-i', sceneImagePath);
    onLog(`[Video] 🖼️ Scene image found → using Image-to-Video mode`);
  }

  try {
    await runPythonCli('gflow', args, onLog);
    onLog(`[Video] ✅ ${sceneId} video generated`);
    return { success: true, path: outPath };
  } catch (err) {
    onLog(`[Video] ❌ Failed: ${err.message}`);
    return { success: false, error: err.message };
  }
}

/**
 * Generate audio for a scene using native LucyLab TTS.
 */
async function generateAudio({ projectDir, sceneIndex, text, voiceId, speed = 1.0 }, onLog) {
  const sceneId = `scene-${String(sceneIndex + 1).padStart(2, '0')}`;
  const ttsDir = path.join(projectDir, 'tts');
  fs.mkdirSync(ttsDir, { recursive: true });

  const outPath = path.join(ttsDir, sceneId);
  backupFileIfExists(`${outPath}.mp3`, 'Audio', onLog);
  backupFileIfExists(`${outPath}.wav`, 'Audio', onLog);

  try {
    const savedPath = await generateTts({
      text,
      voiceId,
      outPath,
      projectDir,
      speed,
      onLog,
    });
    return { success: true, path: savedPath };
  } catch (err) {
    onLog(`[TTS] ❌ Failed: ${err.message}`);
    return { success: false, error: err.message };
  }
}

/**
 * POST /api/storyboard/generate
 *
 * Body: {
 *   projectId: string,
 *   action: "image" | "video" | "audio" | "mix" | "batch",
 *   sceneIndex?: number,       // Required for image/video/audio
 *   prompt?: string,           // For image/video
 *   text?: string,             // For audio
 *   voiceId?: string,          // For audio
 *   seed?: number,             // For image/video
 *   aspectRatio?: string,      // For image/video (default: "16:9")
 *   speed?: number,            // For audio (default: 1.0)
 *   fadeDuration?: number,     // For mix
 *   bgmVolume?: number,        // For mix
 * }
 *
 * Response: Server-Sent Events stream with real-time logs.
 */
export async function POST(request) {
  const body = await request.json();
  const { projectId, action } = body;

  if (!projectId || !action) {
    return new Response(JSON.stringify({ error: 'Missing projectId or action' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let projectDir;
  try {
    projectDir = getProjectDir(projectId);
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Create SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (type, data) => {
        const payload = JSON.stringify({ type, data, timestamp: Date.now() });
        controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
      };

      const onLog = (msg) => sendEvent('log', msg);

      try {
        sendEvent('start', { action, projectId });
        let result;

        switch (action) {
          case 'character': {
            const { prompt, aspectRatio } = body;
            if (!prompt) {
              sendEvent('error', 'Missing character prompt');
              break;
            }
            onLog(`[Character] Generating character reference image...`);
            onLog(`[Character] Prompt: "${prompt.slice(0, 80)}..."`);
            const outPath = path.join(projectDir, 'character_ref.png');
            try {
              // Try gflow first
              const args = [
                'generate-image',
                '--prompt', prompt,
                '--aspect', aspectRatio || '9:16',
                '--output', outPath,
                '--num-images', '1',
              ];
              await runPythonCli('gflow', args, onLog);
              onLog(`[Character] ✅ Character reference generated`);
              result = { success: true, path: outPath };
            } catch (err) {
              if (err.message.includes('ENOENT') || err.message.includes('not found')) {
                onLog(`[Character] ⚠️ gflow not found. Falling back to Gemini API...`);
                try {
                  const apiKey = loadGeminiApiKey();
                  if (!apiKey) throw new Error('No Gemini API key found.');
                  const ai = new GoogleGenAI({ apiKey });
                  const response = await ai.models.generateImages({
                    model: 'imagen-4.0-generate-001',
                    prompt: prompt,
                    config: {
                      numberOfImages: 1,
                      aspectRatio: aspectRatio || '9:16',
                      outputMimeType: 'image/png',
                      personGeneration: 'allow_adult'
                    }
                  });
                  const base64Str = response.generatedImages[0].image.imageBytes;
                  fs.writeFileSync(outPath, Buffer.from(base64Str, 'base64'));
                  onLog(`[Character] ✅ Character reference generated via Gemini API`);
                  result = { success: true, path: outPath };
                } catch (fbErr) {
                  onLog(`[Character] ❌ Gemini fallback failed: ${fbErr.message}`);
                  result = { success: false, error: fbErr.message };
                }
              } else {
                onLog(`[Character] ❌ Failed: ${err.message}`);
                result = { success: false, error: err.message };
              }
            }
            break;
          }

          case 'image': {
            const { sceneIndex, prompt, aspectRatio, seed } = body;
            if (sceneIndex === undefined || !prompt) {
              sendEvent('error', 'Missing sceneIndex or prompt');
              break;
            }
            result = await generateImage({ projectDir, sceneIndex, prompt, aspectRatio, seed }, onLog);
            break;
          }

          case 'video': {
            const { sceneIndex, prompt, aspectRatio, seed } = body;
            if (sceneIndex === undefined || !prompt) {
              sendEvent('error', 'Missing sceneIndex or prompt');
              break;
            }
            result = await generateVideo({ projectDir, sceneIndex, prompt, aspectRatio, seed }, onLog);
            break;
          }

          case 'audio': {
            const { sceneIndex, text, voiceId, speed } = body;
            if (sceneIndex === undefined || !text || !voiceId) {
              sendEvent('error', 'Missing sceneIndex, text, or voiceId');
              break;
            }
            result = await generateAudio({ projectDir, sceneIndex, text, voiceId, speed }, onLog);
            break;
          }

          case 'mix': {
            const { fadeDuration, bgmVolume } = body;
            onLog('[Mixer] Starting video mix...');
            try {
              const finalPath = await mixVideo({
                projectDir,
                fadeDuration: fadeDuration || 1.0,
                bgmVolume: bgmVolume || 0.1,
                onLog,
              });
              result = { success: true, path: finalPath };
            } catch (err) {
              onLog(`[Mixer] ❌ Failed: ${err.message}`);
              result = { success: false, error: err.message };
            }
            break;
          }

          case 'batch': {
            // Batch generation: generate all missing assets
            const storyboard = loadStoryboard(projectDir);
            const { voiceId, speed, batchTypes = ['image', 'video', 'audio'] } = body;
            const sleepBetweenMs = body.sleepBetween || 5000;

            const scenes = storyboard.scenes || [];
            onLog(`[Batch] Processing ${scenes.length} scenes. Types: ${batchTypes.join(', ')}`);

            const batchResults = [];
            for (let i = 0; i < scenes.length; i++) {
              const scene = scenes[i];
              const sceneId = `scene-${String(i + 1).padStart(2, '0')}`;
              onLog(`\n[Batch] === Scene ${i + 1}/${scenes.length}: ${sceneId} ===`);

              const sceneResult = { sceneId, results: {} };

              // Image generation
              if (batchTypes.includes('image')) {
                const imgPath = path.join(projectDir, 'storyboard', `${sceneId}.png`);
                const prompt = scene.image_prompt || scene.video_prompt;
                if (!fs.existsSync(imgPath) && prompt) {
                  sceneResult.results.image = await generateImage({
                    projectDir, sceneIndex: i, prompt, seed: body.seed,
                  }, onLog);
                  await new Promise(r => setTimeout(r, sleepBetweenMs));
                } else {
                  onLog(`[Batch] Image already exists or no prompt, skipping.`);
                }
              }

              // Video generation
              if (batchTypes.includes('video')) {
                const vidPath = path.join(projectDir, 'segments', `${sceneId}.mp4`);
                const prompt = scene.video_prompt;
                if (!fs.existsSync(vidPath) && prompt) {
                  sceneResult.results.video = await generateVideo({
                    projectDir, sceneIndex: i, prompt, seed: body.seed,
                  }, onLog);
                  await new Promise(r => setTimeout(r, sleepBetweenMs));
                } else {
                  onLog(`[Batch] Video already exists or no prompt, skipping.`);
                }
              }

              // Audio generation
              if (batchTypes.includes('audio')) {
                const ttsText = scene.tts_text || scene.script;
                const audioExists = ['.mp3', '.wav'].some(ext =>
                  fs.existsSync(path.join(projectDir, 'tts', `${sceneId}${ext}`))
                );
                if (!audioExists && ttsText && voiceId) {
                  sceneResult.results.audio = await generateAudio({
                    projectDir, sceneIndex: i, text: ttsText, voiceId, speed,
                  }, onLog);
                  await new Promise(r => setTimeout(r, sleepBetweenMs / 4));
                } else {
                  onLog(`[Batch] Audio already exists or missing text/voiceId, skipping.`);
                }
              }

              batchResults.push(sceneResult);
            }

            result = { success: true, scenes: batchResults };
            break;
          }

          default:
            sendEvent('error', `Unknown action: ${action}`);
        }

        if (result) {
          sendEvent('complete', result);
        }
      } catch (err) {
        sendEvent('error', err.message);
      } finally {
        sendEvent('done', null);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
