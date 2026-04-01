#!/usr/bin/env node

/**
 * Symphony CLI
 * Command-line interface for AWKit Symphony orchestration platform.
 */
const { Command } = require('commander');
const path = require('path');

// Ensure core modules resolve relative to this file
const SYMPHONY_ROOT = path.join(__dirname, '..');
process.env.SYMPHONY_ROOT = SYMPHONY_ROOT;

const { resolveProjectId } = require(path.join(SYMPHONY_ROOT, 'core', 'project-resolver'));

const program = new Command();

program
    .name('symphony')
    .description('🎼 AWKit Symphony — Multi-Agent Orchestration')
    .version('0.1.0');

// ─── Task Commands ───────────────────────────────────────────────────────────

const taskCmd = program.command('task').description('Task management');

taskCmd
    .command('list')
    .description('List tasks')
    .option('-s, --status <status>', 'Filter by status (ready|claimed|in_progress|review|done)')
    .option('-P, --project <id>', 'Filter by project ID')
    .option('-l, --limit <n>', 'Limit results', '20')
    .action((opts) => {
        const tm = require(path.join(SYMPHONY_ROOT, 'core', 'task-manager'));
        const tasks = tm.listTasks({
            status: opts.status || undefined,
            project: resolveProjectId(opts.project) || undefined,
            limit: parseInt(opts.limit),
        });

        if (tasks.length === 0) {
            console.log('No tasks found.');
            return;
        }

        const statusIcon = {
            ready: '⬜', claimed: '🟡', in_progress: '🔵',
            review: '🟣', done: '✅', abandoned: '⚫',
        };

        console.log(`\n${'ID'.padEnd(14)} ${'Status'.padEnd(14)} ${'Pri'.padEnd(6)} ${'Project'.padEnd(12)} Title`);
        console.log('─'.repeat(80));
        for (const t of tasks) {
            const icon = statusIcon[t.status] || '❓';
            const proj = (t.project_id || '-').substring(0, 10).padEnd(12);
            const pri = (typeof t.priority === 'number' ? `P${t.priority}` : (t.priority || '-')).padEnd(6);
            console.log(
                `${t.id.padEnd(14)} ${(icon + ' ' + t.status).padEnd(14)} ${pri} ${proj} ${t.title}`
            );
        }
        console.log(`\nTotal: ${tasks.length} task(s)\n`);
        closeDb();
    });

taskCmd
    .command('create <title>')
    .description('Create a new task')
    .option('-p, --priority <n>', 'Priority (1=high, 3=low)', '2')
    .option('-d, --description <text>', 'Task description')
    .option('-a, --acceptance <text>', 'Acceptance criteria')
    .option('-P, --project <id>', 'Project ID')
    .option('--phase <phase>', 'Phase/group')
    .option('--skills <list>', 'Required skills (comma-separated, e.g. "code,debug")')
    .action((title, opts) => {
        const tm = require(path.join(SYMPHONY_ROOT, 'core', 'task-manager'));
        const taskOpts = {
            priority: parseInt(opts.priority),
            description: opts.description,
            acceptance: opts.acceptance,
            phase: opts.phase,
            projectId: resolveProjectId(opts.project),
        };
        if (opts.skills) {
            taskOpts.requiredSkills = opts.skills.split(',').map(s => s.trim());
        }
        const task = tm.createTask(title, taskOpts);
        console.log(`\n✅ Task created: ${task.id}`);
        console.log(`   Title:    ${task.title}`);
        console.log(`   Priority: P${task.priority}`);
        console.log(`   Project:  ${task.project_id || '(none)'}`);
        if (opts.skills) console.log(`   Skills:   ${opts.skills}`);
        console.log(`   Status:   ${task.status}\n`);
        closeDb();
    });

taskCmd
    .command('show <id>')
    .description('Show task details')
    .action((id) => {
        const tm = require(path.join(SYMPHONY_ROOT, 'core', 'task-manager'));
        const task = tm.getTask(id);
        if (!task) {
            console.log(`❌ Task not found: ${id}`);
            closeDb();
            return;
        }
        console.log(`\n🎫 Task: ${task.id}`);
        console.log(`   Title:       ${task.title}`);
        console.log(`   Status:      ${task.status}`);
        console.log(`   Priority:    P${task.priority}`);
        console.log(`   Agent:       ${task.agent_id || '(unassigned)'}`);
        console.log(`   Progress:    ${task.progress}%`);
        if (task.description) console.log(`   Description: ${task.description}`);
        if (task.acceptance) console.log(`   Acceptance:  ${task.acceptance}`);
        if (task.phase) console.log(`   Phase:       ${task.phase}`);
        if (task.branch) console.log(`   Branch:      ${task.branch}`);
        console.log(`   Created:     ${task.created_at}`);
        if (task.claimed_at) console.log(`   Claimed:     ${task.claimed_at}`);
        if (task.completed_at) console.log(`   Completed:   ${task.completed_at}`);
        if (task.summary) console.log(`   Summary:     ${task.summary}`);
        console.log('');
        closeDb();
    });

taskCmd
    .command('claim <id>')
    .description('Claim a task (ready → claimed)')
    .option('-a, --agent <agent>', 'Agent ID', 'cli-user')
    .action((id, opts) => {
        const tm = require(path.join(SYMPHONY_ROOT, 'core', 'task-manager'));
        try {
            const task = tm.claimTask(id, opts.agent);
            console.log(`\n🟡 Task claimed: ${task.id}`);
            console.log(`   Title:  ${task.title}`);
            console.log(`   Agent:  ${task.agent_id}`);
            console.log(`   Status: ${task.status}\n`);
        } catch (e) {
            console.error(`\n❌ ${e.message}\n`);
        }
        closeDb();
    });

