#!/usr/bin/env node

/**
 * AWF v6.0 CLI — Antigravity Workflow Framework
 * Unified installer, updater, and manager for AI agent workflows.
 * 
 * Usage:
 *   awf install        Install AWF into ~/.gemini/antigravity/
 *   awf uninstall      Remove AWF from system
 *   awf update         Update to latest version
 *   awf doctor         Check installation health
 *   awf enable-pack    Enable a skill pack
 *   awf disable-pack   Disable a skill pack
 *   awf list-packs     List available skill packs
 *   awf version        Show current version
 * 
 * Created by Kien AI
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ─── Constants ────────────────────────────────────────────────────────────────

const AWF_VERSION = fs.readFileSync(path.join(__dirname, '..', 'VERSION'), 'utf8').trim();
const AWF_ROOT = path.join(__dirname, '..');
const HOME = process.env.HOME || process.env.USERPROFILE;

const TARGETS = {
    antigravity: path.join(HOME, '.gemini', 'antigravity'),
    geminiMd: path.join(HOME, '.gemini', 'GEMINI.md'),
    versionFile: path.join(HOME, '.gemini', 'awf_version'),
    agentsDir: null, // Set per-project
};

// Mapping: source dir in package → target dir in antigravity
const SYNC_MAP = {
    'core/GEMINI.md': 'GEMINI.md',
    'core/AGENTS.md': 'global_workflows/AGENTS.md',
    'core/orchestrator.md': 'skills/orchestrator/SKILL.md',
    'workflows': 'global_workflows',
    'skills': 'skills',
    'schemas': 'schemas',
    'templates': 'templates',
};

// ─── Colors ──────────────────────────────────────────────────────────────────

const C = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    gray: '\x1b[90m',
    bold: '\x1b[1m',
};

function log(msg) { console.log(msg); }
function ok(msg) { log(`${C.green}✅ ${msg}${C.reset}`); }
function warn(msg) { log(`${C.yellow}⚠️  ${msg}${C.reset}`); }
function err(msg) { log(`${C.red}❌ ${msg}${C.reset}`); }
function info(msg) { log(`${C.cyan}ℹ️  ${msg}${C.reset}`); }
function dim(msg) { log(`${C.gray}   ${msg}${C.reset}`); }

// ─── Utility Functions ──────────────────────────────────────────────────────

/**
 * Recursively copy directory, preserving structure.
 * Does NOT overwrite files prefixed with `.` (user configs).
 */
function copyDirRecursive(src, dest, options = {}) {
    const { flatten = false, dryRun = false, overwrite = true } = options;
    let count = 0;

    if (!fs.existsSync(src)) return count;
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });

    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
        if (entry.name === '.DS_Store') continue;

        const srcPath = path.join(src, entry.name);

        if (entry.isDirectory()) {
            if (flatten) {
                // Flatten: copy workflow files from subcategories into single dir
                count += copyDirRecursive(srcPath, dest, options);
            } else {
                const destPath = path.join(dest, entry.name);
                count += copyDirRecursive(srcPath, destPath, options);
            }
        } else {
            const destPath = path.join(dest, entry.name);

            // Skip user config files if they already exist and overwrite is off
            if (!overwrite && fs.existsSync(destPath)) {
                dim(`Skip (exists): ${entry.name}`);
                continue;
            }

            if (!dryRun) {
                fs.copyFileSync(srcPath, destPath);
            }
            count++;
        }
    }

    return count;
}

/**
 * Flatten workflow category dirs into single global_workflows dir.
 * workflows/lifecycle/code.md → global_workflows/code.md
 * workflows/context/recap.md → global_workflows/recap.md
 */
function flattenWorkflows(srcBase, destDir) {
    let count = 0;

    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

    const categories = fs.readdirSync(srcBase, { withFileTypes: true });

    for (const cat of categories) {
        if (!cat.isDirectory()) continue;

        const catPath = path.join(srcBase, cat.name);
        const files = fs.readdirSync(catPath, { withFileTypes: true });

        for (const file of files) {
            if (file.name === '.DS_Store') continue;

            if (file.isFile() && file.name.endsWith('.md')) {
                const srcFile = path.join(catPath, file.name);
                const destFile = path.join(destDir, file.name);
                fs.copyFileSync(srcFile, destFile);
                count++;
            }
        }
    }

    return count;
}

/**
 * Install or update GEMINI.md into ~/.gemini/
 */
