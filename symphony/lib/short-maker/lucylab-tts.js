/**
 * LucyLab TTS — Native Node.js implementation.
 *
 * Ported from: skills/lucylab-tts/scripts/lucylab_tts.py
 *
 * Core API: POST https://api.lucylab.io/json-rpc
 * Auth: Bearer token (env LUCYLAB_BEARER)
 * Payload: { method: "tts", input: { text, userVoiceId, speed, blockVersion } }
 * Response: contains audioUrl (CDN) or audioBase64, downloaded to disk.
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import https from 'https';
import http from 'http';
import { loadLucylabBearer } from './credentials.js';

const DEFAULT_ENDPOINT = 'https://api.lucylab.io/json-rpc';

/**
 * Load bearer token with fallback chain via centralized credentials.
 */
function loadBearerToken(explicit, projectDir) {
  if (explicit) return explicit;
  return loadLucylabBearer(projectDir);
}

/**
 * Recursively search for an audio URL in the API response.
 */
function findAudioUrl(obj) {
  if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
    for (const key of ['cdnUrl', 'audioUrl', 'url', 'fileUrl', 'downloadUrl']) {
      const v = obj[key];
      if (typeof v === 'string' && v.startsWith('http')) return v;
    }
    for (const v of Object.values(obj)) {
      const found = findAudioUrl(v);
      if (found) return found;
    }
  }
  if (Array.isArray(obj)) {
    for (const v of obj) {
      const found = findAudioUrl(v);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Recursively search for base64-encoded audio in the API response.
 */
function findAudioBase64(obj) {
  if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
    for (const key of ['audioBase64', 'base64', 'dataBase64']) {
      const v = obj[key];
      if (typeof v === 'string' && v.length > 200) return v;
    }
    for (const v of Object.values(obj)) {
      const found = findAudioBase64(v);
      if (found) return found;
    }
  }
  if (Array.isArray(obj)) {
    for (const v of obj) {
      const found = findAudioBase64(v);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Download a file from a URL and save it to disk.
 */
function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(destPath);
    proto.get(url, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        // Follow redirect
        downloadFile(response.headers.location, destPath).then(resolve).catch(reject);
        return;
      }
      if (response.statusCode >= 400) {
        reject(new Error(`Download failed: HTTP ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => { file.close(); resolve(destPath); });
    }).on('error', (err) => {
      fs.unlink(destPath, () => {}); // Clean up partial file
      reject(err);
    });
  });
}

/**
 * Make a TTS request to the LucyLab API.
 *
 * @param {object} options
 * @param {string} options.text - Text to synthesize
 * @param {string} options.voiceId - LucyLab voice ID
 * @param {string} [options.bearer] - Bearer token (falls back to env)
 * @param {string} [options.endpoint] - API endpoint URL
 * @param {number} [options.speed=1.0] - Speech speed multiplier
 * @param {number} [options.blockVersion=0] - Block version
 * @param {number} [options.timeout=60000] - Request timeout in ms
 * @returns {Promise<object>} Raw API response JSON
 */
async function postTts({ text, voiceId, bearer, endpoint, speed = 1.0, blockVersion = 0, timeout = 60000 }) {
  const url = endpoint || DEFAULT_ENDPOINT;

  const payload = JSON.stringify({
    method: 'tts',
    input: {
      text,
      userVoiceId: voiceId,
      speed,
      blockVersion,
    },
  });

  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const proto = urlObj.protocol === 'https:' ? https : http;

    const req = proto.request({
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${bearer}`,
        'Accept': '*/*',
        'Content-Length': Buffer.byteLength(payload),
      },
      timeout,
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 400) {
          reject(new Error(`LucyLab API error: HTTP ${res.statusCode} — ${data.slice(0, 300)}`));
          return;
        }
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Failed to parse LucyLab response: ${e.message}`));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('LucyLab API request timed out')); });
    req.write(payload);
    req.end();
  });
}

/**
 * Extract audio from the API result and save to disk.
 *
 * @param {object} result - API response JSON
 * @param {string} outPathBase - Base output path (without extension)
 * @returns {Promise<string>} Path to the saved audio file
 */
async function writeAudioFromResult(result, outPathBase) {
  const audioUrl = findAudioUrl(result);
  if (audioUrl) {
    const urlPath = audioUrl.split('?')[0];
    const ext = path.extname(urlPath) || '.mp3';
    const outPath = outPathBase + ext;
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    await downloadFile(audioUrl, outPath);
    return outPath;
  }

  const audioB64 = findAudioBase64(result);
  if (audioB64) {
    const outPath = outPathBase + '.wav';
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, Buffer.from(audioB64, 'base64'));
    return outPath;
  }

  // Fallback: save raw JSON for debugging
  const outPath = outPathBase + '.json';
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
  throw new Error(`No audio found in API response. Raw response saved to ${outPath}`);
}

/**
 * Generate TTS audio for a single scene.
 *
 * @param {object} options
 * @param {string} options.text - Text to synthesize
 * @param {string} options.voiceId - LucyLab voice ID
 * @param {string} options.outPath - Output file path (without extension)
 * @param {string} [options.bearer] - Bearer token
 * @param {string} [options.projectDir] - Project directory for .env lookup
 * @param {number} [options.speed=1.0] - Speech speed
 * @param {function} [options.onLog] - Log callback: (msg) => void
 * @returns {Promise<string>} Path to the generated audio file
 */
export async function generateTts({
  text,
  voiceId,
  outPath,
  bearer,
  projectDir,
  speed = 1.0,
  onLog = console.log,
}) {
  const token = loadBearerToken(bearer, projectDir);
  if (!token) {
    throw new Error('Missing LucyLab bearer token. Set LUCYLAB_BEARER env var or provide --bearer.');
  }

  onLog(`[TTS] Generating audio for: "${text.slice(0, 60)}..."`);
  onLog(`[TTS] Voice ID: ${voiceId}, Speed: ${speed}`);

  let result;
  let lastError;

  // Retry up to 3 times with backoff
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      result = await postTts({
        text,
        voiceId,
        bearer: token,
        speed,
      });
      break;
    } catch (err) {
      lastError = err;
      if (attempt < 3) {
        const waitMs = 1500 * attempt;
        onLog(`[TTS] Attempt ${attempt}/3 failed: ${err.message}. Retrying in ${waitMs}ms...`);
        await new Promise(r => setTimeout(r, waitMs));
      }
    }
  }

  if (!result) {
    throw lastError || new Error('TTS generation failed after 3 attempts');
  }

  const savedPath = await writeAudioFromResult(result, outPath);
  onLog(`[TTS] ✅ Audio saved: ${savedPath}`);
  return savedPath;
}

/**
 * Generate TTS for all scenes in a storyboard.
 *
 * @param {object} options
 * @param {object[]} options.scenes - Array of { tts_text, scene_id }
 * @param {string} options.voiceId - LucyLab voice ID
 * @param {string} options.ttsDir - Directory to save TTS files
 * @param {string} [options.bearer] - Bearer token
 * @param {string} [options.projectDir] - Project directory
 * @param {number} [options.speed=1.0] - Speech speed
 * @param {number} [options.sleepMs=250] - Delay between requests (rate limit)
 * @param {function} [options.onLog] - Log callback
 * @returns {Promise<string[]>} Array of saved file paths
 */
export async function generateAllTts({
  scenes,
  voiceId,
  ttsDir,
  bearer,
  projectDir,
  speed = 1.0,
  sleepMs = 250,
  onLog = console.log,
}) {
  fs.mkdirSync(ttsDir, { recursive: true });
  const results = [];

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    const text = scene.tts_text || scene.script;
    if (!text) {
      onLog(`[TTS] Scene ${i + 1}: No text, skipping.`);
      continue;
    }

    const sceneId = scene.scene_id || `scene-${String(i + 1).padStart(2, '0')}`;
    const outPath = path.join(ttsDir, sceneId);

    // Skip if already exists
    const existingFiles = [outPath + '.mp3', outPath + '.wav'];
    const existing = existingFiles.find(f => fs.existsSync(f));
    if (existing) {
      onLog(`[TTS] Scene ${i + 1}: Already exists at ${existing}, skipping.`);
      results.push(existing);
      if (sleepMs > 0) await new Promise(r => setTimeout(r, sleepMs));
      continue;
    }

    try {
      const savedPath = await generateTts({
        text,
        voiceId,
        outPath,
        bearer,
        projectDir,
        speed,
        onLog,
      });
      results.push(savedPath);
    } catch (err) {
      onLog(`[TTS] ❌ Scene ${i + 1} failed: ${err.message}`);
      results.push(null);
    }

    if (sleepMs > 0 && i < scenes.length - 1) {
      await new Promise(r => setTimeout(r, sleepMs));
    }
  }

  onLog(`[TTS] Batch complete: ${results.filter(Boolean).length}/${scenes.length} scenes generated.`);
  return results;
}
