const fs = require('fs');
const path = require('path');
const { getDb } = require('./db');

/**
 * Auto-detect project identity by walking up the directory tree.
 */
function loadProjectIdentity() {
    try {
        let currentDir = process.cwd();
        while (currentDir !== path.parse(currentDir).root) {
            const identityPath = path.join(currentDir, '.project-identity');
            if (fs.existsSync(identityPath)) {
                const content = fs.readFileSync(identityPath, 'utf8');
                const data = JSON.parse(content);
                return data;
            }
            currentDir = path.dirname(currentDir);
        }
    } catch (e) {
        // ignore errors
    }
    return null;
}

/**
 * Resolve the project ID: use explicit param.
 * If not provided, automatically scope to the closest .project-identity if available.
 * Returns null if no project specified and no .project-identity found (= show ALL tasks).
 */
function resolveProjectId(projectParam) {
    if (projectParam === '__all__') return null;
    if (projectParam) return String(projectParam).toLowerCase();
    
    // Auto-scoping from .project-identity
    const identityData = loadProjectIdentity();
    if (identityData && identityData.projectId) {
        const id = String(identityData.projectId).toLowerCase();
        
        // Auto-register project so it appears in UI
        try {
            const db = getDb();
            db.prepare(`
                INSERT INTO projects (id, name, path, icon, color, last_active_at)
                VALUES (?, ?, NULL, ?, '#8888a0', datetime('now'))
                ON CONFLICT(id) DO UPDATE SET 
                    name = excluded.name,
                    icon = excluded.icon
            `).run(id, identityData.projectName || id, identityData.icon || '📁');
        } catch (e) {
            // ignore db registration errors
        }
        return id;
    }

    // No auto-scoping — return null to show all
    return null;
}

module.exports = {
    loadProjectIdentity,
    resolveProjectId
};
