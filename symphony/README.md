# 🎼 AWKit Symphony

> Multi-Agent Orchestration for AI Coding Assistants

Symphony coordinates multiple AI agents working on the same codebase — managing tasks, preventing file conflicts, and providing real-time visibility through a dashboard.

## ✨ Features

| Feature | Description |
|---------|-------------|
| **Task Management** | Create, assign, track tasks with priority & acceptance criteria |
| **Git Isolation** | Auto worktree/clone per task — agents work on separate branches |
| **File Locking** | Pessimistic locking prevents two agents from editing the same file |
| **Merge Pipeline** | Auto-rebase + fast-forward merge when tasks complete |
| **MCP Server** | 14 tools for IDE integration via Model Context Protocol |
| **Dashboard** | Real-time Kanban board, agent status, events feed |
| **Context Bus** | Event pub/sub — agents notify each other of changes |

## 🚀 Quick Start

```bash
# Install
cd symphony
npm install

# Start dashboard (port 3100)
npm run dev

# Or use CLI
node cli/index.js status
node cli/index.js task list
```

## 📋 CLI Commands

```bash
# System
symphony status                        # Show system status
symphony start                         # Start dashboard server
symphony dashboard                     # Open dashboard in browser

# Tasks
symphony task list [-s ready]          # List tasks (filter by status)
symphony task create "Feature X" -p 1  # Create task (priority 1-3)
symphony task show <id>                # Show task details

# Workspaces
symphony workspace list                # List active workspaces
symphony workspace create <task-id>    # Create workspace for task
symphony workspace merge <task-id>     # Auto-merge completed task
symphony workspace clean               # Remove merged workspaces

# File Locks
symphony lock list                     # Show active locks
symphony lock release <file>           # Force-release stuck lock

# MCP Server
symphony mcp-serve [-n "Agent Name"]   # Start MCP server (stdio)
```

## 🔌 MCP Integration

Add to your IDE's MCP config:

```json
{
  "mcpServers": {
    "symphony": {
      "command": "node",
      "args": ["/path/to/symphony/mcp/server.js"],
      "env": {
        "SYMPHONY_AGENT_NAME": "my-agent"
      }
    }
  }
}
```

### Available MCP Tools (14)

| Tool | Description |
|------|-------------|
| `symphony_available_tasks` | List available tasks |
| `symphony_claim_task` | Claim a task (get workspace + branch) |
| `symphony_report_progress` | Report progress (0-100%) |
| `symphony_complete_task` | Complete task + trigger merge |
| `symphony_abandon_task` | Abandon a task |
| `symphony_check_files` | Check file lock status |
| `symphony_lock_files` | Lock files for editing |
| `symphony_unlock_files` | Release file locks |
| `symphony_broadcast` | Broadcast event to other agents |
| `symphony_events` | Query context bus events |
| `symphony_status` | Get system status |
| `symphony_create_task` | Create a new task |
| `symphony_workspace_status` | Get workspace info + diff stats |
| `symphony_merge_task` | Run auto-merge pipeline |

## 🏗️ Architecture

```
symphony/
├── core/                    # Engine
│   ├── db.js                # SQLite (WAL mode)
│   ├── task-manager.js      # Task CRUD + state machine
│   ├── workspace-manager.js # Git worktree lifecycle
│   ├── merge-pipeline.js    # Auto-rebase + merge
│   ├── file-lock-manager.js # Pessimistic file locking
│   ├── context-bus.js       # Event pub/sub
│   └── orchestrator.js      # Agent dispatch + state
├── mcp/                     # MCP Server
│   ├── server.js            # stdio transport
│   ├── index.js             # Tool registry (14 tools)
│   └── tools/               # Tool implementations
├── cli/                     # CLI
│   └── index.js             # Commander.js commands
├── app/                     # Dashboard (Next.js)
│   ├── page.js              # Kanban + status + events
│   └── api/                 # REST API routes
└── lib/
    └── core.mjs             # ESM bridge for Turbopack
```

## ⚙️ Configuration

Edit `symphony.config.js`:

```js
module.exports = {
    port: 3100,
    maxAgents: 3,
    workspace: {
        type: 'hybrid',       // 'worktree' | 'clone' | 'hybrid'
        cloneThreshold: 30,   // files > 30 → full clone
    },
    git: {
        autoMerge: true,
        targetBranch: 'main',
        branchPrefix: 'symphony/',
    },
    locks: {
        strategy: 'pessimistic',
        autoRelease: 3600,    // seconds
    },
};
```

## 📊 Dashboard

The dashboard runs on `http://localhost:3100` and provides:

- **Kanban Board** — Tasks by status (Ready → In Progress → Review → Done)
- **Agent Panel** — Connected agents with live status
- **Events Feed** — Real-time context bus events
- **Lock Panel** — Active file locks with force-release
- **Stats Bar** — Task counts and system health

## 🔄 Task Lifecycle

```
Ready → Claimed → In Progress → Review → Done
  │                                        │
  └─── Abandoned ◀────────────────────────┘
```

1. **Create** task via CLI or dashboard
2. **Agent claims** via MCP → gets isolated workspace + branch
3. **Agent works** → reports progress, locks files, broadcasts events
4. **Agent completes** → triggers auto-merge pipeline
5. **Merge** → rebase onto main, fast-forward, cleanup workspace

## 📦 Tech Stack

- **Runtime:** Node.js
- **Database:** SQLite (via better-sqlite3, WAL mode)
- **Dashboard:** Next.js 16 + React 19
- **MCP:** @modelcontextprotocol/sdk
- **CLI:** Commander.js
- **Git:** Native git commands (worktree, rebase, merge)
