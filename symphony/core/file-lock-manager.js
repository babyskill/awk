/**
 * Symphony File Lock Manager
 * Pessimistic file locking to prevent 2 agents editing the same file.
 */
const { getDb } = require('./db');

/**
 * Acquire locks on files for an agent.
 * Atomic: all-or-nothing — if any file is locked by another agent, none are acquired.
 * 
 * @param {string} agentId - Agent requesting locks
 * @param {string} taskId - Task the agent is working on
 * @param {string[]} files - File paths to lock
 * @returns {{ success: boolean, conflicts?: Object[] }}
 */
function acquireLocks(agentId, taskId, files) {
    const db = getDb();

    return db.transaction(() => {
        // Check for conflicts
        const conflicts = [];
        const checkStmt = db.prepare('SELECT * FROM file_locks WHERE file_path = ?');

        for (const file of files) {
            const existing = checkStmt.get(file);
            if (existing && existing.agent_id !== agentId) {
                conflicts.push({
                    file,
                    agent: existing.agent_id,
                    task: existing.task_id,
                    since: existing.acquired_at,
                });
            }
        }

        if (conflicts.length > 0) {
            return { success: false, conflicts };
        }

        // Acquire all locks (upsert)
        const upsertStmt = db.prepare(`
      INSERT INTO file_locks (file_path, agent_id, task_id) 
      VALUES (?, ?, ?)
      ON CONFLICT(file_path) DO UPDATE SET agent_id = ?, task_id = ?, acquired_at = datetime('now')
    `);

        for (const file of files) {
            upsertStmt.run(file, agentId, taskId, agentId, taskId);
        }

        return { success: true };
    })();
}

/**
 * Release all locks held by an agent.
 * @param {string} agentId - Agent ID
 * @returns {number} Number of locks released
 */
function releaseLocks(agentId) {
    const db = getDb();
    const result = db.prepare('DELETE FROM file_locks WHERE agent_id = ?').run(agentId);
    return result.changes;
}

/**
 * Release specific file locks for an agent.
 * @param {string} agentId - Agent ID
 * @param {string[]} files - File paths to release
 * @returns {number} Number of locks released
 */
function releaseSpecificLocks(agentId, files) {
    const db = getDb();
    let released = 0;
    const stmt = db.prepare('DELETE FROM file_locks WHERE file_path = ? AND agent_id = ?');
    for (const file of files) {
        const result = stmt.run(file, agentId);
        released += result.changes;
    }
    return released;
}

/**
 * Check if files are available (not locked by another agent).
 * @param {string[]} files - File paths to check
 * @returns {{ available: string[], locked: Object[] }}
 */
function checkFiles(files) {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM file_locks WHERE file_path = ?');

    const available = [];
    const locked = [];

    for (const file of files) {
        const lock = stmt.get(file);
        if (lock) {
            locked.push({
                file,
                agent: lock.agent_id,
                task: lock.task_id,
                since: lock.acquired_at,
            });
        } else {
            available.push(file);
        }
    }

    return { available, locked };
}

/**
 * Get all currently locked files.
 * @returns {Object[]}
 */
function getAllLocks() {
    const db = getDb();
    return db.prepare('SELECT * FROM file_locks ORDER BY acquired_at DESC').all();
}

/**
 * Force-release a specific file lock (admin operation).
 * @param {string} filePath - File path to unlock
 * @returns {boolean} Whether a lock was released
 */
function forceRelease(filePath) {
    const db = getDb();
    const result = db.prepare('DELETE FROM file_locks WHERE file_path = ?').run(filePath);
    return result.changes > 0;
}

/**
 * Auto-release stale locks older than the given seconds.
 * @param {number} maxAge - Max age in seconds (default: 3600)
 * @returns {number} Number of locks released
 */
function autoReleaseStale(maxAge = 3600) {
    const db = getDb();
    const result = db.prepare(`
    DELETE FROM file_locks 
    WHERE acquired_at < datetime('now', '-' || ? || ' seconds')
  `).run(maxAge);
    return result.changes;
}

module.exports = {
    acquireLocks,
    releaseLocks,
    releaseSpecificLocks,
    checkFiles,
    getAllLocks,
    forceRelease,
    autoReleaseStale,
};
