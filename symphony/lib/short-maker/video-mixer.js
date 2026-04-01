/**
 * Video Mixer — Native Node.js implementation.
 *
 * Ported from: skills/short-maker/scripts/video_mixer.py
 *
 * Orchestrates FFmpeg CLI to:
 * 1. Prepare scenes (loop video to match TTS audio duration)
 * 2. Apply xfade transitions between scenes
 * 3. Chroma key green screen replacement (optional)
 * 4. Mix background music (optional)
 *
 * All heavy lifting is done by ffmpeg/ffprobe — this module
 * only builds the correct CLI arguments and runs them.
 */

import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

// Supported FFmpeg xfade transition types
const SUPPORTED_TRANSITIONS = [
  'fade', 'slideleft', 'slideright', 'circlecrop',
  'dissolve', 'wipeleft', 'wiperight',
  'smoothleft', 'smoothright', 'smoothup', 'smoothdown',
];

/**
 * Get media duration using ffprobe.
 * @param {string} filepath - Path to media file
 * @returns {number} Duration in seconds
 */
function getDuration(filepath) {
  try {
    const output = execSync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filepath}"`,
      { encoding: 'utf-8', timeout: 15000 }
    ).trim();
    return parseFloat(output) || 0;
  } catch (e) {
    return 0;
  }
}

/**
 * Check if a media file has an audio stream.
 * @param {string} filepath - Path to media file
 * @returns {boolean}
 */
function hasAudioStream(filepath) {
  try {
    const output = execSync(
      `ffprobe -v error -select_streams a -show_entries stream=codec_type -of csv=p=0 "${filepath}"`,
      { encoding: 'utf-8', timeout: 10000 }
    ).trim();
    return output.length > 0;
  } catch {
    return false;
  }
}

/**
 * Run an FFmpeg command with optional log streaming.
 * @param {string[]} args - FFmpeg arguments (without the 'ffmpeg' binary)
 * @param {function} onLog - Log callback
 * @returns {Promise<void>}
 */
function runFfmpeg(args, onLog = console.log) {
  return new Promise((resolve, reject) => {
    const proc = spawn('ffmpeg', args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stderr = '';

    proc.stdout.on('data', (data) => {
      const msg = data.toString().trim();
      if (msg) onLog(`  [ffmpeg] ${msg}`);
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
      // FFmpeg outputs progress to stderr — only log relevant lines
      const lines = data.toString().split('\n').filter(l => l.trim());
      for (const line of lines) {
        if (line.includes('frame=') || line.includes('time=') || line.includes('Error')) {
          onLog(`  [ffmpeg] ${line.trim()}`);
        }
      }
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        // Extract a meaningful error from stderr
        const errorLines = stderr.split('\n').filter(l =>
          l.includes('Error') || l.includes('error') || l.includes('No such') || l.includes('Invalid')
        ).slice(-3);
        reject(new Error(
          `FFmpeg exited with code ${code}.\n${errorLines.join('\n') || stderr.slice(-500)}`
        ));
      }
    });

    proc.on('error', reject);
  });
}

/**
 * Load per-scene transitions from storyboard.json.
 * @param {string} projectDir - Project directory path
 * @returns {string[]} Array of transition names per scene
 */
function loadStoryboardTransitions(projectDir) {
  const sbPath = path.join(projectDir, 'storyboard.json');
  try {
    if (!fs.existsSync(sbPath)) return [];
    const data = JSON.parse(fs.readFileSync(sbPath, 'utf-8'));
    return (data.scenes || []).map(scene => {
      const t = scene.transition || 'fade';
      return SUPPORTED_TRANSITIONS.includes(t) ? t : 'fade';
    });
  } catch {
    return [];
  }
}

/**
 * Mix a full Short Maker project using FFmpeg.
 *
 * @param {object} options
 * @param {string} options.projectDir - Project directory containing segments/, tts/, audio/
 * @param {number} [options.fadeDuration=1.0] - Crossfade duration in seconds
 * @param {number} [options.bgmVolume=0.1] - Background music volume (0.0 - 1.0)
 * @param {string} [options.chromaBg] - Path to chroma key background image/video
 * @param {string} [options.chromaColor='0x00FF00'] - Chroma key color
 * @param {number} [options.chromaSim=0.3] - Chroma key similarity (0.01 - 1.0)
 * @param {number} [options.chromaBlend=0.2] - Chroma key blend (0.0 - 1.0)
 * @param {function} [options.onLog] - Log callback: (msg) => void
 * @returns {Promise<string>} Path to the final output video
 */
