/**
 * Workflows Discovery API — Scans ~/.gemini/antigravity/global_workflows/
 * GET /api/workflows — list all available workflows with descriptions
 */
import { NextResponse } from 'next/server';
import { readdirSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const WORKFLOWS_DIR = join(homedir(), '.gemini', 'antigravity', 'global_workflows');

function parseWorkflowMeta(content) {
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match) return {};
    const fm = {};
    match[1].split('\n').forEach(line => {
        const idx = line.indexOf(':');
        if (idx > 0) {
            const key = line.substring(0, idx).trim();
            let val = line.substring(idx + 1).trim();
            if ((val.startsWith('"') && val.endsWith('"')) ||
                (val.startsWith("'") && val.endsWith("'"))) {
                val = val.slice(1, -1);
            }
            if (val !== '>-' && val !== '|') {
                fm[key] = val;
            }
        }
    });
    return fm;
}

export async function GET() {
    try {
        if (!existsSync(WORKFLOWS_DIR)) {
            return NextResponse.json({ workflows: [], total: 0 });
        }

        const files = readdirSync(WORKFLOWS_DIR).filter(f => f.endsWith('.md') && f !== 'README.md' && f !== 'AGENTS.md');
        const workflows = [];

        for (const file of files) {
            const content = readFileSync(join(WORKFLOWS_DIR, file), 'utf-8');
            const fm = parseWorkflowMeta(content);
            const command = '/' + file.replace('.md', '');

            workflows.push({
                id: file.replace('.md', ''),
                command,
                description: fm.description || '',
                file: file,
            });
        }

        workflows.sort((a, b) => a.command.localeCompare(b.command));

        return NextResponse.json({ workflows, total: workflows.length });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
