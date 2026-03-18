/**
 * Symphony Merge Pipeline
 * Auto-rebase, merge, and conflict detection for completed tasks.
 */
const { execSync } = require('child_process');
const { getDb } = require('./db');
const workspaceManager = require('./workspace-manager');

/**
 * Get the main branch name (main or master).
 * @param {string} repoPath
 * @returns {string}
 */
function getMainBranch(repoPath) {
    try {
        const branches = execSync('git branch -l main master', {
            cwd: repoPath,
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'pipe'],
        }).trim();
        if (branches.includes('main')) return 'main';
        if (branches.includes('master')) return 'master';
    } catch (_) { /* ignore */ }
    return 'main'; // default
}

/**
 * Get diff stats between task branch and main.
 * @param {string} taskId
 * @param {string} repoPath
 * @returns {{ files: number, insertions: number, deletions: number, summary: string }}
 */
function getDiff(taskId, repoPath) {
    const ws = workspaceManager.getWorkspace(taskId);
    if (!ws) return { files: 0, insertions: 0, deletions: 0, summary: 'No workspace found' };

    const mainBranch = getMainBranch(repoPath);

    try {
        const stat = execSync(`git diff ${mainBranch}...${ws.branch} --stat`, {
            cwd: repoPath,
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'pipe'],
        }).trim();

        const shortstat = execSync(`git diff ${mainBranch}...${ws.branch} --shortstat`, {
            cwd: repoPath,
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'pipe'],
        }).trim();

        // Parse shortstat: "3 files changed, 10 insertions(+), 2 deletions(-)"
        const filesMatch = shortstat.match(/(\d+) files? changed/);
        const insertMatch = shortstat.match(/(\d+) insertions?\(\+\)/);
        const deleteMatch = shortstat.match(/(\d+) deletions?\(-\)/);

        return {
            files: filesMatch ? parseInt(filesMatch[1]) : 0,
            insertions: insertMatch ? parseInt(insertMatch[1]) : 0,
            deletions: deleteMatch ? parseInt(deleteMatch[1]) : 0,
            summary: stat,
        };
    } catch (e) {
        return { files: 0, insertions: 0, deletions: 0, summary: `Error: ${e.message}` };
    }
}

/**
 * Check for merge conflicts without actually merging.
 * @param {string} taskId
 * @param {string} repoPath
 * @returns {{ hasConflicts: boolean, conflictingFiles: string[] }}
 */
function checkConflicts(taskId, repoPath) {
    const ws = workspaceManager.getWorkspace(taskId);
    if (!ws) return { hasConflicts: false, conflictingFiles: [] };

    const mainBranch = getMainBranch(repoPath);

    try {
        // Try a dry-run merge
        execSync(`git merge-tree $(git merge-base ${mainBranch} ${ws.branch}) ${mainBranch} ${ws.branch}`, {
            cwd: repoPath,
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'pipe'],
        });
        return { hasConflicts: false, conflictingFiles: [] };
    } catch (e) {
        // Parse conflict markers
        const output = e.stdout || '';
        const conflicting = [];
        const regex = /changed in both[\s\S]*?'([^']+)'/g;
        let match;
        while ((match = regex.exec(output))) {
            conflicting.push(match[1]);
        }
        return { hasConflicts: conflicting.length > 0, conflictingFiles: conflicting };
    }
}

/**
 * Auto-merge a completed task branch into main.
 * Steps: fetch → rebase → fast-forward merge → cleanup
 * 
 * @param {string} taskId
 * @param {string} repoPath
 * @returns {{ status: 'merged'|'conflict'|'error', message: string, conflictingFiles?: string[] }}
 */
function autoMerge(taskId, repoPath) {
    const ws = workspaceManager.getWorkspace(taskId);
    if (!ws) {
        return { status: 'error', message: 'No active workspace found for this task' };
    }

    const mainBranch = getMainBranch(repoPath);

    try {
        // Step 1: Fetch latest from remote (if available)
        try {
            execSync(`git fetch origin ${mainBranch}`, {
                cwd: repoPath,
                stdio: 'pipe',
            });
        } catch (_) {
            // No remote or fetch failed — continue with local
        }

        // Step 2: Rebase task branch onto main
        try {
            execSync(`git rebase ${mainBranch}`, {
                cwd: ws.path,
                stdio: 'pipe',
            });
        } catch (rebaseError) {
            // Rebase failed — abort and report conflicts
            try {
                execSync('git rebase --abort', { cwd: ws.path, stdio: 'pipe' });
            } catch (_) { /* ignore */ }

            const conflicts = checkConflicts(taskId, repoPath);
            return {
                status: 'conflict',
                message: `Rebase failed: conflicts detected in ${conflicts.conflictingFiles.length} file(s)`,
                conflictingFiles: conflicts.conflictingFiles,
            };
        }

        // Step 3: Merge into main (fast-forward)
        try {
            execSync(`git checkout ${mainBranch}`, {
                cwd: repoPath,
                stdio: 'pipe',
            });
            execSync(`git merge --ff-only ${ws.branch}`, {
                cwd: repoPath,
                stdio: 'pipe',
            });
        } catch (mergeError) {
            // FF merge failed — try regular merge
            try {
                execSync(`git merge ${ws.branch} --no-edit`, {
                    cwd: repoPath,
                    stdio: 'pipe',
                });
            } catch (e) {
                execSync('git merge --abort', { cwd: repoPath, stdio: 'pipe' });
                return {
                    status: 'conflict',
                    message: `Merge failed: could not fast-forward or auto-merge`,
                    conflictingFiles: [],
                };
            }
        }

        // Step 4: Cleanup
        workspaceManager.markMerged(taskId);
        workspaceManager.removeWorkspace(taskId, repoPath);

        // Step 5: Delete the branch
        try {
            execSync(`git branch -d ${ws.branch}`, {
                cwd: repoPath,
                stdio: 'pipe',
            });
        } catch (_) { /* branch cleanup is best-effort */ }

        return {
            status: 'merged',
            message: `Successfully merged ${ws.branch} into ${mainBranch}`,
        };
    } catch (error) {
        return {
            status: 'error',
            message: `Merge pipeline error: ${error.message}`,
        };
    }
}

/**
 * Get branch log (commits on task branch not on main).
 * @param {string} taskId
 * @param {string} repoPath
 * @returns {Object[]}
 */
function getBranchLog(taskId, repoPath) {
    const ws = workspaceManager.getWorkspace(taskId);
    if (!ws) return [];

    const mainBranch = getMainBranch(repoPath);

    try {
        const log = execSync(
            `git log ${mainBranch}..${ws.branch} --oneline --format="%H|%s|%an|%ai"`,
            { cwd: repoPath, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
        ).trim();

        if (!log) return [];

        return log.split('\n').map(line => {
            const [hash, subject, author, date] = line.split('|');
            return { hash, subject, author, date };
        });
    } catch (_) {
        return [];
    }
}

module.exports = {
    autoMerge,
    getDiff,
    checkConflicts,
    getBranchLog,
    getMainBranch,
};
