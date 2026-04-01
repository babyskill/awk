import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

// Resolve the workspace root (2 levels up from symphony/app/api/storyboard)
const WORKSPACE_ROOT = path.resolve(process.cwd(), '..');

/**
 * Build the absolute path to a project's storyboard.json
 */
function getStoryboardPath(project) {
  if (!project) return null;
  // Sanitize: only allow alphanumeric, dashes, underscores
  const safeProject = project.replace(/[^a-zA-Z0-9_-]/g, '');
  return path.join(WORKSPACE_ROOT, 'short-maker-outputs', safeProject, 'storyboard.json');
}

/**
 * Build the absolute path to the project's output directory
 */
function getProjectDir(project) {
  if (!project) return null;
  const safeProject = project.replace(/[^a-zA-Z0-9_-]/g, '');
  return path.join(WORKSPACE_ROOT, 'short-maker-outputs', safeProject);
}

/**
 * GET /api/storyboard?project=<name>
 * Returns the storyboard.json content for the given project.
 * If no project specified, lists all available projects.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const project = searchParams.get('project');

    // List all projects
    if (!project) {
      const outputsDir = path.join(WORKSPACE_ROOT, 'short-maker-outputs');
      if (!fs.existsSync(outputsDir)) {
        return NextResponse.json({ projects: [] });
      }
      const entries = fs.readdirSync(outputsDir, { withFileTypes: true });
      const projects = entries
        .filter(e => e.isDirectory())
        .map(e => {
          const sbPath = path.join(outputsDir, e.name, 'storyboard.json');
          const hasSb = fs.existsSync(sbPath);
          const charRef = path.join(outputsDir, e.name, 'character_ref.png');
          const hasChar = fs.existsSync(charRef);
          return {
            name: e.name,
            hasStoryboard: hasSb,
            hasCharacter: hasChar,
          };
        });
      return NextResponse.json({ projects });
    }

    // Read specific project storyboard
    const sbPath = getStoryboardPath(project);
    if (!sbPath || !fs.existsSync(sbPath)) {
      return NextResponse.json({ error: 'Storyboard not found' }, { status: 404 });
    }
    const content = JSON.parse(fs.readFileSync(sbPath, 'utf-8'));

    // Inject image URLs if the files exist on disk
    const projDir = getProjectDir(project);
    if (content.scenes && Array.isArray(content.scenes)) {
      content.scenes = content.scenes.map(scene => {
        const sceneId = scene.scene_id || scene.id;
        // Fallback checks for legacy and new image paths
        const imagePaths = [
          `${scene.id}_img.jpg`,
          `${scene.id}.jpg`,
          `storyboard/${scene.id}.png`,
          `storyboard/${sceneId}.png`,
          `storyboard/${scene.id}_img.jpg`
        ];

        for (const imgPathRel of imagePaths) {
          const imgPath = path.join(projDir, imgPathRel);
          if (fs.existsSync(imgPath)) {
            const cacheBuster = fs.statSync(imgPath).mtimeMs;
            scene.image = `/api/storyboard/media?project=${encodeURIComponent(project)}&file=${encodeURIComponent(imgPathRel)}&t=${cacheBuster}`;
            break;
          }
        }

        // Check for video file in segments/
        const videoRel = `segments/${sceneId}.mp4`;
        const videoPath = path.join(projDir, videoRel);
        if (fs.existsSync(videoPath)) {
          const cacheBuster = fs.statSync(videoPath).mtimeMs;
          scene.video = `/api/storyboard/media?project=${encodeURIComponent(project)}&file=${encodeURIComponent(videoRel)}&t=${cacheBuster}`;
        }

        // Check for audio file in tts/
        for (const ext of ['.mp3', '.wav']) {
          const audioRel = `tts/${sceneId}${ext}`;
          const audioPath = path.join(projDir, audioRel);
          if (fs.existsSync(audioPath)) {
            const cacheBuster = fs.statSync(audioPath).mtimeMs;
            scene.audio = `/api/storyboard/media?project=${encodeURIComponent(project)}&file=${encodeURIComponent(audioRel)}&t=${cacheBuster}`;
            break;
          }
        }

        return scene;
      });
    }

    // Also check for character_ref and inject URL
    const charRefPath = path.join(projDir, 'character_ref.png');
    const hasCharacter = fs.existsSync(charRefPath);
    if (hasCharacter) {
      const cacheBuster = fs.statSync(charRefPath).mtimeMs;
      content.character_image = `/api/storyboard/media?project=${encodeURIComponent(project)}&file=character_ref.png&t=${cacheBuster}`;
    }

    return NextResponse.json({ project, storyboard: content, hasCharacter });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/storyboard
 * Body: { project: string, storyboard: object }
 * Saves the storyboard.json back to the project directory.
 */
export async function POST(request) {
  try {
    const body = await request.json();
    if (!body.project || !body.storyboard) {
      return NextResponse.json(
        { error: 'project and storyboard are required' },
        { status: 400 }
      );
    }
    const sbPath = getStoryboardPath(body.project);
    if (!sbPath) {
      return NextResponse.json({ error: 'Invalid project name' }, { status: 400 });
    }

    // Ensure directory exists
    const dir = path.dirname(sbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(sbPath, JSON.stringify(body.storyboard, null, 2), 'utf-8');
    return NextResponse.json({ success: true, project: body.project });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
