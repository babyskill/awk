import { NextResponse } from 'next/server';
import {
    listAllAgents, registerAgent, updateAgentProfile, removeAgent, dispatchTask,
    listProjectAgents, getProjectAgent, createProjectAgent, updateProjectAgent,
    removeProjectAgent, attachProjectAgentSession, detachProjectAgentSession,
} from '../../../lib/core.mjs';

// GET /api/agents — List agents (supports ?project=X for project-scoped filtering)
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const project = searchParams.get('project');
        const type = searchParams.get('type') || 'project'; // 'project' (default) or 'legacy'

        if (type === 'legacy') {
            const agents = listAllAgents();
            return NextResponse.json({ agents, type: 'legacy' });
        }

        const agents = listProjectAgents(project || undefined);
        return NextResponse.json({ agents, type: 'project' });
    } catch (error) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

// POST /api/agents — Create agent (project-scoped or legacy)
export async function POST(request) {
    try {
        const body = await request.json();
        if (!body.id) {
            return NextResponse.json({ error: 'Agent ID is required' }, { status: 400 });
        }

        // Project-scoped agent (new)
        if (body.projectId || body.project_id) {
            const agent = createProjectAgent({
                id: body.id,
                projectId: body.projectId || body.project_id,
                name: body.name || body.id,
                skills: body.skills || [],
                icon: body.icon,
                color: body.color,
            });
            return NextResponse.json({ agent, type: 'project' }, { status: 201 });
        }

        // Legacy agent
        const agent = registerAgent(body.id, body.name);
        if (body.specialties || body.color || body.max_concurrent) {
            updateAgentProfile(body.id, {
                specialties: body.specialties,
                color: body.color,
                max_concurrent: body.max_concurrent,
            });
        }
        const updated = listAllAgents().find(a => a.id === body.id);
        return NextResponse.json({ agent: updated, type: 'legacy' }, { status: 201 });
    } catch (error) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

// PATCH /api/agents — Update agent, assign task, attach, or detach
export async function PATCH(request) {
    try {
        const body = await request.json();
        if (!body.id) {
            return NextResponse.json({ error: 'Agent ID is required' }, { status: 400 });
        }

        // Check if this is a project agent
        const projectAgent = getProjectAgent(body.id);

        if (projectAgent) {
            // Project agent actions
            if (body.action === 'attach' && body.sessionId) {
                const agent = attachProjectAgentSession(body.id, body.sessionId);
                return NextResponse.json({ agent, action: 'attached' });
            }
            if (body.action === 'detach') {
                const agent = detachProjectAgentSession(body.id);
                return NextResponse.json({ agent, action: 'detached' });
            }
            if (body.action === 'assign' && body.taskId) {
                const task = dispatchTask(body.id, body.taskId);
                return NextResponse.json({ task, action: 'assigned' });
            }

            // Update project agent fields
            const agent = updateProjectAgent(body.id, {
                name: body.name,
                skills: body.skills,
                icon: body.icon,
                color: body.color,
            });
            return NextResponse.json({ agent, type: 'project' });
        }

        // Legacy agent fallback
        if (body.action === 'assign' && body.taskId) {
            const task = dispatchTask(body.id, body.taskId);
            return NextResponse.json({ task });
        }

        const agent = updateAgentProfile(body.id, {
            name: body.name,
            specialties: body.specialties,
            color: body.color,
            max_concurrent: body.max_concurrent,
        });
        const updated = listAllAgents().find(a => a.id === body.id);
        return NextResponse.json({ agent: updated, type: 'legacy' });
    } catch (error) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

// DELETE /api/agents — Remove agent
export async function DELETE(request) {
    try {
        const body = await request.json();
        if (!body.id) {
            return NextResponse.json({ error: 'Agent ID is required' }, { status: 400 });
        }

        // Try project agent first
        const projectAgent = getProjectAgent(body.id);
        if (projectAgent) {
            removeProjectAgent(body.id);
            return NextResponse.json({ success: true, type: 'project' });
        }

        // Legacy fallback
        removeAgent(body.id);
        return NextResponse.json({ success: true, type: 'legacy' });
    } catch (error) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
