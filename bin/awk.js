#!/usr/bin/env node

/**
 * AWK v1.0 CLI — Antigravity Workflow Kit
 * Unified installer, updater, and manager for AI agent workflows.
 * 
 * Usage:
 *   awkit install        Install AWK into ~/.gemini/antigravity/
 *   awkit uninstall      Remove AWK from system
 *   awkit update         Update to latest version
 *   awkit init           Init a new mobile project with Firebase setup
 *   awkit sync           Harvest from ~/.gemini/ then install (full sync)
 *   awkit status         Compare repo vs installed files (diff view)
 *   awkit harvest        Pull from ~/.gemini/antigravity/ into repo
 *   awkit doctor         Check installation health
 *   awkit enable-pack    Enable a skill pack
 *   awkit disable-pack   Disable a skill pack
 *   awkit list-packs     List available skill packs
 *   awkit tg setup       Setup Telegram Bot API credentials
 *   awkit tg send        Send a message via Telegram Bot API
 *   awkit version        Show current version
 * 
 * Created by Kien AI
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync, spawnSync } = require('child_process');
const os = require('os');

const packageJson = require(path.join(__dirname, '..', 'package.json'));
const AWK_VERSION = packageJson.version;
const AWK_ROOT = path.join(__dirname, '..');
const HOME = process.env.HOME || process.env.USERPROFILE;

const { generateClineRules, generateClineWorkflows, generateClineSkills } = require('./cline-generators');
const { generateCodexAgentsMd, generateCodexSkills, generateCodexAgents } = require('./codex-generators');

// ─── Platform Definitions ──────────────────────────────────────────────────

const PLATFORMS = {
    antigravity: {
        name: 'Antigravity (Gemini Code Assist)',
        globalRoot: path.join(HOME, '.gemini', 'antigravity'),
        rulesFile: path.join(HOME, '.gemini', 'GEMINI.md'),
        versionFile: path.join(HOME, '.gemini', 'awk_version'),
        dirs: {
            workflows: 'global_workflows',
            skills: 'skills',
            schemas: 'schemas',
            templates: 'templates',
        },
        supportsCustomModes: false,
        supportsSubagents: false,
    },
    cline: {
        name: 'Cline (VS Code)',
        globalRoot: process.cwd(), // Local to project
        rulesFile: path.join(HOME, '.cline', 'rules', 'antigravity-rules.md'),
        versionFile: path.join(HOME, '.cline', 'awk_version'),
        dirs: {
            workflows: '.clinerules',
            skills: '.clinerules/skills',
        },
    },
    codex: {
        name: 'Codex (OpenAI)',
        globalRoot: path.join(HOME, '.codex'),
        rulesFile: path.join(HOME, '.codex', 'AGENTS.md'),
        versionFile: path.join(HOME, '.codex', 'awk_version'),
        dirs: {
            agents: 'agents',
            skills: '../.agents/skills',
        },
    }
};

const PLATFORM_FILE = path.join(HOME, '.awkit_platform');

/**
 * Get the currently configured platform.
 * Reads from ~/.awkit_platform, defaults to 'antigravity'.
 */
function getActivePlatform() {
    return 'antigravity';
}

function savePlatform(platform) {
    fs.writeFileSync(PLATFORM_FILE, platform, 'utf8');
}

// Active platform — resolved at install time or from saved config
let activePlatform = 'antigravity';

// Legacy compat: TARGETS object derived from active platform
const TARGETS = {
    get antigravity() { return PLATFORMS[activePlatform].globalRoot; },
    get geminiMd() { return PLATFORMS[activePlatform].rulesFile || path.join(HOME, '.gemini', 'GEMINI.md'); },
    get versionFile() { return PLATFORMS[activePlatform].versionFile; },
    agentsDir: null,
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

/**
 * Prompt user for Y/N input synchronously (macOS/Linux only).
 * Returns true if user answers 'y' or 'yes'.
 */
function promptYN(question) {
    try {
        const answer = execSync(
            `bash -c 'read -p "${question} [y/N]: " ans; echo $ans'`,
            { stdio: ['inherit', 'pipe', 'inherit'] }
        ).toString().trim().toLowerCase();
        return answer === 'y' || answer === 'yes';
    } catch (e) {
        return false;
    }
}

/**
 * Prompt user for a choice, returning the raw answer string.
 * Returns defaultVal if user presses Enter without input.
 */
function promptChoice(question, defaultVal = '') {
    try {
        const answer = execSync(
            `bash -c 'read -p "${question} (default: ${defaultVal}): " ans; echo $ans'`,
            { stdio: ['inherit', 'pipe', 'inherit'] }
        ).toString().trim();
        return answer || defaultVal;
    } catch (e) {
        return defaultVal;
    }
}

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
    const srcGemini = path.join(AWK_ROOT, 'core', 'GEMINI.md');
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

/**
 * Check if Symphony is available.
 */
function checkSymphony({ silent = false } = {}) {
    try {
        execSync('which symphony', { stdio: 'ignore' });
        if (!silent) ok('Symphony CLI is installed');
        return true;
    } catch (_) {
        if (!silent) warn('Symphony CLI not found. Please install it manually:');
        if (!silent) dim('  npm install -g @leejungkiin/awkit-symphony');
        return false;
    }
}

function cmdInstall(platformArg) {
    log('');
    log(`${C.cyan}${C.bold}╔══════════════════════════════════════════════════════════╗${C.reset}`);
    log(`${C.cyan}${C.bold}║     🚀 AWK v${AWK_VERSION} — Antigravity Workflow Kit        ║${C.reset}`);
    log(`${C.cyan}${C.bold}╚══════════════════════════════════════════════════════════╝${C.reset}`);
    log('');

    // Platform selection
    let platform = platformArg || getActivePlatform();

    if (!PLATFORMS[platform]) {
        err(`Unknown platform: ${platform}.`);
        return;
    }

    activePlatform = platform;
    savePlatform(platform);

    const plat = PLATFORMS[platform];
    const target = plat.globalRoot;

    info(`Installing for ${C.bold}${plat.name}${C.reset}...`);
    log('');

    // 0. Check Symphony dependency
    info('Checking dependencies...');
    checkSymphony();

    // 1. Ensure target dirs exist
    info('Creating directories...');
    const dirKeys = Object.values(plat.dirs);
    for (const dir of dirKeys) {
        const fullPath = path.join(target, dir);
        if (!fs.existsSync(fullPath)) {
            fs.mkdirSync(fullPath, { recursive: true });
        }
    }
    ok('Directories ready');

    // 2. Sync rules (platform-specific)
    if (platform === 'antigravity') {
        info('Syncing GEMINI.md...');
        syncGeminiMd();
    } else if (platform === 'cline') {
        info('Generating Cline global rules...');
        generateClineRules(path.join(AWK_ROOT, 'core', 'GEMINI.md'), plat.rulesFile);
    } else if (platform === 'codex') {
        info('Generating Codex AGENTS.md...');
        generateCodexAgentsMd(path.join(AWK_ROOT, 'core', 'GEMINI.md'), plat.rulesFile);
    }

    // 3. Backup and install workflows
    if (plat.dirs.workflows) {
        info('Installing workflows...');
        const wfSrc = path.join(AWK_ROOT, 'workflows');
        const wfDest = path.join(target, plat.dirs.workflows);

        // Backup existing workflows
        if (fs.existsSync(wfDest)) {
            const backupDir = path.join(target, 'backup');
            if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const zipFile = path.join(backupDir, `workflows_${timestamp}.bak.zip`);
            try {
                execSync(`zip -r "${zipFile}" .`, { cwd: wfDest, stdio: 'ignore' });
                dim(`Backup: ${zipFile}`);
            } catch (e) {
                warn(`Failed to create backup: ${e.message}`);
            }
        }

        if (platform === 'cline') {
            generateClineWorkflows(wfSrc, wfDest);
        } else if (platform !== 'codex') {
            const wfCount = flattenWorkflows(wfSrc, wfDest);
            ok(`${wfCount} workflows installed`);
        }
    }

    // 4. Copy AGENTS.md
    if (platform === 'antigravity' && plat.dirs.workflows) {
        const agentsSrc = path.join(AWK_ROOT, 'core', 'AGENTS.md');
        const agentsDest = path.join(target, plat.dirs.workflows, 'AGENTS.md');
        if (fs.existsSync(agentsSrc)) {
            fs.copyFileSync(agentsSrc, agentsDest);
            ok('AGENTS.md installed');
        }
    }

    // 5. Copy skills
    if (plat.dirs.skills) {
        info('Installing skills...');
        const skillsSrc = path.join(AWK_ROOT, 'skills');
        const skillsDest = path.join(target, plat.dirs.skills);

        if (platform === 'cline') {
            generateClineSkills(skillsSrc, skillsDest);
        } else if (platform === 'codex') {
            generateCodexSkills(skillsSrc, skillsDest);
            const agentsDest = path.join(target, plat.dirs.agents);
            generateCodexAgents(skillsSrc, agentsDest);
        } else {
            const skillCount = copyDirRecursive(skillsSrc, skillsDest);
            ok(`${skillCount} skill files installed`);
        }
    }

    // 6. Copy orchestrator
    if (platform === 'antigravity') {
        const orchSrc = path.join(AWK_ROOT, 'core', 'orchestrator.md');
        const orchDestDir = path.join(target, plat.dirs.skills, 'orchestrator');
        if (!fs.existsSync(orchDestDir)) fs.mkdirSync(orchDestDir, { recursive: true });
        fs.copyFileSync(orchSrc, path.join(orchDestDir, 'SKILL.md'));
        ok('Orchestrator skill installed');
    }

    // 7. Copy schemas (always overwrite)
    if (plat.dirs.schemas) {
        info('Installing schemas...');
        const schemaSrc = path.join(AWK_ROOT, 'schemas');
        const schemaDest = path.join(target, plat.dirs.schemas);
        const schemaCount = copyDirRecursive(schemaSrc, schemaDest);
        ok(`${schemaCount} schemas installed`);
    }

    // 8. Copy templates (don't overwrite existing)
    if (plat.dirs.templates) {
        info('Installing templates...');
        const tmplSrc = path.join(AWK_ROOT, 'templates');
        const tmplDest = path.join(target, plat.dirs.templates);
        const tmplCount = copyDirRecursive(tmplSrc, tmplDest, { overwrite: false });
        ok(`${tmplCount} templates installed`);
    }

    // 9. Save version
    fs.writeFileSync(plat.versionFile, AWK_VERSION);
    ok(`Version ${AWK_VERSION} saved`);

    // 10. Install default skill packs
    const defaultPacks = installDefaultPacks();

    // 11. Summary
    log('');
    log(`${C.gray}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${C.reset}`);
    log(`${C.yellow}${C.bold}🎉 AWK v${AWK_VERSION} installed for ${plat.name}!${C.reset}`);
    log('');
    dim(`Platform:   ${plat.name}`);
    if (plat.dirs.workflows) dim(`Workflows:  ${path.join(target, plat.dirs.workflows)}`);
    if (plat.dirs.skills) dim(`Skills:     ${path.join(target, plat.dirs.skills)}`);
    if (plat.dirs.schemas) dim(`Schemas:    ${path.join(target, plat.dirs.schemas)}`);
    if (plat.dirs.templates) dim(`Templates:  ${path.join(target, plat.dirs.templates)}`);
    if (plat.dirs.agents) dim(`Agents:     ${path.join(target, plat.dirs.agents)}`);

    if (plat.rulesFile) {
        dim(`Global Rules: ${plat.rulesFile}`);
    }
    if (defaultPacks.length > 0) {
        dim(`Packs:      ${defaultPacks.join(', ')} (auto-enabled)`);
    }
    if (platform === 'antigravity') {
        dim(`Symphony:   task tracking ready`);
    }
    log('');

    if (platform === 'antigravity') {
        log(`${C.cyan}👉 Run 'awkit init' in any project to initialize it.${C.reset}`);
    } else if (platform === 'codex') {
        log(`${C.cyan}👉 Type '$skill' in Codex to invoke skills.${C.reset}`);
    }
    log(`${C.cyan}👉 Run 'awkit doctor' to verify installation.${C.reset}`);
    log('');
}

/**
 * Scan skill-packs/ for packs with "auto_install": true in pack.json
 * and enable each of them (copy files + handle requirements).
 * Returns array of enabled pack names.
 */
function installDefaultPacks() {
    const packsDir = path.join(AWK_ROOT, 'skill-packs');
    if (!fs.existsSync(packsDir)) return [];

    const enabled = [];

    const packs = fs.readdirSync(packsDir, { withFileTypes: true })
        .filter(d => d.isDirectory());

    const defaultPacks = packs.filter(d => {
        const cfgPath = path.join(packsDir, d.name, 'pack.json');
        if (!fs.existsSync(cfgPath)) return false;
        try {
            const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
            return cfg.auto_install === true;
        } catch (_) {
            return false;
        }
    });

    if (defaultPacks.length === 0) return [];

    log('');
    log(`${C.cyan}${C.bold}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${C.reset}`);
    log(`${C.cyan}${C.bold}📦 Installing default skill packs...${C.reset}`);
    log('');

    for (const pack of defaultPacks) {
        log(`${C.yellow}▶ ${pack.name}${C.reset}`);
        cmdEnablePack(pack.name, { autoMode: true });
        enabled.push(pack.name);
        log('');
    }

    return enabled;
}

function cmdUninstall() {
    warn('Uninstalling AWK...');

    // Remove version file
    if (fs.existsSync(TARGETS.versionFile)) {
        fs.unlinkSync(TARGETS.versionFile);
        ok('Version file removed');
    }

    // Don't remove workflows/skills — user may have custom ones
    warn('Workflow and skill files were NOT removed (may contain custom content).');
    warn('To fully remove, manually delete:');
    dim(TARGETS.antigravity);

    ok('AWK uninstalled. Custom files preserved.');
}

function cmdUpdate() {
    info('Checking for updates on npm registry...');

    // 1. Fetch latest version from npm
    let npmLatest = null;
    try {
        npmLatest = execSync(
            'npm view @leejungkiin/awkit version',
            { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 5000 }
        ).trim();
    } catch (_) {
        warn('Could not reach npm registry (offline?). Falling back to local check.');
    }

    // 2. Read currently installed version
    let installedVersion = '0.0.0';
    if (fs.existsSync(TARGETS.versionFile)) {
        installedVersion = fs.readFileSync(TARGETS.versionFile, 'utf8').trim();
    }

    const targetVersion = npmLatest || AWK_VERSION;

    log('');
    log(`${C.gray}   npm latest:  v${npmLatest || '(unknown)'}${C.reset}`);
    log(`${C.gray}   installed:   v${installedVersion}${C.reset}`);
    log(`${C.gray}   local repo:  v${AWK_VERSION}${C.reset}`);
    log('');

    // 3. Already up-to-date?
    if (npmLatest && npmLatest === installedVersion) {
        ok(`Already on the latest version (v${installedVersion}) 🎉`);
        return;
    }

    // 4. New version available on npm → install from registry
    if (npmLatest && npmLatest !== installedVersion) {
        info(`Upgrading: v${installedVersion} → v${npmLatest}`);
        info('Running: npm install -g @leejungkiin/awkit');
        try {
            execSync('npm install -g @leejungkiin/awkit', { stdio: 'inherit' });
        } catch (e) {
            err(`npm install failed: ${e.message}`);
            dim('Try manually: npm install -g @leejungkiin/awkit');
            return;
        }
        log('');
        info('Applying new workflows, skills & schemas...');
        cmdInstall();
        return;
    }

    // 5. Offline fallback: compare AWK_VERSION (local repo) vs installed
    if (installedVersion === AWK_VERSION) {
        ok(`Already on latest version (v${AWK_VERSION}) — could not verify with npm`);
    } else {
        info(`Upgrading from v${installedVersion} → v${AWK_VERSION} (local only, npm unreachable)`);
        cmdInstall();
    }
}

function cmdDoctor() {
    log('');
    log(`${C.cyan}${C.bold}🏥 AWK Health Check${C.reset}`);
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
        const essentialSkills = ['orchestrator', 'symphony-orchestrator', 'awf-session-restore'];
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
        ok(`AWK version: ${v}`);
        if (v !== AWK_VERSION) {
            warn(`Package version (${AWK_VERSION}) differs from installed (${v}). Run 'awkit update'.`);
        }
    } else {
        warn('Version file missing. Run "awkit install" first.'); issues++;
    }

    // Summary
    log('');
    if (issues === 0) {
        log(`${C.green}${C.bold}✅ All checks passed! AWK is healthy.${C.reset}`);
    } else {
        log(`${C.yellow}${C.bold}⚠️  ${issues} issue(s) found. Run 'awkit install' to fix.${C.reset}`);
    }
    log('');
}

