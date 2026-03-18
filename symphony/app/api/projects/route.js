import { NextResponse } from 'next/server';
import { listProjects, createProject, updateProject, setActiveProject, deleteProject, getProjectStats, migrateFromLegacy } from '../../../lib/core.mjs';

// GET /api/projects — List all projects (with optional stats)
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const withStats = searchParams.get('stats') === 'true';

        if (withStats) {
            const stats = getProjectStats();
            return NextResponse.json({ projects: stats });
        }

        const projects = listProjects();
        return NextResponse.json({ projects });
    } catch (error) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

// POST /api/projects — Register a project or trigger migration
export async function POST(request) {
    try {
        const body = await request.json();

        // Special action: migrate from legacy DB
        if (body.action === 'migrate') {
            const result = migrateFromLegacy();
            return NextResponse.json(result);
        }

        if (!body.id || !body.name) {
            return NextResponse.json(
                { error: 'id and name are required' },
                { status: 400 }
            );
        }

        const project = createProject({
            id: body.id,
            name: body.name,
            projectPath: body.path,
            icon: body.icon,
            color: body.color,
        });

        return NextResponse.json({ project }, { status: 201 });
    } catch (error) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

// PATCH /api/projects — Update project or set active
export async function PATCH(request) {
    try {
        const body = await request.json();

        if (!body.id) {
            return NextResponse.json(
                { error: 'Project ID is required' },
                { status: 400 }
            );
        }

        // Set active project
        if (body.action === 'activate') {
            const project = setActiveProject(body.id);
            return NextResponse.json({ project });
        }

        // Update project fields
        const project = updateProject(body.id, {
            name: body.name,
            path: body.path,
            icon: body.icon,
            color: body.color,
        });

        return NextResponse.json({ project });
    } catch (error) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

// DELETE /api/projects — Remove a project
export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { error: 'Project ID is required' },
                { status: 400 }
            );
        }

        deleteProject(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
