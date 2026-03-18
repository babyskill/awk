/**
 * Core module bridge for Next.js API routes.
 * 
 * Single centralized DB at ~/.gemini/antigravity/symphony/symphony.db
 * with multi-project support via project_id scoping.
 * 
 * - Projects: registered via projects table
 * - Tasks/Events/Locks: scoped by project_id
 * - Agents: global (1 agent works across projects)
 */

import Database from 'better-sqlite3';
import path from 'path';
import os from 'os';
import fs from 'fs';

// ─── Database Singleton ─────────────────────────────────────────────────────

let dbInstance = null;

function getDbPath() {
    const symphonyDir = path.join(os.homedir(), '.gemini', 'antigravity', 'symphony');
    if (!fs.existsSync(symphonyDir)) {
        fs.mkdirSync(symphonyDir, { recursive: true });
    }
    return path.join(symphonyDir, 'symphony.db');
}

function getDb() {
    if (!dbInstance) {
        const dbPath = getDbPath();
        dbInstance = new Database(dbPath);
        dbInstance.pragma('journal_mode = WAL');
        dbInstance.pragma('foreign_keys = ON');
        ensureSchema(dbInstance);
    }
    return dbInstance;
}

function ensureSchema(db) {
    db.exec(`
        -- Projects registry
        CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            path TEXT,
            icon TEXT DEFAULT '📁',
            color TEXT DEFAULT '#8888a0',
            is_active INTEGER DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now')),
            last_active_at TEXT
        );

        -- Tasks (scoped by project_id)
        CREATE TABLE IF NOT EXISTS tasks (
            id TEXT PRIMARY KEY,
            project_id TEXT,
            title TEXT NOT NULL,
            description TEXT,
            status TEXT NOT NULL DEFAULT 'ready',
            priority INTEGER DEFAULT 2,
            sort_order INTEGER DEFAULT 0,
            acceptance TEXT,
            phase TEXT,
            epic_id TEXT,
            agent_id TEXT,
            estimated_files TEXT,
            workspace_path TEXT,
            branch TEXT,
            progress INTEGER DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now')),
            claimed_at TEXT,
            completed_at TEXT,
            summary TEXT
        );

        -- Agents (global — not project-scoped)
        CREATE TABLE IF NOT EXISTS agents (
            id TEXT PRIMARY KEY,
            name TEXT,
            status TEXT DEFAULT 'idle',
            current_task_id TEXT,
            specialties TEXT DEFAULT '[]',
            color TEXT DEFAULT '#8888a0',
            max_concurrent INTEGER DEFAULT 1,
            connected_at TEXT DEFAULT (datetime('now')),
            last_heartbeat TEXT DEFAULT (datetime('now')),
            workspace_path TEXT
        );

        -- File locks (scoped by project_id)
        CREATE TABLE IF NOT EXISTS file_locks (
            file_path TEXT PRIMARY KEY,
            project_id TEXT,
            agent_id TEXT NOT NULL,
            task_id TEXT,
            acquired_at TEXT DEFAULT (datetime('now'))
        );

        -- Events (scoped by project_id)
        CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id TEXT,
            agent_id TEXT,
            task_id TEXT,
            event_type TEXT NOT NULL,
            payload TEXT,
            created_at TEXT DEFAULT (datetime('now'))
        );

        -- Indexes
        CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
        CREATE INDEX IF NOT EXISTS idx_tasks_agent ON tasks(agent_id);
        CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
        CREATE INDEX IF NOT EXISTS idx_events_time ON events(created_at);
        CREATE INDEX IF NOT EXISTS idx_events_project ON events(project_id);
        CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);

        -- Project-scoped agents (multi-agent architecture)
        CREATE TABLE IF NOT EXISTS project_agents (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            name TEXT NOT NULL,
            skills TEXT DEFAULT '[]',
            status TEXT DEFAULT 'offline',
            session_id TEXT,
            current_task_id TEXT,
            last_active_at TEXT,
            idle_since TEXT,
            max_concurrent INTEGER DEFAULT 1,
            icon TEXT DEFAULT '🤖',
            color TEXT DEFAULT '#8888a0',
            created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE INDEX IF NOT EXISTS idx_project_agents_project ON project_agents(project_id);
        CREATE INDEX IF NOT EXISTS idx_project_agents_status ON project_agents(status);
        CREATE INDEX IF NOT EXISTS idx_project_agents_session ON project_agents(session_id);

        -- Notes (artifact & conversation tracking)
        CREATE TABLE IF NOT EXISTS notes (
            id TEXT PRIMARY KEY,
            task_id TEXT,
            project_id TEXT NOT NULL,
            type TEXT NOT NULL,
            title TEXT NOT NULL,
            content TEXT,
            file_path TEXT,
            conversation_id TEXT,
            metadata TEXT DEFAULT '{}',
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now'))
        );

        CREATE INDEX IF NOT EXISTS idx_notes_task ON notes(task_id);
        CREATE INDEX IF NOT EXISTS idx_notes_project ON notes(project_id);
        CREATE INDEX IF NOT EXISTS idx_notes_type ON notes(type);
        CREATE INDEX IF NOT EXISTS idx_notes_conversation ON notes(conversation_id);
    `);

    // Incremental migrations for existing databases
    migrateExistingDb(db);
}