function syncGeminiMd() {
    const srcGemini = path.join(AWF_ROOT, 'core', 'GEMINI.md');
    const destGemini = TARGETS.geminiMd;

    const destDir = path.dirname(destGemini);
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

    // Read existing GEMINI.md if present
    let existingContent = '';
    if (fs.existsSync(destGemini)) {
        existingContent = fs.readFileSync(destGemini, 'utf8');

        // Backup existing
        const backupDir = path.join(destDir, 'antigravity', 'backup');
        if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(backupDir, `GEMINI_${timestamp}.md.bak`);
        fs.copyFileSync(destGemini, backupPath);
        dim(`Backup: ${backupPath}`);
    }

    // Copy new GEMINI.md
    fs.copyFileSync(srcGemini, destGemini);
    ok('GEMINI.md updated');
}

// ─── Commands ────────────────────────────────────────────────────────────────

function cmdInstall() {
    log('');
    log(`${C.cyan}${C.bold}╔══════════════════════════════════════════════════════════╗${C.reset}`);
    log(`${C.cyan}${C.bold}║     🚀 AWF v${AWF_VERSION} — Antigravity Workflow Framework        ║${C.reset}`);
    log(`${C.cyan}${C.bold}╚══════════════════════════════════════════════════════════╝${C.reset}`);
    log('');

    const target = TARGETS.antigravity;

    // 1. Ensure target dirs exist
    info('Creating directories...');
    const dirs = ['global_workflows', 'skills', 'schemas', 'templates'];
    for (const dir of dirs) {
        const fullPath = path.join(target, dir);
        if (!fs.existsSync(fullPath)) {
            fs.mkdirSync(fullPath, { recursive: true });
        }
    }
    ok('Directories ready');

    // 2. Sync GEMINI.md
    info('Syncing GEMINI.md...');
    syncGeminiMd();

    // 3. Backup and flatten workflows
    info('Installing workflows...');
    const wfSrc = path.join(AWF_ROOT, 'workflows');
    const wfDest = path.join(target, 'global_workflows');

    // Backup existing global_workflows to a zip file
    if (fs.existsSync(wfDest)) {
        const backupDir = path.join(target, 'backup');
        if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const zipFile = path.join(backupDir, `global_workflows_${timestamp}.bak.zip`);
        try {
            info('Creating zip backup of global_workflows...');
            execSync(`zip -r "${zipFile}" .`, { cwd: wfDest, stdio: 'ignore' });
            ok(`Backup created: ${zipFile}`);
        } catch (e) {
            warn(`Failed to create backup zip: ${e.message}`);
        }
    }

    const wfCount = flattenWorkflows(wfSrc, wfDest);
    ok(`${wfCount} workflows installed`);

    // 4. Copy AGENTS.md
    const agentsSrc = path.join(AWF_ROOT, 'core', 'AGENTS.md');
    const agentsDest = path.join(target, 'global_workflows', 'AGENTS.md');
    if (fs.existsSync(agentsSrc)) {
        fs.copyFileSync(agentsSrc, agentsDest);
        ok('AGENTS.md installed');
    }

    // 5. Copy skills
    info('Installing skills...');
    const skillsSrc = path.join(AWF_ROOT, 'skills');
    const skillsDest = path.join(target, 'skills');
    const skillCount = copyDirRecursive(skillsSrc, skillsDest);
    ok(`${skillCount} skill files installed`);

    // 6. Copy orchestrator
    const orchSrc = path.join(AWF_ROOT, 'core', 'orchestrator.md');
    const orchDestDir = path.join(target, 'skills', 'orchestrator');
    if (!fs.existsSync(orchDestDir)) fs.mkdirSync(orchDestDir, { recursive: true });
    fs.copyFileSync(orchSrc, path.join(orchDestDir, 'SKILL.md'));
    ok('Orchestrator skill installed');

    // 7. Copy schemas (always overwrite)
    info('Installing schemas...');
    const schemaSrc = path.join(AWF_ROOT, 'schemas');
    const schemaDest = path.join(target, 'schemas');
    const schemaCount = copyDirRecursive(schemaSrc, schemaDest);
    ok(`${schemaCount} schemas installed`);

    // 8. Copy templates (don't overwrite existing)
    info('Installing templates...');
    const tmplSrc = path.join(AWF_ROOT, 'templates');
    const tmplDest = path.join(target, 'templates');
    const tmplCount = copyDirRecursive(tmplSrc, tmplDest, { overwrite: false });
    ok(`${tmplCount} templates installed`);

    // 9. Save version
    fs.writeFileSync(TARGETS.versionFile, AWF_VERSION);
    ok(`Version ${AWF_VERSION} saved`);

    // 10. Summary
    log('');
    log(`${C.gray}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${C.reset}`);
    log(`${C.yellow}${C.bold}🎉 AWF v${AWF_VERSION} installed successfully!${C.reset}`);
    log('');
    dim(`Workflows:  ${path.join(target, 'global_workflows')}`);
    dim(`Skills:     ${path.join(target, 'skills')}`);
    dim(`Schemas:    ${path.join(target, 'schemas')}`);
    dim(`Templates:  ${path.join(target, 'templates')}`);
    dim(`GEMINI.md:  ${TARGETS.geminiMd}`);
    log('');
    log(`${C.cyan}👉 Type '/plan' in your AI chat to get started.${C.reset}`);
    log(`${C.cyan}👉 Run 'awf doctor' to verify installation.${C.reset}`);
    log('');
}

