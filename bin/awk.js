#!/usr/bin/env node

/**
 * AWK v1.0 CLI — Antigravity Workflow Kit
 * Unified installer, updater, and manager for AI agent workflows.
 * 
 * Usage:
 *   awkit install        Install AWK into the active platform runtime
 *   awkit install --all  Install AWK into every supported platform
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
const { generateClaudeRules, generateClaudeSkills } = require('./claude-generators');

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
    },
    claude: {
        name: 'Claude Code',
        globalRoot: process.cwd(), // Local to project
        rulesFile: 'CLAUDE.md',
        versionFile: '.claude/awk_version',
        dirs: {
            skills: '.claude/skills',
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

const SKILL_RUNTIME_MANIFEST = path.join(AWK_ROOT, 'core', 'skill-runtime-manifest.json');
const INSTALL_STATE_FILENAME = '.awkit-install-state.json';

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

function readJsonFile(filePath, fallback = null) {
    if (!fs.existsSync(filePath)) return fallback;
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (_) {
        return fallback;
    }
}

function listSkillDirs(rootDir) {
    if (!fs.existsSync(rootDir)) return [];
    return fs.readdirSync(rootDir, { withFileTypes: true })
        .filter(d => d.isDirectory() && fs.existsSync(path.join(rootDir, d.name, 'SKILL.md')))
        .map(d => d.name)
        .sort();
}

function loadSkillRuntimeManifest() {
    const manifest = readJsonFile(SKILL_RUNTIME_MANIFEST);
    if (!manifest?.profiles || !manifest.defaultProfile || !manifest.profiles[manifest.defaultProfile]) {
        throw new Error(`Invalid skill runtime manifest: ${SKILL_RUNTIME_MANIFEST}`);
    }
    return manifest;
}

function getDefaultSkillProfileName() {
    return loadSkillRuntimeManifest().defaultProfile;
}

function getDefaultRuntimeSkills() {
    const manifest = loadSkillRuntimeManifest();
    return manifest.profiles[manifest.defaultProfile].skills || [];
}

function getPackSkillNames(packName) {
    const packSrc = path.join(AWK_ROOT, 'skill-packs', packName);
    const config = readJsonFile(path.join(packSrc, 'pack.json'), {});
    if (Array.isArray(config.skills) && config.skills.length > 0) {
        return [...config.skills];
    }
    return listSkillDirs(path.join(packSrc, 'skills'));
}

function resolvePackSkillSources(packName) {
    const packSrc = path.join(AWK_ROOT, 'skill-packs', packName);
    const packSkillsDir = path.join(packSrc, 'skills');
    const localSkills = listSkillDirs(packSkillsDir);

    if (localSkills.length > 0) {
        return localSkills.map(skill => ({
            name: skill,
            src: path.join(packSkillsDir, skill)
        }));
    }

    return getPackSkillNames(packName)
        .map(skill => ({
            name: skill,
            src: path.join(AWK_ROOT, 'skills', skill)
        }))
        .filter(item => fs.existsSync(path.join(item.src, 'SKILL.md')));
}

function getManagedSkillNames() {
    const managed = new Set(listSkillDirs(path.join(AWK_ROOT, 'skills')));
    const packsDir = path.join(AWK_ROOT, 'skill-packs');
    if (!fs.existsSync(packsDir)) return managed;

    const packs = fs.readdirSync(packsDir, { withFileTypes: true }).filter(d => d.isDirectory());
    for (const pack of packs) {
        for (const skill of getPackSkillNames(pack.name)) {
            managed.add(skill);
        }
    }
    return managed;
}

function getPlatformStateRoot(platform = activePlatform) {
    const plat = PLATFORMS[platform];
    switch (platform) {
        case 'cline':
            return path.join(plat.globalRoot, '.clinerules');
        case 'claude':
            return path.join(plat.globalRoot, '.claude');
        default:
            return plat.globalRoot;
    }
}

function getPlatformBackupRoot(platform = activePlatform) {
    return path.join(getPlatformStateRoot(platform), 'backup');
}

function getInstallStatePath(platform = activePlatform) {
    return path.join(getPlatformStateRoot(platform), INSTALL_STATE_FILENAME);
}

function readInstallState(platform = activePlatform) {
    const fallback = {
        version: 1,
        profile: getDefaultSkillProfileName(),
        enabledPacks: [],
        activeMode: null
    };
    return readJsonFile(getInstallStatePath(platform), fallback) || fallback;
}

function writeInstallState(state, platform = activePlatform) {
    const filePath = getInstallStatePath(platform);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(state, null, 2) + '\n');
}

function getDesiredSkillSet(enabledPacks = []) {
    const desired = new Set(getDefaultRuntimeSkills());
    for (const packName of enabledPacks) {
        for (const skill of getPackSkillNames(packName)) {
            desired.add(skill);
        }
    }
    return desired;
}

function collectFileBasenames(dir, ext = '*') {
    const result = new Set();
    if (!fs.existsSync(dir)) return result;

    function walk(current) {
        for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
            if (entry.name === '.DS_Store') continue;
            const fullPath = path.join(current, entry.name);
            if (entry.isDirectory()) {
                walk(fullPath);
            } else if (ext === '*' || entry.name.endsWith(ext)) {
                result.add(entry.name);
            }
        }
    }

    walk(dir);
    return result;
}

function getPackWorkflowNames(packName) {
    return collectFileBasenames(path.join(AWK_ROOT, 'skill-packs', packName, 'workflows'));
}

function getPackSchemaNames(packName) {
    return collectFileBasenames(path.join(AWK_ROOT, 'skill-packs', packName, 'schemas'), '.json');
}

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

function copySelectedSkillDirs(srcDir, destDir, selectedSkills) {
    const wanted = new Set(selectedSkills);
    let count = 0;

    if (!fs.existsSync(srcDir)) return count;
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

    for (const skill of wanted) {
        const skillSrc = path.join(srcDir, skill);
        if (!fs.existsSync(path.join(skillSrc, 'SKILL.md'))) continue;
        const skillDest = path.join(destDir, skill);
        count += copyDirRecursive(skillSrc, skillDest);
    }

    return count;
}

function backupAndPruneManagedSkills(destDir, desiredSkills) {
    if (!fs.existsSync(destDir)) return 0;

    const managed = getManagedSkillNames();
    const installed = fs.readdirSync(destDir, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name);

    const stale = installed.filter(skill => managed.has(skill) && !desiredSkills.has(skill));
    if (stale.length === 0) return 0;

    const backupRoot = path.join(getPlatformBackupRoot(), 'pruned-skills');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(backupRoot, timestamp);
    fs.mkdirSync(backupDir, { recursive: true });

    for (const skill of stale) {
        const from = path.join(destDir, skill);
        const to = path.join(backupDir, skill);
        fs.renameSync(from, to);
        dim(`Archived optional skill: ${skill}`);
    }

    return stale.length;
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

function cmdInstall(args = []) {
    log('');
    log(`${C.cyan}${C.bold}╔══════════════════════════════════════════════════════════╗${C.reset}`);
    log(`${C.cyan}${C.bold}║     🚀 AWK v${AWK_VERSION} — Antigravity Workflow Kit        ║${C.reset}`);
    log(`${C.cyan}${C.bold}╚══════════════════════════════════════════════════════════╝${C.reset}`);
    log('');

    const isUpdate = args.includes('--update');
    let selectedPlatforms = [];

    if (args.includes('--all') || args.includes('-a') || args.includes('all')) {
        selectedPlatforms = Object.keys(PLATFORMS);
    } else {
        if (args.includes('--gemini') || args.includes('-g') || args.includes('antigravity')) selectedPlatforms.push('antigravity');
        if (args.includes('--cline') || args.includes('cline')) selectedPlatforms.push('cline');
        if (args.includes('--codex') || args.includes('-x')) selectedPlatforms.push('codex');
        if (args.includes('--claude-code') || args.includes('--claude') || args.includes('-c') || args.includes('claude')) selectedPlatforms.push('claude');

        const pIdx = args.indexOf('--platform');
        let legacyArg = null;
        if (pIdx !== -1 && args[pIdx + 1]) {
            legacyArg = args[pIdx + 1];
        } else if (args.length > 0 && !args[0].startsWith('-') && args[0] !== 'all' && args[0] !== '--update') {
            legacyArg = args[0];
        }

        if (legacyArg && PLATFORMS[legacyArg] && !selectedPlatforms.includes(legacyArg)) {
            selectedPlatforms.push(legacyArg);
        }
    }

    if (selectedPlatforms.length === 0) {
        if (isUpdate) {
            selectedPlatforms = [getActivePlatform()];
        } else {
            const platformOrder = ['antigravity', 'cline', 'codex', 'claude'];
            const defaultPlatform = getActivePlatform();
            const defaultChoice = String(Math.max(platformOrder.indexOf(defaultPlatform), 0) + 1);
            log(`${C.cyan}Select platforms to install (e.g., type "1,2", "all", or "1,2,3,4"):${C.reset}`);
            log(`  1. Gemini Code Assist (antigravity)`);
            log(`  2. Cline (VS Code)`);
            log(`  3. Codex CLI (codex)`);
            log(`  4. Claude Code (.claude/)`);
            log(`  5. All of the above`);
            log(`${C.gray}Press Enter to install only the active platform: ${PLATFORMS[defaultPlatform].name}.${C.reset}`);
            const choice = promptChoice('Choice', defaultChoice).trim().toLowerCase();

            if (choice === '5' || choice === 'all') {
                selectedPlatforms = Object.keys(PLATFORMS);
            } else {
                if (choice.includes('1')) selectedPlatforms.push('antigravity');
                if (choice.includes('2')) selectedPlatforms.push('cline');
                if (choice.includes('3')) selectedPlatforms.push('codex');
                if (choice.includes('4')) selectedPlatforms.push('claude');
            }
        }
    }

    if (selectedPlatforms.length === 0) {
        selectedPlatforms = [getActivePlatform()];
    }

    log(`${C.cyan}Installing to: ${selectedPlatforms.map(p => PLATFORMS[p].name).join(', ')}${C.reset}`);

    // Main installation loop
    for (const platform of selectedPlatforms) {
        if (!PLATFORMS[platform]) {
            err(`Unknown platform: ${platform}.`);
            continue;
        }

        activePlatform = platform;
        if (platform === selectedPlatforms[0]) {
            savePlatform(platform); // Store primary platform
        }

        const plat = PLATFORMS[platform];
        const target = plat.globalRoot;
        const coreSkills = getDefaultRuntimeSkills();
        const previousState = readInstallState(platform);

        log('');
        info(`Installing for ${C.bold}${plat.name}${C.reset}...`);
        log('');

        // 0. Check Symphony dependency
        info('Checking dependencies...');
        checkSymphony({ silent: platform !== selectedPlatforms[0] });

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
        } else if (platform === 'claude') {
            info('Generating Claude Code CLAUDE.md...');
            const claudeTemplateSrc = path.join(AWK_ROOT, 'core', 'CLAUDE.md');
            const claudeRulesDest = path.join(target, plat.rulesFile);
            generateClaudeRules(claudeTemplateSrc, claudeRulesDest);
        }

        // 3. Backup and install workflows
        if (plat.dirs.workflows) {
            info('Installing workflows...');
            const wfSrc = path.join(AWK_ROOT, 'workflows');
            const wfDest = path.join(target, plat.dirs.workflows);

            // Backup existing workflows
            if (fs.existsSync(wfDest)) {
                const backupDir = getPlatformBackupRoot(platform);
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
                generateClineSkills(skillsSrc, skillsDest, coreSkills);
            } else if (platform === 'codex') {
                generateCodexSkills(skillsSrc, skillsDest, coreSkills);
                const agentsDest = path.join(target, plat.dirs.agents);
                generateCodexAgents(skillsSrc, agentsDest, coreSkills);
            } else if (platform === 'claude') {
                generateClaudeSkills(skillsSrc, skillsDest, coreSkills);
            } else {
                const skillCount = copySelectedSkillDirs(skillsSrc, skillsDest, coreSkills);
                ok(`${skillCount} core skill files installed`);
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
        const activePacks = [...new Set([...(previousState.enabledPacks || []), ...defaultPacks])].sort();

        for (const packName of activePacks) {
            if (defaultPacks.includes(packName)) continue;
            info(`Re-enabling preserved pack: ${packName}`);
            cmdEnablePack(packName, { autoMode: true });
        }

        const desiredSkills = getDesiredSkillSet(activePacks);

        if (plat.dirs.skills) {
            const skillsDest = path.join(target, plat.dirs.skills);
            const removedSkills = backupAndPruneManagedSkills(skillsDest, desiredSkills);
            if (removedSkills > 0) {
                ok(`${removedSkills} managed optional skill(s) archived from runtime`);
            }
        }

        writeInstallState({
            ...previousState,
            enabledPacks: activePacks
        }, platform);
        ok(`Install state saved (${desiredSkills.size} active skills)`);

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
        if (activePacks.length > 0) {
            dim(`Packs:      ${activePacks.join(', ')}`);
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
    } // End of platform loop
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
        cmdInstall(['--update']);
        return;
    }

    // 5. Offline fallback: compare AWK_VERSION (local repo) vs installed
    if (installedVersion === AWK_VERSION) {
        ok(`Already on latest version (v${AWK_VERSION}) — could not verify with npm`);
    } else {
        info(`Upgrading from v${installedVersion} → v${AWK_VERSION} (local only, npm unreachable)`);
        cmdInstall(['--update']);
    }
}

function cmdDoctor() {
    log('');
    log(`${C.cyan}${C.bold}🏥 AWK Health Check${C.reset}`);
    log('');

    let issues = 0;
    const installState = readInstallState();

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

        // Check expected skills based on manifest and enabled packs
        try {
            const expectedSkills = getDesiredSkillSet(installState.enabledPacks || []);
            let missingSkills = [];
            for (const s of expectedSkills) {
                if (!skills.includes(s)) missingSkills.push(s);
            }
            if (missingSkills.length > 0) {
                warn(`Missing ${missingSkills.length} expected skill(s): ${missingSkills.join(', ')}`); issues++;
            } else {
                ok('All expected skills are present');
            }
        } catch (e) {
            warn(`Failed to validate expected skills: ${e.message}`); issues++;
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

    log('');
    log(`${C.bold}Runtime Profile:${C.reset}`);
    log(`  Profile: ${C.cyan}${installState.profile}${C.reset}`);
    log(`  Optional packs: ${installState.enabledPacks?.length ? installState.enabledPacks.join(', ') : C.gray + 'none' + C.reset}`);

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
 * Handle browser-related tasks (e.g., cleaning up recordings).
 */
