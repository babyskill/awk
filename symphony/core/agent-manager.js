/**
 * Symphony Agent Manager
 * Project-scoped agent operations with skill-based task matching.
 * 
 * Agents are configuration templates attached to projects.
 * Each Antigravity window attaches to one agent via session_id.
 * Agents have skills that determine which tasks they can be assigned.
 */
const { getDb } = require('./db');

const IDLE_THRESHOLD_MINUTES = 15;

// ─── CRUD Operations ────────────────────────────────────────────────────────

/**
 * Create a new project-scoped agent.
 * @param {string} id - Agent ID (e.g., 'giacngo-dev')
 * @param {string} projectId - Project ID
 * @param {string} name - Display name
 * @param {string[]} [skills] - Array of skill strings
 * @param {Object} [opts] - { icon, color, max_concurrent }
 * @returns {Object} Created agent
 */
function createAgent(id, projectId, name, skills = [], opts = {}) {
    const db = getDb();

    // Validate project exists
    const project = db.prepare('SELECT id FROM projects WHERE id = ?').get(projectId);
    if (!project) {
        throw new Error(`Project not found: ${projectId}. Register it first.`);
    }

    // Check for duplicate
    const existing = db.prepare('SELECT id FROM project_agents WHERE id = ?').get(id);
    if (existing) {
        throw new Error(`Agent already exists: ${id}`);
    }

    db.prepare(`
        INSERT INTO project_agents (id, project_id, name, skills, icon, color, max_concurrent)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
        id,
        projectId,
        name,
        JSON.stringify(skills),
        opts.icon || '🤖',
        opts.color || '#8888a0',
        opts.max_concurrent || 1
    );

    return getAgent(id);
}

/**
 * Get a single agent by ID.
 * @param {string} id - Agent ID
 * @returns {Object|null}
 */
function getAgent(id) {
    const db = getDb();
    const row = db.prepare('SELECT * FROM project_agents WHERE id = ?').get(id);
    return row ? normalizeAgent(row) : null;
}

/**
 * List agents with optional filters.
 * @param {Object} [filter] - { project, status }
 * @returns {Object[]}
 */
function listAgents(filter = {}) {
    const db = getDb();
    const conditions = [];
    const params = [];

    if (filter.project) {
        conditions.push('project_id = ?');
        params.push(filter.project);
    }
    if (filter.status) {
        conditions.push('status = ?');
        params.push(filter.status);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows = db.prepare(`SELECT * FROM project_agents ${where} ORDER BY project_id ASC, created_at ASC`).all(...params);
    return rows.map(normalizeAgent);
}

/**
 * Update agent fields.
 * @param {string} id - Agent ID
 * @param {Object} fields - { name, skills, icon, color, max_concurrent }
 * @returns {Object} Updated agent
 */
function updateAgent(id, fields) {
    const db = getDb();
    const allowed = ['name', 'icon', 'color', 'max_concurrent'];
    const sets = [];
    const params = [];

    for (const key of allowed) {
        if (fields[key] !== undefined) {
            sets.push(`${key} = ?`);
            params.push(fields[key]);
        }
    }

    // Handle skills separately (needs JSON)
    if (fields.skills !== undefined) {
        sets.push('skills = ?');
        params.push(JSON.stringify(fields.skills));
    }

    if (sets.length === 0) return getAgent(id);

    params.push(id);
    db.prepare(`UPDATE project_agents SET ${sets.join(', ')} WHERE id = ?`).run(...params);
    return getAgent(id);
}

/**
 * Remove an agent (must be offline).
 * @param {string} id - Agent ID
 * @returns {boolean}
 */
function removeAgent(id) {
    const db = getDb();
    const agent = db.prepare('SELECT * FROM project_agents WHERE id = ?').get(id);
    if (!agent) throw new Error(`Agent not found: ${id}`);
    if (agent.status === 'working') {
        throw new Error(`Cannot remove working agent: ${id}. Detach first.`);
    }
    db.prepare('DELETE FROM project_agents WHERE id = ?').run(id);
    return true;
}

// ─── Session Management ─────────────────────────────────────────────────────

/**
 * Attach an Antigravity window (session) to an agent.
 * @param {string} agentId - Agent ID
 * @param {string} sessionId - Conversation/session ID
 * @returns {Object} Updated agent
 */
function attachSession(agentId, sessionId) {
    const db = getDb();
    const agent = db.prepare('SELECT * FROM project_agents WHERE id = ?').get(agentId);
    if (!agent) throw new Error(`Agent not found: ${agentId}`);

    if (agent.session_id && agent.session_id !== sessionId && agent.status !== 'offline') {
        throw new Error(`Agent ${agentId} already attached to session ${agent.session_id}`);
    }

    db.prepare(`
        UPDATE project_agents 
        SET session_id = ?, status = 'idle', last_active_at = datetime('now'), idle_since = datetime('now')
        WHERE id = ?
    `).run(sessionId, agentId);

    return getAgent(agentId);
}

/**
 * Detach a session from an agent.
 * Releases any claimed tasks.
 * @param {string} agentId - Agent ID
 * @returns {Object} Updated agent
 */
function detachSession(agentId) {
    const db = getDb();
    const agent = db.prepare('SELECT * FROM project_agents WHERE id = ?').get(agentId);
    if (!agent) throw new Error(`Agent not found: ${agentId}`);

    // Reset any in-progress tasks back to ready
    if (agent.current_task_id) {
        db.prepare(`
            UPDATE tasks SET status = 'ready', agent_id = NULL 
            WHERE agent_id = ? AND status IN ('claimed', 'in_progress')
        `).run(agentId);
    }

    db.prepare(`
        UPDATE project_agents 
        SET session_id = NULL, status = 'offline', current_task_id = NULL, idle_since = NULL
        WHERE id = ?
    `).run(agentId);

    return getAgent(agentId);
}

/**
 * Update agent's last activity timestamp (call on every meaningful action).
 * @param {string} agentId - Agent ID
 */
function touchActivity(agentId) {
    const db = getDb();
    db.prepare(`
        UPDATE project_agents 
        SET last_active_at = datetime('now'), idle_since = NULL
        WHERE id = ?
    `).run(agentId);
}

/**
 * Mark agent as working on a task.
 * @param {string} agentId - Agent ID
 * @param {string} taskId - Task ID
 * @returns {Object} Updated agent
 */
function startWork(agentId, taskId) {
    const db = getDb();
    db.prepare(`
        UPDATE project_agents 
        SET status = 'working', current_task_id = ?, last_active_at = datetime('now'), idle_since = NULL
        WHERE id = ?
    `).run(taskId, agentId);
    return getAgent(agentId);
}

/**
 * Mark agent as idle (after task completion).
 * @param {string} agentId - Agent ID
 * @returns {Object} Updated agent
 */
function markIdle(agentId) {
    const db = getDb();
    db.prepare(`
        UPDATE project_agents 
        SET status = 'idle', current_task_id = NULL, idle_since = datetime('now')
        WHERE id = ?
    `).run(agentId);
    return getAgent(agentId);
}

// ─── Skill Matching ─────────────────────────────────────────────────────────

/**
 * Find agents matching task skill requirements.
 * @param {string[]} taskSkills - Required skills for the task
 * @param {string} [projectId] - Limit to one project
 * @returns {Object[]} Matching agents sorted by relevance
 */
function findMatchingAgents(taskSkills, projectId) {
    const agents = listAgents(projectId ? { project: projectId } : {});

    if (!taskSkills || taskSkills.length === 0) {
        // No skill requirements — all agents match
        return agents.filter(a => a.status !== 'offline');
    }

    return agents
        .filter(a => a.status !== 'offline')
        .filter(a => {
            // Agent must have at least 1 matching skill
            return taskSkills.some(s => a.skills.includes(s));
        })
        .map(a => {
            const matchCount = taskSkills.filter(s => a.skills.includes(s)).length;
            return { ...a, matchCount, matchPercent: Math.round((matchCount / taskSkills.length) * 100) };
        })
        .sort((a, b) => {
            // Prefer idle over working
            if (a.status === 'idle' && b.status !== 'idle') return -1;
            if (b.status === 'idle' && a.status !== 'idle') return 1;
            // Then by match count
            return b.matchCount - a.matchCount;
        });
}

/**
 * Find agents that have been idle beyond the threshold.
 * @param {number} [thresholdMinutes] - Minutes of inactivity
 * @returns {Object[]} Idle agents
 */
function findIdleAgents(thresholdMinutes = IDLE_THRESHOLD_MINUTES) {
    const db = getDb();
    const rows = db.prepare(`
        SELECT * FROM project_agents 
        WHERE status IN ('idle', 'working') 
        AND idle_since IS NOT NULL 
        AND datetime(idle_since, '+' || ? || ' minutes') < datetime('now')
    `).all(thresholdMinutes);
    return rows.map(normalizeAgent);
}

/**
 * Suggest reassignment for idle agents (cross-project).
 * Returns agents with matching ready tasks from any project.
 * @returns {Object[]} Array of { agent, suggestedTasks }
 */
function suggestReassignment() {
    const db = getDb();
    const idleAgents = findIdleAgents();
    const suggestions = [];

    for (const agent of idleAgents) {
        // Find ready tasks matching this agent's skills (any project)
        const readyTasks = db.prepare(`
            SELECT * FROM tasks WHERE status = 'ready' ORDER BY priority ASC, sort_order ASC LIMIT 10
        `).all();

        const matchingTasks = readyTasks.filter(t => {
            const reqSkills = t.required_skills ? JSON.parse(t.required_skills) : [];
            if (reqSkills.length === 0) return true; // No skill req → matches all
            return reqSkills.some(s => agent.skills.includes(s));
        });

        if (matchingTasks.length > 0) {
            suggestions.push({
                agent,
                suggestedTasks: matchingTasks.slice(0, 3),
            });
        }
    }

    return suggestions;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Normalize a raw DB row into a clean agent object.
 */
function normalizeAgent(row) {
    return {
        id: row.id,
        projectId: row.project_id,
        name: row.name,
        skills: row.skills ? JSON.parse(row.skills) : [],
        status: row.status,
        sessionId: row.session_id,
        currentTask: row.current_task_id,
        lastActiveAt: row.last_active_at,
        idleSince: row.idle_since,
        maxConcurrent: row.max_concurrent || 1,
        icon: row.icon || '🤖',
        color: row.color || '#8888a0',
        createdAt: row.created_at,
    };
}

module.exports = {
    createAgent,
    getAgent,
    listAgents,
    updateAgent,
    removeAgent,
    attachSession,
    detachSession,
    touchActivity,
    startWork,
    markIdle,
    findMatchingAgents,
    findIdleAgents,
    suggestReassignment,
};
