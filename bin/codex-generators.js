const fs = require('fs');
const path = require('path');

/**
 * Generates Codex global agents.md from GEMINI.md
 * @param {string} sourcePath Path to core/GEMINI.md
 * @param {string} destPath Destination path (e.g. ~/.codex/AGENTS.md)
 */
function generateCodexAgentsMd(sourcePath, destPath) {
    if (!fs.existsSync(sourcePath)) return;

    let content = fs.readFileSync(sourcePath, 'utf8');

    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.writeFileSync(destPath, content.trim() + '\n');
    console.log(`✅ Codex AGENTS.md generated at: ${destPath}`);
}

/**
 * Generates Codex skills directory structure.
 * Copies SKILL.md and parses it.
 */
function generateCodexSkills(srcDir, destDir) {
    if (!fs.existsSync(srcDir)) return;

    fs.mkdirSync(destDir, { recursive: true });
    const skills = fs.readdirSync(srcDir);

    let count = 0;
    for (const skill of skills) {
        const skillDir = path.join(srcDir, skill);
        if (!fs.statSync(skillDir).isDirectory()) continue;

        const skillFile = path.join(skillDir, 'SKILL.md');
        if (fs.existsSync(skillFile)) {
            const destSkillDir = path.join(destDir, skill);
            fs.mkdirSync(destSkillDir, { recursive: true });

            const destPath = path.join(destSkillDir, 'SKILL.md');

            let content = fs.readFileSync(skillFile, 'utf8');

            if (content.startsWith('---\n')) {
                if (!content.match(/^name:/m)) {
                    content = content.replace('---\n', `---\nname: ${skill}\n`);
                }
            } else {
                const preamble = `---\nname: ${skill}\ndescription: Antigravity skill ${skill}\n---\n`;
                content = preamble + content;
            }

            fs.writeFileSync(destPath, content);
            count++;
        }
    }
    console.log(`✅ Generated ${count} Codex skills in ${destDir}`);
}

/**
 * Generates Codex custom agents (.toml) for specific skills.
 */
function generateCodexAgents(srcDir, destDir) {
    if (!fs.existsSync(srcDir)) return;

    fs.mkdirSync(destDir, { recursive: true });
    const skills = fs.readdirSync(srcDir);

    const SPECIALIST_SKILLS = [
        'ios-engineer',
        'smali-to-kotlin',
        'smali-to-swift',
        'problem-solving-pro',
        'swiftui-pro',
        'android-re-analyzer',
        'brainstorm-agent'
    ];

    let count = 0;
    for (const skill of skills) {
        if (!SPECIALIST_SKILLS.includes(skill)) continue;

        const skillDir = path.join(srcDir, skill);
        if (!fs.statSync(skillDir).isDirectory()) continue;

        const skillFile = path.join(skillDir, 'SKILL.md');
        if (fs.existsSync(skillFile)) {
            const content = fs.readFileSync(skillFile, 'utf8');

            const tomlContent = `name = "${skill}"
description = "Antigravity specialist ${skill}"
developer_instructions = """
${content.replace(/"""/g, '\\"\\"\\"')}
"""
`;

            const destPath = path.join(destDir, `${skill}.toml`);
            fs.writeFileSync(destPath, tomlContent);
            count++;
        }
    }
    console.log(`✅ Generated ${count} Codex custom agents in ${destDir}`);
}

module.exports = {
    generateCodexAgentsMd,
    generateCodexSkills,
    generateCodexAgents
};