taskCmd
    .command('start <id>')
    .description('Start working on a task (→ in_progress)')
    .action((id) => {
        const tm = require(path.join(SYMPHONY_ROOT, 'core', 'task-manager'));
        try {
            // Claim first if still ready
            const task = tm.getTask(id);
            if (!task) { console.error(`\n❌ Task not found: ${id}\n`); closeDb(); return; }
            if (task.status === 'ready') {
                tm.claimTask(id, 'cli-user');
            }
            const updated = tm.updateProgress(id, 1);
            console.log(`\n🔵 Task started: ${updated.id}`);
            console.log(`   Title:  ${updated.title}`);
            console.log(`   Status: ${updated.status}\n`);
        } catch (e) {
            console.error(`\n❌ ${e.message}\n`);
        }
        closeDb();
    });

taskCmd
    .command('done <id>')
    .description('Complete a task (→ done)')
    .option('-m, --message <text>', 'Completion summary', '')
    .action((id, opts) => {
        const tm = require(path.join(SYMPHONY_ROOT, 'core', 'task-manager'));
        try {
            const task = tm.getTask(id);
            if (!task) { console.error(`\n❌ Task not found: ${id}\n`); closeDb(); return; }
            // Auto-claim if still ready
            if (task.status === 'ready') {
                tm.claimTask(id, 'cli-user');
            }
            const updated = tm.completeTask(id, opts.message || 'Completed via CLI');
            console.log(`\n✅ Task completed: ${updated.id}`);
            console.log(`   Title:  ${updated.title}`);
            console.log(`   Status: ${updated.status}\n`);
        } catch (e) {
            console.error(`\n❌ ${e.message}\n`);
        }
        closeDb();
    });

taskCmd
    .command('approve <id>')
    .description('Approve a draft task (draft → ready)')
    .action((id) => {
        const tm = require(path.join(SYMPHONY_ROOT, 'core', 'task-manager'));
        try {
            const task = tm.approveTask(id);
            console.log(`\n⬜ Task approved: ${task.id}`);
            console.log(`   Title:  ${task.title}`);
            console.log(`   Status: ${task.status}\n`);
        } catch (e) {
            console.error(`\n❌ ${e.message}\n`);
        }
        closeDb();
    });

taskCmd
    .command('reopen <id>')
    .description('Reopen a completed task (done → ready)')
    .action((id) => {
        const tm = require(path.join(SYMPHONY_ROOT, 'core', 'task-manager'));
        try {
            const task = tm.reopenTask(id);
            console.log(`\n🔄 Task reopened: ${task.id}`);
            console.log(`   Title:  ${task.title}`);
            console.log(`   Status: ${task.status}\n`);
        } catch (e) {
            console.error(`\n❌ ${e.message}\n`);
        }
        closeDb();
    });

taskCmd
    .command('abandon <id>')
    .description('Abandon a task (back to ready)')
    .option('-r, --reason <text>', 'Reason for abandoning', 'No reason given')
    .action((id, opts) => {
        const tm = require(path.join(SYMPHONY_ROOT, 'core', 'task-manager'));
        try {
            const task = tm.abandonTask(id, opts.reason);
            console.log(`\n⚫ Task abandoned: ${task.id}`);
            console.log(`   Title:  ${task.title}`);
            console.log(`   Status: ${task.status}\n`);
        } catch (e) {
            console.error(`\n❌ ${e.message}\n`);
        }
        closeDb();
    });

taskCmd
    .command('delete <id>')
    .description('Delete a task (draft/ready only)')
    .action((id) => {
        const tm = require(path.join(SYMPHONY_ROOT, 'core', 'task-manager'));
        try {
            tm.deleteTask(id);
            console.log(`\n🗑️  Task deleted: ${id}\n`);
        } catch (e) {
            console.error(`\n❌ ${e.message}\n`);
        }
        closeDb();
    });

// ─── TODO Command ───────────────────────────────────────────────────────────

taskCmd
    .command('todo')
    .description('List pending (ready) tasks, scoped to the current project')
    .option('-p, --project <id>', 'Project ID filter (overrides auto-detection)')
    .action((opts) => {
        const tm = require(path.join(SYMPHONY_ROOT, 'core', 'task-manager'));
        const { resolveProjectId } = require(path.join(SYMPHONY_ROOT, 'core', 'project-resolver'));
        const projectId = opts.project || resolveProjectId();

        const filter = { status: 'ready', limit: 30 };
        if (projectId && projectId !== '__all__') {
            filter.project = projectId;
        }

        const tasks = tm.listTasks(filter);
        if (tasks.length === 0) {
            console.log('\n✅ No pending tasks — all caught up!\n');
        } else {
            console.log(`\n📋 TODO List${projectId && projectId !== '__all__' ? ` [Project: ${projectId}]` : ''} (${tasks.length}):\n`);
            for (let i = 0; i < tasks.length; i++) {
                const t = tasks[i];
                console.log(`   ${i + 1}. [P${t.priority}] [${t.id}] ${t.title}`);
            }
            console.log('');
        }
        closeDb();
    });

