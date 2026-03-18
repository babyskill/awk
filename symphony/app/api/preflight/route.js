import { NextResponse } from 'next/server';
import { getPreflightStatus } from '../../../lib/core.mjs';

// GET /api/preflight — Single-call gate check for AI agents
// Returns server health, active project, task summary, and gate status
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const project = searchParams.get('project') || undefined;

        const preflight = getPreflightStatus(project);
        return NextResponse.json(preflight);
    } catch (error) {
        return NextResponse.json(
            {
                gate_status: 'FAIL',
                error: error.message,
                server: { status: 'error' },
            },
            { status: 500 }
        );
    }
}