export async function mixVideo({
  projectDir,
  fadeDuration = 1.0,
  bgmVolume = 0.1,
  chromaBg,
  chromaColor = '0x00FF00',
  chromaSim = 0.3,
  chromaBlend = 0.2,
  onLog = console.log,
}) {
  const segmentsDir = path.join(projectDir, 'segments');
  const ttsDir = path.join(projectDir, 'tts');
  const audioDir = path.join(projectDir, 'audio');
  const tempDir = path.join(projectDir, 'temp');
  const finalDir = path.join(projectDir, 'final');

  fs.mkdirSync(tempDir, { recursive: true });
  fs.mkdirSync(finalDir, { recursive: true });

  if (!fs.existsSync(segmentsDir)) {
    throw new Error(`Segments directory not found: ${segmentsDir}`);
  }

  // List video files
  const videoFiles = fs.readdirSync(segmentsDir)
    .filter(f => f.endsWith('.mp4'))
    .sort()
    .map(f => path.join(segmentsDir, f));

  if (videoFiles.length === 0) {
    throw new Error('No .mp4 files found in segments/');
  }

  onLog(`[Mixer] Found ${videoFiles.length} scenes to mix.`);

  // Build scene list with matching TTS audio
  const scenes = videoFiles.map(vPath => {
    const sceneName = path.basename(vPath, '.mp4');
    let audioPath = path.join(ttsDir, `${sceneName}.mp3`);
    if (!fs.existsSync(audioPath)) {
      audioPath = path.join(ttsDir, `${sceneName}.wav`);
    }
    return {
      video: vPath,
      audio: fs.existsSync(audioPath) ? audioPath : null,
      name: sceneName,
    };
  });

  // Step 1: Prepare each scene (loop video to match audio)
  onLog('[Mixer] Step 1: Preparing scenes...');
  const readyScenes = [];

  for (let idx = 0; idx < scenes.length; idx++) {
    const scene = scenes[idx];
    const outScene = path.join(tempDir, `ready_${String(idx).padStart(2, '0')}.mp4`);
    readyScenes.push(outScene);

    if (fs.existsSync(outScene)) {
      onLog(`  [Skip] Scene ${idx + 1} already prepared.`);
      continue;
    }

    onLog(`  [Render] Preparing scene ${idx + 1}/${scenes.length}...`);

    if (scene.audio) {
      // Loop video to match audio duration
      await runFfmpeg([
        '-y',
        '-stream_loop', '-1', '-i', scene.video,
        '-i', scene.audio,
        '-c:v', 'libx264', '-c:a', 'aac',
        '-map', '0:v:0', '-map', '1:a:0',
        '-shortest', '-pix_fmt', 'yuv420p',
        outScene,
      ], onLog);
    } else {
      // Use native Veo audio or add silent track
      const hasAudio = hasAudioStream(scene.video);
      if (hasAudio) {
        await runFfmpeg([
          '-y',
          '-i', scene.video,
          '-c:v', 'libx264', '-c:a', 'aac', '-pix_fmt', 'yuv420p',
          outScene,
        ], onLog);
      } else {
        // Add silent audio to prevent acrossfade errors
        await runFfmpeg([
          '-y',
          '-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100',
          '-i', scene.video,
          '-c:v', 'libx264', '-c:a', 'aac',
          '-map', '1:v:0', '-map', '0:a:0',
          '-shortest', '-pix_fmt', 'yuv420p',
          outScene,
        ], onLog);
      }
    }
  }

  // Step 2: Crossfade scenes using xfade
  let mergedOutput = path.join(tempDir, 'merged_crossfaded.mp4');
  const sceneTransitions = loadStoryboardTransitions(projectDir);

  if (readyScenes.length === 1) {
    mergedOutput = readyScenes[0];
    onLog('[Mixer] Step 2: Single scene, skipping crossfade.');
  } else {
    onLog('[Mixer] Step 2: Applying crossfade transitions...');

    const durations = readyScenes.map(f => getDuration(f));
    const offsets = [];
    let currentOffset = 0;

    for (let i = 0; i < durations.length - 1; i++) {
      currentOffset += durations[i] - fadeDuration;
      offsets.push(currentOffset);
    }

    // Build video filter chain
    let filterComplex = '';
    const vLabels = readyScenes.map((_, i) => `[${i}:v]`);

    for (let i = 0; i < offsets.length; i++) {
      let transitionType = 'fade';
      if (i < sceneTransitions.length) {
        const t = sceneTransitions[i];
        if (t !== 'none') transitionType = t;
      }

      const lastOut = vLabels[0];
      const nextIn = vLabels[i + 1];
      const outLabel = `[v${i + 1}]`;

      if (i < sceneTransitions.length && sceneTransitions[i] === 'none') {
        filterComplex += `${lastOut}${nextIn}xfade=transition=fade:duration=0.01:offset=${offsets[i]}${outLabel}; `;
      } else {
        filterComplex += `${lastOut}${nextIn}xfade=transition=${transitionType}:duration=${fadeDuration}:offset=${offsets[i]}${outLabel}; `;
      }
      vLabels[0] = outLabel;
      onLog(`  Scene ${i + 1} → ${i + 2}: transition=${transitionType}`);
    }

    // Build audio filter chain
    const aLabels = readyScenes.map((_, i) => `[${i}:a]`);
    for (let i = 0; i < offsets.length; i++) {
      const lastOut = aLabels[0];
      const nextIn = aLabels[i + 1];
      const outLabel = `[a${i + 1}]`;
      filterComplex += `${lastOut}${nextIn}acrossfade=d=${fadeDuration}${outLabel}; `;
      aLabels[0] = outLabel;
    }

    const inputs = readyScenes.flatMap(f => ['-i', f]);
    await runFfmpeg([
      '-y',
      ...inputs,
      '-filter_complex', filterComplex.trimEnd().replace(/;\s*$/, ''),
      '-map', vLabels[0],
      '-map', aLabels[0],
      '-c:v', 'libx264', '-c:a', 'aac', '-pix_fmt', 'yuv420p',
      mergedOutput,
    ], onLog);
  }

  // Step 2.5: Chroma key (optional)
  if (chromaBg && fs.existsSync(chromaBg)) {
    onLog(`[Mixer] Step 2.5: Applying chroma key with background: ${chromaBg}`);
    const mergedChroma = path.join(tempDir, 'merged_chroma.mp4');
    const bgExt = path.extname(chromaBg).toLowerCase();
    const isImage = ['.png', '.jpg', '.jpeg'].includes(bgExt);

    const filterChroma =
      `[0:v][1:v]scale2ref=w=iw:h=ih[bg][ref];` +
      `[ref]colorkey=${chromaColor}:${chromaSim}:${chromaBlend}[ckout];` +
      `[bg][ckout]overlay=shortest=1`;

    if (isImage) {
      await runFfmpeg([
        '-y',
        '-loop', '1', '-framerate', '30', '-i', chromaBg,
        '-i', mergedOutput,
        '-filter_complex', filterChroma,
        '-c:v', 'libx264', '-c:a', 'copy', '-pix_fmt', 'yuv420p',
        mergedChroma,
      ], onLog);
    } else {
      await runFfmpeg([
        '-y',
        '-stream_loop', '-1', '-i', chromaBg,
        '-i', mergedOutput,
        '-filter_complex', filterChroma,
        '-c:v', 'libx264', '-c:a', 'copy', '-pix_fmt', 'yuv420p',
        mergedChroma,
      ], onLog);
    }
    mergedOutput = mergedChroma;
  }

  // Step 3: Mix background music (optional)
  const bgmFile = path.join(audioDir, 'bgm.mp3');
  const finalOutput = path.join(finalDir, 'promo-final.mp4');

  if (fs.existsSync(bgmFile)) {
    onLog(`[Mixer] Step 3: Mixing background music (volume: ${bgmVolume})...`);
    await runFfmpeg([
      '-y',
      '-i', mergedOutput,
      '-stream_loop', '-1', '-i', bgmFile,
      '-filter_complex',
      `[1:a]volume=${bgmVolume}[bgm];[0:a][bgm]amix=inputs=2:duration=first:dropout_transition=2[a]`,
      '-map', '0:v:0', '-map', '[a]',
      '-c:v', 'copy', '-c:a', 'aac',
      finalOutput,
    ], onLog);
  } else {
    onLog('[Mixer] Step 3: No bgm.mp3 found, skipping BGM mix.');
    fs.copyFileSync(mergedOutput, finalOutput);
  }

  onLog(`[Mixer] ✅ Final video: ${finalOutput}`);
  return finalOutput;
}

/**
 * List available transitions.
 * @returns {string[]}
 */
export function getAvailableTransitions() {
  return [...SUPPORTED_TRANSITIONS];
}
