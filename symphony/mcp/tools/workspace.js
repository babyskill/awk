/**
 * Symphony MCP Tools — Workspace Management
 * 
 * Tools for workspace/git operations:
 * - symphony_workspace_status: Get workspace info + diff stats
 * - symphony_merge_task: Trigger auto-merge pipeline
 */
const { z } = require('zod');
const workspaceManager = require('../../core/workspace-manager');
const mergePipeline = require('../../core/merge-pipeline');

const tools = [];

// ─── symphony_workspace_status ──────────────────────────────────────────────

tools.push({
    name: 'symphony_workspace_status',
    description: 'Get workspace info for a task — branch, path, diff stats, and commit log.',
    schema: {
        task_id: z.string().describe('Task ID to check workspace for'),
    },
    handler: async ({ task_id }) => {
        try {
            const ws = workspaceManager.getWorkspace(task_id);

            if (!ws) {
                return {
                    content: [{
                        type: 'text',
                        text: JSON.stringify({
                            exists: false,
                            message: `No active workspace for task ${task_id}`,
                        }),
                    }],
                };
            }

            // Get repo path from workspace path
            const path = require('path');
            const repoPath = getRepoPath(ws.path);

            const diff = mergePipeline.getDiff(task_id, repoPath);
            const log = mergePipeline.getBranchLog(task_id, repoPath);
            const conflicts = mergePipeline.checkConflicts(task_id, repoPath);

            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        exists: true,
                        workspace: {
                            id: ws.id,
                            path: ws.path,
                            branch: ws.branch,
                            type: ws.type,
                            created_at: ws.created_at,
                        },
                        diff: {
                            files: diff.files,
                            insertions: diff.insertions,
                            deletions: diff.deletions,
                        },
                        commits: log.length,
                        commitLog: log.slice(0, 10),
                        hasConflicts: conflicts.hasConflicts,
                        conflictingFiles: conflicts.conflictingFiles,
                    }),
                }],
            };
        } catch (error) {
            return {
                content: [{ type: 'text', text: JSON.stringify({ error: error.message }) }],
                isError: true,
            };
        }
    },
});

// ─── symphony_merge_task ────────────────────────────────────────────────────

tools.push({
    name: 'symphony_merge_task',
    description: 'Run auto-merge pipeline for a completed task: rebase → merge → cleanup.',
    schema: {
        task_id: z.string().describe('Task ID to merge'),
        repo_path: z.string().optional().describe('Repository path (auto-detected if omitted)'),
    },
    handler: async ({ task_id, repo_path }) => {
        try {
            const ws = workspaceManager.getWorkspace(task_id);
            if (!ws) {
                return {
                    content: [{
                        type: 'text',
                        text: JSON.stringify({
                            status: 'error',
                            message: `No active workspace for task ${task_id}`,
                        }),
                    }],
                    isError: true,
                };
            }

            const repoPath = repo_path || getRepoPath(ws.path);
            const result = mergePipeline.autoMerge(task_id, repoPath);

            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify(result),
                }],
                isError: result.status === 'error',
            };
        } catch (error) {
            return {
                content: [{ type: 'text', text: JSON.stringify({ error: error.message }) }],
                isError: true,
            };
        }
    },
});

// ─── Helper ─────────────────────────────────────────────────────────────────

/**
 * Derive the main repo path from a workspace path.
 * Workspaces are typically in .symphony/workspaces/<task-id> relative to repo.
 */
function getRepoPath(wsPath) {
    const path = require('path');
    // Walk up from workspace to find .git
    let current = path.dirname(wsPath);
    for (let i = 0; i < 5; i++) {
        const gitDir = path.join(current, '.git');
        const fs = require('fs');
        if (fs.existsSync(gitDir)) return current;
        current = path.dirname(current);
    }
    // Fallback: assume workspace is in .symphony/workspaces/ under repo root
    return path.resolve(wsPath, '..', '..', '..');
}

module.exports = tools;
