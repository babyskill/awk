/**
 * Symphony MCP Tools — Status & Task Creation
 * 2 tools for system status overview and creating new tasks.
 */
const { z } = require('zod');
const path = require('path');

const CORE = path.join(__dirname, '..', '..', 'core');

/**
 * Register status tools on the MCP server.
 * @param {import('@modelcontextprotocol/sdk/server/mcp.js').McpServer} server
 */
function registerStatusTools(server) {
    // Tool 11: System status
    server.tool(
        'symphony_status',
        'Get full Symphony system status: connected agents, file locks, task queue, and statistics.',
        {},
        async () => {
            const orchestrator = require(path.join(CORE, 'orchestrator'));
            const status = orchestrator.getStatus();

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(status, null, 2),
                    },
                ],
            };
        }
    );

    // Tool 12: Create a new task
    server.tool(
        'symphony_create_task',
        'Create a new task in the Symphony queue. The task will be available for any agent to claim.',
        {
            title: z.string().describe('Task title'),
            description: z.string().optional().describe('Detailed description'),
            priority: z.number().int().min(1).max(3).default(2).describe('Priority: 1=high, 2=medium, 3=low'),
            acceptance: z.string().optional().describe('Acceptance criteria'),
            phase: z.string().optional().describe('Phase/milestone'),
            estimated_files: z
                .array(z.string())
                .optional()
                .describe('Files this task will likely edit (for pre-locking)'),
        },
        async ({ title, description, priority, acceptance, phase, estimated_files }) => {
            const tm = require(path.join(CORE, 'task-manager'));

            const task = tm.createTask(title, {
                description,
                priority,
                acceptance,
                phase,
                estimatedFiles: estimated_files,
            });

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(
                            {
                                id: task.id,
                                title: task.title,
                                status: task.status,
                                priority: task.priority,
                            },
                            null,
                            2
                        ),
                    },
                ],
            };
        }
    );
}

module.exports = { registerStatusTools };
