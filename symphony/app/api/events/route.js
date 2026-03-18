import { NextResponse } from 'next/server';
import { queryEvents } from '../../../lib/core.mjs';

// GET /api/events — List recent events (scoped by project)
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const since = searchParams.get('since') || undefined;
        const eventType = searchParams.get('type') || undefined;
        const project = searchParams.get('project') || undefined;
        const limit = parseInt(searchParams.get('limit') || '30');

        const events = queryEvents({ since, eventType, project, limit });

        return NextResponse.json({ events });
    } catch (error) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