/**
 * Run incremental migrations for databases that may have older schemas.
 */
function migrateExistingDb(db) {
    const taskCols = db.pragma('table_info(tasks)').map(c => c.name);
    if (!taskCols.includes('sort_order')) {
        db.exec('ALTER TABLE tasks ADD COLUMN sort_order INTEGER DEFAULT 0');
    }
    if (!taskCols.includes('project_id')) {
        db.exec('ALTER TABLE tasks ADD COLUMN project_id TEXT');
    }

    const agentCols = db.pragma('table_info(agents)').map(c => c.name);
    if (!agentCols.includes('specialties')) {
        db.exec("ALTER TABLE agents ADD COLUMN specialties TEXT DEFAULT '[]'");
    }
    if (!agentCols.includes('color')) {
        db.exec("ALTER TABLE agents ADD COLUMN color TEXT DEFAULT '#8888a0'");
    }
    if (!agentCols.includes('max_concurrent')) {
        db.exec('ALTER TABLE agents ADD COLUMN max_concurrent INTEGER DEFAULT 1');
    }

    const eventCols = db.pragma('table_info(events)').map(c => c.name);
    if (!eventCols.includes('project_id')) {
        db.exec('ALTER TABLE events ADD COLUMN project_id TEXT');
    }

    const lockCols = db.pragma('table_info(file_locks)').map(c => c.name);
    if (!lockCols.includes('project_id')) {
        db.exec('ALTER TABLE file_locks ADD COLUMN project_id TEXT');
    }

    // Ensure projects table exists (for DBs created before multi-project)
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='projects'").get();
    if (!tables) {
        db.exec(`
            CREATE TABLE projects (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                path TEXT,
                icon TEXT DEFAULT '📁',
                color TEXT DEFAULT '#8888a0',
                is_active INTEGER DEFAULT 0,
                created_at TEXT DEFAULT (datetime('now')),
                last_active_at TEXT
            );
        `);
    }

    // Add required_skills to tasks
    if (!taskCols.includes('required_skills')) {
        db.exec("ALTER TABLE tasks ADD COLUMN required_skills TEXT DEFAULT '[]'");
    }

    // Add conversation_id to tasks (Hybrid approach C)
    if (!taskCols.includes('conversation_id')) {
        db.exec('ALTER TABLE tasks ADD COLUMN conversation_id TEXT');
    }

    // Ensure notes table exists (for DBs created before notes feature)
    const notesTbl = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='notes'").get();
    if (!notesTbl) {
        db.exec(`
            CREATE TABLE notes (
                id TEXT PRIMARY KEY,
                task_id TEXT,
                project_id TEXT NOT NULL,
                type TEXT NOT NULL,
                title TEXT NOT NULL,
                content TEXT,
                file_path TEXT,
                conversation_id TEXT,
                metadata TEXT DEFAULT '{}',
                created_at TEXT DEFAULT (datetime('now')),
                updated_at TEXT DEFAULT (datetime('now'))
            );
            CREATE INDEX idx_notes_task ON notes(task_id);
            CREATE INDEX idx_notes_project ON notes(project_id);
            CREATE INDEX idx_notes_type ON notes(type);
            CREATE INDEX idx_notes_conversation ON notes(conversation_id);
        `);
    }
}

// ─── Project Operations ─────────────────────────────────────────────────────

export function listProjects() {
    const db = getDb();
    return db.prepare('SELECT * FROM projects ORDER BY last_active_at DESC, created_at DESC').all();
}