function cmdUninstall() {
    warn('Uninstalling AWF...');

    // Remove version file
    if (fs.existsSync(TARGETS.versionFile)) {
        fs.unlinkSync(TARGETS.versionFile);
        ok('Version file removed');
    }

    // Don't remove workflows/skills — user may have custom ones
    warn('Workflow and skill files were NOT removed (may contain custom content).');
    warn('To fully remove, manually delete:');
    dim(TARGETS.antigravity);

    ok('AWF uninstalled. Custom files preserved.');
}

function cmdUpdate() {
    info(`Updating to AWF v${AWF_VERSION}...`);

    // Check current version
    let currentVersion = '0.0.0';
    if (fs.existsSync(TARGETS.versionFile)) {
        currentVersion = fs.readFileSync(TARGETS.versionFile, 'utf8').trim();
    }

    if (currentVersion === AWF_VERSION) {
        ok(`Already on latest version (${AWF_VERSION})`);
        return;
    }

    info(`Upgrading from ${currentVersion} → ${AWF_VERSION}`);
    cmdInstall();
}

function cmdDoctor() {
    log('');
    log(`${C.cyan}${C.bold}🏥 AWF Health Check${C.reset}`);
    log('');

    let issues = 0;

    // 1. Check GEMINI.md
    if (fs.existsSync(TARGETS.geminiMd)) {
        ok('GEMINI.md exists');
    } else {
        err('GEMINI.md missing'); issues++;
    }

    // 2. Check global_workflows
    const wfDir = path.join(TARGETS.antigravity, 'global_workflows');
    if (fs.existsSync(wfDir)) {
        const wfFiles = fs.readdirSync(wfDir).filter(f => f.endsWith('.md'));
        ok(`${wfFiles.length} workflows found`);

        // Check essential workflows
        const essential = ['code.md', 'plan.md', 'debug.md', 'save-brain.md', 'recap.md', 'init.md'];
        for (const wf of essential) {
            if (!wfFiles.includes(wf)) {
                warn(`Essential workflow missing: ${wf}`); issues++;
            }
        }
    } else {
        err('global_workflows/ directory missing'); issues++;
    }

    // 3. Check skills
    const skillsDir = path.join(TARGETS.antigravity, 'skills');
    if (fs.existsSync(skillsDir)) {
        const skills = fs.readdirSync(skillsDir, { withFileTypes: true })
            .filter(d => d.isDirectory())
            .map(d => d.name);
        ok(`${skills.length} skills found`);

        // Check essential skills
        const essentialSkills = ['orchestrator', 'beads-manager', 'session-restore'];
        for (const s of essentialSkills) {
            if (!skills.includes(s)) {
                warn(`Essential skill missing: ${s}`); issues++;
            }
        }
    } else {
        err('skills/ directory missing'); issues++;
    }

    // 4. Check schemas
    const schemasDir = path.join(TARGETS.antigravity, 'schemas');
    if (fs.existsSync(schemasDir)) {
        const schemas = fs.readdirSync(schemasDir).filter(f => f.endsWith('.json'));
        ok(`${schemas.length} schemas found`);
    } else {
        warn('schemas/ directory missing'); issues++;
    }

    // 5. Check version
    if (fs.existsSync(TARGETS.versionFile)) {
        const v = fs.readFileSync(TARGETS.versionFile, 'utf8').trim();
        ok(`AWF version: ${v}`);
        if (v !== AWF_VERSION) {
            warn(`Package version (${AWF_VERSION}) differs from installed (${v}). Run 'awf update'.`);
        }
    } else {
        warn('Version file missing. Run "awf install" first.'); issues++;
    }

    // Summary
    log('');
    if (issues === 0) {
        log(`${C.green}${C.bold}✅ All checks passed! AWF is healthy.${C.reset}`);
    } else {
        log(`${C.yellow}${C.bold}⚠️  ${issues} issue(s) found. Run 'awf install' to fix.${C.reset}`);
    }
    log('');
}

