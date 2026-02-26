const fs = require('fs');
const path = require('path');
const os = require('os');

const HOME = os.homedir();
const MAIN_AWF_DIR = path.join(__dirname, '..');

// Nguồn v4 (Chi tiết, Persona, Auto-test loop)
const AWF_V4_DIR = path.join(HOME, 'Dev', 'NodeJS', 'awf');
// Nguồn v5 (Beads, Brain, Fast execution)
const ANTIGRAVITY_V5_DIR = path.join(HOME, '.gemini', 'antigravity');

function ensureDir(dir) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function copyFile(src, dest) {
    if (fs.existsSync(src)) {
        ensureDir(path.dirname(dest));
        fs.copyFileSync(src, dest);
        console.log(`✅ Copied: ${path.basename(dest)}`);
        return true;
    } else {
        console.log(`❌ Source not found: ${src}`);
        return false;
    }
}

function copySkill(skillName, destDir) {
    const destPath = path.join(MAIN_AWF_DIR, 'skills', destDir || skillName, 'SKILL.md');

    // Try sources in order of priority
    const sources = [
        path.join(ANTIGRAVITY_V5_DIR, 'skills', `awf-${skillName}`, 'SKILL.md'),
        path.join(ANTIGRAVITY_V5_DIR, 'skills', skillName, 'SKILL.md'),
        path.join(AWF_V4_DIR, 'awf_skills', `awf-${skillName}`, 'SKILL.md')
    ];

    for (const src of sources) {
        if (fs.existsSync(src)) {
            ensureDir(path.dirname(destPath));
            fs.copyFileSync(src, destPath);
            console.log(`✅ Skill installed: ${skillName}`);
            return;
        }
    }
    console.log(`⚠️ Skill NOT found: ${skillName}`);
}

async function run() {
    console.log('🚀 Bootstrapping AWF v6.0 Workflows & Skills...\n');

    // 1. CURATE LIFECYCLE WORKFLOWS
    console.log('--- Lifecycle Workflows ---');
    // V4 is better for deep planning & coding
    copyFile(path.join(AWF_V4_DIR, 'workflows', 'code.md'), path.join(MAIN_AWF_DIR, 'workflows', 'lifecycle', 'code.md'));
    copyFile(path.join(AWF_V4_DIR, 'workflows', 'plan.md'), path.join(MAIN_AWF_DIR, 'workflows', 'lifecycle', 'plan.md'));
    copyFile(path.join(AWF_V4_DIR, 'workflows', 'debug.md'), path.join(MAIN_AWF_DIR, 'workflows', 'lifecycle', 'debug.md'));
    copyFile(path.join(AWF_V4_DIR, 'workflows', 'brainstorm.md'), path.join(MAIN_AWF_DIR, 'workflows', 'lifecycle', 'brainstorm.md'));
    copyFile(path.join(AWF_V4_DIR, 'workflows', 'test.md'), path.join(MAIN_AWF_DIR, 'workflows', 'lifecycle', 'test.md'));
    copyFile(path.join(AWF_V4_DIR, 'workflows', 'deploy.md'), path.join(MAIN_AWF_DIR, 'workflows', 'lifecycle', 'deploy.md'));
    copyFile(path.join(AWF_V4_DIR, 'workflows', 'refactor.md'), path.join(MAIN_AWF_DIR, 'workflows', 'lifecycle', 'refactor.md'));
    // V5 is better for init (has project-identity integration)
    copyFile(path.join(ANTIGRAVITY_V5_DIR, 'global_workflows', 'init.md'), path.join(MAIN_AWF_DIR, 'workflows', 'lifecycle', 'init.md'));

    // 2. CURATE CONTEXT WORKFLOWS
    console.log('\n--- Context Workflows ---');
    // Both from V5
    copyFile(path.join(ANTIGRAVITY_V5_DIR, 'global_workflows', 'save-brain.md'), path.join(MAIN_AWF_DIR, 'workflows', 'context', 'save-brain.md'));
    copyFile(path.join(ANTIGRAVITY_V5_DIR, 'global_workflows', 'recap.md'), path.join(MAIN_AWF_DIR, 'workflows', 'context', 'recap.md'));
    copyFile(path.join(ANTIGRAVITY_V5_DIR, 'global_workflows', 'next.md'), path.join(MAIN_AWF_DIR, 'workflows', 'context', 'next.md'));

    // 3. CURATE QUALITY & UI WORKFLOWS (From v5)
    console.log('\n--- Quality & UI Workflows ---');
    const v5Workflows = [
        ['audit.md', 'quality'],
        ['performance-audit.md', 'quality'],
        ['ux-audit.md', 'quality'],
        ['visualize.md', 'ui'],
        ['design-to-ui.md', 'ui'],
        ['ui-review.md', 'ui'],
        ['ads-audit.md', 'ads'],
        ['ads-optimize.md', 'ads'],
        ['adsExpert.md', 'ads'],
        ['git-commit-workflow.md', 'git', 'commit.md'],
        ['hotfix.md', 'git'],
        ['planExpert.md', 'expert'],
        ['codeExpert.md', 'expert'],
        ['debugExpert.md', 'expert']
    ];

    for (const [file, category, rename] of v5Workflows) {
        const src = path.join(ANTIGRAVITY_V5_DIR, 'global_workflows', file);
        const dest = path.join(MAIN_AWF_DIR, 'workflows', category, rename || file);
        copyFile(src, dest);
    }

    // 4. CURATE META WORKFLOWS (From v4)
    console.log('\n--- Meta Workflows ---');
    copyFile(path.join(AWF_V4_DIR, 'workflows', 'customize.md'), path.join(MAIN_AWF_DIR, 'workflows', 'meta', 'customize.md'));
    copyFile(path.join(AWF_V4_DIR, 'workflows', 'help.md'), path.join(MAIN_AWF_DIR, 'workflows', 'meta', 'help.md'));
    copyFile(path.join(AWF_V4_DIR, 'workflows', 'awf-update.md'), path.join(MAIN_AWF_DIR, 'workflows', 'meta', 'awf-update.md'));
    copyFile(path.join(AWF_V4_DIR, 'workflows', 'rollback.md'), path.join(MAIN_AWF_DIR, 'workflows', 'meta', 'rollback.md'));

    // 5. CURATE CORE SKILLS
    console.log('\n--- Core Skills ---');
    const coreSkills = [
        'session-restore',
        'auto-save',
        'adaptive-language',
        'error-translator',
        'context-help',
        'beads-manager'
    ];
    for (const skill of coreSkills) {
        copySkill(skill, skill);
    }

    console.log('\n✅ Bootstrap Complete! Essential framework files synchronized.');
}

run().catch(console.error);
