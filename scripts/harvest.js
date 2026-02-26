#!/usr/bin/env node
/**
 * AWK Harvest Script — Phase 1 Migration
 * Pulls all workflows, skills, and GEMINI.md from the live ~/.gemini/antigravity/
 * into main-awf/ so that main-awf becomes the Single Source of Truth.
 *
 * Usage: node scripts/harvest.js [--dry-run]
 * Created by Kien AI
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const HOME = os.homedir();
const AWK_ROOT = path.join(__dirname, '..');
const ANTIGRAVITY = path.join(HOME, '.gemini', 'antigravity');
const GEMINI_MD_SRC = path.join(HOME, '.gemini', 'GEMINI.md');

const DRY_RUN = process.argv.includes('--dry-run');

// ─── Colors ───────────────────────────────────────────────────────────────────
const C = {
    reset: '\x1b[0m', red: '\x1b[31m', green: '\x1b[32m',
    yellow: '\x1b[33m', cyan: '\x1b[36m', gray: '\x1b[90m', bold: '\x1b[1m',
};
const ok = (m) => console.log(`${C.green}✅ ${m}${C.reset}`);
const warn = (m) => console.log(`${C.yellow}⚠️  ${m}${C.reset}`);
const info = (m) => console.log(`${C.cyan}ℹ️  ${m}${C.reset}`);
const dim = (m) => console.log(`${C.gray}   ${m}${C.reset}`);
const err = (m) => console.log(`${C.red}❌ ${m}${C.reset}`);
const head = (m) => console.log(`\n${C.cyan}${C.bold}── ${m} ──${C.reset}`);

// ─── Workflow Category Map ─────────────────────────────────────────────────────
// Maps workflow filename → destination category folder
const WORKFLOW_CATEGORIES = {
    // Lifecycle
    'brainstorm.md': 'lifecycle', 'plan.md': 'lifecycle', 'planExpert.md': 'expert',
    'code.md': 'lifecycle', 'codeExpert.md': 'expert', 'debug.md': 'lifecycle',
    'debugExpert.md': 'expert', 'test.md': 'lifecycle', 'deploy.md': 'lifecycle',
    'refactor.md': 'lifecycle', 'init.md': 'lifecycle', 'run.md': 'lifecycle',
    'migration.md': 'lifecycle', 'hotfix.md': 'git',
    // Context & Memory
    'recap.md': 'context', 'next.md': 'context', 'save-brain.md': 'context',
    'codebase-sync.md': 'context', 'auto-execution-workflow.md': 'context',
    'auto-implement.md': 'context',
    // Quality
    'audit.md': 'quality', 'performance-audit.md': 'quality', 'ux-audit.md': 'quality',
    'code-quality-rules.md': 'quality', 'accessibility-audit.md': 'quality',
    'project-audit.md': 'quality', 'ui-review.md': 'quality', 'visual-debug.md': 'quality',
    'bug-hunter.md': 'quality', 'code-janitor.md': 'quality', 'self-healing-test.md': 'quality',
    // UI/UX
    'visualize.md': 'ui', 'design-to-ui.md': 'ui', 'ui-first-methodology.md': 'ui',
    'app-screen-analyzer.md': 'ui', 'create-feature.md': 'ui', 'feature-completion.md': 'ui',
    'create-spec-architect.md': 'ui',
    // Ads
    'ads-audit.md': 'ads', 'ads-optimize.md': 'ads', 'adsExpert.md': 'ads',
    'ads-analyst.md': 'ads', 'ads-targeting.md': 'ads', 'admob.md': 'ads',
    'smali-ads-config.md': 'ads', 'smali-ads-flow.md': 'ads',
    'smali-ads-interstitial.md': 'ads', 'smali-ads-native.md': 'ads',
    // Mobile
    'maestro-qa-workflow.md': 'mobile', 'maestro-test-workflow.md': 'mobile',
    'turbo-mobile-build.md': 'mobile', 'app-analysis.md': 'mobile',
    'structure-clean-architect.md': 'mobile',
    // Git
    'git-commit-workflow.md': 'git', 'smart-git-ops.md': 'git', 'rollback.md': 'git',
    'release-notes.md': 'git', 'cloudflare-tunnel.md': 'git',
    // Roles
    'tech-lead-workflow.md': 'roles', 'product-manager-workflow.md': 'roles',
    'qa-engineer-workflow.md': 'roles', 'ui-ux-designer-workflow.md': 'roles',
    'vibe-coding-master-workflow.md': 'roles', 'oracle.md': 'roles',
    // Meta / Config
    'customize.md': 'meta', 'base-rules.md': 'meta', 'file-protection-rules.md': 'meta',
    'project-identity-enforcement.md': 'meta', 'help.html': 'meta',
    // Workflows & Logic
    'plan.md': 'lifecycle', 'logic-reasoning-workflow.md': 'context',
    'user-intent-analysis-workflow.md': 'context', 'master-code-workflow.md': 'lifecycle',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        if (!DRY_RUN) fs.mkdirSync(dirPath, { recursive: true });
    }
}

function copyFile(src, dest, label) {
    if (!fs.existsSync(src)) { warn(`Not found: ${label || path.basename(src)}`); return false; }
    ensureDir(path.dirname(dest));
    if (!DRY_RUN) fs.copyFileSync(src, dest);
    dim(`${DRY_RUN ? '[DRY] ' : ''}${label || path.basename(src)}`);
    return true;
}

function copyDirRecursive(src, dest) {
    if (!fs.existsSync(src)) return 0;
    ensureDir(dest);
    let count = 0;
    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
        if (entry.name === '.DS_Store') continue;
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            count += copyDirRecursive(srcPath, destPath);
        } else {
            if (!DRY_RUN) fs.copyFileSync(srcPath, destPath);
            count++;
        }
    }
    return count;
}

// ─── Main Harvest ─────────────────────────────────────────────────────────────
async function harvest() {
    console.log('');
    console.log(`${C.cyan}${C.bold}╔══════════════════════════════════════════════════════════╗${C.reset}`);
    console.log(`${C.cyan}${C.bold}║   🌾 AWK Harvest — Pulling from ~/.gemini/antigravity/   ║${C.reset}`);
    console.log(`${C.cyan}${C.bold}╚══════════════════════════════════════════════════════════╝${C.reset}`);
    if (DRY_RUN) warn('DRY RUN MODE — No files will be written');
    console.log('');

    // Verify source exists
    if (!fs.existsSync(ANTIGRAVITY)) {
        err(`Source not found: ${ANTIGRAVITY}`);
        process.exit(1);
    }

    const stats = { workflows: 0, skills: 0, misc: 0 };

    // ── 1. Harvest GEMINI.md ──────────────────────────────────────────────────
    head('GEMINI.md');
    if (fs.existsSync(GEMINI_MD_SRC)) {
        const destGemini = path.join(AWK_ROOT, 'core', 'GEMINI.md');
        // Backup existing
        if (fs.existsSync(destGemini)) {
            const bak = destGemini + '.bak';
            if (!DRY_RUN) fs.copyFileSync(destGemini, bak);
            dim(`Backed up existing → core/GEMINI.md.bak`);
        }
        copyFile(GEMINI_MD_SRC, destGemini, 'GEMINI.md → core/GEMINI.md');
        ok('GEMINI.md harvested');
        stats.misc++;
    } else {
        warn('GEMINI.md not found at ~/.gemini/GEMINI.md');
    }

    // ── 2. Harvest Workflows ──────────────────────────────────────────────────
    head('Workflows (77 files → categorized)');
    const wfSrc = path.join(ANTIGRAVITY, 'global_workflows');

    if (!fs.existsSync(wfSrc)) {
        err(`global_workflows not found: ${wfSrc}`);
    } else {
        const files = fs.readdirSync(wfSrc).filter(f => f.endsWith('.md') || f.endsWith('.html'));
        let categorized = 0, uncategorized = 0;

        for (const file of files) {
            // Skip AGENTS.md — handled separately
            if (file === 'AGENTS.md') continue;

            const srcFile = path.join(wfSrc, file);
            const category = WORKFLOW_CATEGORIES[file] || '_uncategorized';

            if (!WORKFLOW_CATEGORIES[file]) {
                uncategorized++;
                dim(`→ _uncategorized/${file}`);
            } else {
                categorized++;
            }

            const destFile = path.join(AWK_ROOT, 'workflows', category, file);
            copyFile(srcFile, destFile, `${file} → workflows/${category}/`);
            stats.workflows++;
        }

        ok(`${stats.workflows} workflow files harvested (${categorized} categorized, ${uncategorized} → _uncategorized)`);
    }

    // ── 3. Harvest Skills ─────────────────────────────────────────────────────
    head('Skills');
    const skillSrc = path.join(ANTIGRAVITY, 'skills');

    if (!fs.existsSync(skillSrc)) {
        warn('skills/ not found in antigravity');
    } else {
        const skillDirs = fs.readdirSync(skillSrc, { withFileTypes: true })
            .filter(d => d.isDirectory() && d.name !== '.DS_Store');

        for (const skillDir of skillDirs) {
            const src = path.join(skillSrc, skillDir.name);
            const dest = path.join(AWK_ROOT, 'skills', skillDir.name);
            const count = copyDirRecursive(src, dest);
            dim(`${skillDir.name}/ (${count} files)`);
            stats.skills++;
        }

        ok(`${stats.skills} skills harvested`);
    }

    // ── 4. Harvest brain/ambient-brain skill (special case in main-awf) ───────
    head('Special Skills from main-awf legacy');
    const ambientBrainSrc = path.join(AWK_ROOT, 'skills', 'ambient-brain');
    if (fs.existsSync(ambientBrainSrc)) {
        // Rename ambient-brain → memory-sync if memory-sync not already there from harvest
        const memorySyncDest = path.join(AWK_ROOT, 'skills', 'memory-sync');
        if (!fs.existsSync(memorySyncDest)) {
            if (!DRY_RUN) fs.renameSync(ambientBrainSrc, memorySyncDest);
            ok('ambient-brain → memory-sync (renamed)');
        } else {
            dim('memory-sync already exists (from harvest), ambient-brain kept for reference');
        }
    }

    // ── 5. Harvest AGENTS.md ──────────────────────────────────────────────────
    head('AGENTS.md');
    const agentsSrc = path.join(ANTIGRAVITY, 'global_workflows', 'AGENTS.md');
    if (fs.existsSync(agentsSrc)) {
        copyFile(agentsSrc, path.join(AWK_ROOT, 'core', 'AGENTS.md'), 'AGENTS.md → core/AGENTS.md');
        ok('AGENTS.md harvested');
        stats.misc++;
    }

    // ── 6. Harvest schemas & templates ────────────────────────────────────────
    head('Schemas & Templates');
    const schemasSrc = path.join(ANTIGRAVITY, 'schemas');
    if (fs.existsSync(schemasSrc)) {
        const count = copyDirRecursive(schemasSrc, path.join(AWK_ROOT, 'schemas'));
        ok(`${count} schemas harvested`);
    }
    const tmplSrc = path.join(ANTIGRAVITY, 'templates');
    if (fs.existsSync(tmplSrc)) {
        const count = copyDirRecursive(tmplSrc, path.join(AWK_ROOT, 'templates'));
        ok(`${count} templates harvested`);
    }

    // ── Summary ───────────────────────────────────────────────────────────────
    console.log('');
    console.log(`${C.gray}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${C.reset}`);
    console.log(`${C.yellow}${C.bold}🎉 Harvest Complete!${DRY_RUN ? ' (DRY RUN)' : ''}${C.reset}`);
    console.log('');
    dim(`Workflows: ${stats.workflows} files`);
    dim(`Skills:    ${stats.skills} directories`);
    dim(`Misc:      ${stats.misc} files (GEMINI.md, AGENTS.md)`);
    console.log('');
    console.log(`${C.cyan}Next: node scripts/rename-to-awk.js${C.reset}`);
    console.log('');
}

harvest().catch(console.error);
