import { NextResponse } from 'next/server';
import { createNote, listNotes, getNote, updateNote, deleteNote } from '../../../lib/core.mjs';

// GET /api/notes — List notes with filters
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const projectId = searchParams.get('projectId') || undefined;
        const type = searchParams.get('type') || undefined;
        const conversationId = searchParams.get('conversationId') || undefined;
        const taskId = searchParams.get('taskId') || undefined;
        const limit = searchParams.get('limit') || '50';

        const notes = listNotes({
            projectId,
            type,
            conversationId,
            taskId,
            limit: parseInt(limit),
        });

        return NextResponse.json({ notes });
    } catch (error) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

// POST /api/notes — Create a note
export async function POST(request) {
    try {
        const body = await request.json();

        if (!body.project_id && !body.projectId) {
            return NextResponse.json(
                { error: 'project_id is required' },
                { status: 400 }
            );
        }
        if (!body.type) {
            return NextResponse.json(
                { error: 'type is required' },
                { status: 400 }
            );
        }
        if (!body.title) {
            return NextResponse.json(
                { error: 'title is required' },
                { status: 400 }
            );
        }

        const note = createNote({
            projectId: body.project_id || body.projectId,
            type: body.type,
            title: body.title,
            content: body.content,
            filePath: body.file_path || body.filePath,
            conversationId: body.conversation_id || body.conversationId,
            taskId: body.task_id || body.taskId,
            metadata: body.metadata,
        });

        return NextResponse.json({ note }, { status: 201 });
    } catch (error) {
        return NextResponse.json(
            { error: error.message },
            { status: error.message.includes('required') ? 400 : 500 }
        );
    }
}

// PATCH /api/notes — Update a note
export async function PATCH(request) {
    try {
        const body = await request.json();

        if (!body.id) {
            return NextResponse.json(
                { error: 'Note ID is required' },
                { status: 400 }
            );
        }

        const note = updateNote(body.id, {
            title: body.title,
            content: body.content,
            file_path: body.file_path || body.filePath,
            task_id: body.task_id || body.taskId,
            metadata: body.metadata,
            conversation_id: body.conversation_id || body.conversationId,
        });

        return NextResponse.json({ note });
    } catch (error) {
        return NextResponse.json(
            { error: error.message },
            { status: error.message.includes('not found') ? 404 : 500 }
        );
    }
}

// DELETE /api/notes — Delete a note
export async function DELETE(request) {
    try {
        const body = await request.json();

        if (!body.id) {
            return NextResponse.json(
                { error: 'Note ID is required' },
                { status: 400 }
            );
        }

        deleteNote(body.id);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json(
            { error: error.message },
            { status: error.message.includes('not found') ? 404 : 500 }
        );
    }
}
