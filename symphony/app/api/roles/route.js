/**
 * Roles API — CRUD for role manifest (agent-skill mapping)
 * GET    /api/roles         — list all roles from role-manifest.json
 * POST   /api/roles         — create a new role
 * PATCH  /api/roles         — update an existing role
 * DELETE /api/roles         — delete a role
 */
import { NextResponse } from 'next/server';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const MANIFEST_PATH = join(homedir(), '.gemini', 'antigravity', 'role-manifest.json');

function readManifest() {
    if (!existsSync(MANIFEST_PATH)) {
        return { version: '1.0', description: 'Maps task phases to agent roles', roles: {}, shared: { auto_skills: [], common_workflows: [] } };
    }
    return JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8'));
}

function writeManifest(manifest) {
    writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 4), 'utf-8');
}

export async function GET() {
    try {
        const manifest = readManifest();
        return NextResponse.json(manifest);
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// POST /api/roles — Create a new role
export async function POST(request) {
    try {
        const body = await request.json();
        const { key, name, icon, color, skills, workflows, match } = body;

        if (!key || !name) {
            return NextResponse.json({ error: 'key and name are required' }, { status: 400 });
        }

        const manifest = readManifest();
        if (manifest.roles[key]) {
            return NextResponse.json({ error: `Role "${key}" already exists` }, { status: 409 });
        }

        manifest.roles[key] = {
            name,
            icon: icon || '🎭',
            color: color || '#8888a0',
            skills: skills || [],
            workflows: workflows || [],
            match: {
                phases: match?.phases || [],
                keywords: match?.keywords || [],
            },
        };

        writeManifest(manifest);
        return NextResponse.json({ role: { key, ...manifest.roles[key] } }, { status: 201 });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// PATCH /api/roles — Update an existing role (or shared section)
export async function PATCH(request) {
    try {
        const body = await request.json();
        const { key, ...fields } = body;

        if (!key) {
            return NextResponse.json({ error: 'key is required' }, { status: 400 });
        }

        const manifest = readManifest();

        // Update shared section
        if (key === '__shared__') {
            if (fields.auto_skills) manifest.shared.auto_skills = fields.auto_skills;
            if (fields.common_workflows) manifest.shared.common_workflows = fields.common_workflows;
            writeManifest(manifest);
            return NextResponse.json({ shared: manifest.shared });
        }

        if (!manifest.roles[key]) {
            return NextResponse.json({ error: `Role "${key}" not found` }, { status: 404 });
        }

        const role = manifest.roles[key];
        if (fields.name !== undefined) role.name = fields.name;
        if (fields.icon !== undefined) role.icon = fields.icon;
        if (fields.color !== undefined) role.color = fields.color;
        if (fields.skills !== undefined) role.skills = fields.skills;
        if (fields.workflows !== undefined) role.workflows = fields.workflows;
        if (fields.match !== undefined) {
            role.match = {
                phases: fields.match.phases ?? role.match?.phases ?? [],
                keywords: fields.match.keywords ?? role.match?.keywords ?? [],
            };
        }

        writeManifest(manifest);
        return NextResponse.json({ role: { key, ...role } });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// DELETE /api/roles — Delete a role
export async function DELETE(request) {
    try {
        const body = await request.json();
        const { key } = body;

        if (!key) {
            return NextResponse.json({ error: 'key is required' }, { status: 400 });
        }

        const manifest = readManifest();
        if (!manifest.roles[key]) {
            return NextResponse.json({ error: `Role "${key}" not found` }, { status: 404 });
        }

        delete manifest.roles[key];
        writeManifest(manifest);
        return NextResponse.json({ success: true, deleted: key });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
