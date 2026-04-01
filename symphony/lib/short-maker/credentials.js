/**
 * Centralized credentials loader — reads from ~/.gemini/antigravity/.credentials.json
 *
 * API keys are stored as JSON (same pattern as .tg_config.json) and managed via `awkit credentials`.
 * Fallback chain: env var → centralized .credentials.json
 */

import fs from 'fs';
import path from 'path';
import os from 'os';

const CREDENTIALS_PATH = path.join(os.homedir(), '.gemini', 'antigravity', '.credentials.json');

/**
 * Load the centralized credentials JSON.
 * @returns {Record<string, string>} key-value pairs from .credentials.json
 */
function loadCredentialsFile() {
  try {
    if (fs.existsSync(CREDENTIALS_PATH)) {
      return JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf-8'));
    }
  } catch { /* ignore parse error */ }
  return {};
}

/**
 * Load a specific credential key.
 *
 * Lookup order:
 * 1. process.env[envKey]  (e.g. GEMINI_API_KEY)
 * 2. ~/.gemini/antigravity/.credentials.json[jsonKey]  (e.g. gemini_api_key)
 *
 * @param {string} envKey - Environment variable name (e.g. 'GEMINI_API_KEY')
 * @param {string} jsonKey - JSON key in .credentials.json (e.g. 'gemini_api_key')
 * @returns {string|null}
 */
export function loadCredential(envKey, jsonKey) {
  // 1. Environment variable
  if (process.env[envKey]) return process.env[envKey];

  // 2. Centralized JSON
  const creds = loadCredentialsFile();
  if (creds[jsonKey]) return creds[jsonKey];

  return null;
}

/**
 * Convenience: load Gemini API key.
 */
export function loadGeminiApiKey() {
  return loadCredential('GEMINI_API_KEY', 'gemini_api_key');
}

/**
 * Convenience: load LucyLab bearer token.
 */
export function loadLucylabBearer() {
  return loadCredential('LUCYLAB_BEARER', 'lucylab_bearer');
}

/**
 * Get the credentials file path (for logging/display).
 */
export function getCredentialsPath() {
  return CREDENTIALS_PATH;
}
