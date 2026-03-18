/**
 * Symphony Context Bus
 * Event pub/sub for inter-agent communication.
 * Agents broadcast changes (schema updates, API changes, etc.)
 * so other agents can adapt their work.
 */
const { getDb } = require('./db');

/**
 * Publish an event to the context bus.
 * @param {string} agentId - Publishing agent
 * @param {string} eventType - Event type (file_modified, api_changed, schema_updated, etc.)
 * @param {Object} payload - Event payload { files, description, impact }
 * @param {string} [taskId] - Related task
 */
function publish(agentId, eventType, payload, taskId = null) {
    const db = getDb();
    db.prepare(`
    INSERT INTO events (agent_id, task_id, event_type, payload)
    VALUES (?, ?, ?, ?)
  `).run(agentId, taskId, eventType, JSON.stringify(payload));
}

/**
 * Query events with optional filters.
 * @param {Object} [filter] - { since, eventType, agentId, limit }
 * @returns {Object[]}
 */
function query(filter = {}) {
    const db = getDb();
    const conditions = [];
    const params = [];

    if (filter.since) {
        conditions.push('created_at > ?');
        params.push(filter.since);
    }
    if (filter.eventType) {
        conditions.push('event_type = ?');
        params.push(filter.eventType);
    }
    if (filter.agentId) {
        conditions.push('agent_id = ?');
        params.push(filter.agentId);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = filter.limit ? `LIMIT ${parseInt(filter.limit)}` : 'LIMIT 50';

    const rows = db.prepare(`
    SELECT * FROM events ${where} ORDER BY created_at DESC ${limit}
  `).all(...params);

    return rows.map(row => ({
        ...row,
        payload: row.payload ? JSON.parse(row.payload) : null,
    }));
}

/**
 * Get most recent events.
 * @param {number} [limit=10]
 * @returns {Object[]}
 */
function getRecent(limit = 10) {
    return query({ limit });
}

/**
 * Get events related to specific files.
 * @param {string[]} files - File paths to check
 * @param {number} [limit=20]
 * @returns {Object[]}
 */
function getFileEvents(files, limit = 20) {
    const db = getDb();
    const rows = db.prepare(`
    SELECT * FROM events 
    WHERE event_type IN ('file_modified', 'schema_updated', 'api_changed')
    ORDER BY created_at DESC
    LIMIT ?
  `).all(limit);

    return rows
        .map(row => ({
            ...row,
            payload: row.payload ? JSON.parse(row.payload) : null,
        }))
        .filter(event => {
            if (!event.payload?.files) return false;
            return event.payload.files.some(f => files.includes(f));
        });
}

module.exports = {
    publish,
    query,
    getRecent,
    getFileEvents,
};
