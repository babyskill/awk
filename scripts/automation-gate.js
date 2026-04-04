#!/usr/bin/env node

/**
 * Automation Gate — Enforces .project-identity automation config.
 *
 * Reads automation.git / automation.trello / automation.telegram from
 * .project-identity BEFORE executing any operation. Blocks if disabled.
 *
 * Usage (via awkit CLI):
 *   awkit gate git commit "feat: add feature"
 *   awkit gate git push
 *   awkit gate git auto "feat: add feature"
 *   awkit gate trello complete "Task name"
 *   awkit gate trello comment "Note"
 *   awkit gate telegram send "Message"
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ─── Color helpers (borrowed from main CLI) ──────────────────────────────────

const C = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    gray: '\x1b[90m',
    bold: '\x1b[1m',
};

const log = (msg) => console.log(msg);
const ok = (msg) => log(`${C.green}✔${C.reset} ${msg}`);
const warn = (msg) => log(`${C.yellow}⚠${C.reset} ${msg}`);
const err = (msg) => log(`${C.red}✖${C.reset} ${msg}`);
const info = (msg) => log(`${C.cyan}ℹ${C.reset} ${msg}`);
const dim = (msg) => log(`${C.gray}${msg}${C.reset}`);

// ─── .project-identity reader ─────────────────────────────────────────────────

/**
 * Walk up directories from `startDir` to find .project-identity.
 * Returns parsed JSON or null.
 */
function readProjectIdentity(startDir = process.cwd()) {
    let dir = path.resolve(startDir);
    const root = path.parse(dir).root;

    while (dir !== root) {
        const candidate = path.join(dir, '.project-identity');
        if (fs.existsSync(candidate)) {
            try {
                return JSON.parse(fs.readFileSync(candidate, 'utf8'));
            } catch (e) {
                warn(`Failed to parse ${candidate}: ${e.message}`);
                return null;
            }
        }
        dir = path.dirname(dir);
    }
    return null;
}

// ─── Gate checker ─────────────────────────────────────────────────────────────

/**
 * Check if an automation action is allowed.
 *
 * @param {string} domain - 'git' | 'trello' | 'telegram'
 * @param {string} action - Domain-specific action name
 * @returns {{ allowed: boolean, config: object|null, reason: string }}
 */
function checkGate(domain, action) {
    const identity = readProjectIdentity();

    if (!identity) {
        return { allowed: true, config: null, reason: 'No .project-identity found — default allow' };
    }

    const automation = identity.automation;
    if (!automation) {
        return { allowed: true, config: null, reason: 'No automation config — default allow' };
    }

    switch (domain) {
        case 'git': {
            const gitConfig = automation.git;
            if (!gitConfig) {
                return { allowed: true, config: null, reason: 'No automation.git config — default allow' };
            }
            if (action === 'commit' && gitConfig.autoCommit === false) {
                return { allowed: false, config: gitConfig, reason: 'automation.git.autoCommit is false' };
            }
            if (action === 'push' && gitConfig.autoPush === false) {
                return { allowed: false, config: gitConfig, reason: 'automation.git.autoPush is false' };
            }
            return { allowed: true, config: gitConfig, reason: 'automation.git allows this action' };
        }

        case 'trello': {
            const trelloConfig = automation.trello;
            if (!trelloConfig) {
                return { allowed: true, config: null, reason: 'No automation.trello config — default allow' };
            }
            if (trelloConfig.enabled === false || trelloConfig.autoSync === false) {
                return { allowed: false, config: trelloConfig, reason: 'automation.trello is disabled (enabled=false or autoSync=false)' };
            }
            // Check trigger-level gates
            if (trelloConfig.triggers) {
                const triggerMap = {
                    'complete': 'task_complete',
                    'comment': 'milestone',
                    'block': 'blocked',
                };
                const trigger = triggerMap[action];
                if (trigger && trelloConfig.triggers[trigger] === false) {
                    return { allowed: false, config: trelloConfig, reason: `automation.trello.triggers.${trigger} is false` };
                }
            }
            return { allowed: true, config: trelloConfig, reason: 'automation.trello allows this action' };
        }

        case 'telegram': {
            const tgConfig = automation.telegram;
            if (!tgConfig) {
                return { allowed: true, config: null, reason: 'No automation.telegram config — default allow' };
            }
            if (tgConfig.enabled === false) {
                return { allowed: false, config: tgConfig, reason: 'automation.telegram.enabled is false' };
            }
            // Check trigger-level gates
            if (tgConfig.triggers && action !== 'send') {
                const triggerMap = {
                    'git_push': 'git_push',
                    'task_complete': 'task_complete',
                    'deploy': 'deploy',
                };
                const trigger = triggerMap[action];
                if (trigger && tgConfig.triggers[trigger] === false) {
                    return { allowed: false, config: tgConfig, reason: `automation.telegram.triggers.${trigger} is false` };
                }
            }
            return { allowed: true, config: tgConfig, reason: 'automation.telegram allows this action' };
        }

        default:
            return { allowed: true, config: null, reason: `Unknown domain '${domain}' — default allow` };
    }
}