taskCmd
    .command('update <id>')
    .description('Update task fields')
    .option('-t, --title <text>', 'New title')
    .option('-d, --description <text>', 'New description')
    .option('-p, --priority <n>', 'New priority (1=high, 3=low)')
    .option('--phase <phase>', 'New phase')
    .option('-a, --acceptance <text>', 'Acceptance criteria')
    .action((id, opts) => {
        const tm = require(path.join(SYMPHONY_ROOT, 'core', 'task-manager'));
        try {
            const fields = {};
            if (opts.title) fields.title = opts.title;
            if (opts.description) fields.description = opts.description;
            if (opts.priority) fields.priority = parseInt(opts.priority);
            if (opts.phase) fields.phase = opts.phase;
            if (opts.acceptance) fields.acceptance = opts.acceptance;

            if (Object.keys(fields).length === 0) {
                console.log('\n⚠️  No fields specified. Use --title, --description, --priority, --phase, or --acceptance\n');
                closeDb();
                return;
            }

            const task = tm.updateTask(id, fields);
            console.log(`\n📝 Task updated: ${task.id}`);
            console.log(`   Title:    ${task.title}`);
            console.log(`   Priority: P${task.priority}`);
            console.log(`   Status:   ${task.status}\n`);
        } catch (e) {
            console.error(`\n❌ ${e.message}\n`);
        }
        closeDb();
    });

// ─── Project Commands ────────────────────────────────────────────────────────

const projectCmd = program.command('project').description('Project management');

projectCmd
    .command('list')
    .description('List all registered projects')
    .action(async () => {
        try {
            const core = await import('file://' + path.join(SYMPHONY_ROOT, 'lib', 'core.mjs'));
            const projects = core.listProjects();
            if (projects.length === 0) {
                console.log('No projects found.');
                return;
            }
            console.log(`\n${'ID'.padEnd(25)} ${'Name'.padEnd(30)} ${'Path'}`);
            console.log('─'.repeat(90));
            for (const p of projects) {
                console.log(`${p.id.padEnd(25)} ${(p.icon + ' ' + p.name).padEnd(30)} ${p.path || '(no path)'}`);
            }
            console.log(`\nTotal: ${projects.length} project(s)\n`);
        } catch (e) {
            console.error(`\n❌ Error: ${e.message}\n`);
        }
    });

projectCmd
    .command('edit <id>')
    .description('Edit a project')
    .option('-n, --name <name>', 'New project name')
    .option('-p, --path <path>', 'New project path')
    .option('-i, --icon <icon>', 'New project icon')
    .option('-c, --color <color>', 'New project color')
    .action(async (id, opts) => {
        try {
            const core = await import('file://' + path.join(SYMPHONY_ROOT, 'lib', 'core.mjs'));
            const updates = {};
            if (opts.name) updates.name = opts.name;
            if (opts.path) updates.path = opts.path;
            if (opts.icon) updates.icon = opts.icon;
            if (opts.color) updates.color = opts.color;

            if (Object.keys(updates).length === 0) {
                console.log('No fields to update provided.');
                return;
            }

            const updated = core.updateProject(id, updates);
            if (!updated) {
                console.error(`\n❌ Project not found: ${id}\n`);
                return;
            }
            console.log(`\n✅ Project updated: ${updated.id}`);
            console.log(`   Name:  ${updated.icon} ${updated.name}`);
            console.log(`   Path:  ${updated.path || '(none)'}`);
            console.log(`   Color: ${updated.color || '(none)'}\n`);
        } catch (e) {
            console.error(`\n❌ Error: ${e.message}\n`);
        }
    });

projectCmd
    .command('delete <id>')
    .description('Delete a project (Warning: tasks will lose their project association)')
    .option('-f, --force', 'Force delete without confirmation (for scripts)')
    .action(async (id, opts) => {
        try {
            if (!opts.force) {
                console.log(`\n⚠️  WARNING: Deleting project '${id}' will orphan all its tasks (they will remain but without a project).`);
                console.log(`Run this command again with --force to confirm deletion.\n`);
                return;
            }
            const core = await import('file://' + path.join(SYMPHONY_ROOT, 'lib', 'core.mjs'));
            core.deleteProject(id);
            console.log(`\n🗑️  Project deleted: ${id}\n`);
        } catch (e) {
            console.error(`\n❌ Error: ${e.message}\n`);
        }
    });

// ─── Agent Commands (Project-Scoped) ────────────────────────────────────────

const agentCmd = program.command('agent').description('Agent management (project-scoped)');

agentCmd
    .command('create <id>')
    .description('Create a project-scoped agent with skills')
    .requiredOption('-P, --project <project>', 'Project ID (required)')
    .option('-n, --name <name>', 'Agent display name')
    .option('-s, --skills <list>', 'Comma-separated skills (e.g. "code,debug,refactor")')
    .option('--icon <icon>', 'Agent icon', '🤖')
    .option('-c, --color <hex>', 'Agent color (hex)', '#8888a0')
    .action((id, opts) => {
        const am = require(path.join(SYMPHONY_ROOT, 'core', 'agent-manager'));
        try {
            const skills = opts.skills ? opts.skills.split(',').map(s => s.trim()) : [];
            const project = resolveProjectId(opts.project);
            if (!project) throw new Error("Agent requires a valid project ID.");
            const agent = am.createAgent(id, project, opts.name || id, skills, {
                icon: opts.icon,
                color: opts.color,
            });
            console.log(`\n✅ Agent created: ${agent.icon} ${agent.name} (${agent.id})`);
            console.log(`   Project: ${agent.projectId}`);
            console.log(`   Skills:  ${agent.skills.length > 0 ? agent.skills.join(', ') : '(none)'}`);
            console.log(`   Status:  ${agent.status}\n`);
        } catch (e) {
            console.error(`\n❌ ${e.message}\n`);
        }
        closeDb();
    });

