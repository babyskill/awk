import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const KNOWLEDGE_DIR = path.join(
    process.env.HOME || process.env.USERPROFILE,
    '.gemini', 'antigravity', 'knowledge'
);

/**
 * GET /api/knowledge
 * 
 * Query params:
 *   - (none)          → List all KI summaries
 *   - id=<folder>     → Get KI detail + artifact list
 *   - id=<folder>&file=<path> → Read artifact file content
 */
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const file = searchParams.get('file');

        // Read a specific artifact file
        if (id && file) {
            const filePath = path.join(KNOWLEDGE_DIR, id, file);
            if (!filePath.startsWith(KNOWLEDGE_DIR)) {
                return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
            }
            if (!fs.existsSync(filePath)) {
                return NextResponse.json({ error: 'File not found' }, { status: 404 });
            }
            const content = fs.readFileSync(filePath, 'utf-8');
            return NextResponse.json({ content, path: file });
        }

        // Get detail of a specific KI
        if (id) {
            const kiDir = path.join(KNOWLEDGE_DIR, id);
            if (!fs.existsSync(kiDir)) {
                return NextResponse.json({ error: 'KI not found' }, { status: 404 });
            }
            const metadata = readMetadata(kiDir);
            const artifacts = listArtifacts(kiDir);
            return NextResponse.json({ item: { id, ...metadata, artifacts } });
        }

        // List all KIs
        if (!fs.existsSync(KNOWLEDGE_DIR)) {
            return NextResponse.json({ items: [] });
        }
        const entries = fs.readdirSync(KNOWLEDGE_DIR, { withFileTypes: true });
        const items = [];
        for (const entry of entries) {
            if (!entry.isDirectory()) continue;
            const kiDir = path.join(KNOWLEDGE_DIR, entry.name);
            const metaPath = path.join(kiDir, 'metadata.json');
            if (!fs.existsSync(metaPath)) continue;
            const metadata = readMetadata(kiDir);
            const artifactCount = countArtifacts(kiDir);
            const stat = fs.statSync(metaPath);
            items.push({
                id: entry.name,
                title: metadata.title || entry.name,
                summary: metadata.summary || '',
                referenceCount: (metadata.references || []).length,
                artifactCount,
                updatedAt: stat.mtime.toISOString(),
            });
        }
        // Sort by updatedAt desc
        items.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        return NextResponse.json({ items });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * POST /api/knowledge — Create a new KI
 * Body: { id, title, summary, references? }
 */
export async function POST(request) {
    try {
        const body = await request.json();
        if (!body.id || !body.title) {
            return NextResponse.json({ error: 'id and title are required' }, { status: 400 });
        }
        // Sanitize id
        const safeId = body.id.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
        const kiDir = path.join(KNOWLEDGE_DIR, safeId);
        if (fs.existsSync(kiDir)) {
            return NextResponse.json({ error: 'KI already exists' }, { status: 409 });
        }
        const artifactsDir = path.join(kiDir, 'artifacts');
        fs.mkdirSync(artifactsDir, { recursive: true });

        const metadata = {
            title: body.title,
            summary: body.summary || '',
            references: body.references || [],
        };
        fs.writeFileSync(
            path.join(kiDir, 'metadata.json'),
            JSON.stringify(metadata, null, 2),
            'utf-8'
        );
        // Create overview.md stub
        fs.writeFileSync(
            path.join(artifactsDir, 'overview.md'),
            `# ${body.title}\n\n${body.summary || 'TODO: Add content'}\n`,
            'utf-8'
        );
        return NextResponse.json({
            item: { id: safeId, ...metadata, artifacts: ['artifacts/overview.md'] }
        }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * PATCH /api/knowledge — Update metadata or file content
 * Body: { id, file?, content?, metadata? }
 */
export async function PATCH(request) {
    try {
        const body = await request.json();
        if (!body.id) {
            return NextResponse.json({ error: 'id is required' }, { status: 400 });
        }
        const kiDir = path.join(KNOWLEDGE_DIR, body.id);
        if (!fs.existsSync(kiDir)) {
            return NextResponse.json({ error: 'KI not found' }, { status: 404 });
        }

        // Update file content
        if (body.file && body.content !== undefined) {
            const filePath = path.join(kiDir, body.file);
            if (!filePath.startsWith(KNOWLEDGE_DIR)) {
                return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
            }
            // Ensure parent dir exists
            const parentDir = path.dirname(filePath);
            if (!fs.existsSync(parentDir)) {
                fs.mkdirSync(parentDir, { recursive: true });
            }
            fs.writeFileSync(filePath, body.content, 'utf-8');
            return NextResponse.json({ success: true, file: body.file });
        }

        // Update metadata
        if (body.metadata) {
            const metaPath = path.join(kiDir, 'metadata.json');
            const existing = readMetadata(kiDir);
            const updated = {
                ...existing,
                ...body.metadata,
            };
            fs.writeFileSync(metaPath, JSON.stringify(updated, null, 2), 'utf-8');
            return NextResponse.json({ success: true, metadata: updated });
        }

        return NextResponse.json({ error: 'No update specified (need file+content or metadata)' }, { status: 400 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * DELETE /api/knowledge — Delete an artifact file
 * Body: { id, file }
 */
export async function DELETE(request) {
    try {
        const body = await request.json();
        if (!body.id || !body.file) {
            return NextResponse.json({ error: 'id and file are required' }, { status: 400 });
        }
        // Prevent deleting metadata.json
        if (body.file === 'metadata.json') {
            return NextResponse.json({ error: 'Cannot delete metadata.json' }, { status: 400 });
        }
        const filePath = path.join(KNOWLEDGE_DIR, body.id, body.file);
        if (!filePath.startsWith(KNOWLEDGE_DIR)) {
            return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
        }
        if (!fs.existsSync(filePath)) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 });
        }
        fs.unlinkSync(filePath);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function readMetadata(kiDir) {
    const metaPath = path.join(kiDir, 'metadata.json');
    if (!fs.existsSync(metaPath)) return { title: '', summary: '', references: [] };
    try {
        return JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
    } catch {
        return { title: '', summary: '', references: [] };
    }
}

function listArtifacts(kiDir) {
    const results = [];
    function walk(dir, prefix) {
        if (!fs.existsSync(dir)) return;
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const relPath = prefix ? `${prefix}/${entry.name}` : entry.name;
            if (entry.name === 'metadata.json') continue;
            if (entry.name === '.DS_Store') continue;
            if (entry.isDirectory()) {
                walk(path.join(dir, entry.name), relPath);
            } else {
                const stat = fs.statSync(path.join(dir, entry.name));
                results.push({
                    path: relPath,
                    name: entry.name,
                    size: stat.size,
                    updatedAt: stat.mtime.toISOString(),
                });
            }
        }
    }
    walk(kiDir, '');
    return results;
}

function countArtifacts(kiDir) {
    const artifactsDir = path.join(kiDir, 'artifacts');
    if (!fs.existsSync(artifactsDir)) return 0;
    let count = 0;
    function walk(dir) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.name === '.DS_Store') continue;
            if (entry.isDirectory()) {
                walk(path.join(dir, entry.name));
            } else {
                count++;
            }
        }
    }
    walk(artifactsDir);
    return count;
}
