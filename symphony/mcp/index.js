/**
 * Symphony MCP — Tool Registry
 * Registers all 14 MCP tools on the server instance.
 */

const { registerTaskTools } = require('./tools/tasks');
const { registerLockTools } = require('./tools/locks');
const { registerContextTools } = require('./tools/context');
const { registerStatusTools } = require('./tools/status');
const workspaceTools = require('./tools/workspace');

/**
 * Register all Symphony MCP tools on the given server.
 * @param {import('@modelcontextprotocol/sdk/server/mcp.js').McpServer} server
 * @param {() => string} getAgentId - Returns the current agent ID for this session
 */
function registerAllTools(server, getAgentId) {
    registerTaskTools(server, getAgentId);
    registerLockTools(server, getAgentId);
    registerContextTools(server, getAgentId);
    registerStatusTools(server);

    // Register workspace tools (array-based export)
    for (const tool of workspaceTools) {
        server.tool(tool.name, tool.description, tool.schema, tool.handler);
    }
}

module.exports = { registerAllTools };
