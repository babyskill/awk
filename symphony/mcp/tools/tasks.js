/**
 * Symphony MCP Tools — Task Management
 * 5 tools for task lifecycle: list, claim, progress, complete, abandon
 */
const { z } = require('zod');
const path = require('path');

const CORE = path.join(__dirname, '..', '..', 'core');

/**
 * Register all task management tools on the MCP server.
 * @param {import('@modelcontextprotocol/sdk/server/mcp.js').McpServer} server
 * @param {() => string} getAgentId - Returns current agent ID
 */
function registerTaskTools(server, getAgentId) {
    // Tool 1: List available tasks
    server.tool(
        'symphony_available_tasks',
        'List tasks available for claiming. Use filter "ready" for unclaimed tasks, "my" for your tasks, or "all" for everything.',
        {
            filter: z.enum(['ready', 'all', 'my']).default('ready').describe('Task filter'),
            limit: z.number().int().min(1).max(100).default(10).describe('Max results'),
        },
        async ({ filter, limit }) => {
            const tm = require(path.join(CORE, 'task-manager'));
            const agentId = getAgentId();

            let tasks;
            switch (filter) {
                case 'ready':
                    tasks = tm.listTasks({ status: 'ready', limit });
                    break;
                case 'my':
                    tasks = tm.listTasks({ agentId, limit });
                    break;
                case 'all':
                    tasks = tm.listTasks({ limit });
                    break;
                default:
                    tasks = tm.listTasks({ status: 'ready', limit });
            }

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(
                            tasks.map((t) => ({
                                id: t.id,
                                title: t.title,
                                description: t.description,
                                status: t.status,
                                priority: t.priority,
                                acceptance: t.acceptance,
                                phase: t.phase,
                                estimated_files: t.estimated_files,
                            })),
                            null,
                            2
                        ),
                    },
                ],
            };
        }
    );

    // Tool 2: Claim a task
    server.tool(
        'symphony_claim_task',
        'Claim a task to start working on it. This acquires file locks and prepares a workspace.',
        {
            task_id: z.string().describe('Task ID to claim'),
            agent_name: z.string().optional().describe('Optional agent display name'),
        },
        async ({ task_id, agent_name }) => {
            const orchestrator = require(path.join(CORE, 'orchestrator'));
            const tm = require(path.join(CORE, 'task-manager'));
            const flm = require(path.join(CORE, 'file-lock-manager'));
            const agentId = getAgentId();

            // Ensure agent is registered
            orchestrator.registerAgent(agentId, agent_name || agentId);

            // Dispatch task to agent
            const task = orchestrator.dispatchTask(agentId, task_id);

            // Acquire file locks if estimated files are provided
            let lockedFiles = [];
            if (task.estimated_files && task.estimated_files.length > 0) {
                const lockResult = flm.acquireLocks(agentId, task_id, task.estimated_files);
                lockedFiles = lockResult.acquired || task.estimated_files;
            }

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(
                            {
                                task_id: task.id,
                                title: task.title,
                                workspace_path: task.workspace_path || null,
                                branch: task.branch || null,
                                locked_files: lockedFiles,
                                acceptance_criteria: task.acceptance || null,
                                description: task.description || null,
                            },
                            null,
                            2
                        ),
                    },
                ],
            };
        }
    );

    // Tool 3: Report progress
    server.tool(
        'symphony_report_progress',
        'Report progress on a claimed task. Updates percentage and optionally current file being edited.',
        {
            task_id: z.string().describe('Task ID'),
            progress: z.number().int().min(0).max(100).describe('Progress percentage 0-100'),
            current_file: z.string().optional().describe('Current file being edited'),
            last_action: z.string().optional().describe('Last action performed'),
        },
        async ({ task_id, progress, current_file, last_action }) => {
            const tm = require(path.join(CORE, 'task-manager'));
            tm.updateProgress(task_id, progress, { currentFile: current_file, lastAction: last_action });

            return {
                content: [{ type: 'text', text: `Progress updated: ${progress}%` }],
            };
        }
    );

    // Tool 4: Complete a task
    server.tool(
        'symphony_complete_task',
        'Mark a task as complete. Releases file locks and marks agent as idle.',
        {
            task_id: z.string().describe('Task ID'),
            summary: z.string().describe('Summary of what was done'),
            files_changed: z.array(z.string()).default([]).describe('List of changed files'),
        },
        async ({ task_id, summary, files_changed }) => {
            const tm = require(path.join(CORE, 'task-manager'));
            const orchestrator = require(path.join(CORE, 'orchestrator'));
            const flm = require(path.join(CORE, 'file-lock-manager'));
            const agentId = getAgentId();

            // Complete the task
            const task = tm.completeTask(task_id, summary, files_changed);

            // Release all file locks for this agent
            flm.releaseLocks(agentId);

            // Mark agent as idle
            orchestrator.markIdle(agentId);

            // Check for next available task
            const nextTasks = tm.listTasks({ status: 'ready', limit: 1 });
            const nextTask = nextTasks.length > 0 ? nextTasks[0] : null;

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(
                            {
                                status: 'completed',
                                merge_status: 'pr_created', // TODO: implement actual merge logic
                                next_task: nextTask
                                    ? { id: nextTask.id, title: nextTask.title, priority: nextTask.priority }
                                    : null,
                            },
                            null,
                            2
                        ),
                    },
                ],
            };
        }
    );

    // Tool 5: Abandon a task
    server.tool(
        'symphony_abandon_task',
        'Abandon a task you are working on. Releases all file locks and returns the task to the queue.',
        {
            task_id: z.string().describe('Task ID'),
            reason: z.string().describe('Reason for abandoning'),
        },
        async ({ task_id, reason }) => {
            const tm = require(path.join(CORE, 'task-manager'));
            const orchestrator = require(path.join(CORE, 'orchestrator'));
            const flm = require(path.join(CORE, 'file-lock-manager'));
            const agentId = getAgentId();

            // Abandon the task
            tm.abandonTask(task_id, reason);

            // Release file locks
            flm.releaseLocks(agentId);

            // Mark agent idle
            orchestrator.markIdle(agentId);

            return {
                content: [{ type: 'text', text: `Task ${task_id} abandoned: ${reason}` }],
            };
        }
    );
}

module.exports = { registerTaskTools };