agentCmd
    .command('list')
    .description('List agents (optionally filter by project)')
    .option('-P, --project <project>', 'Filter by project ID')
    .option('-s, --status <status>', 'Filter by status (offline|idle|working)')
    .action((opts) => {
        const am = require(path.join(SYMPHONY_ROOT, 'core', 'agent-manager'));
        const agents = am.listAgents({
            project: resolveProjectId(opts.project) || undefined,
            status: opts.status || undefined,
        });

        if (agents.length === 0) {
            console.log('\n🤖 No agents found\n');
            closeDb();
            return;
        }

        const statusIcon = { offline: '⚫', idle: '💤', working: '🟢' };
        console.log(`\n🤖 Agents (${agents.length}):\n`);

        let currentProject = '';
        for (const a of agents) {
            if (a.projectId !== currentProject) {
                currentProject = a.projectId;
                console.log(`   📁 ${currentProject}`);
            }
            const icon = statusIcon[a.status] || '❓';
            const task = a.currentTask ? ` → ${a.currentTask}` : '';
            const skills = a.skills.length > 0 ? ` [${a.skills.join(', ')}]` : '';
            const session = a.sessionId ? ` 🔗` : '';
            console.log(`      ${icon} ${a.icon} ${a.name} (${a.id}) — ${a.status}${task}${skills}${session}`);
        }
        console.log('');
        closeDb();
    });

agentCmd
    .command('show <id>')
    .description('Show agent details')
    .action((id) => {
        // Try project_agents first, fallback to legacy agents
        const am = require(path.join(SYMPHONY_ROOT, 'core', 'agent-manager'));
        const agent = am.getAgent(id);
        if (!agent) {
            // Fallback to legacy orchestrator
            const orchestrator = require(path.join(SYMPHONY_ROOT, 'core', 'orchestrator'));
            const legacy = orchestrator.getAgent(id);
            if (!legacy) {
                console.error(`\n❌ Agent not found: ${id}\n`);
                closeDb();
                return;
            }
            const specs = legacy.specialties ? JSON.parse(legacy.specialties || '[]') : [];
            console.log(`\n🤖 Agent (legacy): ${legacy.name} (${legacy.id})`);
            console.log(`   Status:       ${legacy.status}`);
            console.log(`   Specialties:  ${specs.length > 0 ? specs.join(', ') : '(none)'}`);
            console.log(`   Current Task: ${legacy.current_task_id || '(none)'}`);
            console.log('');
            closeDb();
            return;
        }
        console.log(`\n${agent.icon} Agent: ${agent.name} (${agent.id})`);
        console.log(`   Project:      ${agent.projectId}`);
        console.log(`   Status:       ${agent.status}`);
        console.log(`   Skills:       ${agent.skills.length > 0 ? agent.skills.join(', ') : '(none)'}`);
        console.log(`   Current Task: ${agent.currentTask || '(none)'}`);
        console.log(`   Session:      ${agent.sessionId || '(detached)'}`);
        console.log(`   Last Active:  ${agent.lastActiveAt || '(never)'}`);
        console.log(`   Idle Since:   ${agent.idleSince || '-'}`);
        console.log(`   Icon:         ${agent.icon}`);
        console.log(`   Color:        ${agent.color}`);
        console.log(`   Created:      ${agent.createdAt}`);
        console.log('');
        closeDb();
    });

agentCmd
    .command('update <id>')
    .description('Update agent config')
    .option('-n, --name <name>', 'New display name')
    .option('-s, --skills <list>', 'Comma-separated skills')
    .option('--icon <icon>', 'Agent icon')
    .option('-c, --color <hex>', 'Agent color (hex)')
    .action((id, opts) => {
        const am = require(path.join(SYMPHONY_ROOT, 'core', 'agent-manager'));
        try {
            const fields = {};
            if (opts.name) fields.name = opts.name;
            if (opts.skills) fields.skills = opts.skills.split(',').map(s => s.trim());
            if (opts.icon) fields.icon = opts.icon;
            if (opts.color) fields.color = opts.color;

            if (Object.keys(fields).length === 0) {
                console.log('\n⚠️  No fields specified. Use --name, --skills, --icon, or --color\n');
                closeDb();
                return;
            }

            const agent = am.updateAgent(id, fields);
            console.log(`\n📝 Agent updated: ${agent.icon} ${agent.name} (${agent.id})`);
            console.log(`   Skills: ${agent.skills.join(', ')}`);
            console.log(`   Status: ${agent.status}\n`);
        } catch (e) {
            console.error(`\n❌ ${e.message}\n`);
        }
        closeDb();
    });

agentCmd
    .command('remove <id>')
    .description('Remove an agent config (must be offline)')
    .action((id) => {
        const am = require(path.join(SYMPHONY_ROOT, 'core', 'agent-manager'));
        try {
            am.removeAgent(id);
            console.log(`\n🗑️  Agent removed: ${id}\n`);
        } catch (e) {
            console.error(`\n❌ ${e.message}\n`);
        }
        closeDb();
    });

agentCmd
    .command('attach <id>')
    .description('Attach this window (session) to an agent')
    .option('--session <session>', 'Session/conversation ID', `cli-${Date.now()}`)
    .action((id, opts) => {
        const am = require(path.join(SYMPHONY_ROOT, 'core', 'agent-manager'));
        try {
            const agent = am.attachSession(id, opts.session);
            console.log(`\n🔗 Attached to agent: ${agent.icon} ${agent.name}`);
            console.log(`   Project: ${agent.projectId}`);
            console.log(`   Skills:  ${agent.skills.join(', ')}`);
            console.log(`   Status:  ${agent.status}`);
            console.log(`   Session: ${agent.sessionId}\n`);
        } catch (e) {
            console.error(`\n❌ ${e.message}\n`);
        }
        closeDb();
    });