/**
 * Find a compatible Python interpreter meeting the minimum version requirement.
 * Tries python3.13, python3.12, python3.11, python3, python in order.
 * Returns { cmd, version } or null if none found.
 */
function findCompatiblePython(minVersion) {
    if (!minVersion) {
        // No version constraint — just return first python found
        for (const cmd of ['python3', 'python']) {
            try {
                execSync(`${cmd} --version`, { stdio: 'ignore' });
                return { cmd, version: 'any' };
            } catch (_) { }
        }
        return null;
    }

    const [minMajor, minMinor] = minVersion.split('.').map(Number);
    // Prefer newest first
    const candidates = ['python3.13', 'python3.12', 'python3.11', 'python3', 'python'];

    for (const cmd of candidates) {
        try {
            const out = execSync(`${cmd} --version 2>&1`, { stdio: ['ignore', 'pipe', 'pipe'] })
                .toString().trim();
            const match = out.match(/(\d+)\.(\d+)/);
            if (!match) continue;
            const major = parseInt(match[1]);
            const minor = parseInt(match[2]);
            if (major > minMajor || (major === minMajor && minor >= minMinor)) {
                return { cmd, version: `${major}.${minor}` };
            }
        } catch (_) { /* not installed */ }
    }
    return null;
}

/**
 * Auto-update mcp_config.json with absolute path to the MCP server command.
 * Resolves `<serverName>-mcp` via `which`, patches the matching mcpServer entry.
 */
function autoUpdateMcpConfig(serverName) {
    const mcpConfigPath = path.join(TARGETS.antigravity, 'mcp_config.json');
    if (!fs.existsSync(mcpConfigPath)) return;

    // Resolve command path (e.g. neural-memory-mcp → nmem-mcp)
    const candidates = [`${serverName}-mcp`, serverName, 'nmem-mcp'];
    let absPath = '';
    for (const c of candidates) {
        try { absPath = execSync(`which ${c}`, { encoding: 'utf8' }).trim(); break; } catch (_) { }
    }
    if (!absPath) {
        dim(`Could not resolve MCP command for '${serverName}' — skipping config update.`);
        return;
    }

    try {
        const cfg = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf8'));
        if (!cfg.mcpServers) cfg.mcpServers = {};
        if (!cfg.mcpServers[serverName]) cfg.mcpServers[serverName] = {};
        cfg.mcpServers[serverName].command = absPath;
        delete cfg.mcpServers[serverName].disabled; // enable it
        fs.writeFileSync(mcpConfigPath, JSON.stringify(cfg, null, 2) + '\n');
        ok(`MCP config updated: "${serverName}" → ${absPath}`);
    } catch (e) {
        warn(`Could not update mcp_config.json: ${e.message}`);
    }
}

/**
 * Handle pack requirements defined in pack.json:
 * - Check pip packages (with Python version detection)
 * - Prompt to install if missing (or auto-install in autoMode)
 * - Run post_install steps
 * - Show MCP setup instructions
 */