export function getActiveProject() {
    const db = getDb();
    return db.prepare('SELECT * FROM projects WHERE is_active = 1').get() || null;
}

/**
 * Resolve the project ID: use explicit param only.
 * Returns null if no project specified (= show ALL tasks across projects).
 * Active project is for UI display only — does NOT affect queries.
 */
function resolveProjectId(projectParam) {
    if (projectParam === '__all__') return null;
    if (projectParam) return projectParam;
    // No auto-scoping — return null to show all
    return null;
}

export function createProject({ id, name, projectPath, icon, color }) {
    const db = getDb();
    db.prepare(`
        INSERT INTO projects (id, name, path, icon, color, last_active_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'))
        ON CONFLICT(id) DO UPDATE SET 
            name = excluded.name, 
            path = excluded.path, 
            icon = COALESCE(excluded.icon, icon),
            color = COALESCE(excluded.color, color),
            last_active_at = datetime('now')
    `).run(id, name, projectPath || null, icon || '📁', color || '#8888a0');
    return db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
}

export function updateProject(id, fields) {
    const db = getDb();
    const allowed = ['name', 'path', 'icon', 'color'];
    const sets = [];
    const params = [];

    for (const key of allowed) {
        if (fields[key] !== undefined) {
            sets.push(`${key} = ?`);
            params.push(fields[key]);
        }
    }

    if (sets.length === 0) return db.prepare('SELECT * FROM projects WHERE id = ?').get(id);

    params.push(id);
    db.prepare(`UPDATE projects SET ${sets.join(', ')} WHERE id = ?`).run(...params);
    return db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
}

export function setActiveProject(projectId) {
    const db = getDb();
    db.prepare('UPDATE projects SET is_active = 0 WHERE is_active = 1').run();
    if (projectId) {
        db.prepare("UPDATE projects SET is_active = 1, last_active_at = datetime('now') WHERE id = ?").run(projectId);
    }
    return getActiveProject();
}

export function deleteProject(projectId) {
    const db = getDb();
    // Check for in-progress tasks
    const busyTasks = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE project_id = ? AND status IN ('claimed', 'in_progress')").get(projectId);
    if (busyTasks.count > 0) {
        throw new Error(`Cannot delete project with ${busyTasks.count} active tasks`);
    }
    db.prepare('DELETE FROM projects WHERE id = ?').run(projectId);
    return true;
}

export function getProjectStats() {
    const db = getDb();
    const rows = db.prepare(`
        SELECT p.id, p.name, p.icon, p.color, p.is_active,
            COUNT(t.id) as total_tasks,
            SUM(CASE WHEN t.status = 'ready' THEN 1 ELSE 0 END) as ready,
            SUM(CASE WHEN t.status IN ('claimed', 'in_progress') THEN 1 ELSE 0 END) as active,
            SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) as done
        FROM projects p
        LEFT JOIN tasks t ON t.project_id = p.id
        GROUP BY p.id
        ORDER BY p.is_active DESC, p.last_active_at DESC
    `).all();
    return rows;
}

// ─── Task Operations (project-scoped) ───────────────────────────────────────

