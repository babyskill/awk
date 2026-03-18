import { NextResponse } from 'next/server';
import { listTasks, getTaskStats, createTask, updateTask, deleteTask, approveTask, bulkApprove, reopenTask, reorderTasks, claimTask, completeTask, abandonTask } from '../../../lib/core.mjs';

// GET /api/tasks — List tasks (scoped by project)
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status') || undefined;
        const project = searchParams.get('project') || undefined;
        const limit = searchParams.get('limit') || '50';

        const tasks = listTasks({ status, project, limit: parseInt(limit) });
        const stats = getTaskStats(project);

        return NextResponse.json({ tasks, stats });
    } catch (error) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

// POST /api/tasks — Create task
export async function POST(request) {
    try {
        const body = await request.json();

        if (!body.title) {
            return NextResponse.json(
                { error: 'Title is required' },
                { status: 400 }
            );
        }

        const task = createTask(body.title, {
            description: body.description,
            priority: body.priority || 2,
            acceptance: body.acceptance,
            phase: body.phase,
            estimatedFiles: body.estimatedFiles,
            isDraft: body.isDraft,
            projectId: body.project_id || body.projectId,
            conversationId: body.conversation_id || body.conversationId,
        });

        return NextResponse.json({ task }, { status: 201 });
    } catch (error) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

// PATCH /api/tasks — Update task (edit fields, approve, reopen, reorder)
export async function PATCH(request) {
    try {
        const body = await request.json();

        // Batch approve
        if (body.action === 'bulk_approve' && Array.isArray(body.ids)) {
            const count = bulkApprove(body.ids);
            return NextResponse.json({ approved: count });
        }

        // Reorder
        if (body.action === 'reorder' && Array.isArray(body.orderedIds)) {
            reorderTasks(body.orderedIds);
            return NextResponse.json({ success: true });
        }

        if (!body.id) {
            return NextResponse.json(
                { error: 'Task ID is required' },
                { status: 400 }
            );
        }

        // Approve draft → ready
        if (body.action === 'approve') {
            const task = approveTask(body.id);
            return NextResponse.json({ task });
        }

        // Claim task (ready → claimed)
        if (body.action === 'claim') {
            const task = claimTask(body.id, body.agent_id || 'api-user');
            return NextResponse.json({ task });
        }

        // Complete task (→ done)
        if (body.action === 'complete') {
            const task = completeTask(body.id, body.summary || '');
            return NextResponse.json({ task });
        }

        // Abandon task (→ ready)
        if (body.action === 'abandon') {
            const task = abandonTask(body.id, body.reason || '');
            return NextResponse.json({ task });
        }

        // Shorthand: { id, status: "done" } — used by GEMINI.md Gate 2
        if (body.status === 'done') {
            const task = completeTask(body.id, body.summary || '');
            return NextResponse.json({ task });
        }

        // Reopen done → ready
        if (body.action === 'reopen') {
            const task = reopenTask(body.id);
            return NextResponse.json({ task });
        }

        // General field update
        const task = updateTask(body.id, {
            title: body.title,
            description: body.description,
            priority: body.priority,
            acceptance: body.acceptance,
            phase: body.phase,
            sort_order: body.sort_order,
            project_id: body.project_id,
            agent_id: body.agent_id,
        });

        return NextResponse.json({ task });
    } catch (error) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

// DELETE /api/tasks — Delete task
export async function DELETE(request) {
    try {
        const body = await request.json();

        if (!body.id) {
            return NextResponse.json(
                { error: 'Task ID is required' },
                { status: 400 }
            );
        }

        deleteTask(body.id);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