function cmdBrowser(args) {
    if (args[0] !== 'clean') {
        err('Unknown browser command. Use "awkit browser clean".');
        return;
    }

    const recordingsDir = path.join(TARGETS.antigravity, 'browser_recordings');

    log('');
    log(`${C.cyan}${C.bold}🧹 AWK Browser Cleanup${C.reset}`);
    log('');

    if (!fs.existsSync(recordingsDir)) {
        ok(`No browser_recordings directory found at ${recordingsDir}. Nothing to clean.`);
        return;
    }

    const files = fs.readdirSync(recordingsDir).filter(f => f.endsWith('.webm') || f.endsWith('.webp') || f.endsWith('.mp4'));
    if (files.length === 0) {
        ok('No browser recordings found. Nothing to clean.');
        return;
    }

    let keepDays = 7; // default 7 days
    const daysArgIdx = args.indexOf('--days');
    if (daysArgIdx !== -1 && args[daysArgIdx + 1]) {
        keepDays = parseInt(args[daysArgIdx + 1], 10);
    } else if (args.includes('--all')) {
        keepDays = 0;
    }

    if (keepDays === 0) {
        log(`Cleaning ${C.yellow}ALL${C.reset} browser recordings...`);
    } else {
        log(`Cleaning browser recordings older than ${C.yellow}${keepDays} days${C.reset}...`);
    }

    const now = Date.now();
    const cutoff = now - (keepDays * 24 * 60 * 60 * 1000);
    let deletedCount = 0;
    let totalSizeFreed = 0;

    for (const file of files) {
        const filePath = path.join(recordingsDir, file);
        try {
            const stats = fs.statSync(filePath);
            if (stats.mtimeMs < cutoff) {
                totalSizeFreed += stats.size;
                fs.unlinkSync(filePath);
                deletedCount++;
                dim(`Deleted: ${file}`);
            }
        } catch (e) {
            warn(`Failed to process ${file}: ${e.message}`);
        }
    }

    log('');
    const sizeMb = (totalSizeFreed / (1024 * 1024)).toFixed(2);
    if (deletedCount > 0) {
        ok(`Cleaned ${C.green}${C.bold}${deletedCount}${C.reset} recording(s).`);
        ok(`Freed ${C.green}${C.bold}${sizeMb} MB${C.reset} of disk space.`);
    } else {
        ok(`No recordings older than ${keepDays} days found. Disk space is already optimized.`);
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

    // 1. Copy pack skills into runtime.
    const packSkills = resolvePackSkillSources(packName);
    if (packSkills.length > 0) {
        for (const skill of packSkills) {
            const dest = path.join(TARGETS.antigravity, 'skills', skill.name);
            const n = copyDirRecursive(skill.src, dest);
            totalCount += n;
            dim(`Skill: ${skill.name} (${n} files)`);
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

    const state = readInstallState();
    const enabledPacks = new Set(state.enabledPacks || []);
    enabledPacks.add(packName);
    writeInstallState({
        ...state,
        enabledPacks: [...enabledPacks].sort()
    });

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

    const skillDirs = getPackSkillNames(packName);

    const target = path.join(TARGETS.antigravity, 'skills');
    const backupDir = path.join(getPlatformBackupRoot(), 'skills');
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
    const coreSkills = new Set(getDefaultRuntimeSkills());
    const coreSkillsSrc = path.join(AWK_ROOT, 'skills');
    const workflowTarget = path.join(TARGETS.antigravity, 'global_workflows');
    const workflowBackupDir = path.join(getPlatformBackupRoot(), 'workflows');
    const schemaTarget = path.join(TARGETS.antigravity, 'schemas');
    const schemaBackupDir = path.join(getPlatformBackupRoot(), 'schemas');

    for (const skillDir of skillDirs) {
        const destPath = path.join(target, skillDir);
        if (fs.existsSync(destPath)) {
            fs.renameSync(destPath, path.join(backupDir, skillDir));
            dim(`Moved to backup: ${skillDir}`);
        }

        if (coreSkills.has(skillDir)) {
            const srcPath = path.join(coreSkillsSrc, skillDir);
            if (fs.existsSync(path.join(srcPath, 'SKILL.md'))) {
                copyDirRecursive(srcPath, destPath);
                dim(`Restored core skill: ${skillDir}`);
            }
        }
    }

    if (!fs.existsSync(workflowBackupDir)) fs.mkdirSync(workflowBackupDir, { recursive: true });
    for (const workflowFile of getPackWorkflowNames(packName)) {
        const livePath = path.join(workflowTarget, workflowFile);
        if (!fs.existsSync(livePath)) continue;
        fs.renameSync(livePath, path.join(workflowBackupDir, workflowFile));
        dim(`Moved workflow to backup: ${workflowFile}`);
    }

    if (!fs.existsSync(schemaBackupDir)) fs.mkdirSync(schemaBackupDir, { recursive: true });
    for (const schemaFile of getPackSchemaNames(packName)) {
        const livePath = path.join(schemaTarget, schemaFile);
        if (!fs.existsSync(livePath)) continue;
        fs.renameSync(livePath, path.join(schemaBackupDir, schemaFile));
        dim(`Moved schema to backup: ${schemaFile}`);
    }

    const state = readInstallState();
    writeInstallState({
        ...state,
        enabledPacks: (state.enabledPacks || []).filter(name => name !== packName)
    });

    ok(`Skill pack "${packName}" disabled (skills backed up to ${backupDir})`);
}

function loadWorkModes() {
    const defaultsPath = path.join(AWK_ROOT, 'core', 'work-modes.json');
    const userPath = path.join(HOME, '.awkit_modes.json');
    const modes = readJsonFile(defaultsPath, { modes: {} }).modes || {};

    if (fs.existsSync(userPath)) {
        const userModes = readJsonFile(userPath, { modes: {} }).modes || {};
        for (const [key, val] of Object.entries(userModes)) {
            modes[key] = { ...modes[key], ...val };
        }
    }
    return modes;
}

function cmdMode(args = []) {
    const modes = loadWorkModes();
    const state = readInstallState();

    if (args.length === 0) {
        log('');
        log(`${C.cyan}${C.bold}🔄 AWK Work Modes${C.reset}`);
        log('');

        const active = state.activeMode;
        if (active && modes[active]) {
            log(`Current Mode: ${C.green}${C.bold}${active}${C.reset} - ${modes[active].description}`);
        } else {
            log(`Current Mode: ${C.yellow}core-only${C.reset}`);
        }
        log('');
        log(`${C.cyan}Available Modes:${C.reset}`);
        for (const [modeName, data] of Object.entries(modes)) {
            if (data.hidden && modeName !== active) continue;
            const marker = modeName === active ? `${C.green}▶${C.reset}` : ` `;
            log(` ${marker} ${C.green}${modeName.padEnd(15)}${C.reset} ${C.gray}${data.description}${C.reset}`);
        }
        log('');
        log(`${C.cyan}Commands:${C.reset}`);
        log(`  awkit mode <name>             Switch to a mode`);
        log(`  awkit mode --create <name> <pack1,pack2,...>`);
        log(`  awkit mode --delete <name>`);
        log(`  awkit mode --reset            Back to core-only`);
        log('');
        return;
    }

    const subCmd = args[0];

    if (subCmd === '--reset') {
        if (!state.activeMode) {
            info(`Already in core-only mode.`);
            return;
        }
        const activePacks = modes[state.activeMode]?.packs || [];
        for (const p of activePacks) cmdDisablePack(p);

        state.activeMode = null;
        writeInstallState(state);
        ok(`Disabled mode packs. Back to core-only.`);
        return;
    }

    if (subCmd === '--create') {
        const name = args[1];
        const packsList = args[2];
        if (!name || !packsList) {
            err(`Usage: awkit mode --create <name> <pack1,pack2,...>`);
            return;
        }
        const packs = packsList.split(',').map(s => s.trim()).filter(Boolean);
        const userPath = path.join(HOME, '.awkit_modes.json');
        const userConfig = readJsonFile(userPath, { version: 1, modes: {} }) || { version: 1, modes: {} };
        if (!userConfig.modes) userConfig.modes = {};
        userConfig.modes[name] = {
            description: "Custom user mode",
            packs
        };
        fs.writeFileSync(userPath, JSON.stringify(userConfig, null, 2));
        ok(`Created custom mode: ${name} with packs: ${packs.join(', ')}`);
        return;
    }

    if (subCmd === '--delete') {
        const name = args[1];
        const userPath = path.join(HOME, '.awkit_modes.json');
        if (fs.existsSync(userPath)) {
            const userConfig = readJsonFile(userPath, { version: 1, modes: {} });
            if (userConfig?.modes?.[name]) {
                delete userConfig.modes[name];
                fs.writeFileSync(userPath, JSON.stringify(userConfig, null, 2));
                ok(`Deleted custom mode: ${name}`);
            } else {
                err(`Mode '${name}' not found in user configs.`);
            }
        } else {
            err(`No user modes config found.`);
        }
        return;
    }

    // Switch mode
    const modeName = subCmd;
    if (!modes[modeName]) {
        err(`Work mode '${modeName}' not found.`);
        return;
    }

    info(`Switching to mode: ${modeName}`);

    const currentActive = state.activeMode;
    if (currentActive && currentActive !== modeName && modes[currentActive]) {
        const oldPacks = modes[currentActive].packs || [];
        // Disable packs that are not in the new mode to avoid toggling what we want to keep
        const newPacksSet = new Set(modes[modeName].packs || []);
        for (const p of oldPacks) {
            if (!newPacksSet.has(p)) {
                cmdDisablePack(p);
            }
        }
    }

    const newPacks = modes[modeName].packs || [];
    for (const p of newPacks) {
        cmdEnablePack(p, { autoMode: true });
    }

    const freshState = readInstallState();
    freshState.activeMode = modeName;
    writeInstallState(freshState);

    ok(`Successfully switched to mode: ${C.bold}${modeName}${C.reset}`);
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
        const configPath = path.join(packsDir, pack.name, 'pack.json');
        let desc = '';
        if (fs.existsSync(readmePath)) {
            const content = fs.readFileSync(readmePath, 'utf8');
            desc = content.split('\n').find(l => l.trim() && !l.startsWith('#')) || '';
        }
        if (!desc && fs.existsSync(configPath)) {
            const config = readJsonFile(configPath, {});
            desc = config.description || '';
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

function cmdStatus() {
    log('');
    log(`${C.cyan}${C.bold}📊 AWK Status — Repo vs Installed${C.reset}`);
    log('');

    const repoWfDir = path.join(AWK_ROOT, 'workflows');
    const liveWfDir = path.join(TARGETS.antigravity, 'global_workflows');
    const liveSkillDir = path.join(TARGETS.antigravity, 'skills');
    const installState = readInstallState();
    const expectedSkills = getDesiredSkillSet(installState.enabledPacks || []);

    // ── Workflows ──────────────────────────────────────────────────────────
    log(`${C.bold}Workflows:${C.reset}`);
    const repoWf = collectFileBasenames(repoWfDir);
    for (const packName of installState.enabledPacks || []) {
        for (const wf of getPackWorkflowNames(packName)) {
            repoWf.add(wf);
        }
    }
    const liveWf = collectFileBasenames(liveWfDir);

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
    const repoSkills = new Set(expectedSkills);
    const liveSkills = fs.existsSync(liveSkillDir)
        ? new Set(fs.readdirSync(liveSkillDir, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name))
        : new Set();

    const skillsOnlyRepo = [...repoSkills].filter(s => !liveSkills.has(s));
    const managedSkills = getManagedSkillNames();
    const skillsOnlyLive = [...liveSkills].filter(s => managedSkills.has(s) && !repoSkills.has(s));
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

    log(`  ${C.gray}Profile:${C.reset}         ${installState.profile}`);
    log(`  ${C.gray}Optional packs:${C.reset}  ${installState.enabledPacks?.length ? installState.enabledPacks.join(', ') : 'none'}`);

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

async function cmdAdmin() {
    info('Mở Symphony Dashboard...');
    try {
        const http = require('http');
        const isRunning = await new Promise((resolve) => {
            const req = http.get('http://localhost:3100', (res) => {
                resolve(true);
            }).on('error', () => {
                resolve(false);
            });
            req.setTimeout(1000, () => {
                req.destroy();
                resolve(false);
            });
        });

        if (!isRunning) {
            info('Symphony service chưa chạy. Đang khởi động ngầm...');
            const { spawn } = require('child_process');
            const child = spawn('symphony', ['start'], {
                detached: true,
                stdio: 'ignore'
            });
            child.unref();

            info('Vui lòng đợi 3 giây để service khởi động...');
            await new Promise(r => setTimeout(r, 3000));
        }

        try {
            execSync('symphony dashboard', { stdio: 'inherit' });
        } catch (_) {
            err('Không thể mở Symphony Dashboard.');
        }
    } catch (e) {
        err('Không thể khởi động Symphony Dashboard.');
        dim('Vui lòng cài đặt: npm install -g @leejungkiin/awkit-symphony');
    }
}

async function cmdRestart() {
    info('Đang restart service awkit (Symphony)...');
    try {
        const { execSync, spawn } = require('child_process');
        try {
            // Find and kill process on port 3100
            const pids = execSync('lsof -t -i:3100').toString().trim().split('\n');
            for (const pid of pids) {
                if (pid) {
                    process.kill(parseInt(pid, 10), 'SIGTERM');
                }
            }
            info('Đã dừng service hiện tại.');
        } catch (e) {
            // Probably no process running on port 3100
            dim('Không tìm thấy service đang chạy.');
        }

        await new Promise(r => setTimeout(r, 1000));

        // Auto-build production bundle so code changes take effect
        const symphonyDir = path.join(AWK_ROOT, '..', 'symphony');
        if (fs.existsSync(path.join(symphonyDir, 'package.json'))) {
            info('Đang build production bundle...');
            try {
                execSync('npm run build', { cwd: symphonyDir, stdio: 'pipe' });
                log(`${C.green}✅ Build thành công!${C.reset}`);
            } catch (buildErr) {
                warn('Build thất bại, sử dụng bundle cũ.');
                dim(buildErr.message?.slice(0, 200));
            }
        }

        info('Đang khởi động lại service ngầm...');
        const child = spawn('symphony', ['start'], {
            detached: true,
            stdio: 'ignore'
        });
        child.unref();

        info('Vui lòng đợi 3 giây để service khởi động...');
        await new Promise(r => setTimeout(r, 3000));

        log(`${C.green}✅ Restart thành công!${C.reset}`);
    } catch (e) {
        err('Lỗi khi restart service: ' + e.message);
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
    log(`  ${C.gray}             CODEBASE.md, thiết lập router (AGENTS.md, CLAUDE.md)${C.reset}`);
    log('');

    // Maintenance
    log(`${C.bold}🧹  Maintenance${C.reset}`);
    log(line);
    log(`  ${C.green}serve${C.reset} [dir] [-p <port>] Start local HTTP server for assets in CWD`);
    log(`  ${C.green}browser clean${C.reset}       Clean browser recordings`);
    log(`  ${C.gray}  --days <N>${C.reset}         Keep recordings from last N days (default: 7)`);
    log(`  ${C.gray}  --all${C.reset}              Delete all recordings`);
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
    log(`${C.bold}📦  Skill Packs & Modes${C.reset}`);
    log(line);
    log(`  ${C.green}mode${C.reset}                Show active mode & list modes`);
    log(`  ${C.green}mode <name>${C.reset}         Switch to a work mode`);
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
    log(`  ${C.gray}awkit install        # Active platform only${C.reset}`);
    log(`  ${C.gray}awkit install --all  # All supported platforms${C.reset}`);
    log(`  ${C.gray}awkit doctor${C.reset}`);
    log('');
    log(`  ${C.cyan}# Daily usage${C.reset}`);
    log(`  ${C.gray}awkit status       # What's out of sync?${C.reset}`);
    log(`  ${C.gray}awkit harvest      # Pull live edits → repo${C.reset}`);
    log(`  ${C.gray}awkit sync         # harvest + install in one shot${C.reset}`);
    log('');
    log(`  ${C.cyan}# Enable Marketing Skills${C.reset}`);
    log(`  ${C.gray}awkit enable-pack marketing${C.reset}`);
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
        _comments: {
            projectId: 'Auto-generated. DO NOT change — used by Symphony for task scoping.',
            trello: 'Fill in your Trello board/list/card names. Run "awkit trello info" to verify.',
        },
        projectName,
        projectId: bundleBase,
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
        trello: {
            board: 'Your Board Name',
            list: 'Your List Name',
            card: 'Your Card Name',
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
 *   Router files (AGENTS.md, CLAUDE.md)
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

    // ── 3.5. Trello config (embedded in .project-identity) ──────────────────────
    // Migration: If .trello-config.json exists but identity has no trello key, merge it in
    const trelloConfigPath = path.join(cwd, '.trello-config.json');
    if (fs.existsSync(trelloConfigPath)) {
        try {
            const oldCfg = JSON.parse(fs.readFileSync(trelloConfigPath, 'utf8'));
            const currentIdentity = JSON.parse(fs.readFileSync(identityPath, 'utf8'));
            if (!currentIdentity.trello) {
                currentIdentity.trello = {
                    board: oldCfg.BOARD_NAME || oldCfg.board || 'Your Board Name',
                    list: oldCfg.LIST_NAME || oldCfg.list || 'Your List',
                    card: oldCfg.CARD_NAME || oldCfg.card || 'Your Card',
                };
                fs.writeFileSync(identityPath, JSON.stringify(currentIdentity, null, 2) + '\n');
                ok('Migrated Trello config from .trello-config.json → .project-identity');
                dim('You can safely delete .trello-config.json now.');
            }
        } catch (_) { /* ignore migration errors */ }
    } else {
        // Ensure identity has trello placeholder if not already present
        try {
            const currentIdentity = JSON.parse(fs.readFileSync(identityPath, 'utf8'));
            if (!currentIdentity.trello) {
                currentIdentity.trello = {
                    board: 'Your Board Name',
                    list: 'Your List',
                    card: 'Your Card',
                };
                fs.writeFileSync(identityPath, JSON.stringify(currentIdentity, null, 2) + '\n');
                ok('Added Trello config placeholder to .project-identity');
            }
        } catch (_) { /* ignore */ }
    }

    // ── 3.6. Automation config migration ─────────────────────────────────────────
    try {
        const currentIdentity = JSON.parse(fs.readFileSync(identityPath, 'utf8'));
        if (!currentIdentity.automation) {
            currentIdentity.automation = {
                telegram: {
                    enabled: true,
                    chatId: "",
                    topicId: "",
                    triggers: { git_push: true, task_complete: false, deploy: true }
                },
                trello: {
                    enabled: true,
                    autoSync: true,
                    triggers: { task_complete: true, milestone: true, blocked: true }
                },
                git: {
                    autoCommit: true,
                    autoPush: true
                }
            };
            fs.writeFileSync(identityPath, JSON.stringify(currentIdentity, null, 2) + '\n');
            ok('Added Automation config placeholder to .project-identity');
        }
    } catch (_) { /* ignore */ }

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

    // ── 4.1. IDE Agent Router Files (AGENTS.md & CLAUDE.md) ───────────────────
    const agentRouterContent = `# AI Agent Strategy
> **NOTICE:** This project uses Antigravity (AWKit) as the central orchestrator.
> All core system rules, behaviors, and workflows are defined globally.

**CRITICAL INSTRUCTION FOR ALL AI AGENTS:**
Before reading any other context or starting work, you MUST read the global system instructions file located at:

\`\`\`bash
cat ~/.gemini/antigravity/GEMINI.md
\`\`\`

If you cannot read the file directly, you must ask the user to provide its contents. 
Please follow ALL rules defined in that global file.

Additional project context can be found in:
- \`.project-identity\`
- \`CODEBASE.md\`
`;

    const routerFiles = ['AGENTS.md', 'CLAUDE.md'];
    for (const file of routerFiles) {
        const filePath = path.join(cwd, file);
        if (fs.existsSync(filePath)) {
            const bakPath = path.join(cwd, `${file}.bak`);
            fs.copyFileSync(filePath, bakPath);
            warn(`Backed up existing ${file} to ${file}.bak`);
        }
        info(`Creating ${file} (Router to GEMINI.md)...`);
        fs.writeFileSync(filePath, agentRouterContent);
        ok(`${file} created/updated`);
    }

    // ── 4.2. Help Documentation (help.html) ───────────────────────────────────
    const helpPath = path.join(cwd, 'help.html');
    if (fs.existsSync(helpPath) && !forceFlag) {
        warn('help.html already exists — skipping (use --force to overwrite)');
    } else {
        info('Creating help.html...');
        const tmplHelpPath = path.join(AWK_ROOT, 'templates', 'help.html');
        if (fs.existsSync(tmplHelpPath)) {
            fs.copyFileSync(tmplHelpPath, helpPath);
            ok('help.html created');
        } else {
            warn('Template help.html not found, skipped.');
        }
    }

    // ── 4.5. .gitignore ────────────────────────────────────────────────────────
    const gitignorePath = path.join(cwd, '.gitignore');
    const ignoreRules = ['log.txt', 'tmp/', '.gitnexus/', 'node_modules/'];

    if (fs.existsSync(gitignorePath)) {
        let content = fs.readFileSync(gitignorePath, 'utf8');
        let added = 0;
        for (const rule of ignoreRules) {
            // Very simple check to avoid duplicates, might not be perfect for regexes but good for simple literal paths.
            if (!content.includes(rule)) {
                if (!content.endsWith('\n') && content.length > 0 && added === 0) content += '\n';
                content += `${rule}\n`;
                added++;
            }
        }
        if (added > 0) {
            fs.writeFileSync(gitignorePath, content);
            ok('Updated .gitignore with AWKit ignore rules');
        } else {
            dim('.gitignore already has AWKit ignore rules');
        }
    } else {
        info('Creating .gitignore...');
        fs.writeFileSync(gitignorePath, ignoreRules.join('\n') + '\n');
        ok('.gitignore created');
    }

    // ── 5. Symphony CLI Initialization ───────────────────────────────────────────
    info('Checking Symphony CLI...');
    const symReady = checkSymphony({ silent: true });
    if (!symReady) {
        info('Symphony CLI is not installed. Installing automatically...');
        try {
            execSync('npm install -g @leejungkiin/awkit-symphony', { stdio: 'inherit' });
            ok('Symphony CLI installed successfully.');
        } catch (e) {
            err('Failed to auto-install Symphony CLI.');
            dim('Please install manually: npm i -g @leejungkiin/awkit-symphony');
        }
    } else {
        ok('Symphony CLI is ready.');
    }

    // ── 5.5. GitNexus: Code Intelligence Index ──────────────────────────────
    info('Indexing codebase with GitNexus...');
    try {
        // Only index if there are actual source files
        const hasSource = execSync(
            `find . -maxdepth 4 \\( -name "*.swift" -o -name "*.kt" -o -name "*.ts" -o -name "*.js" -o -name "*.dart" -o -name "*.py" \\) -not -path "*/node_modules/*" -not -path "*/.build/*" -not -path "*/Pods/*" | head -1`,
            { cwd, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
        ).trim();

        if (hasSource) {
            execSync('npx -y gitnexus analyze', {
                cwd,
                stdio: 'ignore',
            });
            ok('GitNexus index created (.gitnexus/)');
        } else {
            dim('No source files found — skipping GitNexus index (run later: npx gitnexus analyze)');
        }
    } catch (e) {
        warn(`GitNexus indexing failed: ${e.message}`);
        dim('Run manually later: npx gitnexus analyze');
    }

    // ── 6. Summary ─────────────────────────────────────────────────────────────
    log('');
    log(`${C.gray}${'─'.repeat(56)}${C.reset}`);
    log(`${C.yellow}${C.bold}🎉 ${projectName} initialized!${C.reset}`);
    log('');
    dim(`Type:       ${projectType}`);
    dim(`Firebase:   analytics, crashlytics, remote-config, auth`);
    dim(`Files:      .project-identity, ${workspaceName}, CODEBASE.md`);
    dim(`Symphony:     task tracking ready`);
    dim(`GitNexus:   code intelligence index`);
    log('');
    log(`${C.cyan}👉 Open ${workspaceName} in VS Code to get started.${C.reset}`);
    log(`${C.cyan}👉 Run '/codebase-sync' in AI chat to keep CODEBASE.md updated.${C.reset}`);
    log(`${C.cyan}👉 Run 'symphony task list' to manage tasks.${C.reset}`);
    log(`${C.cyan}👉 Run 'npx gitnexus analyze' after major changes to refresh index.${C.reset}`);
    log('');

    // ── 7. Open Documentation ───────────────────────────────────────────────────
    try {
        const platform = process.platform;
        let openCmd = 'xdg-open';
        if (platform === 'darwin') openCmd = 'open';
        else if (platform === 'win32') openCmd = 'start ""';

        execSync(`${openCmd} "help.html"`, { cwd, stdio: 'ignore' });
        dim('Opened help.html in browser');
    } catch (e) {
        // Silently ignore if opening fails
    }
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

    // Apply .project-identity automation overrides
    const pjPath = path.join(process.cwd(), '.project-identity');
    if (fs.existsSync(pjPath)) {
        try {
            const pj = JSON.parse(fs.readFileSync(pjPath, 'utf8'));
            if (pj?.automation?.telegram) {
                const tgAuto = pj.automation.telegram;
                if (tgAuto.enabled === false) {
                    dim('Telegram notifications are disabled for this project (.project-identity).');
                    return;
                }
                if (tgAuto.chatId) chatId = tgAuto.chatId;
                if (tgAuto.topicId) topicId = tgAuto.topicId;
            }
        } catch (e) { }
    }

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

// ─── Credentials Management ───────────────────────────────────────────────────

const CREDENTIALS_CONFIG_PATH = path.join(TARGETS.antigravity, '.credentials.json');

function credentialsLoad() {
    if (!fs.existsSync(CREDENTIALS_CONFIG_PATH)) return {};
    try {
        return JSON.parse(fs.readFileSync(CREDENTIALS_CONFIG_PATH, 'utf8'));
    } catch (_) {
        return {};
    }
}

function credentialsSave(config) {
    const dir = path.dirname(CREDENTIALS_CONFIG_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(CREDENTIALS_CONFIG_PATH, JSON.stringify(config, null, 2) + '\n');
}

function credentialsHelp() {
    log('');
    log(`${C.cyan}${C.bold}🔑 Credentials Commands${C.reset}`);
    log('');
    log(`  ${C.green}awkit credentials list${C.reset}                    List all stored credentials`);
    log(`  ${C.green}awkit credentials set${C.reset} <key> <value>       Set a credential`);
    log(`  ${C.green}awkit credentials get${C.reset} <key>              Get a credential value`);
    log(`  ${C.green}awkit credentials remove${C.reset} <key>           Remove a credential`);
    log(`  ${C.green}awkit credentials setup${C.reset}                   Interactive setup wizard`);
    log('');
    log(`  ${C.gray}Known keys: gemini_api_key, lucylab_bearer${C.reset}`);
    log(`  ${C.gray}Config: ${CREDENTIALS_CONFIG_PATH}${C.reset}`);
    log('');
}

async function credentialsSetup() {
    log('');
    log(`${C.cyan}${C.bold}🔑 API Credentials Setup${C.reset}`);
    log('');
    log(`${C.gray}  Credentials are stored in: ${CREDENTIALS_CONFIG_PATH}${C.reset}`);
    log(`${C.gray}  Used by Short Maker, Symphony Admin, and other services.${C.reset}`);
    log('');

    const readline = require('readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const question = (query) => new Promise(resolve => rl.question(query, resolve));
    const sanitize = (s) => s.trim().replace(/^bearer\s+/i, '').replace(/\s+/g, '');

    const config = credentialsLoad();

    try {
        // Gemini API Key
        log(`${C.gray}  Get your key at: https://aistudio.google.com/apikey${C.reset}`);
        const geminiKey = sanitize(await question(`  ${C.yellow}Gemini API Key${config.gemini_api_key ? ` [${config.gemini_api_key.slice(0, 8)}...]` : ''}: ${C.reset}`));
        if (geminiKey) {
            config.gemini_api_key = geminiKey;
            ok('Gemini API Key saved');
        } else if (config.gemini_api_key) {
            dim('Kept existing Gemini API Key');
        }

        log('');

        // LucyLab Bearer
        log(`${C.gray}  LucyLab TTS bearer token for voice generation${C.reset}`);
        const lucylabToken = sanitize(await question(`  ${C.yellow}LucyLab Bearer${config.lucylab_bearer ? ` [${config.lucylab_bearer.slice(0, 8)}...]` : ''}: ${C.reset}`));
        if (lucylabToken) {
            config.lucylab_bearer = lucylabToken;
            ok('LucyLab Bearer saved');
        } else if (config.lucylab_bearer) {
            dim('Kept existing LucyLab Bearer');
        }

        credentialsSave(config);
        log('');
        ok(`Credentials saved to ${CREDENTIALS_CONFIG_PATH}`);
        log('');
    } catch (e) {
        warn(`Failed to setup credentials: ${e.message}`);
    } finally {
        rl.close();
    }
}

function cmdCredentials(args) {
    const subCmd = args[0];
    const key = args[1];
    const value = args.slice(2).join(' ');

    switch (subCmd) {
        case 'list': {
            const config = credentialsLoad();
            const keys = Object.keys(config);
            if (keys.length === 0) {
                warn('No credentials stored. Run "awkit credentials setup" to configure.');
                return;
            }
            log('');
            log(`${C.cyan}${C.bold}🔑 Stored Credentials${C.reset}`);
            log('');
            for (const k of keys) {
                const val = config[k];
                const masked = val ? `${val.slice(0, 8)}${'•'.repeat(Math.max(0, val.length - 8))}` : '(empty)';
                log(`  ${C.green}${k}${C.reset} = ${C.gray}${masked}${C.reset}`);
            }
            log('');
            dim(`Config: ${CREDENTIALS_CONFIG_PATH}`);
            log('');
            break;
        }

        case 'set': {
            let valueToSet = value;
            if (valueToSet) {
                valueToSet = valueToSet.trim().replace(/^bearer\s+/i, '').replace(/\s+/g, '');
            }
            if (!key || !valueToSet) {
                err('Usage: awkit credentials set <key> <value>');
                dim('Example: awkit credentials set gemini_api_key AIzaSy...');
                return;
            }
            const config = credentialsLoad();
            config[key] = valueToSet;
            credentialsSave(config);
            ok(`${key} saved ✅`);
            break;
        }

        case 'get': {
            if (!key) {
                err('Usage: awkit credentials get <key>');
                return;
            }
            const config = credentialsLoad();
            if (config[key]) {
                log(config[key]);
            } else {
                warn(`Key "${key}" not found.`);
            }
            break;
        }

        case 'remove':
        case 'delete': {
            if (!key) {
                err('Usage: awkit credentials remove <key>');
                return;
            }
            const config = credentialsLoad();
            if (config[key]) {
                delete config[key];
                credentialsSave(config);
                ok(`${key} removed`);
            } else {
                warn(`Key "${key}" not found.`);
            }
            break;
        }

        case 'setup':
            credentialsSetup();
            break;

        default:
            credentialsHelp();
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
 * Load Trello project config from .project-identity (preferred) or .trello-config.json (fallback).
 * Returns { board, list, card } or null.
 */
function trelloLoadProjectConfig() {
    // 1. Try .project-identity → trello key
    const identityPath = path.join(process.cwd(), '.project-identity');
    if (fs.existsSync(identityPath)) {
        try {
            const identity = JSON.parse(fs.readFileSync(identityPath, 'utf8'));
            if (identity.trello) {
                const t = identity.trello;
                const board = t.board || t.BOARD_NAME;
                const list = t.list || t.LIST_NAME;
                const card = t.card || t.CARD_NAME;
                if (board && list && card) {
                    return { board, list, card };
                }
            }
        } catch (_) { /* ignore parse error */ }
    }

    // 2. Fallback: .trello-config.json
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
        err('Trello config not found. Add "trello" key to .project-identity or create .trello-config.json.');
        log(`  Run ${C.cyan}awkit init${C.reset} to set up, or add manually to .project-identity.`);
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
    log(`  ${C.green}awkit trello info${C.reset}                 Show card details`);
    log(`  ${C.green}awkit trello checklists${C.reset}           List checklists on card`);
    log(`  ${C.green}awkit trello comments${C.reset}             List comments on card`);
    log('');
    log(`  ${C.gray}Credentials: env vars TRELLO_KEY and TRELLO_TOKEN${C.reset}`);
    log(`  ${C.gray}Project config: "trello" key in .project-identity (fallback: .trello-config.json)${C.reset}`);
    log('');
}

function cmdTrello(args) {
    const subCmd = args[0];
    const text = args.slice(1).join(' ');

    if (!subCmd || subCmd === 'help' || subCmd === '--help' || subCmd === '-h') {
        trelloHelp();
        return;
    }

    const noTextCmds = ['info', 'checklists', 'comments'];
    if (!text && !noTextCmds.includes(subCmd)) {
        err(`Missing argument for 'trello ${subCmd}'. Usage: awkit trello ${subCmd} <text>`);
        return;
    }

    switch (subCmd) {
        case 'info':
            info(`Fetching card details...`);
            trelloExec(['card:show']);
            break;

        case 'checklists':
            info(`Fetching card checklists...`);
            trelloExec(['card:checklists']);
            break;

        case 'comments':
            info(`Fetching card comments...`);
            trelloExec(['card:comments']);
            break;

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

// ─── Native HTTP Server ───────────────────────────────────────────────────────

function cmdServe(args) {
    const http = require('http');

    let port = 8080;
    let serveDir = process.cwd();

    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--port' || args[i] === '-p') {
            port = parseInt(args[++i], 10) || 8080;
        } else if (!args[i].startsWith('-')) {
            serveDir = path.resolve(process.cwd(), args[i]);
        }
    }

    if (!fs.existsSync(serveDir)) {
        err(`Directory not found: ${serveDir}`);
        return;
    }

    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.wav': 'audio/wav',
        '.mp4': 'video/mp4',
        '.woff': 'application/font-woff',
        '.ttf': 'application/font-ttf',
        '.eot': 'application/vnd.ms-fontobject',
        '.otf': 'application/font-otf',
        '.wasm': 'application/wasm'
    };

    const server = http.createServer((request, response) => {
        response.setHeader('Access-Control-Allow-Origin', '*');
        response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (request.method === 'OPTIONS') {
            response.writeHead(200);
            response.end();
            return;
        }

        let filePath = '.' + request.url.split('?')[0];
        if (filePath === './') {
            filePath = './index.html';
        }

        const absPath = path.join(serveDir, filePath);
        const extname = String(path.extname(absPath)).toLowerCase();
        const contentType = mimeTypes[extname] || 'application/octet-stream';

        fs.readFile(absPath, (error, content) => {
            if (error) {
                if (error.code === 'ENOENT') {
                    response.writeHead(404, { 'Content-Type': 'text/plain' });
                    response.end('404 Not Found', 'utf-8');
                } else {
                    response.writeHead(500, { 'Content-Type': 'text/plain' });
                    response.end('500 Internal Server Error: ' + error.code, 'utf-8');
                }
            } else {
                response.writeHead(200, { 'Content-Type': contentType });
                response.end(content, 'utf-8');
            }
        });
    });

    server.listen(port, '0.0.0.0', () => {
        log('');
        log(`${C.cyan}${C.bold}🚀 awkit serve running at:${C.reset}`);
        log(`${C.green}   http://localhost:${port}${C.reset}`);
        dim(`Serving directory: ${serveDir}`);
        dim(`Press Ctrl+C to stop`);
        log('');
    }).on('error', (e) => {
        if (e.code === 'EADDRINUSE') {
            err(`Port ${port} is already in use. Try a different port with --port <number>`);
        } else {
            err(`Server error: ${e.message}`);
        }
    });
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
            cmdInstall(args);
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
        case 'browser':
            cmdBrowser(args);
            break;
        case 'mode':
            cmdMode(args);
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
        case 'credentials':
        case 'creds':
            cmdCredentials(args);
            break;
        case 'serve':
            cmdServe(args);
            break;
        case 'admin':
            cmdAdmin();
            break;
        case 'restart':
            await cmdRestart();
            break;
        case 'help':
        case '--help':
        case '-h':
        default:
            cmdHelp();
            break;
    }
})();