function cmdEnablePack(packName) {
    if (!packName) {
        err('Usage: awf enable-pack <pack-name>');
        log('');
        cmdListPacks();
        return;
    }

    const packSrc = path.join(AWF_ROOT, 'skill-packs', packName);

    if (!fs.existsSync(packSrc)) {
        err(`Skill pack "${packName}" not found.`);
        cmdListPacks();
        return;
    }

    const target = path.join(TARGETS.antigravity, 'skills');
    info(`Enabling skill pack: ${packName}`);

    // Copy all skills from pack into skills/
    const count = copyDirRecursive(packSrc, target);
    ok(`${count} files from "${packName}" pack installed`);
}

function cmdDisablePack(packName) {
    if (!packName) {
        err('Usage: awf disable-pack <pack-name>');
        return;
    }

    const packSrc = path.join(AWF_ROOT, 'skill-packs', packName);

    if (!fs.existsSync(packSrc)) {
        err(`Skill pack "${packName}" not found.`);
        return;
    }

    // Get list of skill dirs in this pack
    const skillDirs = fs.readdirSync(packSrc, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name);

    const target = path.join(TARGETS.antigravity, 'skills');

    for (const skillDir of skillDirs) {
        const destPath = path.join(target, skillDir);
        if (fs.existsSync(destPath)) {
            // Move to backup instead of deleting
            const backupDir = path.join(TARGETS.antigravity, 'backup', 'skills');
            if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
            fs.renameSync(destPath, path.join(backupDir, skillDir));
            dim(`Moved to backup: ${skillDir}`);
        }
    }

    ok(`Skill pack "${packName}" disabled (backed up)`);
}

function cmdListPacks() {
    const packsDir = path.join(AWF_ROOT, 'skill-packs');

    log('');
    log(`${C.cyan}${C.bold}📦 Available Skill Packs${C.reset}`);
    log('');

    if (!fs.existsSync(packsDir)) {
        warn('No skill packs directory found.');
        return;
    }

    const packs = fs.readdirSync(packsDir, { withFileTypes: true })
        .filter(d => d.isDirectory());

    if (packs.length === 0) {
        info('No skill packs available yet.');
        return;
    }

    for (const pack of packs) {
        const readmePath = path.join(packsDir, pack.name, 'README.md');
        let desc = '';
        if (fs.existsSync(readmePath)) {
            const content = fs.readFileSync(readmePath, 'utf8');
            desc = content.split('\n').find(l => l.trim() && !l.startsWith('#')) || '';
        }
        log(`  ${C.green}${pack.name}${C.reset}  ${C.gray}${desc}${C.reset}`);
    }

    log('');
    log(`${C.cyan}Usage: awf enable-pack <name>${C.reset}`);
    log('');
}

function cmdVersion() {
    log(`AWF v${AWF_VERSION}`);
}

function cmdHelp() {
    log('');
    log(`${C.cyan}${C.bold}AWF v${AWF_VERSION} — Antigravity Workflow Framework${C.reset}`);
    log('');
    log('Commands:');
    log(`  ${C.green}install${C.reset}        Install AWF into ~/.gemini/antigravity/`);
    log(`  ${C.green}uninstall${C.reset}      Remove AWF (preserves custom files)`);
    log(`  ${C.green}update${C.reset}         Update to latest version`);
    log(`  ${C.green}doctor${C.reset}         Check installation health`);
    log(`  ${C.green}enable-pack${C.reset}    Enable a skill pack`);
    log(`  ${C.green}disable-pack${C.reset}   Disable a skill pack`);
    log(`  ${C.green}list-packs${C.reset}     List available skill packs`);
    log(`  ${C.green}version${C.reset}        Show version`);
    log(`  ${C.green}help${C.reset}           Show this help`);
    log('');
}

// ─── Main ────────────────────────────────────────────────────────────────────

const [, , command, ...args] = process.argv;

switch (command) {
    case 'install':
        cmdInstall();
        break;
    case 'uninstall':
        cmdUninstall();
        break;
    case 'update':
        cmdUpdate();
        break;
    case 'doctor':
        cmdDoctor();
        break;
    case 'enable-pack':
        cmdEnablePack(args[0]);
        break;
    case 'disable-pack':
        cmdDisablePack(args[0]);
        break;
    case 'list-packs':
        cmdListPacks();
        break;
    case 'version':
    case '--version':
    case '-v':
        cmdVersion();
        break;
    case 'help':
    case '--help':
    case '-h':
    default:
        cmdHelp();
        break;
}
