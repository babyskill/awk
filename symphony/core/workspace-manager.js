/**
 * Symphony Workspace Manager
 * Git worktree lifecycle management with hybrid clone/worktree support.
 */
const { execSync } = require('child_process');
const { nanoid } = require('nanoid');
const { getDb } = require('./db');
const path = require('path');
const fs = require('fs');

/**
 * Create a workspace for a task.
 * Uses git worktree (default) or full clone based on hybrid config.
 * 
 * @param {string} taskId - Task ID
 * @param {string} repoPath - Path to the main repository
 * @param {Object} [opts] - { type: 'worktree'|'clone', branchPrefix }
 * @returns {Object} { id, path, branch, type }
 */
function createWorkspace(taskId, repoPath, opts = {}) {
    const db = getDb();
    const type = opts.type || 'worktree';
    const branchPrefix = opts.branchPrefix || 'symphony/';
    const branch = `${branchPrefix}${sanitizeId(taskId)}`;
    const wsId = `ws-${nanoid(8)}`;

    const workspaceRoot = path.resolve(repoPath, '.symphony', 'workspaces');
    if (!fs.existsSync(workspaceRoot)) {
        fs.mkdirSync(workspaceRoot, { recursive: true });
    }

    const wsPath = path.join(workspaceRoot, sanitizeId(taskId));

    if (type === 'worktree') {
        createWorktree(repoPath, wsPath, branch);
    } else {
        cloneRepo(repoPath, wsPath, branch);
    }

    // Record in database
    db.prepare(`
    INSERT INTO workspaces (id, task_id, type, path, branch, status)
    VALUES (?, ?, ?, ?, ?, 'active')
  `).run(wsId, taskId, type, wsPath, branch);

    return { id: wsId, path: wsPath, branch, type };
}

/**
 * Remove a workspace.
 * @param {string} taskId - Task ID
 * @param {string} repoPath - Path to the main repository
 */
function removeWorkspace(taskId, repoPath) {
    const db = getDb();
    const ws = db.prepare('SELECT * FROM workspaces WHERE task_id = ? AND status = ?').get(taskId, 'active');
    if (!ws) return;

    if (ws.type === 'worktree') {
        try {
            execSync(`git worktree remove "${ws.path}" --force`, {
                cwd: repoPath,
                stdio: 'pipe',
            });
        } catch (e) {
            // Fallback: manual cleanup
            if (fs.existsSync(ws.path)) {
                fs.rmSync(ws.path, { recursive: true, force: true });
            }
            try {
                execSync(`git worktree prune`, { cwd: repoPath, stdio: 'pipe' });
            } catch (_) { /* ignore */ }
        }
    } else {
        // Clone: just remove directory
        if (fs.existsSync(ws.path)) {
            fs.rmSync(ws.path, { recursive: true, force: true });
        }
    }

    db.prepare("UPDATE workspaces SET status = 'cleaned' WHERE task_id = ?").run(taskId);
}

/**
 * List all active workspaces.
 * @returns {Object[]}
 */
function listWorkspaces() {
    const db = getDb();
    return db.prepare("SELECT * FROM workspaces WHERE status = 'active' ORDER BY created_at DESC").all();
}

/**
 * Get workspace for a task.
 * @param {string} taskId
 * @returns {Object|null}
 */
function getWorkspace(taskId) {
    const db = getDb();
    return db.prepare("SELECT * FROM workspaces WHERE task_id = ? AND status = 'active'").get(taskId) || null;
}

/**
 * Mark workspace as merged.
 * @param {string} taskId
 */
function markMerged(taskId) {
    const db = getDb();
    db.prepare("UPDATE workspaces SET status = 'merged', merged_at = datetime('now') WHERE task_id = ?").run(taskId);
}

// ─── Internal Helpers ────────────────────────────────────────────────────────

function createWorktree(repoPath, wsPath, branch) {
    try {
        // Create new branch from current HEAD and checkout in worktree
        execSync(`git worktree add -b "${branch}" "${wsPath}"`, {
            cwd: repoPath,
            stdio: 'pipe',
        });
    } catch (e) {
        // Branch might already exist — try without -b
        try {
            execSync(`git worktree add "${wsPath}" "${branch}"`, {
                cwd: repoPath,
                stdio: 'pipe',
            });
        } catch (e2) {
            throw new Error(`Failed to create worktree: ${e2.message}`);
        }
    }
}

function cloneRepo(repoPath, wsPath, branch) {
    const remote = getRemoteUrl(repoPath);
    if (remote) {
        execSync(`git clone "${remote}" "${wsPath}"`, { stdio: 'pipe' });
        execSync(`git checkout -b "${branch}"`, { cwd: wsPath, stdio: 'pipe' });
    } else {
        // Local-only repo: just copy
        execSync(`git clone "${repoPath}" "${wsPath}"`, { stdio: 'pipe' });
        execSync(`git checkout -b "${branch}"`, { cwd: wsPath, stdio: 'pipe' });
    }
}

function getRemoteUrl(repoPath) {
    try {
        return execSync('git remote get-url origin', {
            cwd: repoPath,
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'pipe'],
        }).trim();
    } catch (_) {
        return null;
    }
}

function sanitizeId(id) {
    return id.replace(/[^A-Za-z0-9._-]/g, '_');
}

module.exports = {
    createWorkspace,
    removeWorkspace,
    listWorkspaces,
    getWorkspace,
    markMerged,
};
