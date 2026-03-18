/**
 * Symphony MCP Tools — File Lock Management
 * 3 tools for checking, acquiring, and releasing file locks.
 */
const { z } = require('zod');
const path = require('path');

const CORE = path.join(__dirname, '..', '..', 'core');

/**
 * Register file lock tools on the MCP server.
 * @param {import('@modelcontextprotocol/sdk/server/mcp.js').McpServer} server
 * @param {() => string} getAgentId - Returns current agent ID
 */
function registerLockTools(server, getAgentId) {
    // Tool 6: Check file availability
    server.tool(
        'symphony_check_files',
        'Check if files are available (not locked by another agent). Use before editing to avoid conflicts.',
        {
            files: z.array(z.string()).min(1).describe('File paths to check'),
        },
        async ({ files }) => {
            const flm = require(path.join(CORE, 'file-lock-manager'));
            const result = flm.checkFiles(files);

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(result, null, 2),
                    },
                ],
            };
        }
    );

    // Tool 7: Acquire file locks
    server.tool(
        'symphony_lock_files',
        'Acquire locks on specific files to prevent other agents from editing them.',
        {
            task_id: z.string().describe('Task ID the locks are for'),
            files: z.array(z.string()).min(1).describe('File paths to lock'),
        },
        async ({ task_id, files }) => {
            const flm = require(path.join(CORE, 'file-lock-manager'));
            const agentId = getAgentId();

            try {
                const result = flm.acquireLocks(agentId, task_id, files);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({ success: true, ...result }, null, 2),
                        },
                    ],
                };
            } catch (err) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(
                                { success: false, error: err.message },
                                null,
                                2
                            ),
                        },
                    ],
                    isError: true,
                };
            }
        }
    );

    // Tool 8: Release file locks
    server.tool(
        'symphony_unlock_files',
        'Release locks on specific files. Other agents can then edit these files.',
        {
            task_id: z.string().describe('Task ID the locks belong to'),
            files: z.array(z.string()).min(1).describe('File paths to unlock'),
        },
        async ({ task_id, files }) => {
            const flm = require(path.join(CORE, 'file-lock-manager'));
            const agentId = getAgentId();

            flm.releaseSpecificLocks(agentId, files);

            return {
                content: [{ type: 'text', text: `Released locks: ${files.join(', ')}` }],
            };
        }
    );
}

module.exports = { registerLockTools };