function handlePackRequirements(packSrc, packName, { autoMode = false } = {}) {
    const packConfigPath = path.join(packSrc, 'pack.json');
    if (!fs.existsSync(packConfigPath)) return; // No requirements defined

    let config;
    try {
        config = JSON.parse(fs.readFileSync(packConfigPath, 'utf8'));
    } catch (e) {
        warn(`Could not parse pack.json: ${e.message}`);
        return;
    }

    // ── 1. Check pip/npm dependencies ─────────────────────────────────────
    const requires = config.requires || [];
    if (requires.length > 0) {
        log('');
        log(`${C.cyan}${C.bold}📦 Dependencies${C.reset}`);
    }

    for (const req of requires) {
        const label = `${req.type === 'pip' ? '🐍 pip' : '📦 npm'}: ${req.package}`;

        // Check if already installed
        let installed = false;
        try {
            execSync(req.check_cmd, { stdio: 'ignore' });
            installed = true;
        } catch (_) {
            installed = false;
        }

        if (installed) {
            ok(`${req.package} already installed`);
            continue;
        }

        warn(`${req.package} not found — required for this pack to work`);
        if (req.description) dim(req.description);
        log('');

        // Build actual install command — detect correct Python if needed
        let installCmd = req.install_cmd;
        if (req.type === 'pip') {
            const pyInfo = findCompatiblePython(req.python_min || null);
            if (pyInfo) {
                installCmd = `${pyInfo.cmd} -m pip install ${req.package}`;
                dim(`Using: ${pyInfo.cmd} (Python ${pyInfo.version})`);
            } else if (req.python_min) {
                err(`Requires Python >= ${req.python_min}, but none found on this system.`);
                log('');
                log(`${C.yellow}   Fix options:${C.reset}`);
                log(`${C.gray}   1. brew install python@${req.python_min}${C.reset}`);
                log(`${C.gray}   2. pyenv install ${req.python_min} && pyenv global ${req.python_min}${C.reset}`);
                log(`${C.gray}   3. Download from https://www.python.org/downloads/${C.reset}`);
                log('');
                log(`${C.gray}   Then re-run: awkit enable-pack ${packName}${C.reset}`);
                continue;
            }
        }

        const doInstall = autoMode ? true : promptYN(`   Install now? (${installCmd})`);
        if (autoMode) info(`Auto-installing: ${installCmd}`);
        if (doInstall) {
            log('');

            // runPipCmd: streams output to terminal + captures stderr for PEP 668 detection
            const runPipCmd = (cmd) => {
                const parts = cmd.split(' ');
                const result = spawnSync(parts[0], parts.slice(1), {
                    encoding: 'utf8',
                    stdio: ['inherit', 'pipe', 'pipe'],
                });
                if (result.stdout) process.stdout.write(result.stdout);
                if (result.stderr) process.stderr.write(result.stderr);
                return { success: result.status === 0, stderr: result.stderr || '' };
            };

            info(`Running: ${installCmd}`);
            const r1 = runPipCmd(installCmd);

            if (r1.success) {
                ok(`${req.package} installed successfully`);
            } else {
                const isPep668 = r1.stderr.includes('externally-managed-environment')
                    || r1.stderr.includes('break-system-packages');

                if (isPep668) {
                    // Step 2: retry with --user
                    warn('System Python is externally managed (PEP 668). Retrying with --user...');
                    log('');
                    const userCmd = `${installCmd} --user`;
                    info(`Running: ${userCmd}`);
                    const r2 = runPipCmd(userCmd);

                    if (r2.success) {
                        ok(`${req.package} installed to user directory`);
                        const pyVer = installCmd.match(/python(\d+\.\d+)/)?.[1] || '';
                        if (pyVer) {
                            log('');
                            log(`${C.yellow}   ⚠️  PATH hint:${C.reset}`);
                            log(`${C.gray}   The 'nmem' command lives in your user bin dir.${C.reset}`);
                            log(`${C.gray}   Add to ~/.zshrc:${C.reset}`);
                            log(`${C.gray}   export PATH="$PATH:$HOME/Library/Python/${pyVer}/bin"${C.reset}`);
                            log(`${C.gray}   Then: source ~/.zshrc && nmem init${C.reset}`);
                        }
                    } else {
                        // Step 3: try pipx (best for Homebrew Python environments)
                        let pipxAvailable = false;
                        try { execSync('which pipx', { stdio: 'ignore' }); pipxAvailable = true; } catch (_) { }

                        // autoMode: if pipx not found, try to install it via brew
                        if (!pipxAvailable && autoMode) {
                            let brewAvailable = false;
                            try { execSync('which brew', { stdio: 'ignore' }); brewAvailable = true; } catch (_) { }
                            if (brewAvailable) {
                                info('pipx not found. Auto-installing via brew...');
                                const rb = runPipCmd('brew install pipx');
                                if (rb.success) {
                                    try { execSync('which pipx', { stdio: 'ignore' }); pipxAvailable = true; } catch (_) { }
                                }
                            }
                        }

                        if (pipxAvailable) {
                            warn('Trying pipx (recommended for Homebrew Python)...');
                            const pipxCmd = `pipx install ${req.package}`;
                            log('');
                            info(`Running: ${pipxCmd}`);
                            const r3 = runPipCmd(pipxCmd);
                            if (r3.success) {
                                ok(`${req.package} installed via pipx ✨`);
                                dim(`Commands like 'nmem' are now globally available via pipx.`);
                                // Auto-update mcp_config.json with absolute path
                                if (autoMode && config.mcp_setup?.server_name) {
                                    autoUpdateMcpConfig(config.mcp_setup.server_name);
                                }
                            } else {
                                err(`pipx install also failed.`);
                                log('');
                                log(`${C.yellow}   Manual options:${C.reset}`);
                                log(`${C.gray}   1. ${installCmd} --break-system-packages${C.reset}`);
                                log(`${C.gray}   2. python3 -m venv ~/.venv && source ~/.venv/bin/activate${C.reset}`);
                                log(`${C.gray}      pip install ${req.package}${C.reset}`);
                            }
                        } else {
                            // pipx not available — show all options
                            err(`Installation failed even with --user.`);
                            log('');
                            log(`${C.yellow}   Options (pick one):${C.reset}`);
                            log(`${C.gray}   1. brew install pipx && pipx install ${req.package}  ← recommended${C.reset}`);
                            log(`${C.gray}   2. ${installCmd} --break-system-packages${C.reset}`);
                            log(`${C.gray}   3. python3 -m venv ~/.venv && source ~/.venv/bin/activate${C.reset}`);
                            log(`${C.gray}      pip install ${req.package}${C.reset}`);
                        }
                    }
                } else {
                    err(`Installation failed. Try manually: ${installCmd}`);
                }
            }
        } else {
            warn(`Skipped. Run manually: ${installCmd}`);
        }
    }

    // ── 2. Post-install steps ──────────────────────────────────────────────
    const postInstall = config.post_install || [];
    for (const step of postInstall) {
        // Skip if artifact already exists
        if (step.skip_if_exists) {
            const expandedPath = step.skip_if_exists.replace('~', process.env.HOME || '');
            if (fs.existsSync(expandedPath)) {
                dim(`Already exists, skipping: ${step.cmd}`);
                continue;
            }
        }

        log('');
        info(`Post-install: ${step.description || step.cmd}`);

        // Check if the command is actually available before running
        const cmdName = step.cmd.split(' ')[0];
        let cmdAvailable = false;
        try {
            execSync(`which ${cmdName}`, { stdio: 'ignore' });
            cmdAvailable = true;
        } catch (_) { cmdAvailable = false; }

        if (!cmdAvailable) {
            warn(`Skipped: '${cmdName}' not found. Complete the install above first.`);
            dim(`Then run: ${step.cmd}`);
            continue;
        }

        if (step.optional && !autoMode) {
            const doRun = promptYN(`   Run now? (${step.cmd})`);
            if (!doRun) {
                dim(`Skipped. Run manually: ${step.cmd}`);
                continue;
            }
        } else if (step.optional && autoMode) {
            info(`Auto-running post-install: ${step.cmd}`);
        }

        try {
            execSync(step.cmd, { stdio: 'inherit' });
            ok(`Done: ${step.cmd}`);
        } catch (e) {
            warn(`Step failed: ${e.message}`);
            dim(`Try manually: ${step.cmd}`);
        }
    }

    // ── 3. MCP Setup Instructions ──────────────────────────────────────────
    const mcp = config.mcp_setup;
    if (mcp) {
        log('');
        log(`${C.cyan}${C.bold}🔌 MCP Server Setup${C.reset}`);
        log(`${C.gray}   ${mcp.description}${C.reset}`);
        log('');

        if (mcp.config_json) {
            log(`${C.gray}   Add to your editor's MCP config:${C.reset}`);
            log(`${C.gray}   {${C.reset}`);
            log(`${C.gray}     "mcpServers": {${C.reset}`);
            log(`${C.gray}       "${mcp.server_name}": ${JSON.stringify(mcp.config_json)}${C.reset}`);
            log(`${C.gray}     }${C.reset}`);
            log(`${C.gray}   }${C.reset}`);
            log('');
        }

        if (mcp.editors) {
            log(`${C.cyan}   Editor-specific setup:${C.reset}`);
            for (const [editor, instruction] of Object.entries(mcp.editors)) {
                log(`${C.gray}   • ${editor}:${C.reset}`);
                log(`${C.gray}     ${instruction}${C.reset}`);
            }
        }
    }
}

function cmdEnablePack(packName, { autoMode = false } = {}) {
    if (!packName) {
        err('Usage: awkit enable-pack <pack-name>');
        log('');
        cmdListPacks();
        return;
    }

    const packSrc = path.join(AWK_ROOT, 'skill-packs', packName);

    if (!fs.existsSync(packSrc)) {
        err(`Skill pack "${packName}" not found.`);
        cmdListPacks();
        return;
    }

    info(`Enabling skill pack: ${packName}`);
    let totalCount = 0;

    // 1. Copy skills/ subdirs → ~/.gemini/antigravity/skills/
    const packSkillsDir = path.join(packSrc, 'skills');
    if (fs.existsSync(packSkillsDir)) {
        const skillDirs = fs.readdirSync(packSkillsDir, { withFileTypes: true }).filter(d => d.isDirectory());
        for (const skillDir of skillDirs) {
            const src = path.join(packSkillsDir, skillDir.name);
            const dest = path.join(TARGETS.antigravity, 'skills', skillDir.name);
            const n = copyDirRecursive(src, dest);
            totalCount += n;
            dim(`Skill: ${skillDir.name} (${n} files)`);
        }
    }

    // 2. Copy workflows/ → ~/.gemini/antigravity/global_workflows/
    const packWfDir = path.join(packSrc, 'workflows');
    if (fs.existsSync(packWfDir)) {
        const wfDest = path.join(TARGETS.antigravity, 'global_workflows');
        const n = copyDirRecursive(packWfDir, wfDest, { flatten: false });
        totalCount += n;
        dim(`Workflows: ${n} files`);
    }

    // 3. Copy schemas/ → ~/.gemini/antigravity/schemas/
    const packSchemaDir = path.join(packSrc, 'schemas');
    if (fs.existsSync(packSchemaDir)) {
        const schemaDest = path.join(TARGETS.antigravity, 'schemas');
        const n = copyDirRecursive(packSchemaDir, schemaDest);
        totalCount += n;
        dim(`Schemas: ${n} files`);
    }

    ok(`${totalCount} files from "${packName}" pack installed`);

    // Handle pack.json requirements (pip deps, post-install, MCP setup)
    handlePackRequirements(packSrc, packName, { autoMode });

    log('');
    log(`${C.cyan}👉 Skills available: type skill name in your AI chat.${C.reset}`);
    log(`${C.cyan}👉 Workflows available: use /nm-recall, /memory-audit, etc.${C.reset}`);
    log(`${C.cyan}👉 Run 'awkit doctor' to verify installation.${C.reset}`);
}

