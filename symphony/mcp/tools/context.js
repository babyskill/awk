/**
 * Symphony MCP Tools — Context Bus
 * 2 tools for inter-agent communication via event pub/sub.
 */
const { z } = require('zod');
const path = require('path');

const CORE = path.join(__dirname, '..', '..', 'core');

/**
 * Register context bus tools on the MCP server.
 * @param {import('@modelcontextprotocol/sdk/server/mcp.js').McpServer} server
 * @param {() => string} getAgentId - Returns current agent ID
 */
function registerContextTools(server, getAgentId) {
    // Tool 9: Broadcast event
    server.tool(
        'symphony_broadcast',
        'Broadcast an event to other agents. Use to notify about schema changes, file modifications, or API updates.',
        {
            event_type: z
                .enum(['file_modified', 'api_changed', 'schema_updated', 'dependency_added', 'custom'])
                .describe('Type of event'),
            payload: z
                .object({
                    files: z.array(z.string()).optional().describe('Affected files'),
                    description: z.string().describe('Human-readable description'),
                    impact: z.enum(['low', 'medium', 'high']).default('medium').describe('Impact level'),
                })
                .describe('Event payload'),
        },
        async ({ event_type, payload }) => {
            const cb = require(path.join(CORE, 'context-bus'));
            const agentId = getAgentId();

            cb.publish(agentId, event_type, payload);

            return {
                content: [
                    {
                        type: 'text',
                        text: `Event broadcasted: ${event_type} — ${payload.description}`,
                    },
                ],
            };
        }
    );

    // Tool 10: Query events
    server.tool(
        'symphony_events',
        'Query recent events from other agents. Use to stay informed about changes made by teammates.',
        {
            since: z.string().optional().describe('ISO timestamp — only events after this time'),
            event_type: z.string().optional().describe('Filter by event type'),
            limit: z.number().int().min(1).max(100).default(20).describe('Max events to return'),
        },
        async ({ since, event_type, limit }) => {
            const cb = require(path.join(CORE, 'context-bus'));

            const filter = {};
            if (since) filter.since = since;
            if (event_type) filter.eventType = event_type;
            filter.limit = limit;

            const events = cb.query(filter);

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(events, null, 2),
                    },
                ],
            };
        }
    );
}

module.exports = { registerContextTools };
