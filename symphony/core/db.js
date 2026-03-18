/**
 * Symphony Database Module
 * SQLite database wrapper with auto-migration.
 */
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const SCHEMA = `
-- Tasks table (source of truth for all work items)
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
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
  created_at DATETIME DEFAULT (datetime('now')),
  claimed_at DATETIME,
  completed_at DATETIME,
  summary TEXT
);

-- File locks (prevent 2 agents editing same file)
CREATE TABLE IF NOT EXISTS file_locks (
  file_path TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  task_id TEXT NOT NULL,
  acquired_at DATETIME DEFAULT (datetime('now'))
);

-- Agent registry (connected IDE sessions)
CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  name TEXT,
  status TEXT DEFAULT 'idle',
  current_task_id TEXT,
  specialties TEXT DEFAULT '[]',
  color TEXT DEFAULT '#8888a0',
  max_concurrent INTEGER DEFAULT 1,
  connected_at DATETIME DEFAULT (datetime('now')),
  last_heartbeat DATETIME DEFAULT (datetime('now')),
  workspace_path TEXT
);

-- Context Bus events (inter-agent communication)
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agent_id TEXT NOT NULL,
  task_id TEXT,
  event_type TEXT NOT NULL,
  payload TEXT,
  created_at DATETIME DEFAULT (datetime('now'))
);

-- Workspaces (git worktree tracking)
CREATE TABLE IF NOT EXISTS workspaces (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  type TEXT DEFAULT 'worktree',
  path TEXT NOT NULL,
  branch TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT (datetime('now')),
  merged_at DATETIME
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_agent ON tasks(agent_id);
CREATE INDEX IF NOT EXISTS idx_locks_agent ON file_locks(agent_id);
CREATE INDEX IF NOT EXISTS idx_events_time ON events(created_at);
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
  created_at DATETIME DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_project_agents_project ON project_agents(project_id);
CREATE INDEX IF NOT EXISTS idx_project_agents_status ON project_agents(status);
CREATE INDEX IF NOT EXISTS idx_project_agents_session ON project_agents(session_id);
`;

let _db = null;

/**
 * Get or create the database connection (singleton).
 * @param {string} [dbPath] - Optional custom path for the database file.
 * @returns {Database} better-sqlite3 instance
 */
function getDb(dbPath) {
  if (_db) return _db;

  const resolvedPath = dbPath || resolveDbPath();
  const dir = path.dirname(resolvedPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  _db = new Database(resolvedPath);
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');

  // Run schema migrations
  _db.exec(SCHEMA);

  // Run incremental migrations
  runMigrations(_db);

  return _db;
}

/**
 * Run incremental schema migrations for existing databases.
 */
function runMigrations(db) {
  const cols = db.pragma('table_info(tasks)').map(c => c.name);
  if (!cols.includes('sort_order')) {
    db.exec('ALTER TABLE tasks ADD COLUMN sort_order INTEGER DEFAULT 0');
  }
  if (!cols.includes('project_id')) {
    db.exec('ALTER TABLE tasks ADD COLUMN project_id TEXT');
  }
  const agentCols = db.pragma('table_info(agents)').map(c => c.name);
  if (!agentCols.includes('specialties')) {
    db.exec('ALTER TABLE agents ADD COLUMN specialties TEXT DEFAULT "[]"');
  }
  if (!agentCols.includes('color')) {
    db.exec('ALTER TABLE agents ADD COLUMN color TEXT DEFAULT "#8888a0"');
  }
  if (!agentCols.includes('max_concurrent')) {
    db.exec('ALTER TABLE agents ADD COLUMN max_concurrent INTEGER DEFAULT 1');
  }

  // Add required_skills to tasks
  const taskCols2 = db.pragma('table_info(tasks)').map(c => c.name);
  if (!taskCols2.includes('required_skills')) {
    db.exec("ALTER TABLE tasks ADD COLUMN required_skills TEXT DEFAULT '[]'");
  }

  // Add conversation_id to tasks (Hybrid approach C)
  if (!taskCols2.includes('conversation_id')) {
    db.exec('ALTER TABLE tasks ADD COLUMN conversation_id TEXT');
  }

  // Ensure notes table exists
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
        created_at DATETIME DEFAULT (datetime('now')),
        updated_at DATETIME DEFAULT (datetime('now'))
      );
      CREATE INDEX idx_notes_task ON notes(task_id);
      CREATE INDEX idx_notes_project ON notes(project_id);
      CREATE INDEX idx_notes_type ON notes(type);
      CREATE INDEX idx_notes_conversation ON notes(conversation_id);
    `);
  }
}

/**
 * Resolve database file path.
 * CENTRALIZED: Always use ~/.gemini/antigravity/symphony/symphony.db
 * This ensures CLI and API (core.mjs) share the same database.
 */
function resolveDbPath() {
  const home = process.env.HOME || process.env.USERPROFILE;
  const symphonyDir = path.join(home, '.gemini', 'antigravity', 'symphony');
  if (!fs.existsSync(symphonyDir)) {
    fs.mkdirSync(symphonyDir, { recursive: true });
  }
  return path.join(symphonyDir, 'symphony.db');
}

/**
 * Close the database connection.
 */
function close() {
  if (_db) {
    _db.close();
    _db = null;
  }
}

/**
 * Reset the singleton (for testing).
 */
function reset() {
  close();
}

module.exports = { getDb, close, reset };