agentCmd
    .command('detach <id>')
    .description('Detach session from an agent (→ offline)')
    .action((id) => {
        const am = require(path.join(SYMPHONY_ROOT, 'core', 'agent-manager'));
        try {
            const agent = am.detachSession(id);
            console.log(`\n🔌 Detached from agent: ${agent.icon} ${agent.name}`);
            console.log(`   Status: ${agent.status}\n`);
        } catch (e) {
            console.error(`\n❌ ${e.message}\n`);
        }
        closeDb();
    });

agentCmd
    .command('assign <agent-id> <task-id>')
    .description('Assign a task to a project agent')
    .action((agentId, taskId) => {
        const am = require(path.join(SYMPHONY_ROOT, 'core', 'agent-manager'));
        const tm = require(path.join(SYMPHONY_ROOT, 'core', 'task-manager'));
        try {
            const agent = am.getAgent(agentId);
            if (!agent) throw new Error(`Agent not found: ${agentId}`);
            if (agent.status === 'offline') throw new Error(`Agent ${agentId} is offline. Attach first.`);

            const task = tm.claimTask(taskId, agentId);
            am.startWork(agentId, taskId);

            console.log(`\n🎯 Task dispatched:`);
            console.log(`   Agent: ${agent.icon} ${agent.name} (${agentId})`);
            console.log(`   Task:  ${task.id} — ${task.title}`);
            console.log(`   Status: ${task.status}\n`);
        } catch (e) {
            console.error(`\n❌ ${e.message}\n`);
        }
        closeDb();
    });

agentCmd
    .command('idle <id>')
    .description('Mark an agent as idle')
    .action((id) => {
        const am = require(path.join(SYMPHONY_ROOT, 'core', 'agent-manager'));
        try {
            am.markIdle(id);
            console.log(`\n💤 Agent marked idle: ${id}\n`);
        } catch (e) {
            // Fallback to legacy orchestrator
            try {
                const orchestrator = require(path.join(SYMPHONY_ROOT, 'core', 'orchestrator'));
                orchestrator.markIdle(id);
                console.log(`\n💤 Agent marked idle (legacy): ${id}\n`);
            } catch (e2) {
                console.error(`\n❌ ${e2.message}\n`);
            }
        }
        closeDb();
    });

// Legacy: keep 'register' as alias for backward compat
agentCmd
    .command('register <id>')
    .description('Register a legacy agent (use "create" for project-scoped)')
    .option('-n, --name <name>', 'Agent display name')
    .option('-s, --specialties <list>', 'Comma-separated specialties')
    .option('-c, --color <hex>', 'Agent color (hex)', '#8888a0')
    .action((id, opts) => {
        const orchestrator = require(path.join(SYMPHONY_ROOT, 'core', 'orchestrator'));
        try {
            orchestrator.registerAgent(id, opts.name || id);
            if (opts.specialties || opts.color !== '#8888a0') {
                orchestrator.updateAgentProfile(id, {
                    specialties: opts.specialties ? opts.specialties.split(',').map(s => s.trim()) : undefined,
                    color: opts.color,
                });
            }
            const agent = orchestrator.getAgent(id);
            console.log(`\n🤖 Agent registered (legacy): ${agent.name} (${agent.id})`);
            console.log(`   💡 Use 'symphony agent create' for project-scoped agents\n`);
        } catch (e) {
            console.error(`\n❌ ${e.message}\n`);
        }
        closeDb();
    });

// ─── Dispatch Command (shortcut) ────────────────────────────────────────────

program
    .command('dispatch <task-id>')
    .description('🎯 Dispatch a task to the best available agent')
    .option('-a, --agent <id>', 'Specific agent to dispatch to')
    .action((taskId, opts) => {
        const orchestrator = require(path.join(SYMPHONY_ROOT, 'core', 'orchestrator'));
        try {
            let agentId = opts.agent;

            if (!agentId) {
                // Auto-select: find idle agent or the one with fewest tasks
                const agents = orchestrator.getAgents();
                const idle = agents.find(a => a.status === 'idle');
                if (idle) {
                    agentId = idle.id;
                } else if (agents.length > 0) {
                    // Pick agent with least work
                    agentId = agents[0].id;
                } else {
                    // No agents — auto-register a default one
                    agentId = 'auto-agent';
                    orchestrator.registerAgent(agentId, 'Auto Agent');
                    console.log('   📍 Auto-registered agent: auto-agent');
                }
            } else {
                // Ensure agent exists
                if (!orchestrator.getAgent(agentId)) {
                    orchestrator.registerAgent(agentId, agentId);
                }
            }

            const task = orchestrator.dispatchTask(agentId, taskId);
            console.log(`\n🎯 Dispatched:`);
            console.log(`   Task:  ${task.id} — ${task.title}`);
            console.log(`   Agent: ${agentId}`);
            console.log(`   Status: ${task.status}\n`);
        } catch (e) {
            console.error(`\n❌ ${e.message}\n`);
        }
        closeDb();
    });

// ─── Next Command (AI helper) ───────────────────────────────────────────────

program
    .command('next')
    .description('📋 Suggest the next task to work on')
    .option('-n, --count <n>', 'Number of suggestions', '3')
    .action((opts) => {
        const tm = require(path.join(SYMPHONY_ROOT, 'core', 'task-manager'));
        const ready = tm.listTasks({ status: 'ready', limit: parseInt(opts.count) });

        if (ready.length === 0) {
            console.log('\n✅ No tasks in queue — all caught up!\n');
            closeDb();
            return;
        }

        console.log(`\n📋 Next task suggestions (${ready.length}):\n`);
        for (let i = 0; i < ready.length; i++) {
            const t = ready[i];
            console.log(`   ${i + 1}. [P${t.priority}] ${t.title}`);
            console.log(`      ID: ${t.id}`);
            if (t.description) console.log(`      ${t.description.substring(0, 80)}`);
            console.log('');
        }

        console.log(`   💡 Start working: symphony task start ${ready[0].id}`);
        console.log(`   🎯 Dispatch:      symphony dispatch ${ready[0].id}\n`);
        closeDb();
    });

