const fs = require('fs');
const path = require('path');

/**
 * Generates Cline global rules from GEMINI.md
 * @param {string} sourcePath Path to core/GEMINI.md
 * @param {string} destPath Destination path (e.g. ~/.cline/rules/antigravity.md)
 */
function generateClineRules(sourcePath, destPath) {
    if (!fs.existsSync(sourcePath)) return;

    let content = fs.readFileSync(sourcePath, 'utf8');
    const preamble = `
# Antigravity Rules for Cline

${content}
`;

    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.writeFileSync(destPath, preamble.trim() + '\n');
    console.log(`✅ Cline global rules generated at: ${destPath}`);
}

/**
 * Copies workflow markdown files to the given directory.
 */
function generateClineWorkflows(srcDir, destDir) {
    if (!fs.existsSync(srcDir)) return;

    fs.mkdirSync(destDir, { recursive: true });
    const items = fs.readdirSync(srcDir);

    let count = 0;
    for (const item of items) {
        if (!item.endsWith('.md')) continue;
        const srcPath = path.join(srcDir, item);
        const destPath = path.join(destDir, item);
        fs.copyFileSync(srcPath, destPath);
        count++;
    }
    console.log(`✅ Copied ${count} workflows to ${destDir}`);
}

/**
 * Copies SKILL.md from each skill directory to the given directory.
 */
function generateClineSkills(srcDir, destDir, selectedSkills = null) {
    if (!fs.existsSync(srcDir)) return;

    fs.mkdirSync(destDir, { recursive: true });
    const skills = fs.readdirSync(srcDir);
    const allowed = selectedSkills ? new Set(selectedSkills) : null;

    let count = 0;
    for (const skill of skills) {
        if (allowed && !allowed.has(skill)) continue;
        const skillDir = path.join(srcDir, skill);
        if (!fs.statSync(skillDir).isDirectory()) continue;

        const skillFile = path.join(skillDir, 'SKILL.md');
        if (fs.existsSync(skillFile)) {
            // Copy SKILL.md as <skillname>.md
            const destPath = path.join(destDir, `${skill}.md`);
            fs.copyFileSync(skillFile, destPath);
            count++;
        }
    }
    console.log(`✅ Copied ${count} skills to ${destDir}`);
}

module.exports = {
    generateClineRules,
    generateClineWorkflows,
    generateClineSkills
};
