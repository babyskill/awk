#!/usr/bin/env node

/**
 * AWK v1.0 CLI — Antigravity Workflow Kit
 * Unified installer, updater, and manager for AI agent workflows.
 * 
 * Usage:
 *   awkit install        Install AWK into ~/.gemini/antigravity/
 *   awkit uninstall      Remove AWK from system
 *   awkit update         Update to latest version
 *   awkit sync           Harvest from ~/.gemini/ then install (full sync)
 *   awkit status         Compare repo vs installed files (diff view)
 *   awkit harvest        Pull from ~/.gemini/antigravity/ into repo
 *   awkit doctor         Check installation health
 *   awkit enable-pack    Enable a skill pack
 *   awkit disable-pack   Disable a skill pack
 *   awkit list-packs     List available skill packs
 *   awkit version        Show current version
 * 
 * Created by Kien AI
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');

// ─── Constants ────────────────────────────────────────────────────────────────

const AWK_VERSION = fs.readFileSync(path.join(__dirname, '..', 'VERSION'), 'utf8').trim();
const AWK_ROOT = path.join(__dirname, '..');
const HOME = process.env.HOME || process.env.USERPROFILE;

const TARGETS = {
    antigravity: path.join(HOME, '.gemini', 'antigravity'),
    geminiMd: path.join(HOME, '.gemini', 'GEMINI.md'),
    versionFile: path.join(HOME, '.gemini', 'awk_version'),
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

function cmdInstall() {
    log('');
    log(`${C.cyan}${C.bold}╔══════════════════════════════════════════════════════════╗${C.reset}`);
    log(`${C.cyan}${C.bold}║     🚀 AWK v${AWK_VERSION} — Antigravity Workflow Kit        ║${C.reset}`);
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
    const wfSrc = path.join(AWK_ROOT, 'workflows');
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
    const agentsSrc = path.join(AWK_ROOT, 'core', 'AGENTS.md');
    const agentsDest = path.join(target, 'global_workflows', 'AGENTS.md');
    if (fs.existsSync(agentsSrc)) {
        fs.copyFileSync(agentsSrc, agentsDest);
        ok('AGENTS.md installed');
    }

    // 5. Copy skills
    info('Installing skills...');
    const skillsSrc = path.join(AWK_ROOT, 'skills');
    const skillsDest = path.join(target, 'skills');
    const skillCount = copyDirRecursive(skillsSrc, skillsDest);
    ok(`${skillCount} skill files installed`);

    // 6. Copy orchestrator
    const orchSrc = path.join(AWK_ROOT, 'core', 'orchestrator.md');
    const orchDestDir = path.join(target, 'skills', 'orchestrator');
    if (!fs.existsSync(orchDestDir)) fs.mkdirSync(orchDestDir, { recursive: true });
    fs.copyFileSync(orchSrc, path.join(orchDestDir, 'SKILL.md'));
    ok('Orchestrator skill installed');

    // 7. Copy schemas (always overwrite)
    info('Installing schemas...');
    const schemaSrc = path.join(AWK_ROOT, 'schemas');
    const schemaDest = path.join(target, 'schemas');
    const schemaCount = copyDirRecursive(schemaSrc, schemaDest);
    ok(`${schemaCount} schemas installed`);

    // 8. Copy templates (don't overwrite existing)
    info('Installing templates...');
    const tmplSrc = path.join(AWK_ROOT, 'templates');
    const tmplDest = path.join(target, 'templates');
    const tmplCount = copyDirRecursive(tmplSrc, tmplDest, { overwrite: false });
    ok(`${tmplCount} templates installed`);

    // 9. Save version
    fs.writeFileSync(TARGETS.versionFile, AWK_VERSION);
    ok(`Version ${AWK_VERSION} saved`);

    // 10. Install default skill packs
    const defaultPacks = installDefaultPacks();

    // 11. Summary
    log('');
    log(`${C.gray}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${C.reset}`);
    log(`${C.yellow}${C.bold}🎉 AWK v${AWK_VERSION} installed successfully!${C.reset}`);
    log('');
    dim(`Workflows:  ${path.join(target, 'global_workflows')}`);
    dim(`Skills:     ${path.join(target, 'skills')}`);
    dim(`Schemas:    ${path.join(target, 'schemas')}`);
    dim(`Templates:  ${path.join(target, 'templates')}`);
    dim(`GEMINI.md:  ${TARGETS.geminiMd}`);
    if (defaultPacks.length > 0) {
        dim(`Packs:      ${defaultPacks.join(', ')} (auto-enabled)`);
    }
    log('');
    log(`${C.cyan}👉 Type '/plan' in your AI chat to get started.${C.reset}`);
    log(`${C.cyan}👉 Run 'awk doctor' to verify installation.${C.reset}`);
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
        cmdEnablePack(pack.name);
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
    info(`Updating to AWK v${AWK_VERSION}...`);

    // Check current version
    let currentVersion = '0.0.0';
    if (fs.existsSync(TARGETS.versionFile)) {
        currentVersion = fs.readFileSync(TARGETS.versionFile, 'utf8').trim();
    }

    if (currentVersion === AWK_VERSION) {
        ok(`Already on latest version (${AWK_VERSION})`);
        return;
    }

    info(`Upgrading from ${currentVersion} → ${AWK_VERSION}`);
    cmdInstall();
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
        const essentialSkills = ['orchestrator', 'beads-manager', 'awf-session-restore'];
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
            warn(`Package version (${AWK_VERSION}) differs from installed (${v}). Run 'awk update'.`);
        }
    } else {
        warn('Version file missing. Run "awk install" first.'); issues++;
    }

    // Summary
    log('');
    if (issues === 0) {
        log(`${C.green}${C.bold}✅ All checks passed! AWK is healthy.${C.reset}`);
    } else {
        log(`${C.yellow}${C.bold}⚠️  ${issues} issue(s) found. Run 'awk install' to fix.${C.reset}`);
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
 * Handle pack requirements defined in pack.json:
 * - Check pip packages (with Python version detection)
 * - Prompt to install if missing
 * - Run post_install steps
 * - Show MCP setup instructions
 */