// ─── Status Command ──────────────────────────────────────────────────────────

program
    .command('status')
    .description('Show system status')
    .option('-p, --project <id>', 'Project ID filter (overrides auto-detection)')
    .action((opts) => {
        const orchestrator = require(path.join(SYMPHONY_ROOT, 'core', 'orchestrator'));
        const { resolveProjectId } = require(path.join(SYMPHONY_ROOT, 'core', 'project-resolver'));
        const projectId = opts.project || resolveProjectId();
        
        let targetProject = null;
        if (projectId && projectId !== '__all__') {
            targetProject = projectId;
        }
        const status = orchestrator.getStatus(targetProject);

        console.log(`\n🎼 AWKit Symphony Status${targetProject ? ` [Project: ${targetProject}]` : ''}\n`);

        // Agents
        console.log(`🤖 Agents (${status.agents.length}/${status.config.maxAgents}):`);
        if (status.agents.length === 0) {
            console.log('   No agents connected\n');
        } else {
            for (const a of status.agents) {
                const taskInfo = a.currentTask ? ` → ${a.currentTask}` : '';
                console.log(`   ${a.status === 'working' ? '🟢' : '💤'} ${a.name} [${a.status}]${taskInfo}`);
            }
            console.log('');
        }

        // Task stats
        console.log('📊 Tasks:');
        console.log(`   ⬜ Ready:       ${status.stats.ready}`);
        console.log(`   🔵 In Progress: ${status.stats.in_progress + status.stats.claimed}`);
        console.log(`   🟣 Review:      ${status.stats.review}`);
        console.log(`   ✅ Done:        ${status.stats.done}`);
        console.log(`   📋 Total:       ${status.stats.total}\n`);

        // File locks
        console.log(`🔒 File Locks (${status.lockedFiles.length}):`);
        if (status.lockedFiles.length === 0) {
            console.log('   No files locked\n');
        } else {
            for (const l of status.lockedFiles) {
                console.log(`   🔒 ${l.file} → ${l.agent} (${l.since})`);
            }
            console.log('');
        }

        closeDb();
    });

// ─── Preflight Command ──────────────────────────────────────────────────────

program
    .command('preflight')
    .description('🚦 Gate check — mandatory first action every session')
    .option('-p, --project <id>', 'Project ID to scope preflight')
    .option('--json', 'Output as JSON')
    .action(async (opts) => {
        const http = require('http');

        // Try API first (server already running)
        const projectId = resolveProjectId(opts.project);
        const url = `http://localhost:3100/api/preflight${projectId ? `?project=${projectId}` : ''}`;

        try {
            const data = await new Promise((resolve, reject) => {
                const req = http.get(url, { timeout: 2000 }, (res) => {
                    let body = '';
                    res.on('data', (chunk) => body += chunk);
                    res.on('end', () => {
                        if (res.statusCode === 200) resolve(JSON.parse(body));
                        else reject(new Error(`HTTP ${res.statusCode}`));
                    });
                });
                req.on('error', reject);
                req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
            });

            if (opts.json) {
                console.log(JSON.stringify(data, null, 2));
            } else {
                printPreflight(data);
            }
        } catch (_) {
            // Fallback: direct DB query (server not running)
            console.log('⚠️  Symphony server not running — using direct DB\n');
            try {
                const tm = require(path.join(SYMPHONY_ROOT, 'core', 'task-manager'));
                const inProgress = tm.listTasks({ status: 'in_progress', limit: 10 });
                const claimed = tm.listTasks({ status: 'claimed', limit: 10 });
                const ready = tm.listTasks({ status: 'ready', limit: 5 });

                const fallbackData = {
                    gate_status: 'WARN',
                    gates: { server: 'OFFLINE', project: 'UNKNOWN', tasks: inProgress.length > 0 || claimed.length > 0 ? 'HAS_ACTIVE' : 'EMPTY', agents: 'UNKNOWN' },
                    server: { status: 'offline' },
                    active_project: null,
                    projects: [],
                    tasks: {
                        stats: { total: inProgress.length + claimed.length + ready.length },
                        in_progress: [...inProgress, ...claimed].map(t => ({ id: t.id, title: t.title, priority: t.priority })),
                        ready: ready.map(t => ({ id: t.id, title: t.title, priority: t.priority })),
                    },
                    agents: [],
                };

                if (opts.json) {
                    console.log(JSON.stringify(fallbackData, null, 2));
                } else {
                    printPreflight(fallbackData);
                }
            } catch (dbErr) {
                console.log('❌ Cannot connect to Symphony server or database.\n');
                console.log('   Start server: symphony start');
                console.log('   Or install:   cd ~/Dev/NodeJS/main-awf/symphony && npm link\n');
                process.exit(1);
            }
        }
        closeDb();
    });

