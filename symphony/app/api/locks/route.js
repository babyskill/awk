import { NextResponse } from 'next/server';
import { forceReleaseLock } from '../../../lib/core.mjs';

// DELETE /api/locks — Force-release a file lock
export async function DELETE(request) {
    try {
        const body = await request.json();

        if (!body.file) {
            return NextResponse.json(
                { error: 'File path is required' },
                { status: 400 }
            );
        }

        const released = forceReleaseLock(body.file);

        return NextResponse.json({
            released,
            file: body.file,
            message: released ? 'Lock released' : 'No lock found',
        });
    } catch (error) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