function cmdDisablePack(packName) {
    if (!packName) {
        err('Usage: awkit disable-pack <pack-name>');
        return;
    }

    const packSrc = path.join(AWK_ROOT, 'skill-packs', packName);

    if (!fs.existsSync(packSrc)) {
        err(`Skill pack "${packName}" not found.`);
        return;
    }

    // Get list of skill dirs from pack/skills/
    const packSkillsDir = path.join(packSrc, 'skills');
    const skillDirs = fs.existsSync(packSkillsDir)
        ? fs.readdirSync(packSkillsDir, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name)
        : [];

    const target = path.join(TARGETS.antigravity, 'skills');
    const backupDir = path.join(TARGETS.antigravity, 'backup', 'skills');
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

    for (const skillDir of skillDirs) {
        const destPath = path.join(target, skillDir);
        if (fs.existsSync(destPath)) {
            fs.renameSync(destPath, path.join(backupDir, skillDir));
            dim(`Moved to backup: ${skillDir}`);
        }
    }

    ok(`Skill pack "${packName}" disabled (skills backed up to ${backupDir})`);
}

function cmdListPacks() {
    const packsDir = path.join(AWK_ROOT, 'skill-packs');

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
    log(`${C.cyan}Usage: awkit enable-pack <name>${C.reset}`);
    log('');
}

function cmdVersion() {
    log(`AWK v${AWK_VERSION}`);
}

function cmdLint() {
    log('');
    log(`${C.cyan}${C.bold}🔍 AWK Lint — Skill & Workflow Guards${C.reset}`);
    log('');

    const targetDirs = [
        path.join(TARGETS.antigravity, 'global_workflows'),
        path.join(TARGETS.antigravity, 'skills')
    ];

    let fileCount = 0;
    let issues = 0;
    const MAX_LINES = 500;

    function checkFile(filePath) {
        if (!filePath.endsWith('.md')) return;
        fileCount++;
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');

        const localIssues = [];

        // 1. Check max lines
        if (lines.length > MAX_LINES) {
            localIssues.push(`File too large: ${lines.length} lines (max ${MAX_LINES})`);
        }

        // 2. Check frontmatter / description length
        const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
        if (frontmatterMatch) {
            const frontmatter = frontmatterMatch[1];
            const descMatch = frontmatter.match(/description:\s*(.*)/);
            if (descMatch) {
                const desc = descMatch[1].trim();
                // We're lax on description length: warn only if overly verbose
                if (desc.length > 200) {
                    localIssues.push(`Description too long: ${desc.length} chars (max 200)`);
                }
            } else {
                // If it has frontmatter but no description, warn them
                localIssues.push('Missing description field in frontmatter');
            }
        }

        // 3. Report if there are local issues
        if (localIssues.length > 0) {
            issues += localIssues.length;
            const relPath = filePath.replace(TARGETS.antigravity + '/', '');
            log(`${C.red}✖ ${relPath}${C.reset}`);
            for (const issue of localIssues) {
                log(`  ${C.yellow}↳ ${issue}${C.reset}`);
            }
        }
    }

    function scanDir(dir) {
        if (!fs.existsSync(dir)) return;
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                scanDir(fullPath);
            } else {
                checkFile(fullPath);
            }
        }
    }

    for (const dir of targetDirs) {
        scanDir(dir);
    }

    log('');
    if (issues === 0) {
        log(`${C.green}✅ All ${fileCount} files passed linting.${C.reset}`);
    } else {
        log(`${C.red}✖ Found ${issues} issue(s) across ${fileCount} files.${C.reset}`);
        process.exitCode = 1;
    }
}

// ─── Status: Diff repo vs installed ──────────────────────────────────────────

/**
 * Collect all .md files under a directory (recursively, flat list of basenames)
 */
function collectFiles(dir, ext = '.md') {
    const result = new Set();
    if (!fs.existsSync(dir)) return result;
    function walk(current) {
        for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
            if (entry.name === '.DS_Store') continue;
            if (entry.isDirectory()) { walk(path.join(current, entry.name)); }
            else if (entry.name.endsWith(ext) || ext === '*') { result.add(entry.name); }
        }
    }
    walk(dir);
    return result;
}

function cmdStatus() {
    log('');
    log(`${C.cyan}${C.bold}📊 AWK Status — Repo vs Installed${C.reset}`);
    log('');

    const repoWfDir = path.join(AWK_ROOT, 'workflows');
    const liveWfDir = path.join(TARGETS.antigravity, 'global_workflows');
    const repoSkillDir = path.join(AWK_ROOT, 'skills');
    const liveSkillDir = path.join(TARGETS.antigravity, 'skills');

    // ── Workflows ──────────────────────────────────────────────────────────
    log(`${C.bold}Workflows:${C.reset}`);
    const repoWf = collectFiles(repoWfDir);
    const liveWf = collectFiles(liveWfDir);

    const onlyInRepo = [...repoWf].filter(f => !liveWf.has(f));
    const onlyInLive = [...liveWf].filter(f => !repoWf.has(f));
    const inBoth = [...repoWf].filter(f => liveWf.has(f));

    log(`  ${C.green}✅ In sync:${C.reset}        ${inBoth.length} workflows`);
    if (onlyInRepo.length > 0) {
        log(`  ${C.yellow}⬆  Repo only:${C.reset}      ${onlyInRepo.length} → run 'awkit install' to deploy`);
        onlyInRepo.forEach(f => log(`${C.gray}     + ${f}${C.reset}`));
    }
    if (onlyInLive.length > 0) {
        log(`  ${C.cyan}⬇  Live only:${C.reset}      ${onlyInLive.length} → run 'awkit harvest' to pull`);
        onlyInLive.forEach(f => log(`${C.gray}     - ${f}${C.reset}`));
    }
    if (onlyInRepo.length === 0 && onlyInLive.length === 0) {
        log(`  ${C.green}Perfect sync! ✨${C.reset}`);
    }

    log('');

    // ── Skills ─────────────────────────────────────────────────────────────
    log(`${C.bold}Skills:${C.reset}`);
    const repoSkills = fs.existsSync(repoSkillDir)
        ? new Set(fs.readdirSync(repoSkillDir, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name))
        : new Set();
    const liveSkills = fs.existsSync(liveSkillDir)
        ? new Set(fs.readdirSync(liveSkillDir, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name))
        : new Set();

    const skillsOnlyRepo = [...repoSkills].filter(s => !liveSkills.has(s));
    const skillsOnlyLive = [...liveSkills].filter(s => !repoSkills.has(s));
    const skillsInBoth = [...repoSkills].filter(s => liveSkills.has(s));

    log(`  ${C.green}✅ In sync:${C.reset}        ${skillsInBoth.length} skills`);
    if (skillsOnlyRepo.length > 0) {
        log(`  ${C.yellow}⬆  Repo only:${C.reset}      ${skillsOnlyRepo.length} → run 'awkit install'`);
        skillsOnlyRepo.forEach(s => log(`${C.gray}     + ${s}${C.reset}`));
    }
    if (skillsOnlyLive.length > 0) {
        log(`  ${C.cyan}⬇  Live only:${C.reset}      ${skillsOnlyLive.length} → run 'awkit harvest'`);
        skillsOnlyLive.forEach(s => log(`${C.gray}     - ${s}${C.reset}`));
    }
    if (skillsOnlyRepo.length === 0 && skillsOnlyLive.length === 0) {
        log(`  ${C.green}Perfect sync! ✨${C.reset}`);
    }

    log('');

    // ── Versions ───────────────────────────────────────────────────────────
    log(`${C.bold}Versions:${C.reset}`);
    const installedVer = fs.existsSync(TARGETS.versionFile)
        ? fs.readFileSync(TARGETS.versionFile, 'utf8').trim()
        : '(not installed)';
    log(`  Repo:      ${C.cyan}${AWK_VERSION}${C.reset}`);
    log(`  Installed: ${installedVer === AWK_VERSION ? C.green : C.yellow}${installedVer}${C.reset}`);
    if (installedVer !== AWK_VERSION) {
        log(`  ${C.yellow}⚠️  Run 'awkit install' to sync versions.${C.reset}`);
    }

    log('');
    log(`${C.gray}Tip: 'awkit sync' = harvest (pull live→repo) + install (push repo→live)${C.reset}`);
    log('');
}

// ─── Harvest: Pull from live ~/.gemini/ into repo ─────────────────────────────

function cmdHarvest(dryRun = false) {
    const { execSync: exec } = require('child_process');
    const harvestScript = path.join(AWK_ROOT, 'scripts', 'harvest.js');
    if (!fs.existsSync(harvestScript)) {
        err(`harvest.js not found at: ${harvestScript}`);
        return;
    }
    const args = dryRun ? '--dry-run' : '';
    try {
        exec(`node "${harvestScript}" ${args}`, { stdio: 'inherit' });
    } catch (e) {
        err(`Harvest failed: ${e.message}`);
    }
}

// ─── Sync: Harvest + Install ──────────────────────────────────────────────────

function cmdSync() {
    log('');
    log(`${C.cyan}${C.bold}🔄 AWK Sync — Harvest → Install${C.reset}`);
    log('');
    log(`${C.gray}Step 1/2: Harvesting from ~/.gemini/antigravity/ → repo...${C.reset}`);
    log('');
    cmdHarvest(false);
    log('');
    log(`${C.gray}Step 2/2: Installing from repo → ~/.gemini/antigravity/...${C.reset}`);
    log('');
    cmdInstall();
    log('');
    log(`${C.yellow}${C.bold}🔄 Full sync complete!${C.reset}`);
    log(`${C.gray}Tip: Commit the repo changes to save this snapshot in git.${C.reset}`);
    log('');
}

function cmdAdmin() {
    info('Mở Symphony Dashboard...');
    try {
        execSync('symphony dashboard', { stdio: 'inherit' });
    } catch (e) {
        err('Không thể khởi động Symphony Dashboard.');
        dim('Vui lòng cài đặt: npm install -g @leejungkiin/awkit-symphony');
    }
}

