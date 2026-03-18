import { NextResponse } from 'next/server';
import { listActiveWorkspaces } from '../../../lib/core.mjs';

// GET /api/workspaces — List active workspaces
export async function GET() {
    try {
        const workspaces = listActiveWorkspaces();
        return NextResponse.json({ workspaces });
    } catch (error) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