export function listTasks({ status, project, limit = 50 } = {}) {
    const db = getDb();
    const projectId = resolveProjectId(project);
    const conditions = [];
    const params = [];

    if (projectId) {
        conditions.push('project_id = ?');
        params.push(projectId);
    }
    if (status) {
        conditions.push('status = ?');
        params.push(status);
    } else {
        conditions.push("status != 'abandoned'");
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(limit);

    return db.prepare(`SELECT * FROM tasks ${where} ORDER BY sort_order ASC, priority ASC, created_at DESC LIMIT ?`)
        .all(...params);
}

export function getTaskStats(project) {
    const db = getDb();
    const projectId = resolveProjectId(project);

    let query = 'SELECT status, COUNT(*) as count FROM tasks';
    const params = [];
    if (projectId) {
        query += ' WHERE project_id = ?';
        params.push(projectId);
    }
    query += ' GROUP BY status';

    const rows = db.prepare(query).all(...params);
    const stats = { total: 0 };
    for (const row of rows) {
        stats[row.status] = row.count;
        stats.total += row.count;
    }
    return stats;
}

export function createTask(title, opts = {}) {
    const db = getDb();
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let id = 'sym-';
    for (let i = 0; i < 8; i++) id += chars[Math.floor(Math.random() * chars.length)];

    const initialStatus = opts.isDraft ? 'draft' : 'ready';
    const projectId = opts.projectId || resolveProjectId(null);

    db.prepare(`
        INSERT INTO tasks (id, project_id, title, description, status, priority, acceptance, phase, estimated_files, conversation_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
        id, projectId, title, opts.description || null, initialStatus,
        opts.priority || 2, opts.acceptance || null,
        opts.phase || null,
        opts.estimatedFiles ? JSON.stringify(opts.estimatedFiles) : null,
        opts.conversationId || null
    );

    return db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
}

export function updateTask(id, fields) {
    const db = getDb();
    const allowed = ['title', 'description', 'priority', 'acceptance', 'phase', 'sort_order', 'project_id', 'agent_id', 'conversation_id'];
    const sets = [];
    const params = [];

    for (const key of allowed) {
        if (fields[key] !== undefined) {
            sets.push(`${key} = ?`);
            params.push(fields[key]);
        }
    }

    if (sets.length === 0) return db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);

    params.push(id);
    db.prepare(`UPDATE tasks SET ${sets.join(', ')} WHERE id = ?`).run(...params);
    return db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
}

export function deleteTask(id) {
    const db = getDb();
    const task = db.prepare('SELECT status FROM tasks WHERE id = ?').get(id);
    if (!task) throw new Error(`Task not found: ${id}`);
    if (!['draft', 'ready'].includes(task.status)) {
        throw new Error(`Cannot delete task in ${task.status} status`);
    }
    db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
    return true;
}

export function approveTask(id) {
    const db = getDb();
    const task = db.prepare('SELECT status FROM tasks WHERE id = ?').get(id);
    if (!task) throw new Error(`Task not found: ${id}`);
    if (task.status !== 'draft') {
        throw new Error(`Task ${id} is not a draft (status: ${task.status})`);
    }
    db.prepare("UPDATE tasks SET status = 'ready' WHERE id = ?").run(id);
    return db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
}

export function bulkApprove(ids) {
    const db = getDb();
    const stmt = db.prepare("UPDATE tasks SET status = 'ready' WHERE id = ? AND status = 'draft'");
    let count = 0;
    const run = db.transaction(() => {
        for (const id of ids) {
            const result = stmt.run(id);
            count += result.changes;
        }
    });
    run();
    return count;
}

export function reopenTask(id) {
    const db = getDb();
    db.prepare(`
        UPDATE tasks 
        SET status = 'ready', agent_id = NULL, progress = 0, 
            claimed_at = NULL, completed_at = NULL, summary = NULL
        WHERE id = ?
    `).run(id);
    return db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
}

export function reorderTasks(orderedIds) {
    const db = getDb();
    const stmt = db.prepare('UPDATE tasks SET sort_order = ? WHERE id = ?');
    const run = db.transaction(() => {
        for (let i = 0; i < orderedIds.length; i++) {
            stmt.run(i, orderedIds[i]);
        }
    });
    run();
}

export function claimTask(id, agentId = 'api-user') {
    const db = getDb();
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    if (!task) throw new Error(`Task not found: ${id}`);
    if (task.status !== 'ready') {
        throw new Error(`Task ${id} is not claimable (status: ${task.status})`);
    }
    db.prepare(`UPDATE tasks SET status = 'claimed', agent_id = ?, claimed_at = datetime('now') WHERE id = ?`)
        .run(agentId, id);
    return db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
}

export function completeTask(id, summary = '') {
    const db = getDb();
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    if (!task) throw new Error(`Task not found: ${id}`);
    // Auto-claim if still ready
    if (task.status === 'ready') {
        db.prepare(`UPDATE tasks SET status = 'claimed', agent_id = 'api-user', claimed_at = datetime('now') WHERE id = ?`)
            .run(id);
    }
    db.prepare(`UPDATE tasks SET status = 'done', summary = ?, progress = 100, completed_at = datetime('now') WHERE id = ?`)
        .run(summary || 'Completed', id);
    return db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
}

export function abandonTask(id, reason = '') {
    const db = getDb();
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    if (!task) throw new Error(`Task not found: ${id}`);
    db.prepare(`UPDATE tasks SET status = 'ready', agent_id = NULL, summary = ?, progress = 0 WHERE id = ?`)
        .run(reason ? `Abandoned: ${reason}` : null, id);
    return db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
}

// ─── Status Operations ──────────────────────────────────────────────────────

export function getSystemStatus(project) {
    const db = getDb();
    const projectId = resolveProjectId(project);

    const agents = db.prepare('SELECT * FROM agents ORDER BY connected_at DESC').all()
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

    const stats = getTaskStats(project);
    const activeProject = getActiveProject();

    let lockQuery = 'SELECT * FROM file_locks';
    const lockParams = [];
    if (projectId) {
        lockQuery += ' WHERE project_id = ?';
        lockParams.push(projectId);
    }
    lockQuery += ' ORDER BY acquired_at DESC';

    const lockedFiles = db.prepare(lockQuery).all(...lockParams)
        .map(l => ({
            file: l.file_path,
            agent: l.agent_id,
            task: l.task_id,
            since: l.acquired_at,
        }));

    return {
        agents,
        stats,
        lockedFiles,
        activeProject: activeProject || null,
        config: { maxAgents: 3 },
    };
}

/**
 * Preflight check — single call to verify all mandatory gates.
 * Returns everything an AI agent needs to start working.
 */
export function getPreflightStatus(projectParam) {
    const db = getDb();
    const activeProject = getActiveProject();
    const projectId = projectParam || (activeProject ? activeProject.id : null);

    // Task stats (project-scoped if available)
    const stats = getTaskStats(projectId ? projectId : '__all__');

    // In-progress tasks
    const inProgressTasks = projectId
        ? db.prepare("SELECT id, title, priority, phase FROM tasks WHERE project_id = ? AND status IN ('claimed', 'in_progress') ORDER BY priority ASC").all(projectId)
        : db.prepare("SELECT id, title, priority, phase FROM tasks WHERE status IN ('claimed', 'in_progress') ORDER BY priority ASC").all();

    // Ready tasks (top 5)
    const readyTasks = projectId
        ? db.prepare("SELECT id, title, priority, phase FROM tasks WHERE project_id = ? AND status = 'ready' ORDER BY sort_order ASC, priority ASC LIMIT 5").all(projectId)
        : db.prepare("SELECT id, title, priority, phase FROM tasks WHERE status = 'ready' ORDER BY sort_order ASC, priority ASC LIMIT 5").all();

    // All projects summary
    const projects = db.prepare('SELECT id, name, icon, is_active FROM projects ORDER BY is_active DESC, last_active_at DESC').all();

    // Project agents (multi-agent architecture)
    const projectAgents = projectId
        ? db.prepare('SELECT * FROM project_agents WHERE project_id = ? ORDER BY created_at ASC').all(projectId).map(normalizeProjectAgent)
        : db.prepare('SELECT * FROM project_agents ORDER BY project_id ASC, created_at ASC').all().map(normalizeProjectAgent);

    // Gate status
    const gates = {
        server: 'PASS',
        project: activeProject ? 'PASS' : (projects.length > 0 ? 'WARN' : 'NO_PROJECTS'),
        tasks: inProgressTasks.length > 0 ? 'HAS_ACTIVE' : (readyTasks.length > 0 ? 'HAS_READY' : 'EMPTY'),
        agents: projectAgents.length > 0 ? 'HAS_AGENTS' : 'NO_AGENTS',
    };

    const overall = gates.server === 'PASS' ? 'PASS' : 'FAIL';

    return {
        gate_status: overall,
        gates,
        server: { status: 'running', version: '0.1.0' },
        active_project: activeProject ? { id: activeProject.id, name: activeProject.name, icon: activeProject.icon } : null,
        projects: projects.map(p => ({ id: p.id, name: p.name, icon: p.icon, active: !!p.is_active })),
        tasks: {
            stats,
            in_progress: inProgressTasks,
            ready: readyTasks,
        },
        agents: projectAgents,
    };
}

// ─── Event Operations ───────────────────────────────────────────────────────

export function queryEvents({ since, eventType, project, limit = 30 } = {}) {
    const db = getDb();
    const projectId = resolveProjectId(project);
    const conditions = [];
    const params = [];

    if (projectId) { conditions.push('project_id = ?'); params.push(projectId); }
    if (since) { conditions.push('created_at > ?'); params.push(since); }
    if (eventType) { conditions.push('event_type = ?'); params.push(eventType); }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const rows = db.prepare(`SELECT * FROM events ${where} ORDER BY created_at DESC LIMIT ?`)
        .all(...params, limit);

    return rows.map(row => ({
        ...row,
        payload: row.payload ? JSON.parse(row.payload) : null,
    }));
}

// ─── Lock Operations ────────────────────────────────────────────────────────

export function forceReleaseLock(filePath) {
    const db = getDb();
    const result = db.prepare('DELETE FROM file_locks WHERE file_path = ?').run(filePath);
    return result.changes > 0;
}

// ─── Agent Operations (global — not project-scoped) ─────────────────────────

export function listAllAgents() {
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

export function registerAgent(id, name) {
    const db = getDb();
    db.prepare(`
        INSERT INTO agents (id, name, status) VALUES (?, ?, 'idle')
        ON CONFLICT(id) DO UPDATE SET status = 'idle', last_heartbeat = datetime('now')
    `).run(id, name || id);
    return db.prepare('SELECT * FROM agents WHERE id = ?').get(id);
}

export function updateAgentProfile(id, fields) {
    const db = getDb();
    const sets = [];
    const params = [];

    if (fields.name !== undefined) { sets.push('name = ?'); params.push(fields.name); }
    if (fields.specialties !== undefined) { sets.push('specialties = ?'); params.push(JSON.stringify(fields.specialties)); }
    if (fields.color !== undefined) { sets.push('color = ?'); params.push(fields.color); }
    if (fields.max_concurrent !== undefined) { sets.push('max_concurrent = ?'); params.push(fields.max_concurrent); }

    if (sets.length === 0) return;

    params.push(id);
    db.prepare(`UPDATE agents SET ${sets.join(', ')} WHERE id = ?`).run(...params);
}

export function removeAgent(id) {
    const db = getDb();
    const agent = db.prepare('SELECT * FROM agents WHERE id = ?').get(id);
    if (!agent) throw new Error(`Agent not found: ${id}`);
    if (agent.status === 'working') throw new Error(`Cannot remove working agent: ${id}`);
    db.prepare('DELETE FROM file_locks WHERE agent_id = ?').run(id);
    db.prepare('DELETE FROM agents WHERE id = ?').run(id);
    return true;
}

export function dispatchTask(agentId, taskId) {
    const db = getDb();
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
    if (!task) throw new Error(`Task not found: ${taskId}`);
    if (task.status !== 'ready') throw new Error(`Task ${taskId} is not ready (status: ${task.status})`);

    db.prepare(`UPDATE tasks SET status = 'claimed', agent_id = ?, claimed_at = datetime('now') WHERE id = ?`)
        .run(agentId, taskId);
    db.prepare(`UPDATE agents SET status = 'working', current_task_id = ? WHERE id = ?`)
        .run(taskId, agentId);

    return db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
}

// ─── Workspace Operations ───────────────────────────────────────────────────

export function listActiveWorkspaces() {
    const db = getDb();
    db.exec(`
        CREATE TABLE IF NOT EXISTS workspaces (
            id TEXT PRIMARY KEY,
            task_id TEXT NOT NULL,
            type TEXT DEFAULT 'worktree',
            path TEXT NOT NULL,
            branch TEXT NOT NULL,
            status TEXT DEFAULT 'active',
            created_at TEXT DEFAULT (datetime('now')),
            merged_at TEXT
        )
    `);

    const workspaces = db.prepare(`
        SELECT w.*, t.title as task_title, t.status as task_status
        FROM workspaces w
        LEFT JOIN tasks t ON w.task_id = t.id
        WHERE w.status = 'active'
        ORDER BY w.created_at DESC
    `).all();

    return workspaces;
}

// ─── Project Agent Operations (multi-agent architecture) ────────────────────

function normalizeProjectAgent(row) {
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

export function listProjectAgents(projectId) {
    const db = getDb();
    let rows;
    if (projectId) {
        rows = db.prepare('SELECT * FROM project_agents WHERE project_id = ? ORDER BY created_at ASC').all(projectId);
    } else {
        rows = db.prepare('SELECT * FROM project_agents ORDER BY project_id ASC, created_at ASC').all();
    }
    return rows.map(normalizeProjectAgent);
}

export function getProjectAgent(id) {
    const db = getDb();
    const row = db.prepare('SELECT * FROM project_agents WHERE id = ?').get(id);
    return row ? normalizeProjectAgent(row) : null;
}

export function createProjectAgent({ id, projectId, name, skills, icon, color }) {
    const db = getDb();
    db.prepare(`
        INSERT INTO project_agents (id, project_id, name, skills, icon, color)
        VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, projectId, name, JSON.stringify(skills || []), icon || '🤖', color || '#8888a0');
    return getProjectAgent(id);
}

export function updateProjectAgent(id, fields) {
    const db = getDb();
    const sets = [];
    const params = [];

    if (fields.name !== undefined) { sets.push('name = ?'); params.push(fields.name); }
    if (fields.skills !== undefined) { sets.push('skills = ?'); params.push(JSON.stringify(fields.skills)); }
    if (fields.icon !== undefined) { sets.push('icon = ?'); params.push(fields.icon); }
    if (fields.color !== undefined) { sets.push('color = ?'); params.push(fields.color); }

    if (sets.length === 0) return getProjectAgent(id);

    params.push(id);
    db.prepare(`UPDATE project_agents SET ${sets.join(', ')} WHERE id = ?`).run(...params);
    return getProjectAgent(id);
}

export function removeProjectAgent(id) {
    const db = getDb();
    const agent = db.prepare('SELECT * FROM project_agents WHERE id = ?').get(id);
    if (!agent) throw new Error(`Agent not found: ${id}`);
    if (agent.status === 'working') throw new Error(`Cannot remove working agent`);
    db.prepare('DELETE FROM project_agents WHERE id = ?').run(id);
    return true;
}

export function attachProjectAgentSession(agentId, sessionId) {
    const db = getDb();
    db.prepare(`
        UPDATE project_agents 
        SET session_id = ?, status = 'idle', last_active_at = datetime('now'), idle_since = datetime('now')
        WHERE id = ?
    `).run(sessionId, agentId);
    return getProjectAgent(agentId);
}

export function detachProjectAgentSession(agentId) {
    const db = getDb();
    db.prepare(`
        UPDATE project_agents 
        SET session_id = NULL, status = 'offline', current_task_id = NULL, idle_since = NULL
        WHERE id = ?
    `).run(agentId);
    return getProjectAgent(agentId);
}

// ─── Notes Operations (artifact & conversation tracking) ────────────────────

function generateNoteId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let id = 'note-';
    for (let i = 0; i < 8; i++) id += chars[Math.floor(Math.random() * chars.length)];
    return id;
}

