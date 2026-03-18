/**
 * Symphony Task Manager
 * CRUD operations for tasks with atomic claim/complete semantics.
 */
const { nanoid } = require('nanoid');
const { getDb } = require('./db');

/**
 * Create a new task.
 * @param {string} title - Task title
 * @param {Object} [opts] - Optional fields
 * @returns {Object} Created task
 */
function createTask(title, opts = {}) {
    const db = getDb();
    const id = opts.id || `sym-${nanoid(8)}`;
    const estimatedFiles = opts.estimatedFiles
        ? JSON.stringify(opts.estimatedFiles)
        : null;
    const requiredSkills = opts.requiredSkills
        ? JSON.stringify(opts.requiredSkills)
        : '[]';

    const stmt = db.prepare(`
    INSERT INTO tasks (id, title, description, status, priority, acceptance, phase, epic_id, estimated_files, project_id, required_skills)
    VALUES (?, ?, ?, 'ready', ?, ?, ?, ?, ?, ?, ?)
  `);

    stmt.run(
        id,
        title,
        opts.description || null,
        opts.priority || 2,
        opts.acceptance || null,
        opts.phase || null,
        opts.epicId || null,
        estimatedFiles,
        opts.projectId || null,
        requiredSkills
    );

    return getTask(id);
}

/**
 * Get a single task by ID.
 * @param {string} id - Task ID
 * @returns {Object|null}
 */
function getTask(id) {
    const db = getDb();
    const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    return row ? normalizeTask(row) : null;
}

/**
 * List tasks with optional filters.
 * @param {Object} [filter] - { status, agentId, phase, epicId, project, limit }
 * @returns {Object[]}
 */