function cmdHelp() {
    const line = `${C.gray}${'─'.repeat(56)}${C.reset}`;
    log('');
    log(`${C.cyan}${C.bold}╔═══════════════════════════════════════════════════════╗${C.reset}`);
    log(`${C.cyan}${C.bold}║    🚀 AWK v${AWK_VERSION} — Antigravity Workflow Kit       ║${C.reset}`);
    log(`${C.cyan}${C.bold}╚═══════════════════════════════════════════════════════╝${C.reset}`);
    log('');

    // Install
    log(`${C.bold}⚙️  Setup${C.reset}`);
    log(line);
    log(`  ${C.green}install${C.reset}             Deploy AWK into ~/.gemini/antigravity/`);
    log(`  ${C.green}uninstall${C.reset}           Remove AWK (preserves custom files)`);
    log(`  ${C.green}update${C.reset}              Pull latest + reinstall`);
    log(`  ${C.green}lint${C.reset}                Run skill & workflow guards (check length, frontmatter)`);
    log(`  ${C.green}doctor${C.reset}              Check installation health`);
    log('');

    // Project Init
    log(`${C.bold}✨  Project${C.reset}`);
    log(line);
    log(`  ${C.green}init${C.reset}                Init mobile project (Firebase) in CWD`);
    log(`  ${C.gray}  --force${C.reset}            Overwrite existing files`);
    log(`  ${C.gray}  Generates: .project-identity, <Name>.code-workspace,${C.reset}`);
    log(`  ${C.gray}             CODEBASE.md, .symphony/ (Symphony task DB)${C.reset}`);
    log('');

    // Sync
    log(`${C.bold}🔄  Sync${C.reset}`);
    log(line);
    log(`  ${C.green}status${C.reset}              Compare repo vs installed (diff view)`);
    log(`  ${C.green}harvest${C.reset}             Pull live edits from ~/.gemini/ → repo`);
    log(`  ${C.green}sync${C.reset}                Full sync: harvest + install (one shot)`);
    log('');

    // Symphony
    log(`${C.bold}🎶  Symphony${C.reset}`);
    log(line);
    log(`  ${C.green}admin${C.reset}               Khởi động Symphony Dashboard`);
    log('');

    // Packs
    log(`${C.bold}📦  Skill Packs${C.reset}`);
    log(line);
    log(`  ${C.green}list-packs${C.reset}          List available skill packs`);
    log(`  ${C.green}enable-pack${C.reset} <name>  Install a skill pack`);
    log(`  ${C.green}disable-pack${C.reset} <name> Uninstall a skill pack (backed up)`);
    log('');

    // Trello
    log(`${C.bold}📋  Trello${C.reset}`);
    log(line);
    log(`  ${C.green}trello desc${C.reset} <text>       Update card description`);
    log(`  ${C.green}trello comment${C.reset} <text>    Add milestone comment`);
    log(`  ${C.green}trello item${C.reset} <name>       Add checklist item`);
    log(`  ${C.green}trello complete${C.reset} <name>   Mark checklist item ✅`);
    log(`  ${C.green}trello block${C.reset} <reason>    Label card Blocked + comment`);
    log(`  ${C.green}trello checklist${C.reset} <name>  Create new checklist`);
    log(`  ${C.gray}  Auto-loads .trello-config.json + global credentials${C.reset}`);
    log('');

    // Telegram
    log(`${C.bold}📨  Telegram${C.reset}`);
    log(line);
    log(`  ${C.green}tg setup${C.reset}            Setup Bot Token, Chat ID & Topic`);
    log(`  ${C.green}tg send${C.reset} <message>   Send message to default group/topic`);
    log(`  ${C.gray}  --chat <id>${C.reset}        Send to specific chat`);
    log(`  ${C.gray}  --topic <id>${C.reset}       Send to specific forum topic`);
    log(`  ${C.gray}  --parse-mode <md|html>${C.reset}  Formatting mode`);
    log('');

    // Available packs
    const packsDir = path.join(AWK_ROOT, 'skill-packs');
    if (fs.existsSync(packsDir)) {
        const packs = fs.readdirSync(packsDir, { withFileTypes: true }).filter(d => d.isDirectory());
        if (packs.length) {
            log(`  Available packs:`);
            for (const p of packs) {
                const readmePath = path.join(packsDir, p.name, 'README.md');
                let tagline = '';
                if (fs.existsSync(readmePath)) {
                    const content = fs.readFileSync(readmePath, 'utf8');
                    const match = content.match(/^>\s*(.+)/m);
                    if (match) tagline = `— ${match[1].trim().substring(0, 42)}`;
                }
                log(`  ${C.gray}  • ${p.name} ${tagline}${C.reset}`);
            }
        }
    }
    log('');

    // Info
    log(`${C.bold}ℹ️   Info${C.reset}`);
    log(line);
    log(`  ${C.green}version${C.reset}             Show current version`);
    log(`  ${C.green}help${C.reset}                Show this help`);
    log('');

    // Typical workflow
    log(`${C.bold}💡  Typical Workflow${C.reset}`);
    log(line);
    log(`  ${C.cyan}# First time setup${C.reset}`);
    log(`  ${C.gray}npm install -g @leejungkiin/awkit${C.reset}`);
    log(`  ${C.gray}awkit install${C.reset}`);
    log(`  ${C.gray}awkit doctor${C.reset}`);
    log('');
    log(`  ${C.cyan}# Daily usage${C.reset}`);
    log(`  ${C.gray}awkit status       # What's out of sync?${C.reset}`);
    log(`  ${C.gray}awkit harvest      # Pull live edits → repo${C.reset}`);
    log(`  ${C.gray}awkit sync         # harvest + install in one shot${C.reset}`);
    log('');
    log(`  ${C.cyan}# Enable NeuralMemory${C.reset}`);
    log(`  ${C.gray}awkit enable-pack neural-memory${C.reset}`);
    log('');
    log(`  ${C.cyan}# Repo${C.reset}`);
    log(`  ${C.gray}https://github.com/babyskill/awk${C.reset}`);
    log('');
}

// ─── Init: Mobile Project Initializer ───────────────────────────────────────

/**
 * Detect project type from CWD by inspecting known file signatures.
 * Returns: 'ios' | 'android' | 'expo' | 'flutter' | 'mobile-firebase'
 */
function detectProjectType(cwd) {
    const entries = fs.readdirSync(cwd);

    // iOS: .xcworkspace or .xcodeproj folder
    if (entries.some(e => e.endsWith('.xcworkspace') || e.endsWith('.xcodeproj'))) {
        return 'ios';
    }
    // Android: build.gradle or settings.gradle
    if (entries.includes('build.gradle') || entries.includes('settings.gradle') || entries.includes('build.gradle.kts')) {
        return 'android';
    }
    // Expo: app.json with expo key, or expo.json, or app.config.ts
    if (entries.includes('app.json') || entries.includes('expo.json') || entries.includes('app.config.ts') || entries.includes('app.config.js')) {
        try {
            if (entries.includes('app.json')) {
                const appJson = JSON.parse(fs.readFileSync(path.join(cwd, 'app.json'), 'utf8'));
                if (appJson.expo) return 'expo';
            }
        } catch (_) { /* continue */ }
        return 'expo';
    }
    // Flutter: pubspec.yaml
    if (entries.includes('pubspec.yaml')) {
        return 'flutter';
    }
    // Default: generic mobile-firebase
    return 'mobile-firebase';
}

/**
 * Build .project-identity object from detected type + project name.
 */
function buildProjectIdentity(projectName, projectType, cwd, date) {
    const bundleBase = projectName.toLowerCase().replace(/[^a-z0-9]/g, '');

    const identityMap = {
        ios: {
            projectType: 'ios',
            bundleIdentifier: `com.company.${bundleBase}`,
            techStack: {
                platform: 'iOS',
                language: 'Swift',
                minVersion: 'iOS 17.0',
                framework: 'SwiftUI',
                architecture: 'MVVM + Clean Architecture',
                dependencyInjection: 'Manual DI',
                networking: 'URLSession + async/await',
                storage: 'SwiftData',
                testing: 'XCTest',
                packageManager: 'SPM',
                backend: 'Firebase',
            },
            codingStandards: { language: 'en', namingConvention: 'camelCase', indentation: 'spaces-4', lineLength: 120 },
            architecture: 'MVVM + Clean Architecture',
            stateManagement: 'ObservableObject / @State',
            networking: 'URLSession + async/await',
            storage: 'SwiftData',
            featuresDir: 'Sources/Features',
            sharedUIDir: 'Sources/Shared/UI',
            servicesDir: 'Sources/Shared/Services',
            modelsDir: 'Sources/Shared/Models',
        },
        android: {
            projectType: 'android',
            packageName: `com.company.${bundleBase}`,
            techStack: {
                platform: 'Android',
                language: 'Kotlin',
                minSdk: '24',
                targetSdk: '35',
                framework: 'Jetpack Compose',
                architecture: 'MVVM + Clean Architecture',
                dependencyInjection: 'Hilt',
                networking: 'Retrofit + Coroutines',
                storage: 'Room',
                testing: 'JUnit + Espresso',
                buildSystem: 'Gradle (KTS)',
                backend: 'Firebase',
            },
            codingStandards: { language: 'en', namingConvention: 'camelCase', indentation: 'spaces-4', lineLength: 120 },
            architecture: 'MVVM + Clean Architecture',
            stateManagement: 'ViewModel + StateFlow',
            networking: 'Retrofit + Coroutines',
            storage: 'Room',
            featuresDir: 'app/src/main/java/.../features',
            sharedUIDir: 'app/src/main/java/.../ui/components',
            servicesDir: 'app/src/main/java/.../data',
            modelsDir: 'app/src/main/java/.../model',
        },
        expo: {
            projectType: 'expo',
            bundleIdentifier: `com.company.${bundleBase}`,
            techStack: {
                platform: 'Expo / React Native',
                language: 'TypeScript',
                framework: 'Expo SDK 52+',
                router: 'Expo Router',
                styling: 'NativeWind (Tailwind)',
                stateManagement: 'Zustand',
                networking: 'TanStack Query',
                storage: 'Expo SQLite',
                testing: 'Jest + Detox',
                build: 'EAS Build',
                backend: 'Firebase',
            },
            codingStandards: { language: 'en', namingConvention: 'camelCase', indentation: 'spaces-2', lineLength: 100 },
            architecture: 'Feature-based',
            stateManagement: 'Zustand',
            networking: 'TanStack Query + Axios',
            storage: 'Expo SQLite / AsyncStorage',
            featuresDir: 'src/features',
            sharedUIDir: 'src/components',
            servicesDir: 'src/services',
            modelsDir: 'src/models',
        },
        flutter: {
            projectType: 'flutter',
            bundleIdentifier: `com.company.${bundleBase}`,
            techStack: {
                platform: 'Flutter',
                language: 'Dart',
                framework: 'Flutter 3+',
                architecture: 'BLoC + Clean Architecture',
                stateManagement: 'BLoC / Riverpod',
                networking: 'Dio + FutureBuilder',
                storage: 'Hive / SQLite',
                testing: 'flutter_test',
                backend: 'Firebase',
            },
            codingStandards: { language: 'en', namingConvention: 'camelCase', indentation: 'spaces-2', lineLength: 100 },
            architecture: 'BLoC + Clean Architecture',
            stateManagement: 'BLoC / Riverpod',
            networking: 'Dio + FutureBuilder',
            storage: 'Hive / SQLite',
            featuresDir: 'lib/features',
            sharedUIDir: 'lib/shared/widgets',
            servicesDir: 'lib/shared/services',
            modelsDir: 'lib/shared/models',
        },
    };

    // Fallback: generic mobile-firebase
    const cfg = identityMap[projectType] || {
        projectType: 'mobile-firebase',
        bundleIdentifier: `com.company.${bundleBase}`,
        techStack: { platform: 'Mobile', backend: 'Firebase' },
        codingStandards: { language: 'en', namingConvention: 'camelCase', indentation: 'spaces-4', lineLength: 120 },
        architecture: 'MVVM',
        stateManagement: 'Custom',
        networking: 'Custom',
        storage: 'Custom',
        featuresDir: 'src/features',
        sharedUIDir: 'src/components',
        servicesDir: 'src/services',
        modelsDir: 'src/models',
    };

    return {
        projectName,
        projectType: cfg.projectType,
        ...(cfg.bundleIdentifier && { bundleIdentifier: cfg.bundleIdentifier }),
        ...(cfg.packageName && { packageName: cfg.packageName }),
        primaryLanguage: 'en',
        techStack: cfg.techStack,
        services: {
            firebase: {
                enabled: true,
                features: ['analytics', 'crashlytics', 'remote-config', 'auth'],
            },
        },
        projectStage: 'development',
        codingStandards: cfg.codingStandards,
        projectGoals: [],
        createdDate: date,
        lastUpdated: date,
    };
}

