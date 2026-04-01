/**
 * Symphony Orchestrator
 * Central state machine managing agent dispatch, concurrency, and lifecycle.
 */
const { getDb } = require('./db');
const taskManager = require('./task-manager');
const fileLockManager = require('./file-lock-manager');
const config = require('../symphony.config');

/**
 * Register a new agent (IDE session connects).
 * @param {string} agentId - Agent identifier
 * @param {string} [name] - Human-readable name
 * @returns {Object} Agent record
 */
function registerAgent(agentId, name) {
    const db = getDb();
    db.prepare(`
    INSERT INTO agents (id, name, status) VALUES (?, ?, 'idle')
    ON CONFLICT(id) DO UPDATE SET status = 'idle', last_heartbeat = datetime('now')
  `).run(agentId, name || agentId);
    return db.prepare('SELECT * FROM agents WHERE id = ?').get(agentId);
}

/**
 * Unregister an agent (IDE session disconnects).
 * Releases all file locks held by this agent.
 * @param {string} agentId
 */
function unregisterAgent(agentId) {
    const db = getDb();
    fileLockManager.releaseLocks(agentId);

    // Reset any claimed tasks back to ready
    db.prepare(`
    UPDATE tasks SET status = 'ready', agent_id = NULL 
    WHERE agent_id = ? AND status IN ('claimed', 'in_progress')
  `).run(agentId);

    db.prepare("UPDATE agents SET status = 'disconnected' WHERE id = ?").run(agentId);
}

/**
 * Update agent heartbeat.
 * @param {string} agentId
 */
function heartbeat(agentId) {
    const db = getDb();
    db.prepare("UPDATE agents SET last_heartbeat = datetime('now') WHERE id = ?").run(agentId);
}

/**
 * Get all connected agents.
 * @returns {Object[]}
 */
function getAgents() {
    const db = getDb();
    return db.prepare("SELECT * FROM agents WHERE status != 'disconnected' ORDER BY connected_at").all();
}

/**
 * Get a single agent.
 * @param {string} agentId
 * @returns {Object|null}
 */
function getAgent(agentId) {
    const db = getDb();
    return db.prepare('SELECT * FROM agents WHERE id = ?').get(agentId) || null;
}

/**
 * Check if there are available slots for new agents.
 * @returns {boolean}
 */
function hasAvailableSlots() {
    const agents = getAgents();
    const workingAgents = agents.filter(a => a.status === 'working');
    return workingAgents.length < config.maxAgents;
}

/**
 * Get number of available slots.
 * @returns {number}
 */
function availableSlots() {
    const agents = getAgents();
    const workingAgents = agents.filter(a => a.status === 'working');
    return Math.max(0, config.maxAgents - workingAgents.length);
}

/**
 * Dispatch a task to an agent.
 * Sets agent to 'working' status and claims the task.
 * @param {string} agentId
 * @param {string} taskId
 * @returns {Object} The claimed task
 */
function dispatchTask(agentId, taskId) {
    const db = getDb();

    if (!hasAvailableSlots()) {
        const agent = getAgent(agentId);
        // Allow re-dispatch to same agent
        if (!agent || agent.status !== 'working') {
            throw new Error('No available agent slots');
        }
    }

    const task = taskManager.claimTask(taskId, agentId);

    db.prepare(`
    UPDATE agents SET status = 'working', current_task_id = ? WHERE id = ?
  `).run(taskId, agentId);

    return task;
}

/**
 * Mark an agent as idle (after task completion).
 * @param {string} agentId
 */
function markIdle(agentId) {
    const db = getDb();
    db.prepare(`
    UPDATE agents SET status = 'idle', current_task_id = NULL WHERE id = ?
  `).run(agentId);
}

/**
 * Get full system status.
 * @returns {Object}
 */
function getStatus(projectId) {
    const agents = getAgents();
    let locks = fileLockManager.getAllLocks();
    const stats = taskManager.getStats(projectId);
    const readyTasks = taskManager.listTasks({ status: 'ready', project: projectId, limit: 10 });

    return {
        agents: agents.map(a => ({
            id: a.id,
            name: a.name,
            status: a.status,
            currentTask: a.current_task_id,
            lastHeartbeat: a.last_heartbeat,
        })),
        lockedFiles: locks.map(l => ({
            file: l.file_path,
            agent: l.agent_id,
            task: l.task_id,
            since: l.acquired_at,
        })),
        queue: readyTasks,
        stats,
        config: {
            maxAgents: config.maxAgents,
            availableSlots: availableSlots(),
        },
    };
}

/**
 * Update agent profile (name, specialties, color, maxConcurrent).
 * @param {string} agentId - Agent ID
 * @param {Object} fields - { name, specialties, color, max_concurrent }
 * @returns {Object} Updated agent
 */
function updateAgentProfile(agentId, fields) {
    const db = getDb();
    const sets = [];
    const params = [];

    if (fields.name !== undefined) { sets.push('name = ?'); params.push(fields.name); }
    if (fields.specialties !== undefined) { sets.push('specialties = ?'); params.push(JSON.stringify(fields.specialties)); }
    if (fields.color !== undefined) { sets.push('color = ?'); params.push(fields.color); }
    if (fields.max_concurrent !== undefined) { sets.push('max_concurrent = ?'); params.push(fields.max_concurrent); }

    if (sets.length === 0) return getAgent(agentId);

    params.push(agentId);
    db.prepare(`UPDATE agents SET ${sets.join(', ')} WHERE id = ?`).run(...params);
    return getAgent(agentId);
}

/**
 * Remove an agent (must be idle or disconnected).
 * @param {string} agentId - Agent ID
 * @returns {boolean} Success
 */
function removeAgent(agentId) {
    const db = getDb();
    const agent = getAgent(agentId);
    if (!agent) throw new Error(`Agent not found: ${agentId}`);
    if (agent.status === 'working') {
        throw new Error(`Cannot remove working agent: ${agentId}`);
    }
    fileLockManager.releaseLocks(agentId);
    db.prepare('DELETE FROM agents WHERE id = ?').run(agentId);
    return true;
}

/**
 * List all agents (including disconnected).
 * @returns {Object[]}
 */
function listAllAgents() {
    const db = getDb();
    return db.prepare('SELECT * FROM agents ORDER BY status ASC, connected_at DESC').all()
        .map(a => ({
            id: a.id,
            name: a.name,
            status: a.status,
            currentTask: a.current_task_id,
            specialties: a.specialties ? JSON.parse(a.specialties) : [],
            color: a.color || '#8888a0',
            maxConcurrent: a.max_concurrent || 1,
            lastHeartbeat: a.last_heartbeat,
        }));
}

module.exports = {
    registerAgent,
    unregisterAgent,
    heartbeat,
    getAgents,
    getAgent,
    hasAvailableSlots,
    availableSlots,
    dispatchTask,
    markIdle,
    getStatus,
    updateAgentProfile,
    removeAgent,
    listAllAgents,
};

