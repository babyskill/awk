#!/usr/bin/env node
/**
 * AWK Rename Script — Renames awf → awk throughout main-awf
 * Updates: package.json, VERSION, copies awf.js → awk.js
 * Created by Kien AI
 */

const fs = require('fs');
const path = require('path');

const AWK_ROOT = path.join(__dirname, '..');
const C = {
    reset: '\x1b[0m', green: '\x1b[32m', yellow: '\x1b[33m',
    cyan: '\x1b[36m', gray: '\x1b[90m', bold: '\x1b[1m',
};
const ok = (m) => console.log(`${C.green}✅ ${m}${C.reset}`);
const info = (m) => console.log(`${C.cyan}ℹ️  ${m}${C.reset}`);
const dim = (m) => console.log(`${C.gray}   ${m}${C.reset}`);
const head = (m) => console.log(`\n${C.cyan}${C.bold}── ${m} ──${C.reset}`);

async function run() {
    console.log('');
    console.log(`${C.cyan}${C.bold}╔══════════════════════════════════════════════════════════╗${C.reset}`);
    console.log(`${C.cyan}${C.bold}║         🔤 AWK Rename — awf → awk everywhere             ║${C.reset}`);
    console.log(`${C.cyan}${C.bold}╚══════════════════════════════════════════════════════════╝${C.reset}`);
    console.log('');

    // ── 1. Update package.json ─────────────────────────────────────────────────
    head('package.json');
    const pkgPath = path.join(AWK_ROOT, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

    pkg.name = '@zeroteam/awk';
    pkg.version = '7.0.0';
    pkg.description = 'AWK v7.0 — Antigravity Workflow Kit. Unified AI agent orchestration system.';
    pkg.bin = { awk: 'bin/awk.js' };
    pkg.scripts = {
        ...pkg.scripts,
        'install-global': 'node bin/awk.js install',
        'uninstall-global': 'node bin/awk.js uninstall',
        update: 'node bin/awk.js update',
        test: 'node bin/awk.js doctor',
        harvest: 'node scripts/harvest.js',
        'harvest-dry': 'node scripts/harvest.js --dry-run',
    };
    pkg.keywords = ['awk', 'antigravity-workflow-kit', 'ai-agent', 'workflow', 'gemini', 'claude'];

    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
    ok('package.json updated → @zeroteam/awk v7.0.0');
    dim('bin: { awk: "bin/awk.js" }');

    // ── 2. Bump VERSION ────────────────────────────────────────────────────────
    head('VERSION');
    const versionPath = path.join(AWK_ROOT, 'VERSION');
    fs.writeFileSync(versionPath, '7.0.0\n');
    ok('VERSION → 7.0.0');

    // ── 3. Copy awf.js → awk.js (with updated references) ─────────────────────
    head('bin/awk.js');
    const awfJsPath = path.join(AWK_ROOT, 'bin', 'awf.js');
    const awkJsPath = path.join(AWK_ROOT, 'bin', 'awk.js');

    let content = fs.readFileSync(awfJsPath, 'utf8');

    // Update banner and references
    content = content
        .replace(/AWF v\$\{AWF_VERSION\}/g, 'AWK v${AWK_VERSION}')
        .replace(/AWF v\$\{AWF_VERSION\}/g, 'AWK v${AWK_VERSION}')
        .replace(/const AWF_VERSION/g, 'const AWK_VERSION')
        .replace(/const AWF_ROOT/g, 'const AWK_ROOT')
        .replace(/AWF_VERSION/g, 'AWK_VERSION')
        .replace(/AWF_ROOT/g, 'AWK_ROOT')
        .replace(/AWF v6\.0 CLI/g, 'AWK v7.0 CLI')
        .replace(/AWF v6\.0 — Antigravity Workflow Framework/g, 'AWK v7.0 — Antigravity Workflow Kit')
        .replace(/Antigravity Workflow Framework/g, 'Antigravity Workflow Kit')
        .replace(/AWF v\$\{/g, 'AWK v${')
        .replace(/AWF installed/g, 'AWK installed')
        .replace(/AWF is healthy/g, 'AWK is healthy')
        .replace(/AWF Health Check/g, 'AWK Health Check')
        .replace(/\bawf\b(?! skills| v| update| version)/g, 'awk')
        // Fix awf_version path reference
        .replace(/awf_version/g, 'awk_version');

    // Update TARGETS to use awk_version
    content = content.replace(
        "versionFile: path.join(HOME, '.gemini', 'awf_version')",
        "versionFile: path.join(HOME, '.gemini', 'awk_version')"
    );

    // Update script header comment
    content = content.replace(
        `#!/usr/bin/env node

/**
 * AWF v6.0 CLI — Antigravity Workflow Framework`,
        `#!/usr/bin/env node

/**
 * AWK v7.0 CLI — Antigravity Workflow Kit`
    );

    fs.writeFileSync(awkJsPath, content);
    ok('bin/awk.js created');
    dim('All AWF → AWK references updated');

    // Make executable
    try {
        const { execSync } = require('child_process');
        execSync(`chmod +x "${awkJsPath}"`);
        ok('bin/awk.js is now executable');
    } catch (e) {
        // Ignore
    }

    // ── 4. Update core/GEMINI.md references ───────────────────────────────────
    head('core/GEMINI.md — Update binary references');
    const geminiPath = path.join(AWK_ROOT, 'core', 'GEMINI.md');
    if (fs.existsSync(geminiPath)) {
        let gemini = fs.readFileSync(geminiPath, 'utf8');
        // Update references from awf install to awk install
        gemini = gemini
            .replace(/\bawf install\b/g, 'awk install')
            .replace(/\bawf doctor\b/g, 'awk doctor')
            .replace(/\bawf update\b/g, 'awk update')
            .replace(/\bnode bin\/awf\.js\b/g, 'node bin/awk.js');
        fs.writeFileSync(geminiPath, gemini);
        ok('core/GEMINI.md binary references updated');
    }

    // ── 5. Summary ────────────────────────────────────────────────────────────
    console.log('');
    console.log(`${C.gray}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${C.reset}`);
    console.log(`${C.yellow}${C.bold}🎉 Rename Complete! main-awf is now AWK v7.0${C.reset}`);
    console.log('');
    dim('Package:   @zeroteam/awk v7.0.0');
    dim('Binary:    bin/awk.js');
    dim('Command:   awk install / awk doctor / awk update');
    console.log('');
    console.log(`${C.cyan}Next: node bin/awk.js doctor${C.reset}`);
    console.log('');
}

run().catch(console.error);
