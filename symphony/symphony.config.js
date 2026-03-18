/**
 * Symphony Configuration
 * Default settings for the AWKit Symphony orchestration platform.
 */
module.exports = {
    // Server
    port: 3100,

    // Concurrency
    maxAgents: 3,

    // Workspace
    workspace: {
        root: '.symphony/workspaces',
        type: 'hybrid',       // 'worktree' | 'clone' | 'hybrid'
        cloneThreshold: 30,   // files > 30 → full clone instead of worktree
    },

    // Git
    git: {
        autoMerge: true,
        targetBranch: 'main',
        branchPrefix: 'symphony/',
    },

    // File Locks
    locks: {
        strategy: 'pessimistic',
        autoRelease: 3600,    // seconds — auto-release stuck locks
    },

    // Dashboard
    dashboard: {
        theme: 'dark',
    },

    // Database
    db: {
        path: null, // null = auto-detect (~/.symphony/symphony.db or .symphony/symphony.db)
    },
};