// ─── Git executors ────────────────────────────────────────────────────────────

function execGitCommit(message) {
    const gate = checkGate('git', 'commit');
    if (!gate.allowed) {
        err(`🚫 GIT COMMIT BLOCKED: ${gate.reason}`);
        dim('  Modify .project-identity automation.git.autoCommit to change this.');
        return false;
    }

    try {
        execSync('git add -A', { stdio: 'inherit' });
        execSync(`git commit -m "${message.replace(/"/g, '\\"')}"`, { stdio: 'inherit' });
        ok(`Committed: ${message}`);
        return true;
    } catch (e) {
        // git commit returns non-zero if nothing to commit
        if (e.status === 1) {
            warn('Nothing to commit (working tree clean).');
            return true;
        }
        err(`Git commit failed: ${e.message}`);
        return false;
    }
}

function execGitPush() {
    const gate = checkGate('git', 'push');
    if (!gate.allowed) {
        err(`🚫 GIT PUSH BLOCKED: ${gate.reason}`);
        dim('  Modify .project-identity automation.git.autoPush to change this.');
        return false;
    }

    try {
        execSync('git push', { stdio: 'inherit' });
        ok('Pushed successfully.');
        return true;
    } catch (e) {
        warn('Push failed. Retrying with git pull --rebase...');
        try {
            execSync('git pull --rebase && git push', { stdio: 'inherit' });
            ok('Pushed successfully after rebase.');
            return true;
        } catch (e2) {
            err(`Push failed after retry: ${e2.message}`);
            err('Please resolve conflicts manually. DO NOT force push.');
            return false;
        }
    }
}

function execGitAuto(message) {
    log('');
    log(`${C.cyan}${C.bold}🔒 Automation Gate — Git Auto${C.reset}`);
    dim(`  Checking .project-identity...`);

    const committed = execGitCommit(message);
    if (!committed) return false;

    const pushed = execGitPush();
    if (!pushed) return false;

    // Trigger Telegram notification if git_push trigger is enabled
    const tgGate = checkGate('telegram', 'git_push');
    if (tgGate.allowed) {
        info('Triggering Telegram notification...');
        try {
            execSync(`awkit tg send "✅ Pushed: ${message.replace(/"/g, '\\"')}"`, { stdio: 'inherit' });
        } catch (_) {
            dim('Telegram notification skipped (not configured or failed).');
        }
    }

    return true;
}

// ─── Trello executors ─────────────────────────────────────────────────────────

function execTrelloAction(action, args) {
    const gate = checkGate('trello', action);
    if (!gate.allowed) {
        err(`🚫 TRELLO ${action.toUpperCase()} BLOCKED: ${gate.reason}`);
        dim('  Modify .project-identity automation.trello to change this.');
        return false;
    }

    try {
        const cmd = `awkit trello ${action} ${args.map(a => `"${a}"`).join(' ')}`;
        execSync(cmd, { stdio: 'inherit' });
        return true;
    } catch (e) {
        err(`Trello ${action} failed: ${e.message}`);
        return false;
    }
}

