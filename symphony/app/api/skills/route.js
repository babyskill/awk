/**
 * Skills Discovery API — Scans ~/.gemini/antigravity/skills/ directory
 * GET /api/skills — list all available skills with metadata from SKILL.md frontmatter
 */
import { NextResponse } from 'next/server';
import { readdirSync, readFileSync, existsSync, statSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const SKILLS_DIR = join(homedir(), '.gemini', 'antigravity', 'skills');

function parseFrontmatter(content) {
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match) return {};
    const fm = {};
    match[1].split('\n').forEach(line => {
        const idx = line.indexOf(':');
        if (idx > 0) {
            const key = line.substring(0, idx).trim();
            let val = line.substring(idx + 1).trim();
            // Remove quotes
            if ((val.startsWith('"') && val.endsWith('"')) ||
                (val.startsWith("'") && val.endsWith("'"))) {
                val = val.slice(1, -1);
            }
            // Skip multi-line YAML values (e.g., description: >-)
            if (val !== '>-' && val !== '|') {
                fm[key] = val;
            }
        }
    });
    return fm;
}

export async function GET() {
    try {
        if (!existsSync(SKILLS_DIR)) {
            return NextResponse.json({ skills: [], total: 0 });
        }

        const entries = readdirSync(SKILLS_DIR, { withFileTypes: true });
        const skills = [];

        for (const entry of entries) {
            if (!entry.isDirectory()) continue;

            const skillMd = join(SKILLS_DIR, entry.name, 'SKILL.md');
            if (!existsSync(skillMd)) continue;

            const content = readFileSync(skillMd, 'utf-8');
            const fm = parseFrontmatter(content);

            // Extract first paragraph as description if not in frontmatter
            let description = fm.description || '';
            if (!description) {
                const lines = content.split('\n');
                const descLine = lines.find(l => l.trim() && !l.startsWith('#') && !l.startsWith('---'));
                description = descLine ? descLine.trim() : '';
            }

            skills.push({
                id: entry.name,
                name: fm.name || entry.name,
                description: description.substring(0, 200),
                type: fm.trigger === 'conditional' ? 'manual' : (fm.type || 'auto'),
                version: fm.version || null,
                priority: fm.priority || null,
            });
        }

        // Sort: auto skills first, then manual
        skills.sort((a, b) => {
            if (a.type === 'auto' && b.type !== 'auto') return -1;
            if (a.type !== 'auto' && b.type === 'auto') return 1;
            return a.name.localeCompare(b.name);
        });

        return NextResponse.json({ skills, total: skills.length });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
