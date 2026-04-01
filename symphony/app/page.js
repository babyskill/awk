"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const COLUMNS = [
  { key: "draft", label: "Nháp", icon: "📝", color: "#f59e0b" },
  { key: "ready", label: "Sẵn sàng", icon: "⬜", color: "#8888a0" },
  { key: "in_progress", label: "Đang làm", icon: "🔵", color: "#4f7cff", includeStatuses: ["claimed", "in_progress"] },
  { key: "review", label: "Duyệt", icon: "🟣", color: "#7c5cff" },
  { key: "done", label: "Xong", icon: "✅", color: "#34d399" },
];

const PRIORITY_COLORS = { 1: "#ef4444", 2: "#f59e0b", 3: "#22c55e" };
const PRIORITY_LABELS = { 1: "Cao", 2: "Trung bình", 3: "Thấp" };

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({});
  const [status, setStatus] = useState(null);
  const [events, setEvents] = useState([]);
  const [agents, setAgents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [activeTab, setActiveTab] = useState("roles");
  const [roles, setRoles] = useState(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [notes, setNotes] = useState([]);

  // Knowledge state
  const [knowledgeItems, setKnowledgeItems] = useState([]);
  const [showKnowledgeEditor, setShowKnowledgeEditor] = useState(null);

  // Multi-project state
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [projectStats, setProjectStats] = useState([]);
  const [showAddProject, setShowAddProject] = useState(false);
  const [showEditProject, setShowEditProject] = useState(false);
  const [editProjectForm, setEditProjectForm] = useState(null);

  // Responsive side panel
  const [showSidePanel, setShowSidePanel] = useState(true);

  // Drag state
  const [draggedTask, setDraggedTask] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const projectParam = activeProject ? `project=${activeProject.id}` : '';
      const [tasksRes, statusRes, eventsRes, projectsRes, rolesRes] = await Promise.all([
        fetch(`/api/tasks?${projectParam}`),
        fetch(`/api/status?${projectParam}`),
        fetch(`/api/events?limit=30&${projectParam}`),

        fetch("/api/projects?stats=true"),
        roles ? null : fetch("/api/roles"),
      ].filter(Boolean));
      // Fetch notes (project-scoped when project selected)
      const notesUrl = activeProject ? `/api/notes?projectId=${activeProject.id}` : '/api/notes';
      fetch(notesUrl).then(r => r.json()).then(d => setNotes(d.notes || [])).catch(() => { });
      // Fetch knowledge items
      fetch('/api/knowledge').then(r => r.json()).then(d => setKnowledgeItems(d.items || [])).catch(() => { });
      const tasksData = await tasksRes.json();
      const statusData = await statusRes.json();
      const eventsData = await eventsRes.json();
      const projectsData = await projectsRes.json();
      setTasks(tasksData.tasks || []);
      setStats(tasksData.stats || {});
      setStatus(statusData);
      setEvents(eventsData.events || []);
      setProjectStats(projectsData.projects || []);
      // Set active project from server if not yet set
      if (!activeProject && statusData.activeProject) {
        setActiveProject(statusData.activeProject);
      }
      // Build projects list from stats
      setProjects(projectsData.projects || []);
      if (rolesRes) {
        const rolesData = await rolesRes.json();
        setRoles(rolesData);
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
    }
  }, [roles, activeProject]);

  useEffect(() => {
    fetchData();
    // Pause auto-refresh when a modal is open (prevents confirm() dialog from being dismissed)
    if (selectedTask || showModal || showRoleModal || editingRole || showAddProject || showEditProject) return;
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [fetchData, selectedTask, showModal, showRoleModal, editingRole, showAddProject, showEditProject]);

  // Responsive: auto-collapse side panel on small screens
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px)");
    const handleChange = (e) => setShowSidePanel(!e.matches);
    handleChange(mq);
    mq.addEventListener("change", handleChange);
    return () => mq.removeEventListener("change", handleChange);
  }, []);

  const getColumnTasks = (column) => {
    const statuses = column.includeStatuses || [column.key];
    return tasks
      .filter((t) => statuses.includes(t.status))
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || a.priority - b.priority);
  };

  // Resolve role from task phase using role manifest
  const resolveRole = (task) => {
    if (!roles?.roles || !task?.phase) return null;
    const phase = task.phase.toLowerCase();
    for (const [key, role] of Object.entries(roles.roles)) {
      if (role.match?.phases?.some(p => p.toLowerCase() === phase)) return { key, ...role };
    }
    // Try keyword match from title
    const title = (task.title || '').toLowerCase();
    for (const [key, role] of Object.entries(roles.roles)) {
      if (role.match?.keywords?.some(k => title.includes(k))) return { key, ...role };
    }
    return null;
  };

  const handleSwitchProject = async (project) => {
    try {
      await fetch("/api/projects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: project.id, action: "activate" }),
      });
      setActiveProject(project);
      setShowProjectDropdown(false);
      fetchData();
    } catch (err) {
      console.error("Failed to switch project:", err);
    }
  };

  const handleShowAllProjects = () => {
    setActiveProject(null);
    setShowProjectDropdown(false);
  };

  const handleEditProject = async (formData) => {
    try {
      await fetch("/api/projects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      setShowEditProject(false);
      fetchData();
    } catch (err) {
      console.error("Failed to edit project:", err);
    }
  };

  const handleDeleteProject = async (id) => {
    if (!confirm(`Xoá dự án "${id}"? Lưu ý: Các task thuộc dự án này sẽ không bị xoá, nhưng sẽ mất liên kết dự án nếu bạn xoá.`)) return;
    try {
      const res = await fetch(`/api/projects?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.error) {
        alert(`Lỗi: ${data.error}`);
        return;
      }
      setShowEditProject(false);
      if (activeProject?.id === id) {
        setActiveProject(null);
      }
      fetchData();
    } catch (err) {
      console.error("Failed to delete project:", err);
      alert("Đã xảy ra lỗi khi xoá dự án.");
    }
  };

  const handleAddProject = async (formData) => {
    try {
      await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      setShowAddProject(false);
      fetchData();
    } catch (err) {
      console.error("Failed to add project:", err);
    }
  };

  const handleCreateTask = async (formData) => {
    try {
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, isDraft: true, project_id: activeProject?.id }),
      });
      setShowModal(false);
      fetchData();
    } catch (err) {
      console.error("Failed to create task:", err);
    }
  };

  const handleUpdateTask = async (id, fields) => {
    try {
      await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...fields }),
      });
      fetchData();
    } catch (err) {
      console.error("Failed to update task:", err);
    }
  };

  const handleDeleteTask = async (id) => {
    try {
      await fetch("/api/tasks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setSelectedTask(null);
      fetchData();
    } catch (err) {
      console.error("Failed to delete task:", err);
    }
  };

  const handleApproveTask = async (id) => {
    await handleUpdateTask(id, { action: "approve" });
    setSelectedTask(null);
  };

  const handleBulkApprove = async () => {
    const draftIds = getColumnTasks(COLUMNS[0]).map((t) => t.id);
    if (draftIds.length === 0) return;
    try {
      await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "bulk_approve", ids: draftIds }),
      });
      fetchData();
    } catch (err) {
      console.error("Failed to bulk approve:", err);
    }
  };

  const handleReopenTask = async (id) => {
    await handleUpdateTask(id, { action: "reopen" });
    setSelectedTask(null);
  };

  const handleCyclePriority = async (e, task) => {
    e.stopPropagation();
    const next = task.priority >= 3 ? 1 : task.priority + 1;
    await handleUpdateTask(task.id, { priority: next });
  };

  const handleReleaseLock = async (filePath) => {
    try {
      await fetch("/api/locks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file: filePath }),
      });
      fetchData();
    } catch (err) {
      console.error("Failed to release lock:", err);
    }
  };

  // ─── Drag & Drop handlers ──────────────────────────────────────────
  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = "move";
    e.target.style.opacity = "0.5";
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = "1";
    setDraggedTask(null);
    setDragOverColumn(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (e, columnKey, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverColumn(columnKey);
    setDragOverIndex(index);
  };

  const handleDrop = async (e, targetColumnKey) => {
    e.preventDefault();
    if (!draggedTask) return;

    const sourceStatus = draggedTask.status;
    const targetColumn = COLUMNS.find((c) => c.key === targetColumnKey);
    const targetStatus = targetColumn.includeStatuses ? targetColumn.includeStatuses[0] : targetColumn.key;

    // Determine which moves are allowed
    const allowedMoves = {
      draft: ["ready"],
      ready: ["draft"],
      done: ["ready"],
    };

    if (sourceStatus !== targetStatus) {
      const allowed = allowedMoves[sourceStatus];
      if (!allowed || !allowed.includes(targetStatus)) {
        setDraggedTask(null);
        setDragOverColumn(null);
        return;
      }

      if (targetStatus === "ready" && sourceStatus === "draft") {
        await handleUpdateTask(draggedTask.id, { action: "approve" });
      } else if (targetStatus === "draft" && sourceStatus === "ready") {
        // Move back to draft (update status directly)
        await fetch("/api/tasks", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: draggedTask.id, action: "reopen" }),
        });
        // Actually we want draft, not ready — let's set status manually
        // For now reopen sets to ready, so we handle draft↔ready via approve only
      } else if (targetStatus === "ready" && sourceStatus === "done") {
        await handleUpdateTask(draggedTask.id, { action: "reopen" });
      }
    }

    // Reorder within same column
    if (sourceStatus === targetStatus || (sourceStatus === "draft" && targetStatus === "draft")) {
      const columnTasks = getColumnTasks(targetColumn);
      const ids = columnTasks.map((t) => t.id).filter((id) => id !== draggedTask.id);
      const insertAt = dragOverIndex !== null ? dragOverIndex : ids.length;
      ids.splice(insertAt, 0, draggedTask.id);

      await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reorder", orderedIds: ids }),
      });
    }

    setDraggedTask(null);
    setDragOverColumn(null);
    setDragOverIndex(null);
    fetchData();
  };

  // ─── Role handlers ─────────────────────────────────────────────────
  const handleCreateRole = async (formData) => {
    try {
      await fetch("/api/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      setShowRoleModal(false);
      setRoles(null); // Force re-fetch
      fetchData();
    } catch (err) {
      console.error("Failed to create role:", err);
    }
  };

  const handleUpdateRole = async (formData) => {
    try {
      await fetch("/api/roles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      setEditingRole(null);
      setRoles(null); // Force re-fetch
      fetchData();
    } catch (err) {
      console.error("Failed to update role:", err);
    }
  };

  const handleRemoveRole = async (key) => {
    if (!confirm(`Xoá vai trò "${key}"?`)) return;
    try {
      await fetch("/api/roles", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      setRoles(null); // Force re-fetch
      fetchData();
    } catch (err) {
      console.error("Failed to remove role:", err);
    }
  };

  const workingAgents = agents?.filter((a) => a.status === "working").length || 0;
  const draftCount = getColumnTasks(COLUMNS[0]).length;

  return (
    <>
      {/* Header */}
      <header className="header">
        <div className="header-left">
          <span className="header-logo">🎼</span>
          <span className="header-title">Symphony</span>
          {/* Project Selector */}
          <div className="project-selector" style={{ position: 'relative', marginLeft: 12 }}>
            <button
              className="project-selector-btn"
              onClick={() => setShowProjectDropdown(!showProjectDropdown)}
            >
              <span className="project-icon">{activeProject?.icon || '📊'}</span>
              <span className="project-name">{activeProject?.name || 'Tất cả dự án'}</span>
              <span className="dropdown-arrow">▾</span>
            </button>
            {showProjectDropdown && (
              <div className="project-dropdown">
                <div
                  className={`project-option ${!activeProject ? 'active' : ''}`}
                  onClick={handleShowAllProjects}
                >
                  <span>📊</span>
                  <span>Tất cả dự án</span>
                </div>
                {projects.length > 0 && <div className="project-divider" />}
                {projects.map(p => (
                  <div
                    key={p.id}
                    className={`project-option ${activeProject?.id === p.id ? 'active' : ''}`}
                    onClick={() => handleSwitchProject(p)}
                  >
                    <span>{p.icon || '📁'}</span>
                    <span>{p.name}</span>
                    <span className="project-task-count">{p.total_tasks || 0}</span>
                  </div>
                ))}
                <div className="project-divider" />
                <div className="project-option add-project" onClick={() => { setShowAddProject(true); setShowProjectDropdown(false); }}>
                  <span>＋</span>
                  <span>Đăng ký dự án</span>
                </div>
                {activeProject && (
                  <div className="project-option edit-project" onClick={() => { 
                    setEditProjectForm({ ...activeProject }); 
                    setShowEditProject(true); 
                    setShowProjectDropdown(false); 
                  }}>
                    <span>✏️</span>
                    <span>Sửa dự án hiện tại</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="header-right">
          <div className="status-badge">
            <span className="status-dot" />
            {workingAgents} agent đang hoạt động
          </div>
          <button className="create-btn" onClick={() => setShowModal(true)}>
            ＋ Tạo Task
          </button>
          <button
            className={`side-panel-toggle ${showSidePanel ? "active" : ""}`}
            onClick={() => setShowSidePanel(!showSidePanel)}
            title="Hiện/ẩn bảng phụ"
          >
            ☰
          </button>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="stats-bar">
        <div className="stat-card">
          <span className="stat-icon">📋</span>
          <div className="stat-info">
            <span className="stat-value">{stats.total || 0}</span>
            <span className="stat-label">Tổng</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">📝</span>
          <div className="stat-info">
            <span className="stat-value">{stats.draft || 0}</span>
            <span className="stat-label">Nháp</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">⬜</span>
          <div className="stat-info">
            <span className="stat-value">{stats.ready || 0}</span>
            <span className="stat-label">Sẵn sàng</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">🔵</span>
          <div className="stat-info">
            <span className="stat-value">{(stats.claimed || 0) + (stats.in_progress || 0)}</span>
            <span className="stat-label">Đang làm</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">✅</span>
          <div className="stat-info">
            <span className="stat-value">{stats.done || 0}</span>
            <span className="stat-label">Xong</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">🔒</span>
          <div className="stat-info">
            <span className="stat-value">{status?.lockedFiles?.length || 0}</span>
            <span className="stat-label">Khoá</span>
          </div>
        </div>
      </div>

      {/* All Projects Overview (when no project selected) */}
      {!activeProject && projects.length > 0 && (
        <div className="all-projects-bar">
          {projects.map(p => {
            const total = p.total_tasks || 0;
            const done = p.done || 0;
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;
            return (
              <div
                key={p.id}
                className="project-summary-card"
                onClick={() => handleSwitchProject(p)}
                style={{ borderLeftColor: p.color || '#8888a0' }}
              >
                <div className="project-summary-header">
                  <span>{p.icon || '📁'} {p.name}</span>
                </div>
                <div className="project-progress-row">
                  <div className="progress-bar-bg" style={{ flex: 1 }}>
                    <div className="progress-bar-fill" style={{ width: `${pct}%`, background: p.color || '#4f7cff' }} />
                  </div>
                  <span className="project-pct">{pct}%</span>
                </div>
                <div className="project-summary-stats">
                  <span>{p.ready || 0} ready</span>
                  <span>{p.active || 0} active</span>
                  <span>{done} done</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Main Content */}
      <div className="main">
        {/* Kanban Board */}
        <div className="kanban">
          {COLUMNS.map((col) => {
            const columnTasks = getColumnTasks(col);
            const isDragTarget = dragOverColumn === col.key;
            return (
              <div
                className={`kanban-column ${isDragTarget ? "drag-over" : ""}`}
                key={col.key}
                onDragOver={(e) => handleDragOver(e, col.key, columnTasks.length)}
                onDrop={(e) => handleDrop(e, col.key)}
              >
                <div className="column-header">
                  <span className="column-title">
                    {col.icon} {col.label}
                  </span>
                  <div className="column-actions">
                    <span className="column-count">{columnTasks.length}</span>
                    {col.key === "draft" && draftCount > 0 && (
                      <button
                        className="approve-all-btn"
                        onClick={handleBulkApprove}
                        title="Duyệt tất cả task nháp"
                      >
                        ✅ Duyệt tất cả
                      </button>
                    )}
                  </div>
                </div>
                <div className="column-body">
                  {columnTasks.length === 0 ? (
                    <div
                      className="empty-state"
                      onDragOver={(e) => handleDragOver(e, col.key, 0)}
                    >
                      <div className="empty-text">
                        {col.key === "draft"
                          ? "Các task brainstorm sẽ xuất hiện ở đây"
                          : "Không có task"}
                      </div>
                    </div>
                  ) : (
                    columnTasks.map((task, index) => (
                      <div
                        key={task.id}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDragOverColumn(col.key);
                          setDragOverIndex(index);
                        }}
                      >
                        {dragOverIndex === index && isDragTarget && draggedTask?.id !== task.id && (
                          <div className="drop-indicator" />
                        )}
                        <TaskCard
                          task={task}
                          role={resolveRole(task)}
                          agents={agents}
                          onClick={() => setSelectedTask(task)}
                          onCyclePriority={handleCyclePriority}
                          onApprove={col.key === "draft" ? () => handleApproveTask(task.id) : null}
                          onReopen={col.key === "done" ? () => handleReopenTask(task.id) : null}
                          onDragStart={handleDragStart}
                          onDragEnd={handleDragEnd}
                          isDraggable={["draft", "ready", "done"].includes(task.status)}
                        />
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Side Panel Overlay (mobile) */}
        <div
          className={`side-panel-overlay ${showSidePanel ? "visible" : ""}`}
          onClick={() => setShowSidePanel(false)}
        />

        {/* Side Panel */}
        <div className={`side-panel ${showSidePanel ? "visible" : ""}`}>
          <div className="panel-tabs">
            <div
              className={`panel-tab ${activeTab === "roles" ? "active" : ""}`}
              onClick={() => setActiveTab("roles")}
            >
              🎭 Vai trò
            </div>
            <div
              className={`panel-tab ${activeTab === "locks" ? "active" : ""}`}
              onClick={() => setActiveTab("locks")}
            >
              🔒 Khoá
            </div>
            <div
              className={`panel-tab ${activeTab === "events" ? "active" : ""}`}
              onClick={() => setActiveTab("events")}
            >
              📡 Sự kiện
            </div>
            <div
              className={`panel-tab ${activeTab === "notes" ? "active" : ""}`}
              onClick={() => setActiveTab("notes")}
            >
              📝 Ghi chú {notes.length > 0 && <span className="tab-badge">{notes.length}</span>}
            </div>
            <div
              className={`panel-tab ${activeTab === "knowledge" ? "active" : ""}`}
              onClick={() => setActiveTab("knowledge")}
            >
              📚 Knowledge {knowledgeItems.length > 0 && <span className="tab-badge">{knowledgeItems.length}</span>}
            </div>
          </div>
          <div className="panel-content">
            {activeTab === "roles" && (
              <RolesPanel
                roles={roles}
                agents={agents}
                onAddRole={() => setShowRoleModal(true)}
                onEditRole={(role) => setEditingRole(role)}
                onRemoveRole={handleRemoveRole}
              />
            )}
            {activeTab === "locks" && (
              <LocksPanel locks={status?.lockedFiles || []} onRelease={handleReleaseLock} />
            )}
            {activeTab === "events" && (
              <EventsPanel events={events} />
            )}
            {activeTab === "notes" && (
              <NotesPanel notes={notes} onRefresh={fetchData} activeProject={activeProject} />
            )}
            {activeTab === "knowledge" && (
              <KnowledgePanel items={knowledgeItems} onOpenEditor={(item) => setShowKnowledgeEditor(item)} onRefresh={() => fetch('/api/knowledge').then(r => r.json()).then(d => setKnowledgeItems(d.items || []))} />
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showModal && (
        <CreateTaskModal
          onClose={() => setShowModal(false)}
          onSubmit={handleCreateTask}
          agents={agents}
        />
      )}
      {selectedTask && (
        <EditTaskModal
          task={selectedTask}
          agents={agents}
          onClose={() => setSelectedTask(null)}
          onSave={handleUpdateTask}
          onDelete={handleDeleteTask}
          onApprove={handleApproveTask}
          onReopen={handleReopenTask}
          onRefresh={fetchData}
        />
      )}
      {(showRoleModal || editingRole) && (
        <RoleModal
          role={editingRole}
          onClose={() => { setShowRoleModal(false); setEditingRole(null); }}
          onSubmit={editingRole ? handleUpdateRole : handleCreateRole}
        />
      )}
      {showKnowledgeEditor && (
        <KnowledgeEditorModal
          item={showKnowledgeEditor}
          onClose={() => setShowKnowledgeEditor(null)}
          onRefresh={() => fetch('/api/knowledge').then(r => r.json()).then(d => setKnowledgeItems(d.items || []))}
        />
      )}
      {showEditProject && editProjectForm && (
        <EditProjectModal
          initialData={editProjectForm}
          onClose={() => setShowEditProject(false)}
          onSubmit={handleEditProject}
          onDelete={handleDeleteProject}
        />
      )}
      {showAddProject && (
        <AddProjectModal
          onClose={() => setShowAddProject(false)}
          onSubmit={handleAddProject}
        />
      )}
    </>
  );
}

// ─── Task Card Component ─────────────────────────────────────────────────────

function TaskCard({ task, role, agents, onClick, onCyclePriority, onApprove, onReopen, onDragStart, onDragEnd, isDraggable }) {
  const [copied, setCopied] = useState(false);

  const handleCopyId = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(task.id).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const agentName = task.agent_id && agents?.length > 0
    ? agents.find(a => a.id === task.agent_id)?.name || task.agent_id
    : task.agent_id;

  return (
    <div
      className={`task-card ${isDraggable ? "draggable" : ""}`}
      onClick={onClick}
      draggable={isDraggable}
      onDragStart={(e) => isDraggable && onDragStart(e, task)}
      onDragEnd={onDragEnd}
    >
      <div className="task-card-header">
        <div className="task-card-title">{task.title}</div>
        <div className="task-card-actions">
          {onApprove && (
            <button className="card-action-btn approve" onClick={(e) => { e.stopPropagation(); onApprove(); }} title="Duyệt">
              ✅
            </button>
          )}
          {onReopen && (
            <button className="card-action-btn reopen" onClick={(e) => { e.stopPropagation(); onReopen(); }} title="Mở lại">
              🔄
            </button>
          )}
        </div>
      </div>
      <div className="task-card-meta">
        <div className="task-id-group">
          <span className="task-card-id">{task.id}</span>
          <button
            className="copy-id-btn"
            onClick={handleCopyId}
            title="Copy Task ID"
          >
            {copied ? "✓" : "📋"}
          </button>
        </div>
        <button
          className="task-card-priority-btn"
          style={{ background: PRIORITY_COLORS[task.priority], color: "#fff" }}
          onClick={(e) => onCyclePriority(e, task)}
          title={`Ưu tiên: ${PRIORITY_LABELS[task.priority]} — Nhấn để đổi`}
        >
          P{task.priority}
        </button>
      </div>
      {(task.phase || role) && (
        <div className="task-card-phase">
          {role && <span className="role-badge" style={{ borderColor: role.color }}>{role.icon} {role.name}</span>}
          {task.phase && !role && <span className="phase-tag">{task.phase}</span>}
        </div>
      )}
      {task.agent_id && (
        <div className="task-card-agent">
          🤖 {agentName}
        </div>
      )}
      {task.progress > 0 && task.status !== "done" && (
        <div className="task-card-progress">
          <div className="progress-bar-bg">
            <div
              className="progress-bar-fill"
              style={{ width: `${task.progress}%` }}
            />
          </div>
          <div className="progress-label">{task.progress}%</div>
        </div>
      )}
    </div>
  );
}

// ─── Roles Panel (Enhanced with CRUD) ────────────────────────────────────────

function RolesPanel({ roles, agents, onAddRole, onEditRole, onRemoveRole }) {
  if (!roles?.roles) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🎭</div>
        <div className="empty-text">Đang tải vai trò...</div>
      </div>
    );
  }

  const roleEntries = Object.entries(roles.roles);

  return (
    <>
      <div style={{ marginBottom: 12, fontSize: 12, color: "var(--text-muted)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>{roleEntries.length} vai trò</span>
        <button className="add-agent-btn" onClick={onAddRole}>＋ Thêm</button>
      </div>
      <div className="roles-list">
        {roleEntries.map(([key, role]) => (
          <div className="role-card" key={key}>
            <div className="role-header">
              <span className="role-icon" style={{ background: role.color + '22', color: role.color }}>
                {role.icon}
              </span>
              <div className="role-info">
                <div className="role-name">{role.name}</div>
                <div className="role-meta">
                  {role.skills?.length > 0 && <span>{role.skills.length} kỹ năng</span>}
                  <span>{role.workflows?.length || 0} quy trình</span>
                </div>
              </div>
              <div className="role-actions">
                <button className="agent-edit-btn" onClick={() => onEditRole({ key, ...role })} title="Sửa">✏️</button>
                <button className="agent-remove-btn" onClick={() => onRemoveRole(key)} title="Xoá">✕</button>
              </div>
            </div>
            {role.match?.phases?.length > 0 && (
              <div className="role-phases">
                {role.match.phases.map(p => (
                  <span className="phase-tag" key={p}>{p}</span>
                ))}
              </div>
            )}
            {role.skills?.length > 0 && (
              <div className="role-skills">
                {role.skills.map(s => (
                  <span className="skill-tag" key={s}>📚 {s}</span>
                ))}
              </div>
            )}
            {role.match?.keywords?.length > 0 && (
              <div className="role-keywords">
                {role.match.keywords.map(k => (
                  <span className="keyword-tag" key={k}>{k}</span>
                ))}
              </div>
            )}
          </div>
        ))}
        {roles.shared && (
          <div className="role-card shared-card">
            <div className="role-header">
              <span className="role-icon" style={{ background: '#8888a022', color: '#8888a0' }}>⚙️</span>
              <div className="role-info">
                <div className="role-name">Chung (Tất cả Agent)</div>
                <div className="role-meta">
                  <span>{roles.shared.auto_skills.length} kỹ năng tự động</span>
                  <span>{roles.shared.common_workflows.length} quy trình</span>
                </div>
              </div>
            </div>
            <div className="role-skills">
              {roles.shared.auto_skills.map(s => (
                <span className="skill-tag" key={s}>⚡ {s}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Locks Panel ─────────────────────────────────────────────────────────────

function LocksPanel({ locks, onRelease }) {
  if (!locks || locks.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🟢</div>
        <div className="empty-text">Không có file bị khoá</div>
      </div>
    );
  }

  return locks.map((lock, i) => (
    <div className="lock-item" key={i}>
      <span>🔒</span>
      <span className="lock-file" title={lock.file}>
        {lock.file}
      </span>
      <span className="lock-agent">{lock.agent}</span>
      <button
        className="lock-release-btn"
        onClick={() => onRelease(lock.file)}
        title="Giải phóng khoá"
      >
        ✕
      </button>
    </div>
  ));
}

// ─── Events Panel ────────────────────────────────────────────────────────────

function EventsPanel({ events }) {
  if (!events || events.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📡</div>
        <div className="empty-text">
          Sự kiện sẽ xuất hiện khi agent phát thay đổi.
        </div>
      </div>
    );
  }

  const typeIcons = {
    file_modified: "📝",
    api_changed: "🔌",
    schema_updated: "🗄️",
    dependency_added: "📦",
    component_created: "🧩",
    task_completed: "✅",
    custom: "💬",
  };

  const impactColors = {
    low: "var(--text-muted)",
    medium: "var(--accent-yellow)",
    high: "var(--accent-red)",
  };

  return events.map((event) => {
    const icon = typeIcons[event.event_type] || "📡";
    const impact = event.payload?.impact || "low";
    const timeAgo = formatTimeAgo(event.created_at);

    return (
      <div className="event-item" key={event.id}>
        <div className="event-header">
          <span className="event-icon">{icon}</span>
          <span className="event-type">{event.event_type.replace(/_/g, " ")}</span>
          <span className="event-time">{timeAgo}</span>
        </div>
        <div className="event-desc">{event.payload?.description || "Không có mô tả"}</div>
        <div className="event-footer">
          <span className="event-agent">🤖 {event.agent_id}</span>
          <span className="event-impact" style={{ color: impactColors[impact] }}>
            {impact}
          </span>
        </div>
        {event.payload?.files?.length > 0 && (
          <div className="event-files">
            {event.payload.files.map((f, i) => (
              <span className="event-file-tag" key={i}>{f}</span>
            ))}
          </div>
        )}
      </div>
    );
  });
}

// (RolesPanel moved above, combined with former AgentsPanel)

// ─── Notes Panel ─────────────────────────────────────────────────────────────

const NOTE_TYPE_ICONS = {
  brief: "💡", plan: "📋", spec: "📐", conversation: "💬", decision: "⚖️", reference: "📎",
};

function NotesPanel({ notes, onRefresh, activeProject }) {
  const [deleting, setDeleting] = useState(null);

  const handleDelete = async (id) => {
    try {
      await fetch("/api/notes", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      onRefresh();
    } catch (err) {
      console.error("Failed to delete note:", err);
    }
    setDeleting(null);
  };

  if (!notes || notes.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📝</div>
        <div className="empty-text">
          Chưa có ghi chú.
          <br />
          Ghi chú được tạo từ <code>/brainstorm</code> và <code>/plan</code>.
        </div>
      </div>
    );
  }

  // Group by type
  const grouped = {};
  for (const n of notes) {
    if (!grouped[n.type]) grouped[n.type] = [];
    grouped[n.type].push(n);
  }

  return (
    <div className="notes-panel">
      {Object.entries(grouped).map(([type, items]) => (
        <div key={type} className="notes-group">
          <div className="notes-group-header">
            <span>{NOTE_TYPE_ICONS[type] || "📄"} {type.charAt(0).toUpperCase() + type.slice(1)}</span>
            <span className="notes-group-count">{items.length}</span>
          </div>
          {items.map(note => (
            <div className="note-card" key={note.id}>
              <div className="note-card-header">
                <span className="note-title">{note.title}</span>
                {deleting === note.id ? (
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="note-action-btn danger" onClick={() => handleDelete(note.id)}>✕</button>
                    <button className="note-action-btn" onClick={() => setDeleting(null)}>↩</button>
                  </div>
                ) : (
                  <button className="note-action-btn" onClick={() => setDeleting(note.id)} title="Delete">🗑️</button>
                )}
              </div>
              {note.file_path && (
                <div className="note-meta">
                  <span className="note-meta-label">📁</span>
                  <span className="note-meta-value" title={note.file_path}>
                    {note.file_path.split('/').slice(-2).join('/')}
                  </span>
                </div>
              )}
              {note.conversation_id && (
                <div className="note-meta">
                  <span className="note-meta-label">💬</span>
                  <code className="note-conv-id">{note.conversation_id.slice(0, 12)}…</code>
                </div>
              )}
              {note.task_id && (
                <div className="note-meta">
                  <span className="note-meta-label">🎯</span>
                  <code className="note-conv-id">{note.task_id}</code>
                </div>
              )}
              <div className="note-time">{formatTimeAgo(note.created_at)}</div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function formatTimeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec} giây trước`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} phút trước`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} giờ trước`;
  return `${Math.floor(hr / 24)} ngày trước`;
}

// ─── Edit Task Modal (replaces read-only detail modal) ───────────────────────

function EditTaskModal({ task, agents, onClose, onSave, onDelete, onApprove, onReopen, onRefresh }) {
  const [form, setForm] = useState({
    title: task.title,
    description: task.description || "",
    priority: task.priority,
    acceptance: task.acceptance || "",
    phase: task.phase || "",
    agent_id: task.agent_id || "",
  });
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [taskNotes, setTaskNotes] = useState([]);
  const [convInput, setConvInput] = useState("");
  const isEditable = ["draft", "ready"].includes(task.status);

  const refreshNotes = useCallback(() => {
    const params = new URLSearchParams();
    if (task.id) params.set('taskId', task.id);
    fetch(`/api/notes?${params}`)
      .then(r => r.json())
      .then(d => {
        const notes = d.notes || [];
        if (task.conversation_id) {
          fetch(`/api/notes?conversationId=${task.conversation_id}`)
            .then(r => r.json())
            .then(d2 => {
              const convNotes = d2.notes || [];
              const allNotes = [...notes];
              for (const n of convNotes) {
                if (!allNotes.find(existing => existing.id === n.id)) allNotes.push(n);
              }
              setTaskNotes(allNotes);
            })
            .catch(() => setTaskNotes(notes));
        } else {
          setTaskNotes(notes);
        }
      })
      .catch(() => { });
  }, [task.id, task.conversation_id]);

  useEffect(() => { refreshNotes(); }, [refreshNotes]);

  const handleAddConversation = async () => {
    const id = convInput.trim();
    if (!id) return;
    try {
      await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: task.id,
          project_id: task.project_id,
          type: 'conversation',
          title: `Conversation ${id.slice(0, 8)}…`,
          conversation_id: id,
        }),
      });
      setConvInput('');
      refreshNotes();
      onRefresh();
    } catch (err) {
      console.error('Failed to add conversation:', err);
    }
  };

  const handleRemoveNote = async (noteId) => {
    try {
      await fetch('/api/notes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: noteId }),
      });
      refreshNotes();
      onRefresh();
    } catch (err) {
      console.error('Failed to remove note:', err);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(task.id, { ...form, agent_id: form.agent_id || null });
    setSaving(false);
    onClose();
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(task.id).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const statusLabel = {
    draft: "📝 Nháp",
    ready: "⬜ Sẵn sàng",
    claimed: "🟡 Đã nhận",
    in_progress: "🔵 Đang làm",
    review: "🟣 Duyệt",
    done: "✅ Xong",
    abandoned: "⚫ Huỷ bỏ",
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal task-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="detail-header">
          <div className="detail-status-badge" style={{ color: COLUMNS.find(c => c.key === task.status || c.includeStatuses?.includes(task.status))?.color || "#8888a0" }}>
            {statusLabel[task.status] || task.status}
          </div>
          <div className="task-id-group">
            <span className="task-card-id" style={{ fontSize: 11 }}>{task.id}</span>
            <button className="copy-id-btn" onClick={handleCopyId} title="Sao chép ID">
              {copied ? "✓" : "📋"}
            </button>
          </div>
        </div>

        <div className="edit-form">
          <div className="form-group">
            <label className="form-label">Tiêu đề</label>
            {isEditable ? (
              <input
                className="form-input"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            ) : (
              <div className="form-value">{task.title}</div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Mô tả</label>
            {isEditable ? (
              <textarea
                className="form-textarea"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Cần làm gì..."
              />
            ) : (
              <div className="form-value">{task.description || "—"}</div>
            )}
          </div>

          <div className="form-row">
            <div className="form-group half">
              <label className="form-label">Ʈu tiên</label>
              {isEditable ? (
                <select
                  className="form-select"
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value) })}
                >
                  <option value={1}>P1 — Cao</option>
                  <option value={2}>P2 — Trung bình</option>
                  <option value={3}>P3 — Thấp</option>
                </select>
              ) : (
                <div className="form-value">
                  <span style={{ color: PRIORITY_COLORS[task.priority] }}>P{task.priority} — {PRIORITY_LABELS[task.priority]}</span>
                </div>
              )}
            </div>
            <div className="form-group half">
              <label className="form-label">Giai đoạn / Nhóm</label>
              {isEditable ? (
                <input
                  className="form-input"
                  value={form.phase}
                  onChange={(e) => setForm({ ...form, phase: e.target.value })}
                  placeholder="iOS, Android, Backend..."
                />
              ) : (
                <div className="form-value">{task.phase || "—"}</div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Agent phụ trách</label>
            {isEditable ? (
              <select
                className="form-select"
                value={form.agent_id}
                onChange={(e) => setForm({ ...form, agent_id: e.target.value })}
              >
                <option value="">— Chưa gán —</option>
                {agents?.map(a => (
                  <option key={a.id} value={a.id}>
                    🤖 {a.name || a.id}{a.specialties?.length > 0 ? ` (${a.specialties.join(', ')})` : ''}
                  </option>
                ))}
              </select>
            ) : (
              <div className="form-value">
                {task.agent_id ? `🤖 ${agents?.find(a => a.id === task.agent_id)?.name || task.agent_id}` : '—'}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Tiêu chí nghiệm thu</label>
            {isEditable ? (
              <textarea
                className="form-textarea"
                value={form.acceptance}
                onChange={(e) => setForm({ ...form, acceptance: e.target.value })}
                placeholder="Cách xác nhận task hoàn thành..."
              />
            ) : (
              <div className="form-value">{task.acceptance || "—"}</div>
            )}
          </div>

          {task.progress > 0 && (
            <div className="form-group">
              <label className="form-label">Tiến độ</label>
              <div className="progress-bar-bg" style={{ height: 8 }}>
                <div className="progress-bar-fill" style={{ width: `${task.progress}%` }} />
              </div>
              <div className="form-value" style={{ fontSize: 12, marginTop: 4 }}>{task.progress}%</div>
            </div>
          )}

          {task.summary && (
            <div className="form-group">
              <label className="form-label">Tóm tắt</label>
              <div className="form-value">{task.summary}</div>
            </div>
          )}

          {/* Related Conversations & Notes */}
          <div className="form-group">
            <label className="form-label">💬 Hội thoại liên quan</label>
            <div className="task-conversations">
              {/* Primary conversation_id */}
              {task.conversation_id && (
                <div className="conv-item primary">
                  <span className="conv-label">Chính</span>
                  <code className="note-conv-id">{task.conversation_id.slice(0, 20)}…</code>
                  <button
                    className="copy-id-btn"
                    onClick={() => navigator.clipboard.writeText(task.conversation_id)}
                    title="Sao chép ID"
                    style={{ fontSize: 10 }}
                  >
                    📋
                  </button>
                </div>
              )}
              {/* Notes linked to this task */}
              {taskNotes.filter(n => n.conversation_id && n.conversation_id !== task.conversation_id).map(note => (
                <div className="conv-item" key={note.id}>
                  <span className="conv-type-icon">{NOTE_TYPE_ICONS[note.type] || '📄'}</span>
                  <span className="conv-note-title">{note.title}</span>
                  <code className="note-conv-id">{note.conversation_id.slice(0, 12)}…</code>
                  <button
                    className="copy-id-btn"
                    onClick={() => navigator.clipboard.writeText(note.conversation_id)}
                    title="Sao chép ID"
                    style={{ fontSize: 10 }}
                  >
                    📋
                  </button>
                  <button
                    className="conv-remove-btn"
                    onClick={() => handleRemoveNote(note.id)}
                    title="Remove"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {/* Notes without conversation_id (file-linked) */}
              {taskNotes.filter(n => !n.conversation_id && n.file_path).map(note => (
                <div className="conv-item" key={note.id}>
                  <span className="conv-type-icon">{NOTE_TYPE_ICONS[note.type] || '📄'}</span>
                  <span className="conv-note-title">{note.title}</span>
                  <span className="note-meta-value" title={note.file_path}>
                    📁 {note.file_path.split('/').slice(-2).join('/')}
                  </span>
                  <button
                    className="conv-remove-btn"
                    onClick={() => handleRemoveNote(note.id)}
                    title="Xoá"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {/* Add conversation input */}
              <div className="conv-add-row">
                <input
                  className="conv-add-input"
                  value={convInput}
                  onChange={(e) => setConvInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddConversation()}
                  placeholder="Dán ID hội thoại…"
                />
                <button
                  className="conv-add-btn"
                  onClick={handleAddConversation}
                  disabled={!convInput.trim()}
                >
                  ＋
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <div className="modal-actions-left">
            {isEditable && (
              confirmDelete ? (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: '#ef4444' }}>Xoá task này?</span>
                  <button className="btn-danger" onClick={() => onDelete(task.id)} style={{ padding: '4px 12px', fontSize: 12 }}>
                    Có, Xoá
                  </button>
                  <button className="btn-cancel" onClick={() => setConfirmDelete(false)} style={{ padding: '4px 12px', fontSize: 12 }}>
                    Huỷ
                  </button>
                </div>
              ) : (
                <button className="btn-danger" onClick={() => setConfirmDelete(true)}>
                  🗑️ Xoá
                </button>
              )
            )}
            {task.status === "done" && (
              <button className="btn-reopen" onClick={() => onReopen(task.id)}>
                🔄 Mở lại
              </button>
            )}
          </div>
          <div className="modal-actions-right">
            <button className="btn-cancel" onClick={onClose}>
              {isEditable ? "Huỷ" : "Đóng"}
            </button>
            {task.status === "draft" && (
              <button className="btn-approve" onClick={() => onApprove(task.id)}>
                ✅ Duyệt
              </button>
            )}
            {isEditable && (
              <button className="create-btn" onClick={handleSave} disabled={saving}>
                {saving ? "Đang lưu..." : "💾 Lưu"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Create Task Modal ───────────────────────────────────────────────────────

function CreateTaskModal({ onClose, onSubmit, agents }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: 2,
    acceptance: "",
    phase: "",
    agent_id: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSubmit({ ...form, agent_id: form.agent_id || undefined });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Tạo Task Nháp</h2>
        <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: -8, marginBottom: 16 }}>
          Task bắt đầu là nháp. Duyệt khi sẵn sàng cho agent.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Tiêu đề *</label>
            <input
              className="form-input"
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Tiêu đề task..."
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">Mô tả</label>
            <textarea
              className="form-textarea"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Cần làm gì..."
            />
          </div>
          <div className="form-row">
            <div className="form-group half">
              <label className="form-label">Ʈu tiên</label>
              <select
                className="form-select"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value) })}
              >
                <option value={1}>P1 — Cao</option>
                <option value={2}>P2 — Trung bình</option>
                <option value={3}>P3 — Thấp</option>
              </select>
            </div>
            <div className="form-group half">
              <label className="form-label">Giai đoạn / Nhóm</label>
              <input
                className="form-input"
                type="text"
                value={form.phase}
                onChange={(e) => setForm({ ...form, phase: e.target.value })}
                placeholder="iOS, Android, Backend..."
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Gán Agent</label>
            <select
              className="form-select"
              value={form.agent_id}
              onChange={(e) => setForm({ ...form, agent_id: e.target.value })}
            >
              <option value="">— Chưa gán —</option>
              {agents?.map(a => (
                <option key={a.id} value={a.id}>
                  🤖 {a.name || a.id}{a.specialties?.length > 0 ? ` (${a.specialties.join(', ')})` : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Tiêu chí nghiệm thu</label>
            <textarea
              className="form-textarea"
              value={form.acceptance}
              onChange={(e) => setForm({ ...form, acceptance: e.target.value })}
              placeholder="Cách xác nhận task hoàn thành..."
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Huỷ
            </button>
            <button type="submit" className="create-btn">
              📝 Tạo Nháp
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Tag Input Component ─────────────────────────────────────────────────────

function TagInput({ tags, onChange, placeholder }) {
  const [input, setInput] = useState("");

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const val = input.trim().replace(/,$/, "");
      if (val && !tags.includes(val)) {
        onChange([...tags, val]);
      }
      setInput("");
    } else if (e.key === "Backspace" && !input && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  const removeTag = (idx) => onChange(tags.filter((_, i) => i !== idx));

  return (
    <div className="tag-input-container">
      {tags.map((tag, i) => (
        <span className="tag-input-tag" key={i}>
          {tag}
          <button type="button" className="tag-remove" onClick={() => removeTag(i)}>✕</button>
        </span>
      ))}
      <input
        className="tag-input-field"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={tags.length === 0 ? placeholder : ""}
      />
    </div>
  );
}

// ─── Role Modal ──────────────────────────────────────────────────────────────

function RoleModal({ role, onClose, onSubmit }) {
  const [form, setForm] = useState({
    key: role?.key || "",
    name: role?.name || "",
    icon: role?.icon || "🎭",
    color: role?.color || "#4f7cff",
    skills: role?.skills || [],
    workflows: role?.workflows || [],
    phases: role?.match?.phases || [],
    keywords: role?.match?.keywords || [],
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!role && !form.key.trim()) return;
    if (!form.name.trim()) return;
    onSubmit({
      key: role?.key || form.key,
      name: form.name,
      icon: form.icon,
      color: form.color,
      skills: form.skills,
      workflows: form.workflows,
      match: {
        phases: form.phases,
        keywords: form.keywords,
      },
    });
  };

  const colorPresets = ["#ef4444", "#f59e0b", "#22c55e", "#4f7cff", "#7c5cff", "#ec4899", "#8888a0", "#34d399"];
  const iconPresets = ["🍎", "🤖", "🌐", "📈", "🎨", "🔧", "🎭", "📱", "☁️", "🧪", "📊", "🛡️"];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">{role ? "Sửa Vai trò" : "Thêm Vai trò"}</h2>
        <form onSubmit={handleSubmit}>
          {!role && (
            <div className="form-group">
              <label className="form-label">ID Vai trò * <span className="form-hint">(vd: ios, android, web)</span></label>
              <input
                className="form-input"
                value={form.key}
                onChange={(e) => setForm({ ...form, key: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '') })}
                placeholder="ios"
                autoFocus
                style={{ fontFamily: 'monospace' }}
              />
            </div>
          )}
          <div className="form-row">
            <div className="form-group half">
              <label className="form-label">Tên vai trò *</label>
              <input
                className="form-input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="iOS Engineer"
                autoFocus={!!role}
              />
            </div>
            <div className="form-group half">
              <label className="form-label">Biểu tượng</label>
              <div className="color-presets">
                {iconPresets.map((ic) => (
                  <button
                    key={ic}
                    type="button"
                    className={`icon-preset ${form.icon === ic ? "active" : ""}`}
                    onClick={() => setForm({ ...form, icon: ic })}
                  >
                    {ic}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Màu sắc</label>
            <div className="color-presets">
              {colorPresets.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`color-preset ${form.color === c ? "active" : ""}`}
                  style={{ background: c }}
                  onClick={() => setForm({ ...form, color: c })}
                />
              ))}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Kỹ năng (Skills)</label>
            <TagInput
              tags={form.skills}
              onChange={(skills) => setForm({ ...form, skills })}
              placeholder="Nhập kỹ năng, nhấn Enter…"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Quy trình (Workflows)</label>
            <TagInput
              tags={form.workflows}
              onChange={(workflows) => setForm({ ...form, workflows })}
              placeholder="/code, /debug, /test…"
            />
          </div>
          <div className="form-row">
            <div className="form-group half">
              <label className="form-label">Phase matching</label>
              <TagInput
                tags={form.phases}
                onChange={(phases) => setForm({ ...form, phases })}
                placeholder="iOS, SwiftUI…"
              />
            </div>
            <div className="form-group half">
              <label className="form-label">Keyword matching</label>
              <TagInput
                tags={form.keywords}
                onChange={(keywords) => setForm({ ...form, keywords })}
                placeholder="swift, xcode…"
              />
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Huỷ</button>
            <button type="submit" className="create-btn">{role ? "💾 Lưu" : "＋ Thêm Vai trò"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Edit Project Modal ───────────────────────────────────────────────────────

function EditProjectModal({ onClose, onSubmit, onDelete, initialData }) {
  const [form, setForm] = useState({
    id: initialData?.id || "",
    name: initialData?.name || "",
    path: initialData?.path || "",
    icon: initialData?.icon || "📁",
    color: initialData?.color || "#4f7cff",
  });

  const iconPresets = ["📁", "🍎", "🤖", "🌐", "📷", "🪷", "🎮", "💊", "📊", "🛒"];
  const colorPresets = ["#ef4444", "#f59e0b", "#22c55e", "#4f7cff", "#7c5cff", "#ec4899", "#8888a0"];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.id.trim() || !form.name.trim()) return;
    onSubmit(form);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Sửa Dự án</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Tên dự án *</label>
            <input
              className="form-input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="FitBite Pro, FilmCam..."
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">ID dự án (không thể đổi)</label>
            <input
              className="form-input"
              value={form.id}
              disabled
              style={{ fontFamily: 'monospace', opacity: 0.6 }}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Đường dẫn (tuỳ chọn)</label>
            <input
              className="form-input"
              value={form.path}
              onChange={(e) => setForm({ ...form, path: e.target.value })}
              placeholder="/Users/.../Dev/iOS/FitBitePro"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Biểu tượng</label>
            <div className="color-presets">
              {iconPresets.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  className={`icon-preset ${form.icon === ic ? "active" : ""}`}
                  onClick={() => setForm({ ...form, icon: ic })}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Màu sắc</label>
            <div className="color-presets">
              {colorPresets.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`color-preset ${form.color === c ? "active" : ""}`}
                  style={{ background: c }}
                  onClick={() => setForm({ ...form, color: c })}
                />
              ))}
            </div>
          </div>
          <div className="modal-actions">
             {onDelete && (
                <button type="button" className="btn-danger" onClick={() => onDelete(form.id)} style={{ marginRight: 'auto' }}>
                  🗑️ Xoá
                </button>
             )}
             <button type="button" className="btn-cancel" onClick={onClose}>Huỷ</button>
             <button type="submit" className="create-btn">✏️ Lưu thay đổi</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Add Project Modal ───────────────────────────────────────────────────────

function AddProjectModal({ onClose, onSubmit }) {
  const [form, setForm] = useState({
    id: "",
    name: "",
    path: "",
    icon: "📁",
    color: "#4f7cff",
  });

  const iconPresets = ["📁", "🍎", "🤖", "🌐", "📷", "🪷", "🎮", "💊", "📊", "🛒"];
  const colorPresets = ["#ef4444", "#f59e0b", "#22c55e", "#4f7cff", "#7c5cff", "#ec4899", "#8888a0"];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.id.trim() || !form.name.trim()) return;
    onSubmit(form);
  };

  const autoId = (name) => name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Đăng ký Dự án</h2>
        <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: -8, marginBottom: 16 }}>
          Đăng ký dự án để phân nhóm task và sự kiện.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Tên dự án *</label>
            <input
              className="form-input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value, id: form.id || autoId(e.target.value) })}
              placeholder="FitBite Pro, FilmCam..."
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">ID dự án *</label>
            <input
              className="form-input"
              value={form.id}
              onChange={(e) => setForm({ ...form, id: e.target.value })}
              placeholder="fitbite-pro"
              style={{ fontFamily: 'monospace' }}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Đường dẫn (tuỳ chọn)</label>
            <input
              className="form-input"
              value={form.path}
              onChange={(e) => setForm({ ...form, path: e.target.value })}
              placeholder="/Users/.../Dev/iOS/FitBitePro"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Biểu tượng</label>
            <div className="color-presets">
              {iconPresets.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  className={`icon-preset ${form.icon === ic ? "active" : ""}`}
                  onClick={() => setForm({ ...form, icon: ic })}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Màu sắc</label>
            <div className="color-presets">
              {colorPresets.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`color-preset ${form.color === c ? "active" : ""}`}
                  style={{ background: c }}
                  onClick={() => setForm({ ...form, color: c })}
                />
              ))}
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Huỷ</button>
            <button type="submit" className="create-btn">📁 Đăng ký</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Knowledge Panel ─────────────────────────────────────────────────────────

const PROJECT_PATTERNS = [
  { prefix: 'dr_blood_pressure', label: 'Dr. Blood Pressure', icon: '🩺' },
  { prefix: 'fitbite_pro', label: 'FitBite Pro', icon: '🍎' },
  { prefix: 'giacngo', label: 'Giác Ngộ', icon: '🧘' },
  { prefix: 'vintage_camera', label: 'Vintage Camera', icon: '📷' },
  { prefix: 'wink', label: 'Wink', icon: '✨' },
];

function detectProject(kiId) {
  for (const p of PROJECT_PATTERNS) {
    if (kiId.startsWith(p.prefix)) return p;
  }
  return { prefix: '', label: 'Other', icon: '📂' };
}

function KnowledgePanel({ items, onOpenEditor, onRefresh }) {
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ id: '', title: '', summary: '' });
  const [creating, setCreating] = useState(false);

  const filtered = items.filter(item =>
    !search || item.title.toLowerCase().includes(search.toLowerCase()) ||
    item.id.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = {};
  for (const item of filtered) {
    const proj = detectProject(item.id);
    if (!grouped[proj.label]) grouped[proj.label] = { ...proj, items: [] };
    grouped[proj.label].items.push(item);
  }

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await fetch('/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      });
      setShowCreate(false);
      setCreateForm({ id: '', title: '', summary: '' });
      onRefresh();
    } catch (err) {
      console.error('Failed to create KI:', err);
    }
    setCreating(false);
  };

  if (items.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📚</div>
        <div className="empty-text">Chưa có Knowledge Item nào.</div>
      </div>
    );
  }

  return (
    <div className="knowledge-panel">
      <div className="ki-search-bar">
        <input type="text" placeholder="Tìm knowledge..." value={search} onChange={(e) => setSearch(e.target.value)} className="ki-search-input" />
        <button className="ki-create-btn" onClick={() => setShowCreate(!showCreate)} title="Tạo KI mới">＋</button>
      </div>
      {showCreate && (
        <form className="ki-create-form" onSubmit={handleCreate}>
          <input type="text" placeholder="ID (vd: wink_architecture)" value={createForm.id} onChange={(e) => setCreateForm({ ...createForm, id: e.target.value })} className="ki-create-input" required />
          <input type="text" placeholder="Title" value={createForm.title} onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })} className="ki-create-input" required />
          <textarea placeholder="Summary" value={createForm.summary} onChange={(e) => setCreateForm({ ...createForm, summary: e.target.value })} className="ki-create-input" rows={2} />
          <div style={{ display: 'flex', gap: 6 }}>
            <button type="submit" className="ki-create-submit" disabled={creating}>{creating ? '...' : '✅ Tạo'}</button>
            <button type="button" className="ki-create-cancel" onClick={() => setShowCreate(false)}>Huỷ</button>
          </div>
        </form>
      )}
      {Object.entries(grouped).map(([label, group]) => (
        <div key={label} className="ki-project-group">
          <div className="ki-group-header">
            <span>{group.icon} {label}</span>
            <span className="ki-group-count">{group.items.length}</span>
          </div>
          {group.items.map(item => (
            <div key={item.id} className="ki-card" onClick={() => onOpenEditor(item)}>
              <div className="ki-card-title">{item.title}</div>
              <div className="ki-card-meta">
                <span>📄 {item.artifactCount} files</span>
                <span>🔗 {item.referenceCount} refs</span>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Knowledge Editor Modal ──────────────────────────────────────────────────

function KnowledgeEditorModal({ item, onClose, onRefresh }) {
  const [detail, setDetail] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingMeta, setEditingMeta] = useState(false);
  const [metaForm, setMetaForm] = useState({ title: '', summary: '' });
  const [newFileName, setNewFileName] = useState('');
  const [showNewFile, setShowNewFile] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    fetch(`/api/knowledge?id=${item.id}`)
      .then(r => r.json())
      .then(d => {
        setDetail(d.item);
        setMetaForm({ title: d.item.title || '', summary: d.item.summary || '' });
        if (d.item.artifacts?.length > 0) loadFile(d.item.artifacts[0].path);
      })
      .catch(err => console.error('Failed to load KI:', err));
  }, [item.id]);

  const loadFile = async (filePath) => {
    setSelectedFile(filePath);
    try {
      const res = await fetch(`/api/knowledge?id=${item.id}&file=${encodeURIComponent(filePath)}`);
      const data = await res.json();
      setFileContent(data.content || '');
      setOriginalContent(data.content || '');
    } catch (err) {
      setFileContent('Error loading file');
      setOriginalContent('');
    }
  };

  const handleSave = async () => {
    if (!selectedFile || fileContent === originalContent) return;
    setSaving(true);
    try {
      await fetch('/api/knowledge', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, file: selectedFile, content: fileContent }),
      });
      setOriginalContent(fileContent);
    } catch (err) {
      console.error('Failed to save:', err);
    }
    setSaving(false);
  };

  const handleSaveMeta = async () => {
    try {
      await fetch('/api/knowledge', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, metadata: metaForm }),
      });
      setEditingMeta(false);
      onRefresh();
    } catch (err) {
      console.error('Failed to save metadata:', err);
    }
  };

  const handleCreateFile = async (e) => {
    e.preventDefault();
    if (!newFileName) return;
    const filePath = newFileName.startsWith('artifacts/') ? newFileName : `artifacts/${newFileName}`;
    try {
      await fetch('/api/knowledge', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, file: filePath, content: `# ${newFileName.replace(/\.md$/, '').split('/').pop()}\n\nTODO: Add content\n` }),
      });
      const res = await fetch(`/api/knowledge?id=${item.id}`);
      const d = await res.json();
      setDetail(d.item);
      setShowNewFile(false);
      setNewFileName('');
      loadFile(filePath);
    } catch (err) {
      console.error('Failed to create file:', err);
    }
  };

  const handleDeleteFile = async (filePath) => {
    if (!confirm(`Xoá file ${filePath}?`)) return;
    try {
      await fetch('/api/knowledge', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, file: filePath }),
      });
      const res = await fetch(`/api/knowledge?id=${item.id}`);
      const d = await res.json();
      setDetail(d.item);
      if (selectedFile === filePath) { setSelectedFile(null); setFileContent(''); }
    } catch (err) {
      console.error('Failed to delete file:', err);
    }
  };

  const hasChanges = fileContent !== originalContent;

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); handleSave(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="ke-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ke-header">
          <div className="ke-header-left">
            {editingMeta ? (
              <div className="ke-meta-edit">
                <input className="ke-title-input" value={metaForm.title} onChange={(e) => setMetaForm({ ...metaForm, title: e.target.value })} placeholder="Title" />
                <textarea className="ke-summary-input" value={metaForm.summary} onChange={(e) => setMetaForm({ ...metaForm, summary: e.target.value })} placeholder="Summary" rows={2} />
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="ki-create-submit" onClick={handleSaveMeta}>💾 Lưu</button>
                  <button className="ki-create-cancel" onClick={() => setEditingMeta(false)}>Huỷ</button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="ke-title" onClick={() => setEditingMeta(true)} title="Click để sửa">📚 {detail?.title || item.title}</h2>
                <div className="ke-summary">{detail?.summary || item.summary}</div>
              </>
            )}
          </div>
          <button className="ke-close" onClick={onClose}>✕</button>
        </div>
        <div className="ke-body">
          <div className="ke-sidebar">
            <div className="ke-sidebar-header">
              <span>📁 Files</span>
              <button className="ki-create-btn small" onClick={() => setShowNewFile(!showNewFile)} title="Tạo file mới">＋</button>
            </div>
            {showNewFile && (
              <form className="ke-new-file" onSubmit={handleCreateFile}>
                <input type="text" placeholder="path/filename.md" value={newFileName} onChange={(e) => setNewFileName(e.target.value)} className="ki-create-input small" required />
                <button type="submit" className="ki-create-submit small">✅</button>
              </form>
            )}
            <div className="ke-file-list">
              <div className={`ke-file-item ${selectedFile === 'metadata.json' ? 'active' : ''}`} onClick={() => loadFile('metadata.json')}>
                <span>⚙️ metadata.json</span>
              </div>
              {detail?.artifacts?.map(a => (
                <div key={a.path} className={`ke-file-item ${selectedFile === a.path ? 'active' : ''}`} onClick={() => loadFile(a.path)}>
                  <span title={a.path}>{a.path.endsWith('.md') ? '📝' : '📄'} {a.name}</span>
                  <button className="ke-file-delete" onClick={(e) => { e.stopPropagation(); handleDeleteFile(a.path); }} title="Xoá">✕</button>
                </div>
              ))}
            </div>
            {detail?.references?.length > 0 && (
              <div className="ke-refs">
                <div className="ke-sidebar-header">🔗 References</div>
                {detail.references.map((ref, i) => (
                  <div key={i} className="ke-ref-item">
                    <span className="ke-ref-type">{ref.type === 'conversation_id' ? '💬' : '📁'}</span>
                    <span className="ke-ref-value" title={ref.value}>{(ref.value || '').slice(0, 28)}{ref.value?.length > 28 ? '…' : ''}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="ke-editor">
            {selectedFile ? (
              <>
                <div className="ke-editor-header">
                  <span className="ke-editor-path">{selectedFile}</span>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {hasChanges && <span className="ke-unsaved">●</span>}
                    <button className={`ke-save-btn ${hasChanges ? 'active' : ''}`} onClick={handleSave} disabled={!hasChanges || saving}>
                      {saving ? 'Đang lưu...' : '💾 Lưu'}
                    </button>
                  </div>
                </div>
                <textarea className="ke-textarea" value={fileContent} onChange={(e) => setFileContent(e.target.value)} spellCheck={false} ref={contentRef} />
              </>
            ) : (
              <div className="ke-empty"><div className="empty-icon">📝</div><div className="empty-text">Chọn file để xem và chỉnh sửa</div></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