/**
 * Build VS Code .code-workspace JSON for the given project type.
 */
function buildWorkspace(projectName, projectType) {
    const extensionsByType = {
        ios: [
            'sweetpad.sweetpad',
            'sswg.swift-lang',
            'aaron-bond.better-comments',
            'github.copilot',
        ],
        android: [
            'fwcd.kotlin',
            'mathiasfrohlich.Kotlin',
            'redhat.java',
            'github.copilot',
        ],
        expo: [
            'expo.vscode-expo-tools',
            'dsznajder.es7-react-js-snippets',
            'dbaeumer.vscode-eslint',
            'esbenp.prettier-vscode',
            'github.copilot',
        ],
        flutter: [
            'dart-code.dart-code',
            'dart-code.flutter',
            'github.copilot',
        ],
    };

    return {
        folders: [{ path: '.' }],
        settings: {
            'editor.formatOnSave': true,
            'editor.tabSize': (projectType === 'expo' || projectType === 'flutter') ? 2 : 4,
            'files.exclude': {
                '**/.DS_Store': true,
                '**/node_modules': true,
                '**/.git': true,
                '**/build': projectType === 'android',
                '**/.gradle': projectType === 'android',
                '**/DerivedData': projectType === 'ios',
            },
            'files.watcherExclude': {
                '**/node_modules/**': true,
                '**/build/**': true,
                '**/DerivedData/**': true,
            },
        },
        extensions: {
            recommendations: extensionsByType[projectType] || ['github.copilot'],
        },
    };
}

/**
 * Build CODEBASE.md content from template file.
 */
function buildCodebaseMd(projectName, projectType, identity) {
    const tmplPath = path.join(AWK_ROOT, 'templates', 'CODEBASE.md');
    let content = fs.existsSync(tmplPath)
        ? fs.readFileSync(tmplPath, 'utf8')
        : '# {{PROJECT_NAME}}\n\n> Auto-generated by awkit init\n';

    const techSummary = Object.entries(identity.techStack || {})
        .map(([k, v]) => v)
        .slice(0, 4)
        .join(' + ');

    const dirStructure = {
        ios: `Sources/\n├── Features/        ← Feature modules (one dir per feature)\n├── Shared/\n│   ├── UI/          ← Reusable SwiftUI components\n│   ├── Services/    ← Firebase, API, business logic\n│   ├── Models/      ← Data models & DTOs\n│   └── Extensions/  ← Swift extensions\n├── Resources/       ← Assets, fonts, localization\n└── Tests/           ← XCTest unit & UI tests`,
        android: `app/src/main/java/…/\n├── features/        ← Feature modules (one dir per feature)\n├── ui/\n│   └── components/  ← Reusable Compose components\n├── data/            ← Repositories, data sources\n├── model/           ← Data classes & DTOs\n└── di/              ← Hilt modules`,
        expo: `app/                 ← Expo Router screens\n├── (tabs)/          ← Tab navigation\n├── (auth)/          ← Auth screens\nsrc/\n├── features/        ← Feature modules\n├── components/      ← Shared UI components\n├── services/        ← Firebase, API clients\n├── hooks/           ← Custom React hooks\n├── models/          ← TypeScript interfaces\n└── constants/       ← App constants & theme`,
        flutter: `lib/\n├── features/        ← Feature modules (BLoC pattern)\n├── shared/\n│   ├── widgets/     ← Reusable Flutter widgets\n│   ├── services/    ← Firebase, API services\n│   └── models/      ← Dart model classes\n└── core/            ← App config, routing, DI`,
    };

    content = content
        .replace(/{{PROJECT_NAME}}/g, projectName)
        .replace(/{{PROJECT_TYPE}}/g, identity.projectType)
        .replace(/{{PROJECT_STAGE}}/g, identity.projectStage || 'development')
        .replace(/{{TECH_STACK_SUMMARY}}/g, techSummary)
        .replace(/{{DATE}}/g, new Date().toISOString().split('T')[0])
        .replace(/{{DIR_STRUCTURE}}/g, dirStructure[projectType] || `src/\n├── features/\n├── services/\n└── models/`)
        .replace(/{{ARCHITECTURE}}/g, identity.techStack?.architecture || 'MVVM')
        .replace(/{{STATE_MANAGEMENT}}/g, identity.techStack?.stateManagement || identity.stateManagement || 'Custom')
        .replace(/{{NETWORKING}}/g, identity.techStack?.networking || 'Custom')
        .replace(/{{STORAGE}}/g, identity.techStack?.storage || 'Custom')
        .replace(/{{FEATURES_DIR}}/g, identity.featuresDir || 'src/features')
        .replace(/{{SHARED_UI_DIR}}/g, identity.sharedUIDir || 'src/components')
        .replace(/{{SERVICES_DIR}}/g, identity.servicesDir || 'src/services')
        .replace(/{{MODELS_DIR}}/g, identity.modelsDir || 'src/models');

    return content;
}

/**
 * awkit init — Initialize a new mobile project with Firebase.
 * Runs from CWD. Zero prompts. Auto-detects project type.
 *
 * Creates:
 *   .project-identity
 *   <ProjectName>.code-workspace
 *   CODEBASE.md
 *   .symphony/ (via Symphony)
 */