// ─── Telegram executor ────────────────────────────────────────────────────────

function execTelegramSend(args) {
    const gate = checkGate('telegram', 'send');
    if (!gate.allowed) {
        err(`🚫 TELEGRAM BLOCKED: ${gate.reason}`);
        dim('  Modify .project-identity automation.telegram to change this.');
        return false;
    }

    try {
        const cmd = `awkit tg send ${args.map(a => `"${a}"`).join(' ')}`;
        execSync(cmd, { stdio: 'inherit' });
        return true;
    } catch (e) {
        err(`Telegram send failed: ${e.message}`);
        return false;
    }
}

// ─── CLI handler ──────────────────────────────────────────────────────────────

function gateHelp() {
    log('');
    log(`${C.cyan}${C.bold}🔒 Automation Gate${C.reset}`);
    log(`${C.gray}  Enforces .project-identity automation config before executing.${C.reset}`);
    log('');
    log(`  ${C.green}awkit gate git commit${C.reset} <message>     Gated git add + commit`);
    log(`  ${C.green}awkit gate git push${C.reset}                  Gated git push`);
    log(`  ${C.green}awkit gate git auto${C.reset} <message>       Commit + push + telegram`);
    log('');
    log(`  ${C.green}awkit gate trello complete${C.reset} <name>   Gated trello complete`);
    log(`  ${C.green}awkit gate trello comment${C.reset} <text>    Gated trello comment`);
    log(`  ${C.green}awkit gate trello block${C.reset} <reason>    Gated trello block`);
    log('');
    log(`  ${C.green}awkit gate telegram send${C.reset} <message>  Gated telegram send`);
    log('');
    log(`  ${C.green}awkit gate check${C.reset} <domain>           Check gate status (dry-run)`);
    log('');
}

function gateCheck(domain) {
    log('');
    log(`${C.cyan}${C.bold}🔒 Gate Status — ${domain || 'all'}${C.reset}`);
    log('');

    const domains = domain ? [domain] : ['git', 'trello', 'telegram'];
    const actions = {
        git: ['commit', 'push'],
        trello: ['complete', 'comment', 'block'],
        telegram: ['send', 'git_push', 'task_complete', 'deploy'],
    };

    for (const d of domains) {
        log(`  ${C.bold}${d}${C.reset}`);
        for (const a of (actions[d] || [])) {
            const gate = checkGate(d, a);
            const icon = gate.allowed ? `${C.green}✔${C.reset}` : `${C.red}✖${C.reset}`;
            log(`    ${icon} ${a}: ${C.gray}${gate.reason}${C.reset}`);
        }
        log('');
    }
}

/**
 * Main handler for `awkit gate` subcommand.
 * @param {string[]} args - CLI args after 'gate'
 */
function cmdGate(args) {
    const domain = args[0];
    const action = args[1];
    const rest = args.slice(2);

    if (!domain || domain === 'help' || domain === '--help' || domain === '-h') {
        gateHelp();
        return;
    }

    if (domain === 'check') {
        gateCheck(action); // action is optional domain filter
        return;
    }

    switch (domain) {
        case 'git':
            switch (action) {
                case 'commit':
                    execGitCommit(rest.join(' ') || 'chore: update');
                    break;
                case 'push':
                    execGitPush();
                    break;
                case 'auto':
                    execGitAuto(rest.join(' ') || 'chore: update');
                    break;
                default:
                    err(`Unknown git action: ${action}`);
                    gateHelp();
                    break;
            }
            break;

        case 'trello':
            if (!action || !rest.length) {
                err(`Usage: awkit gate trello <action> <text>`);
                gateHelp();
                return;
            }
            execTrelloAction(action, rest);
            break;

        case 'telegram':
        case 'tg':
            if (action === 'send') {
                execTelegramSend(rest);
            } else {
                err(`Unknown telegram action: ${action}`);
                gateHelp();
            }
            break;

        default:
            err(`Unknown gate domain: ${domain}`);
            gateHelp();
            break;
    }
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
    cmdGate,
    checkGate,
    readProjectIdentity,
};