function listTasks(filter = {}) {
    const db = getDb();
    const conditions = [];
    const params = [];

    if (filter.status) {
        conditions.push('status = ?');
        params.push(filter.status);
    }
    if (filter.agentId) {
        conditions.push('agent_id = ?');
        params.push(filter.agentId);
    }
    if (filter.phase) {
        conditions.push('phase = ?');
        params.push(filter.phase);
    }
    if (filter.epicId) {
        conditions.push('epic_id = ?');
        params.push(filter.epicId);
    }
    if (filter.project) {
        conditions.push('project_id = ?');
        params.push(filter.project);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = filter.limit ? `LIMIT ${parseInt(filter.limit)}` : '';
    const order = 'ORDER BY priority ASC, created_at ASC';

    const rows = db.prepare(`SELECT * FROM tasks ${where} ${order} ${limit}`).all(...params);
    return rows.map(normalizeTask);
}

/**
 * Claim a task for an agent (atomic operation).
 * @param {string} taskId - Task ID
 * @param {string} agentId - Agent ID
 * @returns {Object} Updated task
 * @throws {Error} If task is not claimable
 */
function claimTask(taskId, agentId) {
    const db = getDb();

    const claim = db.transaction(() => {
        const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
        if (!task) throw new Error(`Task not found: ${taskId}`);
        if (task.status !== 'ready') {
            throw new Error(`Task ${taskId} is not claimable (status: ${task.status})`);
        }

        db.prepare(`
      UPDATE tasks 
      SET status = 'claimed', agent_id = ?, claimed_at = datetime('now')
      WHERE id = ?
    `).run(agentId, taskId);

        return db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
    });

    return normalizeTask(claim());
}

/**
 * Update task progress.
 * @param {string} taskId - Task ID
 * @param {number} progress - Progress 0-100
 * @param {Object} [opts] - { currentFile, lastAction }
 */
function updateProgress(taskId, progress, opts = {}) {
    const db = getDb();
    db.prepare(`
    UPDATE tasks SET progress = ?, status = 'in_progress' WHERE id = ?
  `).run(Math.min(100, Math.max(0, progress)), taskId);
    return getTask(taskId);
}

/**
 * Complete a task.
 * @param {string} taskId - Task ID
 * @param {string} summary - Completion summary
 * @param {string[]} [filesChanged] - List of changed files
 * @returns {Object} Updated task
 */
function completeTask(taskId, summary, filesChanged = []) {
    const db = getDb();
    db.prepare(`
    UPDATE tasks 
    SET status = 'done', summary = ?, progress = 100, completed_at = datetime('now')
    WHERE id = ?
  `).run(summary, taskId);
    return getTask(taskId);
}

/**
 * Abandon a task (agent gives up).
 * @param {string} taskId - Task ID
 * @param {string} reason - Reason for abandoning
 * @returns {Object} Updated task
 */
function abandonTask(taskId, reason) {
    const db = getDb();
    db.prepare(`
    UPDATE tasks 
    SET status = 'ready', agent_id = NULL, summary = ?, progress = 0
    WHERE id = ?
  `).run(`Abandoned: ${reason}`, taskId);
    return getTask(taskId);
}

/**
 * Move task to review status.
 * @param {string} taskId - Task ID
 * @returns {Object} Updated task
 */
function reviewTask(taskId) {
    const db = getDb();
    db.prepare(`UPDATE tasks SET status = 'review' WHERE id = ?`).run(taskId);
    return getTask(taskId);
}

/**
 * Get task stats.
 * @returns {Object} { ready, claimed, in_progress, review, done, total }
 */
function getStats() {
    const db = getDb();
    const rows = db.prepare(`
    SELECT status, COUNT(*) as count FROM tasks GROUP BY status
  `).all();

    const stats = { ready: 0, claimed: 0, in_progress: 0, review: 0, done: 0, abandoned: 0, total: 0 };
    for (const row of rows) {
        stats[row.status] = row.count;
        stats.total += row.count;
    }
    return stats;
}

/**
 * Normalize a task row from the database.
 */
function normalizeTask(row) {
    return {
        ...row,
        estimated_files: row.estimated_files ? JSON.parse(row.estimated_files) : [],
    };
}

/**
 * Update task fields.
 * @param {string} taskId - Task ID
 * @param {Object} fields - { title, description, priority, acceptance, phase, sort_order }
 * @returns {Object} Updated task
 */
function updateTask(taskId, fields) {
    const db = getDb();
    const allowed = ['title', 'description', 'priority', 'acceptance', 'phase', 'sort_order'];
    const sets = [];
    const params = [];

    for (const key of allowed) {
        if (fields[key] !== undefined) {
            sets.push(`${key} = ?`);
            params.push(fields[key]);
        }
    }

    if (sets.length === 0) return getTask(taskId);

    params.push(taskId);
    db.prepare(`UPDATE tasks SET ${sets.join(', ')} WHERE id = ?`).run(...params);
    return getTask(taskId);
}

/**
 * Delete a task (only draft or ready status).
 * @param {string} taskId - Task ID
 * @returns {boolean} Success
 */
function deleteTask(taskId) {
    const db = getDb();
    const task = db.prepare('SELECT status FROM tasks WHERE id = ?').get(taskId);
    if (!task) throw new Error(`Task not found: ${taskId}`);
    if (!['draft', 'ready'].includes(task.status)) {
        throw new Error(`Cannot delete task in ${task.status} status`);
    }
    db.prepare('DELETE FROM tasks WHERE id = ?').run(taskId);
    return true;
}

/**
 * Approve a draft task → ready.
 * @param {string} taskId - Task ID
 * @returns {Object} Updated task
 */
function approveTask(taskId) {
    const db = getDb();
    const task = db.prepare('SELECT status FROM tasks WHERE id = ?').get(taskId);
    if (!task) throw new Error(`Task not found: ${taskId}`);
    if (task.status !== 'draft') {
        throw new Error(`Task ${taskId} is not a draft (status: ${task.status})`);
    }
    db.prepare("UPDATE tasks SET status = 'ready' WHERE id = ?").run(taskId);
    return getTask(taskId);
}

/**
 * Batch approve multiple draft tasks → ready.
 * @param {string[]} taskIds - Array of task IDs
 * @returns {number} Number of approved tasks
 */
function bulkApprove(taskIds) {
    const db = getDb();
    const stmt = db.prepare("UPDATE tasks SET status = 'ready' WHERE id = ? AND status = 'draft'");
    let count = 0;
    const run = db.transaction(() => {
        for (const id of taskIds) {
            const result = stmt.run(id);
            count += result.changes;
        }
    });
    run();
    return count;
}

/**
 * Reopen a done task → ready (reset agent, progress).
 * @param {string} taskId - Task ID
 * @returns {Object} Updated task
 */
function reopenTask(taskId) {
    const db = getDb();
    db.prepare(`
    UPDATE tasks 
    SET status = 'ready', agent_id = NULL, progress = 0, 
        claimed_at = NULL, completed_at = NULL, summary = NULL
    WHERE id = ?
  `).run(taskId);
    return getTask(taskId);
}

/**
 * Reorder tasks by setting sort_order based on array position.
 * @param {string[]} orderedIds - Task IDs in desired order
 */
function reorderTasks(orderedIds) {
    const db = getDb();
    const stmt = db.prepare('UPDATE tasks SET sort_order = ? WHERE id = ?');
    const run = db.transaction(() => {
        for (let i = 0; i < orderedIds.length; i++) {
            stmt.run(i, orderedIds[i]);
        }
    });
    run();
}

module.exports = {
    createTask,
    getTask,
    listTasks,
    claimTask,
    updateProgress,
    completeTask,
    abandonTask,
    reviewTask,
    getStats,
    updateTask,
    deleteTask,
    approveTask,
    bulkApprove,
    reopenTask,
    reorderTasks,
};

