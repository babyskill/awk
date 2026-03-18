import { NextResponse } from 'next/server';
import { getSystemStatus } from '../../../lib/core.mjs';

// GET /api/status — Full system status (scoped by project)
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const project = searchParams.get('project') || undefined;

        const status = getSystemStatus(project);
        return NextResponse.json(status);
    } catch (error) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
