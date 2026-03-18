#!/usr/bin/env node

/**
 * Symphony MCP Server
 * Starts an MCP server via stdio transport for IDE ↔ Symphony communication.
 *
 * Usage:
 *   node mcp/server.js
 *   # Or via CLI:
 *   symphony mcp-serve
 *
 * Environment:
 *   SYMPHONY_AGENT_NAME  — Agent display name (default: auto-generated)
 *   SYMPHONY_PROJECT     — Project root path (default: cwd)
 */

const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const path = require('path');
const { nanoid } = require('nanoid');

// Initialize database (ensure core modules can access it)
const SYMPHONY_ROOT = path.join(__dirname, '..');
process.chdir(process.env.SYMPHONY_PROJECT || SYMPHONY_ROOT);

// Import core DB to ensure it's initialized
const db = require(path.join(SYMPHONY_ROOT, 'core', 'db'));
const orchestrator = require(path.join(SYMPHONY_ROOT, 'core', 'orchestrator'));

// Read package version
let version = '0.1.0';
try {
    const pkg = require(path.join(SYMPHONY_ROOT, 'package.json'));
    version = pkg.version || version;
} catch (_) {
    // Ignore
}

// Agent identification
const agentName = process.env.SYMPHONY_AGENT_NAME || `agent-${nanoid(6)}`;
let agentId = agentName;

/**
 * Get the current agent ID for this MCP session.
 * @returns {string}
 */
function getAgentId() {
    return agentId;
}

/**
 * Main entry point — starts the MCP server.
 */
async function main() {
    // Create MCP server instance
    const server = new McpServer(
        {
            name: 'awkit-symphony',
            version,
        },
        {
            capabilities: {
                tools: {},
            },
        }
    );

    // Register all 12 tools
    const { registerAllTools } = require('./index');
    registerAllTools(server, getAgentId);

    // Register agent on startup
    orchestrator.registerAgent(agentId, agentName);

    // Log to stderr (stdout is reserved for MCP JSON-RPC)
    process.stderr.write(`🎼 Symphony MCP Server v${version}\n`);
    process.stderr.write(`   Agent: ${agentName} (${agentId})\n`);
    process.stderr.write(`   Transport: stdio\n`);
    process.stderr.write(`   Tools: 12 registered\n\n`);

    // Create stdio transport and connect
    const transport = new StdioServerTransport();
    await server.connect(transport);

    // Graceful shutdown
    const shutdown = () => {
        process.stderr.write('\n🛑 Symphony MCP Server shutting down...\n');
        try {
            orchestrator.unregisterAgent(agentId);
        } catch (_) {
            // Ignore errors during shutdown
        }
        try {
            db.close();
        } catch (_) {
            // Ignore
        }
        process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
}

// Run if executed directly
main().catch((err) => {
    process.stderr.write(`❌ Fatal error: ${err.message}\n`);
    process.stderr.write(`${err.stack}\n`);
    process.exit(1);
});