/**
 * Create a new note.
 * @param {Object} opts - { projectId, type, title, content, filePath, conversationId, taskId, metadata }
 * @returns {Object} Created note
 */
export function createNote({ projectId, type, title, content, filePath, conversationId, taskId, metadata }) {
    const db = getDb();
    if (!projectId) throw new Error('project_id is required');
    if (!type) throw new Error('type is required');
    if (!title) throw new Error('title is required');

    const validTypes = ['brief', 'plan', 'spec', 'conversation', 'decision', 'reference', 'brainstorm', 'analysis'];
    if (!validTypes.includes(type)) {
        throw new Error(`Invalid type: ${type}. Must be one of: ${validTypes.join(', ')}`);
    }

    const id = generateNoteId();
    db.prepare(`
        INSERT INTO notes (id, task_id, project_id, type, title, content, file_path, conversation_id, metadata)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
        id, taskId || null, projectId, type, title,
        content || null, filePath || null, conversationId || null,
        metadata ? JSON.stringify(metadata) : '{}'
    );

    return db.prepare('SELECT * FROM notes WHERE id = ?').get(id);
}

/**
 * Get a single note by ID.
 */
export function getNote(id) {
    const db = getDb();
    const row = db.prepare('SELECT * FROM notes WHERE id = ?').get(id);
    return row ? normalizeNote(row) : null;
}

/**
 * List notes with optional filters.
 * @param {Object} filter - { projectId, type, conversationId, taskId, limit }
 */
export function listNotes({ projectId, type, conversationId, taskId, limit = 50 } = {}) {
    const db = getDb();
    const conditions = [];
    const params = [];

    if (projectId) { conditions.push('project_id = ?'); params.push(projectId); }
    if (type) { conditions.push('type = ?'); params.push(type); }
    if (conversationId) { conditions.push('conversation_id = ?'); params.push(conversationId); }
    if (taskId) { conditions.push('task_id = ?'); params.push(taskId); }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(limit);

    const rows = db.prepare(`SELECT * FROM notes ${where} ORDER BY created_at DESC LIMIT ?`)
        .all(...params);
    return rows.map(normalizeNote);
}

/**
 * Update a note.
 * @param {string} id - Note ID
 * @param {Object} fields - { title, content, filePath, taskId, metadata }
 */
export function updateNote(id, fields) {
    const db = getDb();
    const allowed = ['title', 'content', 'file_path', 'task_id', 'metadata', 'conversation_id'];
    const sets = ["updated_at = datetime('now')"];
    const params = [];

    for (const key of allowed) {
        if (fields[key] !== undefined) {
            if (key === 'metadata') {
                sets.push(`${key} = ?`);
                params.push(JSON.stringify(fields[key]));
            } else {
                sets.push(`${key} = ?`);
                params.push(fields[key]);
            }
        }
    }

    if (sets.length === 1) return getNote(id); // only updated_at, skip

    params.push(id);
    db.prepare(`UPDATE notes SET ${sets.join(', ')} WHERE id = ?`).run(...params);
    return getNote(id);
}

/**
 * Delete a note.
 */
export function deleteNote(id) {
    const db = getDb();
    const note = db.prepare('SELECT id FROM notes WHERE id = ?').get(id);
    if (!note) throw new Error(`Note not found: ${id}`);
    db.prepare('DELETE FROM notes WHERE id = ?').run(id);
    return true;
}

function normalizeNote(row) {
    return {
        ...row,
        metadata: row.metadata ? JSON.parse(row.metadata) : {},
    };
}

// ─── Data Migration ─────────────────────────────────────────────────────────

/**
 * Migrate data from old ~/.symphony/symphony.db to new location.
 * Only runs once, on first boot with new path.
 */
export function migrateFromLegacy() {
    const legacyPath = path.join(os.homedir(), '.symphony', 'symphony.db');
    if (!fs.existsSync(legacyPath)) return { migrated: false, reason: 'no legacy DB' };

    const db = getDb();
    const existingTasks = db.prepare('SELECT COUNT(*) as count FROM tasks').get();
    if (existingTasks.count > 0) return { migrated: false, reason: 'new DB already has data' };

    try {
        const legacyDb = new Database(legacyPath, { readonly: true });

        // Migrate tasks
        const tasks = legacyDb.prepare('SELECT * FROM tasks').all();
        if (tasks.length > 0) {
            const insert = db.prepare(`
                INSERT OR IGNORE INTO tasks (id, title, description, status, priority, sort_order, 
                    acceptance, phase, epic_id, agent_id, estimated_files, workspace_path, branch, 
                    progress, created_at, claimed_at, completed_at, summary)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
            const run = db.transaction(() => {
                for (const t of tasks) {
                    insert.run(t.id, t.title, t.description, t.status, t.priority, t.sort_order || 0,
                        t.acceptance, t.phase, t.epic_id, t.agent_id, t.estimated_files, t.workspace_path,
                        t.branch, t.progress, t.created_at, t.claimed_at, t.completed_at, t.summary);
                }
            });
            run();
        }

        // Migrate agents
        const agents = legacyDb.prepare('SELECT * FROM agents').all();
        if (agents.length > 0) {
            const insertAgent = db.prepare(`
                INSERT OR IGNORE INTO agents (id, name, status, current_task_id, specialties, color, max_concurrent, connected_at, last_heartbeat)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
            const runAgents = db.transaction(() => {
                for (const a of agents) {
                    insertAgent.run(a.id, a.name, a.status, a.current_task_id, a.specialties, a.color, a.max_concurrent || 1, a.connected_at, a.last_heartbeat);
                }
            });
            runAgents();
        }

        // Migrate events
        const events = legacyDb.prepare('SELECT * FROM events').all();
        if (events.length > 0) {
            const insertEvent = db.prepare(`
                INSERT OR IGNORE INTO events (id, agent_id, task_id, event_type, payload, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
            `);
            const runEvents = db.transaction(() => {
                for (const e of events) {
                    insertEvent.run(e.id, e.agent_id, e.task_id, e.event_type, e.payload, e.created_at);
                }
            });
            runEvents();
        }

        legacyDb.close();
        return { migrated: true, tasks: tasks.length, agents: agents.length, events: events.length };
    } catch (err) {
        return { migrated: false, reason: err.message };
    }
}