async function cmdInit(forceFlag = false) {
    const cwd = process.cwd();
    const dirName = path.basename(cwd);
    // Convert dir name to PascalCase project name: my-app → MyApp, fitbite → Fitbite
    const projectName = dirName
        .split(/[-_\s]+/)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join('');
    const date = new Date().toISOString().split('T')[0];

    log('');
    log(`${C.cyan}${C.bold}╔══════════════════════════════════════════════════════════╗${C.reset}`);
    log(`${C.cyan}${C.bold}║     ✨ awkit init — Mobile Project Setup                 ║${C.reset}`);
    log(`${C.cyan}${C.bold}╚══════════════════════════════════════════════════════════╝${C.reset}`);
    log('');
    log(`${C.gray}   Directory: ${cwd}${C.reset}`);
    log(`${C.gray}   Project:   ${projectName}${C.reset}`);

    // ── 1. Detect project type ────────────────────────────────────────────────
    info('Detecting project type...');
    const projectType = detectProjectType(cwd);
    ok(`Detected: ${projectType}`);

    // ── 2. .project-identity ──────────────────────────────────────────────────
    const identityPath = path.join(cwd, '.project-identity');
    if (fs.existsSync(identityPath) && !forceFlag) {
        warn('.project-identity already exists — skipping (use --force to overwrite)');
    } else {
        info('Creating .project-identity...');
        const identity = buildProjectIdentity(projectName, projectType, cwd, date);
        fs.writeFileSync(identityPath, JSON.stringify(identity, null, 2) + '\n');
        ok('.project-identity created');
    }

    // Read identity back for use in other files
    let identity;
    try {
        identity = JSON.parse(fs.readFileSync(identityPath, 'utf8'));
    } catch (_) {
        identity = { projectName, projectType, techStack: {}, projectStage: 'development' };
    }

    // ── 3. .code-workspace ───────────────────────────────────────────────────
    const workspaceName = `${projectName}.code-workspace`;
    const workspacePath = path.join(cwd, workspaceName);
    if (fs.existsSync(workspacePath) && !forceFlag) {
        warn(`${workspaceName} already exists — skipping (use --force to overwrite)`);
    } else {
        info(`Creating ${workspaceName}...`);
        const workspace = buildWorkspace(projectName, projectType);
        fs.writeFileSync(workspacePath, JSON.stringify(workspace, null, 2) + '\n');
        ok(`${workspaceName} created`);
    }

    // ── 3.5. .trello-config.json ───────────────────────────────────────────────
    const trelloConfigPath = path.join(cwd, '.trello-config.json');
    if (fs.existsSync(trelloConfigPath) && !forceFlag) {
        warn('.trello-config.json already exists — skipping (use --force to overwrite)');
    } else {
        info('Creating .trello-config.json...');
        const templatePath = path.join(TARGETS.antigravity, 'templates', 'configs', 'trello-config.json');
        if (fs.existsSync(templatePath)) {
            fs.copyFileSync(templatePath, trelloConfigPath);
            ok('.trello-config.json created from template');
        } else {
            const defaultTrelloConfig = {
                "BOARD_NAME": "Your Board Name",
                "LIST_NAME": "Your Backlog List",
                "CARD_NAME": "Project Card Name or ID"
            };
            fs.writeFileSync(trelloConfigPath, JSON.stringify(defaultTrelloConfig, null, 2) + '\n');
            ok('.trello-config.json created with default values');
        }
    }

    const trelloCred = trelloLoadCredentials();
    if (!trelloCred) {
        log('');
        warn('Trello API Key & Token are not set.');
        log(`  👉 To setup Trello integration, please get your credentials at: https://trello.com/app-key`);
        
        const readline = require('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        const question = (query) => new Promise(resolve => rl.question(query, resolve));
        // Sanitize: strip ALL whitespace (spaces, tabs, newlines) from pasted input
        const sanitize = (s) => s.replace(/\s+/g, '');

        try {
            const apiKey = sanitize(await question(`  ${C.yellow}Enter Trello API Key: ${C.reset}`));

            if (apiKey) {
                const tokenUrl = `https://trello.com/1/authorize?expiration=never&scope=read,write&response_type=token&key=${apiKey}&name=AWKit`;
                log('');
                log(`  ${C.cyan}👉 Open this link to generate your Token:${C.reset}`);
                log(`     ${C.green}${tokenUrl}${C.reset}`);
                log('');
            }

            const apiToken = sanitize(await question(`  ${C.yellow}Enter Trello API Token: ${C.reset}`));

            if (apiKey && apiToken) {
                let profilePath = path.join(os.homedir(), '.zshrc');
                if (!fs.existsSync(profilePath) && fs.existsSync(path.join(os.homedir(), '.bashrc'))) {
                    profilePath = path.join(os.homedir(), '.bashrc');
                }
                
                const exportLines = `\n# Trello API Credentials for AWKit\nexport TRELLO_KEY="${apiKey}"\nexport TRELLO_TOKEN="${apiToken}"\n`;
                fs.appendFileSync(profilePath, exportLines);
                
                // Also inject into current process so immediate awkit trello calls work
                process.env.TRELLO_KEY = apiKey;
                process.env.TRELLO_TOKEN = apiToken;
                
                ok(`Credentials saved to ${path.basename(profilePath)} ✅`);
                log(`  ${C.green}👉 Trello is ready! Credentials are active for this session and all future terminals.${C.reset}`);
            } else {
                warn('Setup skipped. Automated Trello sync will be disabled.');
            }
        } catch (e) {
            warn(`Failed to setup Trello: ${e.message}`);
        } finally {
            rl.close();
        }
    }

    // ── 4. CODEBASE.md ────────────────────────────────────────────────────────
    const codebasePath = path.join(cwd, 'CODEBASE.md');
    if (fs.existsSync(codebasePath) && !forceFlag) {
        warn('CODEBASE.md already exists — skipping (use --force to overwrite)');
    } else {
        info('Creating CODEBASE.md...');
        const mdContent = buildCodebaseMd(projectName, projectType, identity);
        fs.writeFileSync(codebasePath, mdContent);
        ok('CODEBASE.md created');
    }

    // ── 5. Symphony folder ───────────────────────────────────────────────────────
    const symphonyDir = path.join(cwd, '.symphony');
    if (fs.existsSync(symphonyDir) && !forceFlag) {
        warn('.symphony/ folder already exists');
    } else {
        info('Creating .symphony/ folder to mark project context...');
        fs.mkdirSync(symphonyDir, { recursive: true });
        // Create an empty .gitignore just in case
        fs.writeFileSync(path.join(symphonyDir, '.gitignore'), '*\n');
        ok('Symphony project marker created (.symphony/)');
        
        const symReady = checkSymphony({ silent: true });
        if (!symReady) {
            dim('Symphony CLI is not installed. Run: npm i -g @leejungkiin/awkit-symphony');
        }
    }

    // ── 6. Summary ─────────────────────────────────────────────────────────────
    log('');
    log(`${C.gray}${'─'.repeat(56)}${C.reset}`);
    log(`${C.yellow}${C.bold}🎉 ${projectName} initialized!${C.reset}`);
    log('');
    dim(`Type:       ${projectType}`);
    dim(`Firebase:   analytics, crashlytics, remote-config, auth`);
    dim(`Files:      .project-identity, ${workspaceName}, CODEBASE.md, .trello-config.json`);
    dim(`Symphony:     task tracking ready)`);
    log('');
    log(`${C.cyan}👉 Open ${workspaceName} in VS Code to get started.${C.reset}`);
    log(`${C.cyan}👉 Run '/codebase-sync' in AI chat to keep CODEBASE.md updated.${C.reset}`);
    log(`${C.cyan}👉 Run 'symphony task list' to manage tasks.${C.reset}`);
    log('');
}

// ─── Telegram Bot API ─────────────────────────────────────────────────────────

const TG_CONFIG_PATH = path.join(TARGETS.antigravity, '.tg_config.json');

function tgLoadConfig() {
    if (!fs.existsSync(TG_CONFIG_PATH)) return null;
    try {
        return JSON.parse(fs.readFileSync(TG_CONFIG_PATH, 'utf8'));
    } catch (_) {
        return null;
    }
}

function tgSaveConfig(config) {
    const dir = path.dirname(TG_CONFIG_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(TG_CONFIG_PATH, JSON.stringify(config, null, 2) + '\n');
}

/**
 * Send message via Telegram Bot API using built-in https module.
 * Returns a Promise that resolves with the API response.
 */
function tgApiSendMessage(botToken, chatId, text, parseMode, topicId) {
    return new Promise((resolve, reject) => {
        const payload = JSON.stringify({
            chat_id: chatId,
            text: text,
            ...(parseMode ? { parse_mode: parseMode === 'md' ? 'Markdown' : 'HTML' } : {}),
            ...(topicId ? { message_thread_id: parseInt(topicId, 10) } : {}),
        });

        const options = {
            hostname: 'api.telegram.org',
            path: `/bot${botToken}/sendMessage`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload),
            },
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => (data += chunk));
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json.ok) resolve(json);
                    else reject(new Error(json.description || 'Telegram API error'));
                } catch (e) {
                    reject(new Error(`Invalid response: ${data}`));
                }
            });
        });

        req.on('error', reject);
        req.write(payload);
        req.end();
    });
}

function tgSetup() {
    log('');
    log(`${C.cyan}${C.bold}📨 Telegram Bot API Setup${C.reset}`);
    log('');
    log(`${C.gray}  1. Open Telegram → search @BotFather → /newbot${C.reset}`);
    log(`${C.gray}  2. Copy the Bot Token${C.reset}`);
    log(`${C.gray}  3. Add the bot to your target group${C.reset}`);
    log(`${C.gray}  4. Get group Chat ID (send a message, then check:${C.reset}`);
    log(`${C.gray}     https://api.telegram.org/bot<TOKEN>/getUpdates)${C.reset}`);
    log('');

    // Prompt for Bot Token
    let botToken = '';
    try {
        botToken = execSync(
            `bash -c 'read -p "Bot Token: " token; echo $token'`,
            { stdio: ['inherit', 'pipe', 'inherit'] }
        ).toString().trim();
    } catch (_) { err('Failed to read input.'); return; }

    if (!botToken) { err('Bot Token is required.'); return; }

    // Prompt for Chat ID
    let chatId = '';
    try {
        chatId = execSync(
            `bash -c 'read -p "Default Chat ID (e.g. -100xxx): " cid; echo $cid'`,
            { stdio: ['inherit', 'pipe', 'inherit'] }
        ).toString().trim();
    } catch (_) { err('Failed to read input.'); return; }

    if (!chatId) { err('Chat ID is required.'); return; }

    // Prompt for Topic ID (optional)
    let topicId = '';
    try {
        topicId = execSync(
            `bash -c 'read -p "Default Topic ID (optional, press Enter to skip): " tid; echo $tid'`,
            { stdio: ['inherit', 'pipe', 'inherit'] }
        ).toString().trim();
    } catch (_) { /* optional, ignore */ }

    // Save config
    const config = { bot_token: botToken, default_chat_id: chatId };
    if (topicId) config.default_topic_id = topicId;
    tgSaveConfig(config);
    ok(`Config saved to ${TG_CONFIG_PATH}`);

    // Test connection
    info('Sending test message...');
    tgApiSendMessage(botToken, chatId, '✅ AWKit Telegram integration connected!', null, topicId || null)
        .then(() => {
            ok('Test message sent successfully! 🎉');
            log('');
            log(`${C.cyan}Usage: awkit tg send "Your message here"${C.reset}`);
            log('');
        })
        .catch((e) => {
            err(`Test failed: ${e.message}`);
            warn('Check your Bot Token and Chat ID, then run "awkit tg setup" again.');
        });
}

function tgSend(args) {
    const config = tgLoadConfig();
    if (!config) {
        err('Telegram not configured. Run "awkit tg setup" first.');
        return;
    }

    // Parse args: --chat <id>, --parse-mode <md|html>, rest is message
    let chatId = config.default_chat_id;
    let topicId = config.default_topic_id || null;
    let parseMode = null;
    const messageParts = [];

    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--chat' && args[i + 1]) {
            chatId = args[++i];
        } else if (args[i] === '--topic' && args[i + 1]) {
            topicId = args[++i];
        } else if (args[i] === '--parse-mode' && args[i + 1]) {
            parseMode = args[++i];
        } else {
            messageParts.push(args[i]);
        }
    }

    const message = messageParts.join(' ');
    if (!message) {
        err('No message provided.');
        dim('Usage: awkit tg send "Your message"');
        return;
    }

    tgApiSendMessage(config.bot_token, chatId, message, parseMode, topicId)
        .then(() => {
            ok(`Message sent to ${chatId}`);
        })
        .catch((e) => {
            err(`Failed to send: ${e.message}`);
        });
}

function tgHelp() {
    log('');
    log(`${C.cyan}${C.bold}📨 Telegram Commands${C.reset}`);
    log('');
    log(`  ${C.green}awkit tg setup${C.reset}                    Setup Bot Token, Chat ID & Topic`);
    log(`  ${C.green}awkit tg send${C.reset} <message>           Send to default group/topic`);
    log(`  ${C.green}awkit tg send --chat <id>${C.reset} <msg>   Send to specific chat`);
    log(`  ${C.green}awkit tg send --topic <id>${C.reset} <msg>  Send to specific forum topic`);
    log(`  ${C.green}awkit tg send --parse-mode md${C.reset}     Markdown formatting`);
    log(`  ${C.green}awkit tg send --parse-mode html${C.reset}   HTML formatting`);
    log('');
}

