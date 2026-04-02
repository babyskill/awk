const fs = require('fs');
const path = require('path');

/**
 * Generates Claude Code CLAUDE.md from core/GEMINI.md template.
 * Replaces Antigravity-specific paths and references with Claude Code equivalents.
 * @param {string} sourcePath Path to core/CLAUDE.md (pre-adapted template)
 * @param {string} destPath Destination path (e.g. <project>/CLAUDE.md)
 */
function generateClaudeRules(sourcePath, destPath) {
    if (!fs.existsSync(sourcePath)) {
        console.log(`⚠️  Template not found: ${sourcePath}`);
        return;
    }

    const content = fs.readFileSync(sourcePath, 'utf8');

    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.writeFileSync(destPath, content.trim() + '\n');
    console.log(`✅ Claude Code CLAUDE.md generated at: ${destPath}`);
}

/**
 * Copies skill directories to Claude Code .claude/skills/ structure.
 * Preserves full directory structure: <skill-name>/SKILL.md + scripts/ + templates/
 * Injects YAML frontmatter if missing.
 */
function generateClaudeSkills(srcDir, destDir, selectedSkills = null) {
    if (!fs.existsSync(srcDir)) return;

    fs.mkdirSync(destDir, { recursive: true });
    const skills = fs.readdirSync(srcDir);
    const allowed = selectedSkills ? new Set(selectedSkills) : null;

    let count = 0;
    for (const skill of skills) {
        if (allowed && !allowed.has(skill)) continue;
        const skillSrcDir = path.join(srcDir, skill);
        if (!fs.statSync(skillSrcDir).isDirectory()) continue;
        if (skill === '.DS_Store') continue;

        // Skip non-skill directories (schemas, skills, workflows nested dirs)
        const skillFile = path.join(skillSrcDir, 'SKILL.md');
        if (!fs.existsSync(skillFile)) continue;

        const skillDestDir = path.join(destDir, skill);
        const fileCount = copySkillDir(skillSrcDir, skillDestDir);

        // Ensure SKILL.md has YAML frontmatter
        ensureFrontmatter(path.join(skillDestDir, 'SKILL.md'), skill);

        count++;
    }
    console.log(`✅ Generated ${count} Claude Code skills in ${destDir}`);
}

/**
 * Recursively copies a skill directory preserving structure.
 */
function copySkillDir(src, dest) {
    if (!fs.existsSync(src)) return 0;
    fs.mkdirSync(dest, { recursive: true });

    let count = 0;
    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
        if (entry.name === '.DS_Store') continue;
        if (entry.name === '__pycache__') continue;

        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            count += copySkillDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
            count++;
        }
    }
    return count;
}

/**
 * Ensures a SKILL.md file has proper YAML frontmatter.
 * If missing, injects name and description extracted from content.
 */
function ensureFrontmatter(filePath, skillName) {
    if (!fs.existsSync(filePath)) return;

    let content = fs.readFileSync(filePath, 'utf8');

    // Already has frontmatter
    if (content.startsWith('---\n')) {
        // Ensure 'name' field exists
        if (!content.match(/^name:/m)) {
            content = content.replace('---\n', `---\nname: ${skillName}\n`);
            fs.writeFileSync(filePath, content);
        }
        return;
    }

    // Extract description from first line or heading
    let description = `Antigravity skill: ${skillName}`;
    const descMatch = content.match(/^#\s+(.+)/m);
    if (descMatch) {
        description = descMatch[1].replace(/[`*_]/g, '').trim();
    }

    // Also try to extract from YAML-like description in body
    const bodyDescMatch = content.match(/^description:\s*(.+)/m);
    if (bodyDescMatch) {
        description = bodyDescMatch[1].trim();
    }

    const frontmatter = `---\nname: ${skillName}\ndescription: "${description}"\n---\n`;
    content = frontmatter + content;
    fs.writeFileSync(filePath, content);
}

module.exports = {
    generateClaudeRules,
    generateClaudeSkills,
};
