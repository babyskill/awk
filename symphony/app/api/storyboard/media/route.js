import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const WORKSPACE_ROOT = path.resolve(process.cwd(), '..');

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const project = searchParams.get('project');
    const file = searchParams.get('file');

    if (!project || !file) {
      return NextResponse.json({ error: 'project and file are required' }, { status: 400 });
    }

    // Security check: simple sanitize to prevent directory traversal
    const safeProject = project.replace(/[^a-zA-Z0-9_-]/g, '');
    
    // Allow forward slashes for subdirectories, but block `..` or leading `/`
    if (file.includes('..') || file.startsWith('/')) {
      return NextResponse.json({ error: 'Invalid file path' }, { status: 403 });
    }
    const safeFile = file.replace(/[^a-zA-Z0-9_./-]/g, '');

    const filePath = path.join(WORKSPACE_ROOT, 'short-maker-outputs', safeProject, safeFile);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Determine content type
    const ext = path.extname(safeFile).toLowerCase();
    let contentType = 'application/octet-stream';
    if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    else if (ext === '.png') contentType = 'image/png';
    else if (ext === '.mp4') contentType = 'video/mp4';

    const fileBuffer = fs.readFileSync(filePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST: Upload a file to a project directory.
 * Used for uploading character reference images.
 */
export async function POST(request) {
  try {
    const formData = await request.formData();
    const project = formData.get('project');
    const targetName = formData.get('targetName') || 'character_ref.png';
    const file = formData.get('file');

    if (!project || !file) {
      return NextResponse.json({ error: 'project and file are required' }, { status: 400 });
    }

    const safeProject = project.replace(/[^a-zA-Z0-9_-]/g, '');
    const projDir = path.join(WORKSPACE_ROOT, 'short-maker-outputs', safeProject);

    if (!fs.existsSync(projDir)) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Write to destination
    const safeName = targetName.replace(/[^a-zA-Z0-9_.-]/g, '');
    const destPath = path.join(projDir, safeName);
    fs.writeFileSync(destPath, buffer);

    const cacheBuster = Date.now();
    const imageUrl = `/api/storyboard/media?project=${encodeURIComponent(safeProject)}&file=${encodeURIComponent(safeName)}&t=${cacheBuster}`;

    return NextResponse.json({ success: true, path: destPath, imageUrl });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