function printPreflight(data) {
    const gateIcon = (g) => g === 'PASS' ? '✅' : g === 'WARN' || g === 'OFFLINE' || g === 'UNKNOWN' ? '⚠️' : g === 'FAIL' ? '❌' : '🔵';

    console.log('\n🚦 SYMPHONY PREFLIGHT');
    console.log('─'.repeat(50));
    console.log(`   Server:  ${gateIcon(data.gates.server)} ${data.gates.server}`);
    console.log(`   Project: ${gateIcon(data.gates.project)} ${data.gates.project}${data.active_project ? ` — ${data.active_project.icon || '📁'} ${data.active_project.name}` : ''}`);
    console.log(`   Tasks:   ${gateIcon(data.gates.tasks)} ${data.gates.tasks}`);
    if (data.gates.agents) {
        console.log(`   Agents:  ${gateIcon(data.gates.agents)} ${data.gates.agents}`);
    }
    console.log(`   Overall: ${data.gate_status === 'PASS' ? '✅ PASS' : '⚠️  ' + data.gate_status}\n`);

    // Projects
    if (data.projects && data.projects.length > 0) {
        console.log(`📁 Projects (${data.projects.length}):`);
        for (const p of data.projects) {
            console.log(`   ${p.active ? '●' : '○'} ${p.icon || '📁'} ${p.name} [${p.id}]`);
        }
        console.log('');
    }

    // Agents
    if (data.agents && data.agents.length > 0) {
        const statusIcon = { offline: '⚫', idle: '💤', working: '🟢' };
        console.log(`🤖 Agents (${data.agents.length}):`);
        for (const a of data.agents) {
            const icon = statusIcon[a.status] || '❓';
            const skills = a.skills && a.skills.length > 0 ? ` [${a.skills.join(', ')}]` : '';
            const task = a.currentTask ? ` → ${a.currentTask}` : '';
            console.log(`   ${icon} ${a.icon || '🤖'} ${a.name} (${a.id})${skills}${task}`);
        }
        console.log('');
    }

    // In-progress tasks
    if (data.tasks.in_progress && data.tasks.in_progress.length > 0) {
        console.log(`📿 In Progress (${data.tasks.in_progress.length}):`);
        for (const t of data.tasks.in_progress) {
            console.log(`   🔵 ${t.id} — ${t.title} (P${t.priority})`);
        }
        console.log('');
    } else {
        console.log('📿 In Progress: none\n');
    }

    // Ready tasks
    if (data.tasks.ready && data.tasks.ready.length > 0) {
        console.log(`📋 Ready (${data.tasks.ready.length}):`);
        for (const t of data.tasks.ready) {
            console.log(`   ⬜ ${t.id} — ${t.title} (P${t.priority})`);
        }
        console.log('');
    } else {
        console.log('📋 Ready: none\n');
    }
}

// ─── Lock Commands ───────────────────────────────────────────────────────────

const lockCmd = program.command('lock').description('File lock management');

lockCmd
    .command('list')
    .description('List all file locks')
    .action(() => {
        const flm = require(path.join(SYMPHONY_ROOT, 'core', 'file-lock-manager'));
        const locks = flm.getAllLocks();

        if (locks.length === 0) {
            console.log('\n🟢 No files locked\n');
            closeDb();
            return;
        }

        console.log(`\n🔒 Active File Locks (${locks.length}):\n`);
        for (const l of locks) {
            console.log(`   ${l.file_path}`);
            console.log(`   └─ Agent: ${l.agent_id} | Task: ${l.task_id} | Since: ${l.acquired_at}`);
        }
        console.log('');
        closeDb();
    });

lockCmd
    .command('release <file>')
    .description('Force-release a file lock')
    .action((file) => {
        const flm = require(path.join(SYMPHONY_ROOT, 'core', 'file-lock-manager'));
        const released = flm.forceRelease(file);
        if (released) {
            console.log(`\n✅ Lock released: ${file}\n`);
        } else {
            console.log(`\n⚠️  No lock found for: ${file}\n`);
        }
        closeDb();
    });

// ─── Workspace Commands ─────────────────────────────────────────────────────

const wsCmd = program.command('workspace').alias('ws').description('Workspace management');

wsCmd
    .command('list')
    .description('List active workspaces')
    .action(() => {
        const wm = require(path.join(SYMPHONY_ROOT, 'core', 'workspace-manager'));
        const workspaces = wm.listWorkspaces();

        if (workspaces.length === 0) {
            console.log('\n📂 No active workspaces\n');
            closeDb();
            return;
        }

        console.log(`\n📂 Active Workspaces (${workspaces.length}):\n`);
        for (const ws of workspaces) {
            console.log(`   ${ws.branch}`);
            console.log(`   └─ Task: ${ws.task_id} | Type: ${ws.type} | Path: ${ws.path}`);
            console.log(`      Created: ${ws.created_at}`);
        }
        console.log('');
        closeDb();
    });

wsCmd
    .command('create <task-id>')
    .description('Create workspace for a task')
    .option('-t, --type <type>', 'Workspace type (worktree|clone)', 'worktree')
    .action((taskId, opts) => {
        const wm = require(path.join(SYMPHONY_ROOT, 'core', 'workspace-manager'));
        const repoPath = process.cwd();

        try {
            const ws = wm.createWorkspace(taskId, repoPath, { type: opts.type });
            console.log(`\n✅ Workspace created:`);
            console.log(`   Branch: ${ws.branch}`);
            console.log(`   Path:   ${ws.path}`);
            console.log(`   Type:   ${ws.type}\n`);
        } catch (e) {
            console.error(`\n❌ Failed to create workspace: ${e.message}\n`);
        }
        closeDb();
    });