function cmdTelegram(args) {
    const subCmd = args[0];
    switch (subCmd) {
        case 'send':
            tgSend(args.slice(1));
            break;
        case 'setup':
            tgSetup();
            break;
        default:
            tgHelp();
            break;
    }
}

// ─── Trello Integration ───────────────────────────────────────────────────────

/**
 * Load Trello credentials from environment variables.
 * Returns { api_key, api_token } or null.
 */
function trelloLoadCredentials() {
    if (process.env.TRELLO_KEY && process.env.TRELLO_TOKEN) {
        return { api_key: process.env.TRELLO_KEY, api_token: process.env.TRELLO_TOKEN };
    }
    return null;
}

/**
 * Load Trello project config from .trello-config.json in CWD.
 * Returns { board, list, card } or null.
 */
function trelloLoadProjectConfig() {
    const configPath = path.join(process.cwd(), '.trello-config.json');
    if (!fs.existsSync(configPath)) return null;
    try {
        const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        return {
            board: cfg.BOARD_NAME || cfg.board,
            list: cfg.LIST_NAME || cfg.list,
            card: cfg.CARD_NAME || cfg.card,
        };
    } catch (_) {
        return null;
    }
}

/**
 * Execute a trello-cli command with auto-injected credentials and rate-limit retries.
 */
function trelloExec(cliArgs, retries = 3) {
    const cred = trelloLoadCredentials();
    const cfg = trelloLoadProjectConfig();
    if (!cred) {
        err('Trello credentials not found.');
        log(`  Please export ${C.cyan}TRELLO_KEY${C.reset} and ${C.cyan}TRELLO_TOKEN${C.reset} in your ~/.zshrc`);
        return false;
    }
    if (!cfg) {
        err('.trello-config.json not found in current directory.');
        log(`  Run ${C.cyan}awkit init${C.reset} to generate one, or create it manually.`);
        return false;
    }

    const env = { ...process.env, TRELLO_KEY: cred.api_key, TRELLO_TOKEN: cred.api_token };
    const fullArgs = [...cliArgs, '--board', cfg.board, '--list', cfg.list, '--card', cfg.card];

    for (let attempt = 1; attempt <= retries; attempt++) {
        const result = spawnSync('npx', ['--yes', 'trello-cli', ...fullArgs], {
            env,
            encoding: 'utf-8',
            timeout: 30000,
        });

        const stdoutStr = result.stdout || '';
        const stderrStr = result.stderr || '';
        const combinedOut = stdoutStr + stderrStr;

        if (stdoutStr) process.stdout.write(stdoutStr);
        if (stderrStr) process.stderr.write(stderrStr);

        if (result.status === 0) {
            return true;
        }

        if (combinedOut.includes('429') || combinedOut.includes('Rate limit exceeded') || combinedOut.includes('Too Many Requests') || combinedOut.includes('API_TOKEN_LIMIT_EXCEEDED') || combinedOut.includes('API_KEY_LIMIT_EXCEEDED')) {
            warn(`[Trello API] Rate limit hit (429). Waiting 10s before retry ${attempt}/${retries}...`);
            // Sleep for 10 seconds to satisfy the 100 requests / 10s window boundary
            spawnSync('sleep', ['10']);
            continue;
        }

        warn(`Trello CLI returned non-zero exit code (${result.status}). Command: awkit trello ${cliArgs.join(' ')}`);
        return false;
    }
    err('Trello CLI failed after multiple retries due to rate limits.');
    return false;
}

function trelloHelp() {
    log('');
    log(`${C.cyan}${C.bold}📋 Trello Commands${C.reset}`);
    log('');
    log(`  ${C.green}awkit trello desc${C.reset} <text>        Update card description`);
    log(`  ${C.green}awkit trello comment${C.reset} <text>     Add milestone comment to card`);
    log(`  ${C.green}awkit trello item${C.reset} <name>        Add checklist item (incomplete)`);
    log(`  ${C.green}awkit trello complete${C.reset} <name>    Mark checklist item ✅ complete`);
    log(`  ${C.green}awkit trello block${C.reset} <reason>     Label card Blocked + comment`);
    log(`  ${C.green}awkit trello checklist${C.reset} <name>   Create a new checklist on card`);
    log('');
    log(`  ${C.gray}Credentials: env vars TRELLO_KEY and TRELLO_TOKEN${C.reset}`);
    log(`  ${C.gray}Project config: .trello-config.json in CWD${C.reset}`);
    log('');
}

function cmdTrello(args) {
    const subCmd = args[0];
    const text = args.slice(1).join(' ');

    if (!subCmd || subCmd === 'help' || subCmd === '--help' || subCmd === '-h') {
        trelloHelp();
        return;
    }

    if (!text) {
        err(`Missing argument for 'trello ${subCmd}'. Usage: awkit trello ${subCmd} <text>`);
        return;
    }

    switch (subCmd) {
        case 'desc':
            info(`Updating card description...`);
            trelloExec(['card:update', '--description', text]);
            break;

        case 'comment':
            info(`Adding comment to card...`);
            trelloExec(['card:comment', '--text', text]);
            break;

        case 'item':
            info(`Adding checklist item via REST API: ${text}`);
            const credItem = trelloLoadCredentials();
            const cfgItem = trelloLoadProjectConfig();
            if (!credItem || !cfgItem) {
                err("Credentials or config missing for REST API fallback.");
                break;
            }
            
            // 1. Get checklists
            const clRes = spawnSync('npx', ['--yes', 'trello-cli', 'card:checklists', '--board', cfgItem.board, '--list', cfgItem.list, '--card', cfgItem.card, '--format', 'json'], { env: { ...process.env, TRELLO_KEY: credItem.api_key, TRELLO_TOKEN: credItem.api_token }, encoding: 'utf-8' });
            
            if (clRes.status !== 0) {
                err(`Failed to get checklists: ${clRes.stderr || clRes.stdout}`);
                break;
            }
            
            try {
                // Sometime trello-cli outputs to stdout along with some other logs.
                // We extract the JSON array part.
                const outText = clRes.stdout;
                const jsonStr = outText.substring(outText.indexOf('['));
                const checklists = JSON.parse(jsonStr);
                
                if (!checklists || checklists.length === 0) {
                    err("No checklists found on card. Create one first using 'awkit trello checklist <name>'.");
                    break;
                }
                
                // Add to the LAST checklist (most recently appended usually)
                const targetChecklist = checklists[checklists.length - 1];
                const checklistId = targetChecklist.id;
                
                // 2. Add item via curl
                const url = `https://api.trello.com/1/checklists/${checklistId}/checkItems?name=${encodeURIComponent(text)}&key=${credItem.api_key}&token=${credItem.api_token}`;
                const addRes = spawnSync('curl', ['-s', '-X', 'POST', url], { encoding: 'utf-8' });
                
                const responseJson = JSON.parse(addRes.stdout);
                if (responseJson.id) {
                    ok(`Item added successfully to checklist "${targetChecklist.name}".`);
                } else {
                    err(`Failed to add item via REST API: ${addRes.stdout}`);
                }
            } catch (e) {
                err(`Failed to parse checklists or execute curl: ${e.message}`);
            }
            break;

        case 'complete':
            info(`Marking item complete: ${text}`);
            trelloExec(['card:check-item', '--item', text, '--state', 'complete']);
            break;

        case 'block':
            info(`Blocking card with reason...`);
            trelloExec(['card:label', '--label', 'Blocked']);
            trelloExec(['card:comment', '--text', `⚠️ BLOCKED: ${text}`]);
            break;

        case 'checklist':
            info(`Creating checklist: ${text}`);
            trelloExec(['card:checklist', '-n', text]);
            break;

        default:
            err(`Unknown trello subcommand: ${subCmd}`);
            trelloHelp();
            break;
    }
}

// ─── Auto-Update Checker ──────────────────────────────────────────────────────

function checkAutoUpdate() {
    const checkFile = path.join(TARGETS.antigravity, '.awk_update_check');
    const now = Date.now();
    const ONEDAY = 24 * 60 * 60 * 1000;

    if (fs.existsSync(checkFile)) {
        try {
            const lastCheck = parseInt(fs.readFileSync(checkFile, 'utf8'), 10);
            if (!isNaN(lastCheck) && (now - lastCheck < ONEDAY)) {
                return; // already checked recently
            }
        } catch (_) { }
    }

    // Touch the file so we don't retry immediately on failure
    try { fs.writeFileSync(checkFile, now.toString()); } catch (_) { }

    // Check for update using npm registry
    try {
        const output = execSync('npm view @leejungkiin/awkit version', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 3000 });
        const npmVersion = output.trim();

        // Simple string comparison for versions like "1.0.0" (Assumes SemVer)
        if (npmVersion && npmVersion !== AWK_VERSION) {
            log('');
            log(`${C.yellow}${C.bold}🌟 [Thông báo] Có phiên bản mới cho AWKit! (v${npmVersion})${C.reset}`);
            log(`${C.gray}   Phiên bản hiện tại: v${AWK_VERSION}${C.reset}`);
            log(`${C.gray}   Chạy lệnh sau để nâng cấp:${C.reset}`);
            log(`${C.cyan}   npm i -g @leejungkiin/awkit && awkit install${C.reset}`);
            log('');
        }
    } catch (_) {
        // Fail silently (offline, npm not installed, package not published yet)
    }
}

// ─── Main ────────────────────────────────────────────────────────────────────

// Check for updates (max once per day) before continuing
checkAutoUpdate();

const [, , command, ...args] = process.argv;

(async () => {
    switch (command) {
        case 'init':
            await cmdInit(args.includes('--force'));
            break;
        case 'install':
            // Parse platform from either first arg or --platform flag
            {
                const pIdx = args.indexOf('--platform');
                let platformArg = null;
                if (pIdx !== -1 && args[pIdx + 1]) {
                    platformArg = args[pIdx + 1];
                } else if (args[0] && !args[0].startsWith('-')) {
                    platformArg = args[0];
                }
                cmdInstall(platformArg);
            }
            break;
        case 'uninstall':
            cmdUninstall();
            break;
        case 'update':
            cmdUpdate();
            break;
        case 'sync':
            cmdSync();
            break;
        case 'status':
            cmdStatus();
            break;
        case 'harvest':
            cmdHarvest(args.includes('--dry-run'));
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
        case 'lint':
            cmdLint();
            break;
        case 'trello':
            cmdTrello(args);
            break;
        case 'tg':
        case 'telegram':
            cmdTelegram(args);
            break;
        case 'admin':
            cmdAdmin();
            break;
        case 'help':
        case '--help':
        case '-h':
        default:
            cmdHelp();
            break;
    }
})();