function handlePackRequirements(packSrc, packName) {
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

        const doInstall = promptYN(`   Install now? (${installCmd})`);
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
                        err(`Installation failed even with --user.`);
                        log('');
                        log(`${C.yellow}   Options:${C.reset}`);
                        log(`${C.gray}   1. ${installCmd} --break-system-packages${C.reset}`);
                        log(`${C.gray}   2. brew install pipx && pipx install ${req.package}${C.reset}`);
                        log(`${C.gray}   3. python3 -m venv ~/.venv && source ~/.venv/bin/activate${C.reset}`);
                        log(`${C.gray}      pip install ${req.package}${C.reset}`);
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

        if (step.optional) {
            const doRun = promptYN(`   Run now? (${step.cmd})`);
            if (!doRun) {
                dim(`Skipped. Run manually: ${step.cmd}`);
                continue;
            }
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

function cmdEnablePack(packName) {
    if (!packName) {
        err('Usage: awk enable-pack <pack-name>');
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
    handlePackRequirements(packSrc, packName);

    log('');
    log(`${C.cyan}👉 Skills available: type skill name in your AI chat.${C.reset}`);
    log(`${C.cyan}👉 Workflows available: use /nm-recall, /memory-audit, etc.${C.reset}`);
    log(`${C.cyan}👉 Run 'awk doctor' to verify installation.${C.reset}`);
}

function cmdDisablePack(packName) {
    if (!packName) {
        err('Usage: awk disable-pack <pack-name>');
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
    log(`${C.cyan}Usage: awk enable-pack <name>${C.reset}`);
    log('');
}

function cmdVersion() {
    log(`AWK v${AWK_VERSION}`);
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
        log(`  ${C.yellow}⬆  Repo only:${C.reset}      ${onlyInRepo.length} → run 'awk install' to deploy`);
        onlyInRepo.forEach(f => log(`${C.gray}     + ${f}${C.reset}`));
    }
    if (onlyInLive.length > 0) {
        log(`  ${C.cyan}⬇  Live only:${C.reset}      ${onlyInLive.length} → run 'awk harvest' to pull`);
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
        log(`  ${C.yellow}⬆  Repo only:${C.reset}      ${skillsOnlyRepo.length} → run 'awk install'`);
        skillsOnlyRepo.forEach(s => log(`${C.gray}     + ${s}${C.reset}`));
    }
    if (skillsOnlyLive.length > 0) {
        log(`  ${C.cyan}⬇  Live only:${C.reset}      ${skillsOnlyLive.length} → run 'awk harvest'`);
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
        log(`  ${C.yellow}⚠️  Run 'awk install' to sync versions.${C.reset}`);
    }

    log('');
    log(`${C.gray}Tip: 'awk sync' = harvest (pull live→repo) + install (push repo→live)${C.reset}`);
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
    log(`  ${C.green}doctor${C.reset}              Check installation health`);
    log('');

    // Sync
    log(`${C.bold}🔄  Sync${C.reset}`);
    log(line);
    log(`  ${C.green}status${C.reset}              Compare repo vs installed (diff view)`);
    log(`  ${C.green}harvest${C.reset}             Pull live edits from ~/.gemini/ → repo`);
    log(`  ${C.green}sync${C.reset}                Full sync: harvest + install (one shot)`);
    log('');

    // Packs
    log(`${C.bold}📦  Skill Packs${C.reset}`);
    log(line);
    log(`  ${C.green}list-packs${C.reset}          List available skill packs`);
    log(`  ${C.green}enable-pack${C.reset} <name>  Install a skill pack`);
    log(`  ${C.green}disable-pack${C.reset} <name> Uninstall a skill pack (backed up)`);
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
    log(`  ${C.gray}npm install -g github:babyskill/awk${C.reset}`);
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
    case 'help':
    case '--help':
    case '-h':
    default:
        cmdHelp();
        break;
}