wsCmd
    .command('merge <task-id>')
    .description('Run auto-merge pipeline for a completed task')
    .action((taskId) => {
        const mp = require(path.join(SYMPHONY_ROOT, 'core', 'merge-pipeline'));
        const repoPath = process.cwd();

        console.log(`\n🔀 Running merge pipeline for task ${taskId}...\n`);
        const result = mp.autoMerge(taskId, repoPath);

        if (result.status === 'merged') {
            console.log(`   ✅ ${result.message}\n`);
        } else if (result.status === 'conflict') {
            console.log(`   ⚠️  ${result.message}`);
            if (result.conflictingFiles && result.conflictingFiles.length > 0) {
                console.log('   Conflicting files:');
                for (const f of result.conflictingFiles) {
                    console.log(`     - ${f}`);
                }
            }
            console.log('');
        } else {
            console.error(`   ❌ ${result.message}\n`);
        }
        closeDb();
    });

wsCmd
    .command('clean')
    .description('Remove all completed/merged workspaces')
    .action(() => {
        const { getDb } = require(path.join(SYMPHONY_ROOT, 'core', 'db'));
        const wm = require(path.join(SYMPHONY_ROOT, 'core', 'workspace-manager'));
        const db = getDb();

        const merged = db.prepare("SELECT * FROM workspaces WHERE status IN ('merged', 'cleaned')").all();
        if (merged.length === 0) {
            console.log('\n🟢 No workspaces to clean\n');
            closeDb();
            return;
        }

        let cleaned = 0;
        for (const ws of merged) {
            if (ws.status !== 'cleaned') {
                try {
                    wm.removeWorkspace(ws.task_id, process.cwd());
                    cleaned++;
                } catch (_) { /* skip */ }
            }
        }
        console.log(`\n🧹 Cleaned ${cleaned} workspace(s)\n`);
        closeDb();
    });

// ─── Dashboard Command ──────────────────────────────────────────────────────

program
    .command('dashboard')
    .description('Open dashboard in browser')
    .action(() => {
        const config = require(path.join(SYMPHONY_ROOT, 'symphony.config'));
        const url = `http://localhost:${config.port}`;
        console.log(`\n🌐 Opening dashboard: ${url}\n`);
        try {
            require('child_process').execSync(`open "${url}"`, { stdio: 'ignore' });
        } catch (_) {
            console.log(`   Open manually: ${url}`);
        }
    });

// ─── MCP Serve Command ──────────────────────────────────────────────────────

program
    .command('mcp-serve')
    .description('Start MCP server (stdio transport for IDE connections)')
    .option('-n, --name <name>', 'Agent display name')
    .action((opts) => {
        // Set agent name env var before requiring the server
        if (opts.name) {
            process.env.SYMPHONY_AGENT_NAME = opts.name;
        }
        // The MCP server takes over stdio, so we require it directly
        require(path.join(SYMPHONY_ROOT, 'mcp', 'server'));
    });

// ─── Build Command ──────────────────────────────────────────────────────────

program
    .command('build')
    .description('Build Symphony dashboard for production')
    .action(() => {
        console.log('\n📦 Building Symphony dashboard...\n');
        const { execSync } = require('child_process');
        try {
            execSync('npx next build', {
                cwd: SYMPHONY_ROOT,
                stdio: 'inherit',
                env: { ...process.env, NODE_ENV: 'production' },
            });
            console.log('\n✅ Build complete!\n');
        } catch (err) {
            console.error('\n❌ Build failed.\n');
            process.exit(1);
        }
    });

// ─── Start Command ──────────────────────────────────────────────────────────

program
    .command('start')
    .description('Start Symphony server (dashboard + API) in production mode')
    .option('-p, --port <port>', 'Port number', '3100')
    .action((opts) => {
        const { execSync } = require('child_process');
        const fs = require('fs');

        // Auto-build if .next/ doesn't exist
        if (!fs.existsSync(path.join(SYMPHONY_ROOT, '.next'))) {
            console.log('\n📦 First run — building dashboard...\n');
            try {
                execSync('npx next build', {
                    cwd: SYMPHONY_ROOT,
                    stdio: 'inherit',
                    env: { ...process.env, NODE_ENV: 'production' },
                });
            } catch (err) {
                console.error('\n❌ Build failed. Try running: symphony build\n');
                process.exit(1);
            }
        }

        console.log(`\n🎼 Starting AWKit Symphony on port ${opts.port}...\n`);
        try {
            execSync(`npx next start -p ${opts.port}`, {
                cwd: SYMPHONY_ROOT,
                stdio: 'inherit',
            });
        } catch (_) {
            // Interrupted (Ctrl+C)
        }
    });

// ─── Dev Command ────────────────────────────────────────────────────────────

program
    .command('dev')
    .description('Start Symphony in development mode (hot reload)')
    .option('-p, --port <port>', 'Port number', '3100')
    .action((opts) => {
        console.log(`\n🔧 Starting AWKit Symphony (dev) on port ${opts.port}...\n`);
        const { execSync } = require('child_process');
        try {
            execSync(`npx next dev -p ${opts.port}`, {
                cwd: SYMPHONY_ROOT,
                stdio: 'inherit',
            });
        } catch (_) {
            // Interrupted (Ctrl+C)
        }
    });

function closeDb() {
    try {
        require(path.join(SYMPHONY_ROOT, 'core', 'db')).close();
    } catch (_) { /* ignore */ }
}

// ─── Global Error Handling ──────────────────────────────────────────────────

process.on('uncaughtException', (err) => {
    console.error(`\n❌ Unexpected error: ${err.message}\n`);
    if (process.env.DEBUG) console.error(err.stack);
    closeDb();
    process.exit(1);
});

process.on('unhandledRejection', (reason) => {
    console.error(`\n❌ Unhandled rejection: ${reason}\n`);
    closeDb();
    process.exit(1);
});

program.parse();

