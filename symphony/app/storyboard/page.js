'use client';
import { useState, useEffect, useCallback, useRef } from 'react';

const TRANSITIONS = [
  { value: 'fade', label: '🌅 Fade' },
  { value: 'slideleft', label: '⬅️ Slide Left' },
  { value: 'slideright', label: '➡️ Slide Right' },
  { value: 'circlecrop', label: '⭕ Circle Crop' },
  { value: 'dissolve', label: '✨ Dissolve' },
  { value: 'wipeleft', label: '🔲 Wipe Left' },
  { value: 'wiperight', label: '🔳 Wipe Right' },
  { value: 'none', label: '🚫 None' },
];

export default function StoryboardPage() {
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [storyboard, setStoryboard] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isGeneratingScene, setIsGeneratingScene] = useState(false);
  const [toast, setToast] = useState(null);
  // Generation state
  const [genStatus, setGenStatus] = useState({}); // { sceneIdx_type: 'idle'|'running'|'done'|'error' }
  const [logs, setLogs] = useState([]);
  const [showLogPanel, setShowLogPanel] = useState(false);
  const [editingScene, setEditingScene] = useState(null); // index of scene being edited
  const logEndRef = useRef(null);
  const saveTimerRef = useRef(null); // debounce timer for auto-save on text edit
  const charFileRef = useRef(null); // hidden file input for character upload
  const [charMode, setCharMode] = useState(null); // null | 'text2img' | 'uploaded' | 'generate-from-ref'
  const [charPreviewUrl, setCharPreviewUrl] = useState(null);
  const [charPreviewFile, setCharPreviewFile] = useState(null);

  const [isSettingsExpanded, setIsSettingsExpanded] = useState(true);

  // Load expanded state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('sb_settings_expanded');
    if (savedState !== null) {
      setIsSettingsExpanded(savedState === 'true');
    }
  }, []);

  const toggleSettings = () => {
    const newState = !isSettingsExpanded;
    setIsSettingsExpanded(newState);
    localStorage.setItem('sb_settings_expanded', newState);
  };

  // Load project list
  useEffect(() => {
    fetch('/api/storyboard')
      .then(r => r.json())
      .then(data => {
        setProjects(data.projects || []);
        setLoading(false);
        // Auto-select from URL param
        const params = new URLSearchParams(window.location.search);
        const proj = params.get('project');
        if (proj) loadProject(proj);
      })
      .catch(() => setLoading(false));
  }, []);

  const loadProject = useCallback((name) => {
    setLoading(true);
    fetch(`/api/storyboard?project=${encodeURIComponent(name)}&t=${Date.now()}`)
      .then(r => r.json())
      .then(data => {
        if (data.storyboard) {
          setActiveProject(name);
          setStoryboard(data.storyboard);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const updateTransition = (sceneIndex, value) => {
    const updated = { ...storyboard };
    updated.scenes = [...updated.scenes];
    updated.scenes[sceneIndex] = { ...updated.scenes[sceneIndex], transition: value };
    setStoryboard(updated);
    debouncedSave(updated);
  };

  const updateDuration = (sceneIndex, value) => {
    const numVal = parseInt(value, 10);
    if (isNaN(numVal) || numVal < 1) return;
    const updated = { ...storyboard };
    updated.scenes = [...updated.scenes];
    updated.scenes[sceneIndex] = { ...updated.scenes[sceneIndex], duration: numVal };
    // Recalculate total
    updated.duration = updated.scenes.reduce((sum, s) => sum + s.duration, 0);
    setStoryboard(updated);
    debouncedSave(updated);
  };

  // Scene field update (generic) — with debounced auto-save
  const updateSceneField = (sceneIndex, field, value) => {
    const updated = { ...storyboard };
    updated.scenes = [...updated.scenes];
    updated.scenes[sceneIndex] = { ...updated.scenes[sceneIndex], [field]: value };
    setStoryboard(updated);
    debouncedSave(updated);
  };

  // Debounced save — waits 1.5s after last edit before saving
  const debouncedSave = (boardData) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveStoryboard(boardData);
    }, 1500);
  };

  // Add a new blank scene
  const addScene = () => {
    const updated = { ...storyboard };
    const count = (updated.scenes?.length || 0) + 1;
    const newScene = {
      id: String(count).padStart(2, '0'),
      scene_id: `scene-${String(count).padStart(2, '0')}`,
      duration: 5,
      script: '',
      tts_text: '',
      prompt: '',
      video_prompt: '',
      image_prompt: '',
      transition: 'fade',
    };
    updated.scenes = [...(updated.scenes || []), newScene];
    updated.duration = updated.scenes.reduce((sum, s) => sum + (s.duration || 5), 0);
    setStoryboard(updated);
    saveStoryboard(updated);
    setEditingScene(count - 1);
    showToast(`✅ Scene ${count} added`);
  };

  // Add a new scene generated by AI
  const addAiScene = async () => {
    if (!storyboard) return;
    setIsGeneratingScene(true);
    showToast('🧠 AI is writing the next scene...');
    try {
      const res = await fetch('/api/storyboard/ai-scene', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storyboard }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        showToast(`❌ AI Error: ${data.error || 'Failed to generate'}`);
        return;
      }

      if (data.scene) {
        const updated = { ...storyboard };
        const count = (updated.scenes?.length || 0) + 1;
        const newScene = {
          id: String(count).padStart(2, '0'),
          scene_id: `scene-${String(count).padStart(2, '0')}`,
          duration: data.scene.duration || 5,
          script: data.scene.script || '',
          tts_text: data.scene.script || '',
          prompt: data.scene.prompt || '',
          video_prompt: data.scene.prompt || '',
          image_prompt: data.scene.prompt || '',
          transition: data.scene.transition || 'fade',
        };
        updated.scenes = [...(updated.scenes || []), newScene];
        updated.duration = updated.scenes.reduce((sum, s) => sum + (s.duration || 5), 0);
        setStoryboard(updated);
        saveStoryboard(updated);
        setEditingScene(count - 1);
        showToast(`✅ AI generated Scene ${count}`);
      }
    } catch (error) {
      showToast(`❌ Error: ${error.message}`);
    } finally {
      setIsGeneratingScene(false);
    }
  };

  // Duplicate a scene
  const duplicateScene = (index) => {
    const updated = { ...storyboard };
    const source = updated.scenes[index];
    const duplicate = { ...source };
    updated.scenes = [...updated.scenes];
    updated.scenes.splice(index + 1, 0, duplicate);
    // Re-number all IDs
    updated.scenes = updated.scenes.map((s, i) => ({
      ...s,
      id: String(i + 1).padStart(2, '0'),
      scene_id: `scene-${String(i + 1).padStart(2, '0')}`,
    }));
    updated.duration = updated.scenes.reduce((sum, s) => sum + (s.duration || 5), 0);
    setStoryboard(updated);
    saveStoryboard(updated);
    showToast(`✅ Scene duplicated after #${index + 1}`);
  };

  // Delete a scene (with confirmation)
  const deleteScene = (index) => {
    if (!confirm(`Delete Scene ${index + 1}? This cannot be undone.`)) return;
    const updated = { ...storyboard };
    updated.scenes = updated.scenes.filter((_, i) => i !== index);
    updated.scenes = updated.scenes.map((s, i) => ({
      ...s,
      id: String(i + 1).padStart(2, '0'),
      scene_id: `scene-${String(i + 1).padStart(2, '0')}`,
    }));
    updated.duration = updated.scenes.reduce((sum, s) => sum + (s.duration || 5), 0);
    setStoryboard(updated);
    saveStoryboard(updated);
    setEditingScene(null);
    showToast(`🗑️ Scene ${index + 1} deleted`);
  };

  // Move scene up/down
  const moveScene = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= storyboard.scenes.length) return;
    const updated = { ...storyboard };
    const scenes = [...updated.scenes];
    [scenes[index], scenes[newIndex]] = [scenes[newIndex], scenes[index]];
    updated.scenes = scenes.map((s, i) => ({
      ...s,
      id: String(i + 1).padStart(2, '0'),
      scene_id: `scene-${String(i + 1).padStart(2, '0')}`,
    }));
    setStoryboard(updated);
    saveStoryboard(updated);
    setEditingScene(newIndex);
  };

  const saveStoryboard = async (boardToSave) => {
    // MUST have a board to save — no default from stale closure
    if (!boardToSave) {
      console.error('[Save] No storyboard data to save!');
      return;
    }
    // MUST have a project
    if (!activeProject) {
      console.error('[Save] No activeProject set — cannot save!');
      showToast('❌ No project selected');
      return;
    }

    console.log(`[Save] Saving storyboard for "${activeProject}" (${boardToSave.scenes?.length || 0} scenes)...`);
    setSaving(true);

    // Sanitize transitions and defaults before saving
    const sanitizedStoryboard = { ...boardToSave };
    if (sanitizedStoryboard.scenes) {
      sanitizedStoryboard.scenes = sanitizedStoryboard.scenes.map(s => ({
        ...s,
        duration: s.duration || 5,
        script: s.script || s.tts_text || "",
        prompt: s.prompt || s.video_prompt || s.image_prompt || "",
        transition: s.transition || 'fade'
      }));
    }

    try {
      const res = await fetch('/api/storyboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project: activeProject, storyboard: sanitizedStoryboard }),
      });
      const data = await res.json();
      if (data.success) {
        console.log(`[Save] ✅ Saved OK (${sanitizedStoryboard.scenes?.length} scenes)`);
        showToast('✅ Storyboard saved!');
      } else {
        console.error('[Save] ❌ Server error:', data.error);
        showToast('❌ Error: ' + (data.error || 'Unknown'));
      }
    } catch (e) {
      console.error('[Save] ❌ Network error:', e);
      showToast('❌ Network error');
    }
    setSaving(false);
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Auto-scroll log panel
  useEffect(() => {
    if (logEndRef.current) logEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // SSE generation helper
  const runGenerate = useCallback(async (payload, statusKey) => {
    setGenStatus(prev => ({ ...prev, [statusKey]: 'running' }));
    setShowLogPanel(true);
    setLogs(prev => [...prev, `\n--- ${payload.action.toUpperCase()} started ---`]);

    try {
      const res = await fetch('/api/storyboard/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // Parse SSE events from buffer
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const evt = JSON.parse(line.slice(6));
              if (evt.type === 'log') {
                setLogs(prev => [...prev, evt.data]);
              } else if (evt.type === 'complete') {
                setGenStatus(prev => ({ ...prev, [statusKey]: evt.data?.success ? 'done' : 'error' }));
                if (evt.data?.success) {
                  showToast(`✅ ${payload.action} complete!`);
                  // Fetch updated JSON and merge media into current state
                  if (activeProject) {
                    fetch(`/api/storyboard?project=${encodeURIComponent(activeProject)}&t=${Date.now()}`)
                      .then(r => r.json())
                      .then(data => {
                        if (data.storyboard) {
                          setStoryboard(current => {
                            if (!current) return current;
                            const updated = { ...current };
                            // Merge character_image if present
                            if (data.storyboard.character_image) {
                              updated.character_image = data.storyboard.character_image;
                            }
                            // Merge scene media URLs
                            if (data.storyboard.scenes && updated.scenes) {
                              updated.scenes = updated.scenes.map((scene, i) => {
                                const remoteScene = data.storyboard.scenes[i];
                                if (!remoteScene) return scene;
                                return {
                                  ...scene,
                                  image: remoteScene.image || scene.image,
                                  video: remoteScene.video || scene.video,
                                  audio: remoteScene.audio || scene.audio
                                };
                              });
                            }
                            return updated;
                          });
                        }
                      })
                      .catch(err => console.error('Failed to sync media:', err));
                  }
                } else {
                  showToast(`❌ ${payload.action} failed`);
                }
              } else if (evt.type === 'error') {
                setLogs(prev => [...prev, `❌ ERROR: ${evt.data}`]);
                setGenStatus(prev => ({ ...prev, [statusKey]: 'error' }));
              }
            } catch { /* skip malformed */ }
          }
        }
      }
    } catch (err) {
      setLogs(prev => [...prev, `❌ Network error: ${err.message}`]);
      setGenStatus(prev => ({ ...prev, [statusKey]: 'error' }));
    }
  }, [activeProject, loadProject]);

  // Per-scene generation actions
  const genImage = (index) => {
    if (!window.confirm(`Generate image for Scene ${index + 1}? This will use AI credits.`)) return;
    saveStoryboard(storyboard);
    const scene = storyboard.scenes[index];
    runGenerate({
      projectId: activeProject,
      action: 'image',
      sceneIndex: index,
      prompt: scene.image_prompt || scene.prompt || scene.video_prompt || '',
      seed: storyboard.character_seed,
    }, `${index}_image`);
  };

  const genVideo = (index) => {
    if (!window.confirm(`Generate video for Scene ${index + 1}? This may take 1-3 minutes and uses AI credits.`)) return;
    saveStoryboard(storyboard);
    const scene = storyboard.scenes[index];
    runGenerate({
      projectId: activeProject,
      action: 'video',
      sceneIndex: index,
      prompt: scene.video_prompt || scene.prompt || '',
      seed: storyboard.character_seed,
    }, `${index}_video`);
  };

  const genAudio = (index) => {
    if (!window.confirm(`Generate voice for Scene ${index + 1}?`)) return;
    saveStoryboard(storyboard);
    const scene = storyboard.scenes[index];
    runGenerate({
      projectId: activeProject,
      action: 'audio',
      sceneIndex: index,
      text: scene.tts_text || scene.script || '',
      voiceId: storyboard.voice_id || '',
      speed: 1.0,
    }, `${index}_audio`);
  };

  const genMix = () => {
    saveStoryboard(storyboard);
    runGenerate({
      projectId: activeProject,
      action: 'mix',
      fadeDuration: 1.0,
      bgmVolume: 0.1,
    }, 'mix');
  };

  const genBatch = () => {
    saveStoryboard(storyboard);
    runGenerate({
      projectId: activeProject,
      action: 'batch',
      voiceId: storyboard.voice_id || '',
      speed: 1.0,
      sleepBetween: 10000,
    }, 'batch');
  };

  const getStatusIcon = (key) => {
    const s = genStatus[key];
    if (s === 'running') return '⏳';
    if (s === 'done') return '✅';
    if (s === 'error') return '❌';
    return '';
  };

  // Project list view
  if (!activeProject) {
    return (
      <div className="sb-container">
        <div className="sb-header">
          <h1>🎬 Short Maker — Storyboard Editor</h1>
          <p className="sb-subtitle">Select a project to edit its storyboard</p>
        </div>
        {loading ? (
          <div className="sb-loading">Loading projects...</div>
        ) : projects.length === 0 ? (
          <div className="sb-empty">
            <p>No projects found in <code>short-maker-outputs/</code></p>
            <p className="sb-hint">Run <code>/short</code> or <code>/promo</code> to create a project first.</p>
          </div>
        ) : (
          <div className="sb-project-grid">
            {projects.map(p => (
              <button key={p.name} className="sb-project-card" onClick={() => loadProject(p.name)}>
                <div className="sb-project-name">{p.name}</div>
                <div className="sb-project-badges">
                  {p.hasStoryboard && <span className="sb-badge sb-badge-green">Storyboard</span>}
                  {p.hasCharacter && <span className="sb-badge sb-badge-purple">Character</span>}
                </div>
              </button>
            ))}
          </div>
        )}
        <style jsx>{styles}</style>
      </div>
    );
  }

  // Storyboard editor view
  const totalDuration = storyboard?.scenes?.reduce((s, sc) => s + sc.duration, 0) || 0;

  return (
    <div className="sb-container">
      {toast && <div className="sb-toast">{toast}</div>}

      <div className="sb-header">
        <div className="sb-header-top">
          <button className="sb-back-btn" onClick={() => { setActiveProject(null); setStoryboard(null); setLogs([]); setShowLogPanel(false); }}>
            ← Back
          </button>
          <div className="sb-header-actions">
            <button className="sb-gen-batch-btn" onClick={genBatch} disabled={genStatus.batch === 'running'}>
              {genStatus.batch === 'running' ? '⏳ Generating...' : '🚀 Generate Missing Assets'}
            </button>
            <button className="sb-mix-btn" onClick={genMix} disabled={genStatus.mix === 'running'}>
              {genStatus.mix === 'running' ? '⏳ Mixing...' : '🎬 Mix Final Video'}
            </button>
            <button className="sb-save-btn" onClick={() => saveStoryboard(storyboard)} disabled={saving}>
              {saving ? '⏳ Saving...' : '💾 Save'}
            </button>
            <button className="sb-log-toggle" onClick={() => setShowLogPanel(!showLogPanel)}>
              📋 {logs.length > 0 ? `Logs (${logs.length})` : 'Logs'}
            </button>
          </div>
        </div>
        <h1>{storyboard?.title || 'Untitled'}</h1>
        <p className="sb-meta">
          Total: {totalDuration}s &nbsp;|&nbsp; Format: {storyboard?.target_format || '16:9'}
          &nbsp;|&nbsp; Scenes: {storyboard?.scenes?.length || 0}
        </p>
      </div>

      {/* Character Reference Card — multi-step UX */}
      <div className="sb-character-card">
        {/* Left: Image Preview */}
        <div className="sb-character-img">
          {storyboard?.character_image ? (
            <img src={storyboard.character_image} alt="Character Reference" />
          ) : charPreviewUrl ? (
            <img src={charPreviewUrl} alt="Uploaded Preview" />
          ) : (
            <div className="sb-placeholder sb-char-placeholder">
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem' }}>🎭</div>
                <div style={{ fontSize: '0.7rem', marginTop: 8, color: '#777' }}>No Character</div>
              </div>
            </div>
          )}
        </div>

        {/* Hidden file input */}
        <input
          ref={charFileRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            // Create local preview URL
            const url = URL.createObjectURL(file);
            setCharPreviewUrl(url);
            setCharPreviewFile(file);
            setCharMode('uploaded');
            e.target.value = '';
          }}
        />

        {/* Right: Actions panel */}
        <div className="sb-character-body">
          <h3>🎭 Character Reference</h3>

          {/* Already has character image → show info + actions to change */}
          {storyboard?.character_image && !charMode ? (
            <>
              {storyboard?.character_prompt && (
                <p className="sb-char-info">📝 {storyboard.character_prompt}</p>
              )}
              <div className="sb-char-actions">
                <button className="sb-action-btn sb-action-upload" onClick={() => setCharMode('text2img')}>
                  🎨 Generate New
                </button>
                <button className="sb-action-btn sb-action-upload" onClick={() => charFileRef.current?.click()}>
                  📁 Upload New
                </button>
              </div>
            </>
          ) : !charMode ? (
            /* Initial state — no character yet */
            <>
              <p className="sb-char-hint">Choose how to set up your character reference:</p>
              <div className="sb-char-options">
                <button className="sb-char-option-btn sb-option-generate" onClick={() => setCharMode('text2img')}>
                  <span className="sb-option-icon">🎨</span>
                  <span className="sb-option-label">Generate from Text</span>
                  <span className="sb-option-desc">Describe your character and AI will create an image</span>
                </button>
                <button className="sb-char-option-btn sb-option-upload" onClick={() => charFileRef.current?.click()}>
                  <span className="sb-option-icon">📁</span>
                  <span className="sb-option-label">Upload Image</span>
                  <span className="sb-option-desc">Use an existing image as character reference</span>
                </button>
              </div>
            </>
          ) : charMode === 'text2img' ? (
            /* Text-to-Image mode */
            <>
              <div className="sb-edit-field">
                <label>Describe your character</label>
                <textarea
                  value={storyboard?.character_prompt || ''}
                  onChange={(e) => {
                    const updated = { ...storyboard, character_prompt: e.target.value };
                    setStoryboard(updated);
                    debouncedSave(updated);
                  }}
                  rows={3}
                  placeholder="A young female fitness coach with modern sports attire, confident expression, standing on green background..."
                  autoFocus
                />
              </div>
              <div className="sb-char-actions">
                <button
                  className={`sb-action-btn sb-action-char ${genStatus.character === 'running' ? 'sb-running' : ''}`}
                  onClick={() => {
                    saveStoryboard(storyboard);
                    runGenerate({
                      projectId: activeProject,
                      action: 'character',
                      prompt: storyboard?.character_prompt || '',
                    }, 'character');
                  }}
                  disabled={genStatus.character === 'running' || !storyboard?.character_prompt}
                >
                  {genStatus.character === 'running' ? '⏳ Generating...' : '🎨 Generate Character'}
                </button>
                <button className="sb-action-btn sb-action-cancel" onClick={() => setCharMode(null)}>
                  Cancel
                </button>
              </div>
            </>
          ) : charMode === 'uploaded' ? (
            /* Uploaded image — choose how to use it */
            <>
              <p className="sb-char-hint">Image selected! Choose what to do:</p>
              <div className="sb-char-options">
                <button className="sb-char-option-btn sb-option-use" onClick={async () => {
                  if (!charPreviewFile || !activeProject) return;
                  showToast('⏳ Uploading...');
                  const formData = new FormData();
                  formData.append('project', activeProject);
                  formData.append('targetName', 'character_ref.png');
                  formData.append('file', charPreviewFile);
                  try {
                    const res = await fetch('/api/storyboard/media', { method: 'POST', body: formData });
                    const data = await res.json();
                    if (data.success) {
                      setStoryboard(prev => ({ ...prev, character_image: data.imageUrl }));
                      showToast('✅ Character image set!');
                    } else {
                      showToast('❌ Upload failed');
                    }
                  } catch (err) {
                    showToast('❌ Error: ' + err.message);
                  }
                  setCharMode(null);
                  setCharPreviewUrl(null);
                  setCharPreviewFile(null);
                }}>
                  <span className="sb-option-icon">✅</span>
                  <span className="sb-option-label">Use as Reference</span>
                  <span className="sb-option-desc">Use this image directly as the character for all scenes</span>
                </button>
                <button className="sb-char-option-btn sb-option-generate" onClick={() => {
                  setCharMode('generate-from-ref');
                }}>
                  <span className="sb-option-icon">🎨</span>
                  <span className="sb-option-label">Generate from This</span>
                  <span className="sb-option-desc">Use this image as a reference to generate a new character</span>
                </button>
              </div>
              <button className="sb-action-btn sb-action-cancel" onClick={() => { setCharMode(null); setCharPreviewUrl(null); setCharPreviewFile(null); }}>
                Cancel
              </button>
            </>
          ) : charMode === 'generate-from-ref' ? (
            /* Generate from uploaded reference */
            <>
              <div className="sb-edit-field">
                <label>Describe the character to generate (based on uploaded reference)</label>
                <textarea
                  value={storyboard?.character_prompt || ''}
                  onChange={(e) => {
                    const updated = { ...storyboard, character_prompt: e.target.value };
                    setStoryboard(updated);
                    debouncedSave(updated);
                  }}
                  rows={3}
                  placeholder="Generate a character based on the uploaded reference photo, in cinematic style..."
                  autoFocus
                />
              </div>
              <div className="sb-char-actions">
                <button
                  className={`sb-action-btn sb-action-char ${genStatus.character === 'running' ? 'sb-running' : ''}`}
                  onClick={async () => {
                    // First upload the reference, then generate with prompt
                    if (charPreviewFile && activeProject) {
                      const formData = new FormData();
                      formData.append('project', activeProject);
                      formData.append('targetName', 'character_ref_source.png');
                      formData.append('file', charPreviewFile);
                      await fetch('/api/storyboard/media', { method: 'POST', body: formData });
                    }
                    saveStoryboard(storyboard);
                    runGenerate({
                      projectId: activeProject,
                      action: 'character',
                      prompt: storyboard?.character_prompt || '',
                      referenceImage: 'character_ref_source.png',
                    }, 'character');
                    setCharPreviewUrl(null);
                    setCharPreviewFile(null);
                  }}
                  disabled={genStatus.character === 'running' || !storyboard?.character_prompt}
                >
                  {genStatus.character === 'running' ? '⏳ Generating...' : '🎨 Generate from Reference'}
                </button>
                <button className="sb-action-btn sb-action-cancel" onClick={() => { setCharMode('uploaded'); }}>
                  Back
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>

      {/* Project Settings — Background */}
      <div className="sb-project-settings">
        <div className="sb-settings-header" onClick={toggleSettings}>
          <h3>⚙️ Project Settings</h3>
          <span className="sb-settings-toggle">{isSettingsExpanded ? '▼' : '▶'}</span>
        </div>
        
        {isSettingsExpanded && (
          <div className="sb-settings-content">
            <div className="sb-settings-row">
              <label>🎨 Background Mode</label>
          <select
            value={storyboard?.bg_mode || 'per-scene'}
            onChange={(e) => {
              const updated = { ...storyboard, bg_mode: e.target.value };
              if (e.target.value === 'per-scene') {
                updated.bg_value = '';
              }
              setStoryboard(updated);
              debouncedSave(updated);
            }}
          >
            <option value="per-scene">Per Scene (default)</option>
            <option value="unified">Unified Background</option>
          </select>
        </div>
        {storyboard?.bg_mode === 'unified' && (
          <>
            <div className="sb-settings-row">
              <label>Background Preset</label>
              <select
                value={storyboard?.bg_preset || 'custom'}
                onChange={(e) => {
                  const presets = {
                    'green-screen': 'Solid chroma green screen background (#00FF00). Clean, evenly lit, no shadows.',
                    'white-studio': 'Clean white studio background. Soft, even lighting. Professional product-shoot style.',
                    'black-studio': 'Solid black background. Dramatic lighting on subject.',
                    'gradient-blue': 'Smooth gradient background from dark navy blue to light sky blue.',
                    'gradient-sunset': 'Warm gradient background from orange to pink to purple, sunset tones.',
                    'gym': 'Modern gym interior background. Equipment visible, natural lighting.',
                    'outdoor-park': 'Beautiful outdoor park background. Green trees, natural sunlight, bokeh.',
                    'urban': 'Urban city street background. Modern buildings, warm lighting.',
                    'custom': '',
                  };
                  const val = presets[e.target.value] || '';
                  const updated = { ...storyboard, bg_preset: e.target.value, bg_value: val };
                  setStoryboard(updated);
                  debouncedSave(updated);
                }}
              >
                <option value="green-screen">🟢 Chroma Green Screen</option>
                <option value="white-studio">⬜ White Studio</option>
                <option value="black-studio">⬛ Black Studio</option>
                <option value="gradient-blue">🔵 Gradient Blue</option>
                <option value="gradient-sunset">🌅 Gradient Sunset</option>
                <option value="gym">🏋️ Gym Interior</option>
                <option value="outdoor-park">🌳 Outdoor Park</option>
                <option value="urban">🏙️ Urban City</option>
                <option value="custom">✏️ Custom...</option>
              </select>
            </div>
            <div className="sb-settings-row">
              <label>Background Description</label>
              <textarea
                value={storyboard?.bg_value || ''}
                onChange={(e) => {
                  const updated = { ...storyboard, bg_value: e.target.value };
                  setStoryboard(updated);
                  debouncedSave(updated);
                }}
                rows={2}
                placeholder="Describe the background for all scenes..."
              />
            </div>
          </>
        )}

        {/* Speech Language for Video */}
        <div style={{ borderTop: '1px solid #333', marginTop: '12px', paddingTop: '12px' }}>
          <div className="sb-settings-row">
            <label>🗣️ Speech Language</label>
            <select
              value={storyboard?.speech_language || 'en'}
              onChange={(e) => {
                const updated = { ...storyboard, speech_language: e.target.value };
                setStoryboard(updated);
                debouncedSave(updated);
              }}
            >
              <option value="en">🇺🇸 English</option>
              <option value="vi">🇻🇳 Tiếng Việt</option>
              <option value="ja">🇯🇵 日本語</option>
              <option value="ko">🇰🇷 한국어</option>
              <option value="zh">🇨🇳 中文</option>
              <option value="es">🇪🇸 Español</option>
              <option value="fr">🇫🇷 Français</option>
              <option value="de">🇩🇪 Deutsch</option>
              <option value="pt">🇧🇷 Português</option>
              <option value="none">🔇 No Speech</option>
            </select>
          </div>
        </div>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="sb-timeline">
        {storyboard?.scenes?.map((scene, i) => (
          <div key={scene.id} className="sb-timeline-segment" style={{ flex: scene.duration }}>
            <div className="sb-timeline-bar" />
            <span className="sb-timeline-label">{scene.id}</span>
          </div>
        ))}
      </div>

      {/* Scene Grid */}
      <div className="sb-grid">
        {storyboard?.scenes?.map((scene, index) => {
          const isEditing = editingScene === index;
          return (
          <div key={`${scene.id}-${index}`} className={`sb-card ${isEditing ? 'sb-card-editing' : ''}`}>
            <div className="sb-card-img">
              {scene.video ? (
                <video
                  src={scene.video}
                  poster={scene.image || undefined}
                  controls
                  loop
                  playsInline
                />
              ) : scene.image ? (
                <img src={scene.image} alt={`Scene ${scene.id}`} />
              ) : (
                <div className="sb-placeholder">🎬 Scene {scene.id}</div>
              )}
              <div className="sb-scene-badge">Scene {scene.id}</div>
              {/* Scene management buttons */}
              <div className="sb-scene-controls">
                <button onClick={() => setEditingScene(isEditing ? null : index)} title={isEditing ? 'Close' : 'Edit'}>
                  {isEditing ? '✕' : '✏️'}
                </button>
                <button onClick={() => duplicateScene(index)} title="Duplicate">📋</button>
                <button onClick={() => moveScene(index, -1)} title="Move Up" disabled={index === 0}>↑</button>
                <button onClick={() => moveScene(index, 1)} title="Move Down" disabled={index === storyboard.scenes.length - 1}>↓</button>
                <button onClick={() => deleteScene(index)} title="Delete" className="sb-scene-delete">🗑️</button>
              </div>
            </div>
            <div className="sb-card-body">
              {/* Duration */}
              <div className="sb-field-row">
                <label>⏱️ Duration</label>
                <div className="sb-duration-control">
                  <button onClick={() => updateDuration(index, (scene.duration || 5) - 1)}>−</button>
                  <span>{scene.duration || 5}s</span>
                  <button onClick={() => updateDuration(index, (scene.duration || 5) + 1)}>+</button>
                </div>
              </div>

              {/* Script — editable when editing */}
              {isEditing ? (
                <div className="sb-edit-field">
                  <label>🎙️ Script (TTS text)</label>
                  <textarea
                    value={scene.script || scene.tts_text || ''}
                    onChange={(e) => {
                      updateSceneField(index, 'script', e.target.value);
                      updateSceneField(index, 'tts_text', e.target.value);
                    }}
                    rows={3}
                    placeholder="Enter the voiceover script for this scene..."
                  />
                </div>
              ) : (
                <div className="sb-script">🎙️ &ldquo;{scene.script || scene.tts_text || 'No script'}&rdquo;</div>
              )}

              {/* Image Prompt — collapsible in view, editable when editing */}
              {isEditing ? (
                <div className="sb-edit-field">
                  <label>🖼️ Image Prompt</label>
                  <textarea
                    value={scene.image_prompt || scene.prompt || ''}
                    onChange={(e) => updateSceneField(index, 'image_prompt', e.target.value)}
                    rows={2}
                    placeholder="Describe the image to generate..."
                  />
                </div>
              ) : (scene.image_prompt || scene.prompt) ? (
                <details className="sb-prompt-collapse">
                  <summary>🖼️ Image Prompt</summary>
                  <div className="sb-prompt">{scene.image_prompt || scene.prompt}</div>
                </details>
              ) : null}

              {/* Video Prompt — always visible, editable when editing */}
              {isEditing ? (
                <div className="sb-edit-field">
                  <label>🎬 Video Prompt</label>
                  <textarea
                    value={scene.video_prompt || scene.prompt || ''}
                    onChange={(e) => updateSceneField(index, 'video_prompt', e.target.value)}
                    rows={2}
                    placeholder="Describe the video to generate..."
                  />
                </div>
              ) : (
                <div className="sb-prompt sb-prompt-video">🎬 {scene.video_prompt || scene.prompt || scene.image_prompt || 'No prompt'}</div>
              )}

              {/* Transition */}
              {index < (storyboard?.scenes?.length || 0) - 1 && (
                <div className="sb-field-row sb-transition-row">
                  <label>🔀 Transition →</label>
                  <select
                    value={scene.transition || 'fade'}
                    onChange={(e) => updateTransition(index, e.target.value)}
                  >
                    {TRANSITIONS.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Generation Actions */}
              <div className="sb-actions">
                <button
                  className={`sb-action-btn sb-action-img ${genStatus[`${index}_image`] === 'running' ? 'sb-running' : ''}`}
                  onClick={() => genImage(index)}
                  disabled={genStatus[`${index}_image`] === 'running'}
                  title="Generate Image"
                >
                  {getStatusIcon(`${index}_image`)} 🖼️ Image
                </button>
                <button
                  className={`sb-action-btn sb-action-vid ${genStatus[`${index}_video`] === 'running' ? 'sb-running' : ''}`}
                  onClick={() => genVideo(index)}
                  disabled={genStatus[`${index}_video`] === 'running'}
                  title="Generate Video (1-3 min)"
                >
                  {getStatusIcon(`${index}_video`)} 🎬 Video
                </button>
                <button
                  className={`sb-action-btn sb-action-aud ${genStatus[`${index}_audio`] === 'running' ? 'sb-running' : ''}`}
                  onClick={() => genAudio(index)}
                  disabled={genStatus[`${index}_audio`] === 'running'}
                  title="Generate Voice"
                >
                  {getStatusIcon(`${index}_audio`)} 🎤 Voice
                </button>
              </div>
            </div>
          </div>
          );
        })}
        {/* Add Scene Button */}
        <button className="sb-add-scene-card" onClick={addScene}>
          <div className="sb-add-icon">＋</div>
          <div className="sb-add-label">Add Scene</div>
        </button>

        {/* AI Generate Scene Button */}
        <button className={`sb-add-scene-card sb-ai-scene-card ${isGeneratingScene ? 'sb-running' : ''}`} onClick={addAiScene} disabled={isGeneratingScene}>
          <div className="sb-add-icon">{isGeneratingScene ? '⏳' : '✨'}</div>
          <div className="sb-add-label">{isGeneratingScene ? 'Thinking...' : 'AI Gen Next Scene'}</div>
        </button>
      </div>

      {/* Log Panel */}
      {showLogPanel && (
        <div className="sb-log-panel">
          <div className="sb-log-header">
            <span>📋 Generation Logs</span>
            <div>
              <button className="sb-log-clear" onClick={() => setLogs([])}>Clear</button>
              <button className="sb-log-close" onClick={() => setShowLogPanel(false)}>✕</button>
            </div>
          </div>
          <div className="sb-log-body">
            {logs.map((line, i) => <div key={i} className="sb-log-line">{line}</div>)}
            <div ref={logEndRef} />
          </div>
        </div>
      )}

      <style jsx>{styles}</style>
    </div>
  );
}

const styles = `
  .sb-container {
    font-family: 'Inter', -apple-system, sans-serif;
    background: #0a0a0f;
    color: #e0e0e0;
    min-height: 100vh;
    padding: 24px;
    max-width: 1400px;
    margin: 0 auto;
  }
  .sb-header { margin-bottom: 24px; }
  .sb-header h1 {
    font-size: 1.8rem;
    font-weight: 800;
    background: linear-gradient(135deg, #bb86fc, #6c63ff);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin: 0 0 4px;
  }
  .sb-subtitle { color: #888; font-size: 0.95rem; }
  .sb-meta { color: #888; font-size: 0.85rem; margin-top: 4px; }
  .sb-header-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }
  .sb-back-btn {
    background: #1e1e2e;
    border: 1px solid #333;
    color: #ccc;
    padding: 8px 16px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.2s;
  }
  .sb-back-btn:hover { background: #2a2a3e; border-color: #555; }
  .sb-save-btn {
    background: linear-gradient(135deg, #6c63ff, #bb86fc);
    border: none;
    color: #fff;
    padding: 10px 24px;
    border-radius: 10px;
    cursor: pointer;
    font-size: 0.95rem;
    font-weight: 600;
    transition: all 0.2s;
    box-shadow: 0 4px 15px rgba(108, 99, 255, 0.3);
  }
  .sb-save-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(108, 99, 255, 0.4); }
  .sb-save-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

  .sb-loading { text-align: center; color: #888; padding: 60px 0; font-size: 1.1rem; }
  .sb-empty { text-align: center; color: #666; padding: 60px 0; }
  .sb-empty code { background: #1e1e2e; padding: 2px 8px; border-radius: 4px; color: #bb86fc; }
  .sb-hint { margin-top: 12px; font-size: 0.85rem; }

  .sb-project-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 16px;
  }
  .sb-project-card {
    background: #1a1a2e;
    border: 1px solid #2a2a3e;
    border-radius: 12px;
    padding: 20px;
    cursor: pointer;
    text-align: left;
    transition: all 0.2s;
    color: #e0e0e0;
  }
  .sb-project-card:hover { border-color: #6c63ff; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.4); }
  .sb-project-name { font-weight: 700; font-size: 1.05rem; margin-bottom: 8px; }
  .sb-project-badges { display: flex; gap: 6px; flex-wrap: wrap; }

  .sb-badge {
    font-size: 0.7rem;
    padding: 3px 8px;
    border-radius: 20px;
    font-weight: 600;
  }
  .sb-badge-green { background: rgba(0, 200, 83, 0.15); color: #00c853; }
  .sb-badge-purple { background: rgba(187, 134, 252, 0.15); color: #bb86fc; }

  .sb-character-card {
    display: flex;
    gap: 20px;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    border: 1px solid #bb86fc33;
    border-radius: 16px;
    padding: 20px;
    margin-bottom: 24px;
  }
  .sb-character-img {
    flex-shrink: 0;
    width: 180px;
    height: 240px;
    border-radius: 12px;
    overflow: hidden;
    background: #0d0d1a;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .sb-character-img img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .sb-char-placeholder {
    font-size: 2rem;
    color: #555;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .sb-character-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .sb-character-body h3 {
    margin: 0;
    font-size: 1.1rem;
    color: #bb86fc;
  }
  .sb-action-char {
    background: linear-gradient(135deg, #7c4dff 0%, #bb86fc 100%);
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    font-size: 0.9rem;
    transition: all 0.2s;
    align-self: flex-start;
  }
  .sb-action-char:hover:not(:disabled) { filter: brightness(1.15); transform: translateY(-1px); }
  .sb-action-char:disabled { opacity: 0.5; cursor: not-allowed; }
  .sb-char-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }
  .sb-action-upload {
    background: linear-gradient(135deg, #2d3436 0%, #636e72 100%);
    color: white;
    border: 1px solid #636e72;
    padding: 10px 20px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    font-size: 0.9rem;
    transition: all 0.2s;
  }
  .sb-action-upload:hover { filter: brightness(1.2); transform: translateY(-1px); }
  .sb-action-cancel {
    background: transparent;
    color: #888;
    border: 1px solid #444;
    padding: 10px 20px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.85rem;
    transition: all 0.2s;
  }
  .sb-action-cancel:hover { color: #fff; border-color: #888; }
  .sb-char-hint { color: #999; font-size: 0.85rem; margin: 0; }
  .sb-char-info { color: #aaa; font-size: 0.85rem; font-style: italic; margin: 0; line-height: 1.5; }
  .sb-char-options {
    display: flex;
    gap: 12px;
  }
  .sb-char-option-btn {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 16px 12px;
    border-radius: 12px;
    border: 1px solid #333;
    background: #1a1a2e;
    cursor: pointer;
    transition: all 0.2s;
    text-align: center;
  }
  .sb-char-option-btn:hover {
    border-color: #bb86fc;
    background: #1e1e3a;
    transform: translateY(-2px);
  }
  .sb-option-icon { font-size: 1.8rem; }
  .sb-option-label { font-weight: 600; color: #eee; font-size: 0.9rem; }
  .sb-option-desc { color: #777; font-size: 0.72rem; line-height: 1.3; }
  .sb-option-generate:hover { border-color: #bb86fc; }
  .sb-option-upload:hover { border-color: #636e72; }
  .sb-option-use:hover { border-color: #00c853; }
  .sb-project-settings {
    background: #16162a;
    border: 1px solid #2a2a44;
    border-radius: 14px;
    padding: 20px;
    margin-bottom: 0;
  }
  .sb-settings-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    user-select: none;
  }
  .sb-settings-header:hover h3 { filter: brightness(1.2); }
  .sb-settings-header h3 { color: #bb86fc; margin: 0; font-size: 1rem; transition: all 0.2s; }
  .sb-settings-toggle { color: #bb86fc; font-size: 0.9rem; }
  .sb-settings-content {
    margin-top: 16px;
    animation: fadeIn 0.3s ease;
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-4px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .sb-settings-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
  }
  .sb-settings-row label {
    min-width: 140px;
    color: #aaa;
    font-size: 0.85rem;
    font-weight: 500;
  }
  .sb-settings-row select, .sb-settings-row textarea {
    flex: 1;
    background: #1a1a2e;
    color: #eee;
    border: 1px solid #333;
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 0.85rem;
  }
  .sb-settings-row select:focus, .sb-settings-row textarea:focus {
    border-color: #bb86fc;
    outline: none;
  }
  .sb-settings-row textarea { resize: vertical; }
  .sb-character-img:hover { border: 2px dashed #bb86fc55; }

  .sb-timeline {
    display: flex;
    gap: 2px;
    margin-bottom: 24px;
    height: 28px;
    align-items: center;
  }
  .sb-timeline-segment {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .sb-timeline-bar {
    height: 6px;
    width: 100%;
    background: linear-gradient(90deg, #6c63ff, #bb86fc);
    border-radius: 3px;
  }
  .sb-timeline-label {
    position: absolute;
    font-size: 0.65rem;
    color: #888;
    top: 12px;
  }

  .sb-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
    gap: 20px;
  }
  .sb-card {
    background: #1a1a2e;
    border: 1px solid #2a2a3e;
    border-radius: 12px;
    overflow: hidden;
    transition: all 0.2s;
  }
  .sb-card:hover { border-color: #3a3a5e; }
  .sb-card-img {
    position: relative;
    padding-top: 56.25%;
    background: #111;
  }
  .sb-card-img img,
  .sb-card-img video {
    position: absolute;
    top: 0; left: 0;
    width: 100%; height: 100%;
    object-fit: cover;
    border-radius: 8px 8px 0 0;
  }
  .sb-placeholder {
    position: absolute;
    top: 0; left: 0;
    width: 100%; height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.4rem;
    color: #444;
    background: linear-gradient(135deg, #111118, #1a1a28);
  }
  .sb-scene-badge {
    position: absolute;
    top: 10px; left: 10px;
    background: rgba(0,0,0,0.7);
    backdrop-filter: blur(4px);
    color: #fff;
    padding: 4px 10px;
    border-radius: 6px;
    font-weight: 700;
    font-size: 0.75rem;
  }
  .sb-card-body { padding: 16px; }
  .sb-field-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
  }
  .sb-field-row label {
    font-size: 0.8rem;
    color: #aaa;
    font-weight: 600;
  }
  .sb-duration-control {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .sb-duration-control button {
    width: 28px; height: 28px;
    border-radius: 6px;
    border: 1px solid #333;
    background: #1e1e2e;
    color: #ccc;
    cursor: pointer;
    font-size: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
  }
  .sb-duration-control button:hover { background: #2a2a3e; border-color: #6c63ff; }
  .sb-duration-control span { color: #bb86fc; font-weight: 700; font-size: 0.95rem; min-width: 30px; text-align: center; }

  .sb-script {
    font-size: 0.95rem;
    line-height: 1.4;
    margin-bottom: 10px;
  }
  .sb-prompt {
    font-size: 0.8rem;
    color: #888;
    font-style: italic;
    background: #12121e;
    padding: 8px 10px;
    border-radius: 6px;
    margin-bottom: 10px;
    line-height: 1.4;
  }
  .sb-prompt-video {
    color: #a0a0cc;
    border-left: 3px solid #6c5ce7;
  }
  .sb-prompt-collapse {
    margin-bottom: 8px;
  }
  .sb-prompt-collapse summary {
    font-size: 0.78rem;
    color: #666;
    cursor: pointer;
    padding: 4px 0;
    user-select: none;
  }
  .sb-prompt-collapse summary:hover {
    color: #999;
  }
  .sb-prompt-collapse .sb-prompt {
    margin-top: 4px;
    margin-bottom: 0;
  }
  .sb-transition-row {
    background: #12121e;
    padding: 8px 12px;
    border-radius: 8px;
    margin-top: 4px;
  }
  .sb-transition-row select {
    background: #1e1e2e;
    border: 1px solid #333;
    color: #e0e0e0;
    padding: 6px 10px;
    border-radius: 6px;
    font-size: 0.85rem;
    cursor: pointer;
  }
  .sb-transition-row select:focus { outline: none; border-color: #6c63ff; }

  .sb-toast {
    position: fixed;
    top: 20px; right: 20px;
    background: #1a1a2e;
    border: 1px solid #6c63ff;
    color: #e0e0e0;
    padding: 12px 20px;
    border-radius: 10px;
    font-size: 0.9rem;
    font-weight: 600;
    z-index: 1000;
    box-shadow: 0 8px 24px rgba(0,0,0,0.5);
    animation: slideIn 0.3s ease;
  }
  @keyframes slideIn {
    from { transform: translateX(100px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }

  .sb-header-actions {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
  }
  .sb-gen-batch-btn, .sb-mix-btn {
    border: none;
    color: #fff;
    padding: 8px 16px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.85rem;
    font-weight: 600;
    transition: all 0.2s;
  }
  .sb-gen-batch-btn { background: linear-gradient(135deg, #00c853, #00bfa5); box-shadow: 0 4px 12px rgba(0, 200, 83, 0.25); }
  .sb-gen-batch-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(0, 200, 83, 0.35); }
  .sb-mix-btn { background: linear-gradient(135deg, #ff6d00, #ff9100); box-shadow: 0 4px 12px rgba(255, 109, 0, 0.25); }
  .sb-mix-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(255, 109, 0, 0.35); }
  .sb-gen-batch-btn:disabled, .sb-mix-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
  .sb-log-toggle {
    background: #1e1e2e;
    border: 1px solid #333;
    color: #ccc;
    padding: 8px 14px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.85rem;
    transition: all 0.2s;
  }
  .sb-log-toggle:hover { background: #2a2a3e; border-color: #6c63ff; }

  .sb-actions {
    display: flex;
    gap: 6px;
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px solid #222;
  }
  .sb-action-btn {
    flex: 1;
    padding: 7px 4px;
    border: 1px solid #333;
    border-radius: 8px;
    background: #12121e;
    color: #ccc;
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    text-align: center;
    white-space: nowrap;
  }
  .sb-action-btn:hover { background: #1e1e2e; border-color: #555; }
  .sb-action-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .sb-action-img:hover { border-color: #6c63ff; color: #bb86fc; }
  .sb-action-vid:hover { border-color: #ff6d00; color: #ff9100; }
  .sb-action-aud:hover { border-color: #00c853; color: #00e676; }
  .sb-running { animation: pulse 1.5s ease-in-out infinite; }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  .sb-log-panel {
    position: fixed;
    bottom: 0; right: 0;
    width: 520px;
    max-height: 360px;
    background: #111118;
    border: 1px solid #333;
    border-radius: 12px 0 0 0;
    z-index: 999;
    display: flex;
    flex-direction: column;
    box-shadow: -4px -4px 24px rgba(0,0,0,0.5);
  }
  .sb-log-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 14px;
    border-bottom: 1px solid #222;
    font-weight: 700;
    font-size: 0.85rem;
    color: #bb86fc;
  }
  .sb-log-header div { display: flex; gap: 8px; }
  .sb-log-clear, .sb-log-close {
    background: transparent;
    border: 1px solid #333;
    color: #888;
    padding: 3px 10px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.75rem;
    transition: all 0.15s;
  }
  .sb-log-clear:hover, .sb-log-close:hover { background: #1e1e2e; color: #ccc; }
  .sb-log-body {
    flex: 1;
    overflow-y: auto;
    padding: 8px 14px;
    font-family: 'SF Mono', 'Fira Code', monospace;
    font-size: 0.75rem;
    line-height: 1.6;
    color: #aaa;
  }
  .sb-log-line {
    white-space: pre-wrap;
    word-break: break-all;
  }

  /* Scene management controls */
  .sb-scene-controls {
    position: absolute;
    top: 8px; right: 8px;
    display: flex;
    gap: 4px;
    opacity: 0;
    transition: opacity 0.2s;
  }
  .sb-card:hover .sb-scene-controls { opacity: 1; }
  .sb-card-editing .sb-scene-controls { opacity: 1; }
  .sb-scene-controls button {
    width: 28px; height: 28px;
    border-radius: 6px;
    border: none;
    background: rgba(0,0,0,0.6);
    backdrop-filter: blur(4px);
    color: #fff;
    font-size: 0.8rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
  }
  .sb-scene-controls button:hover { background: rgba(108,99,255,0.7); }
  .sb-scene-controls button:disabled { opacity: 0.3; cursor: not-allowed; }
  .sb-scene-delete:hover { background: rgba(255,68,68,0.7) !important; }

  /* Editing state */
  .sb-card-editing { border-color: #6c63ff !important; box-shadow: 0 0 20px rgba(108,99,255,0.15); }

  /* Editable fields */
  .sb-edit-field {
    margin-bottom: 10px;
  }
  .sb-edit-field label {
    display: block;
    font-size: 0.75rem;
    color: #aaa;
    font-weight: 600;
    margin-bottom: 4px;
  }
  .sb-edit-field textarea {
    width: 100%;
    background: #12121e;
    border: 1px solid #333;
    border-radius: 6px;
    color: #e0e0e0;
    padding: 8px 10px;
    font-size: 0.85rem;
    font-family: inherit;
    line-height: 1.4;
    resize: vertical;
    transition: border-color 0.2s;
    box-sizing: border-box;
  }
  .sb-edit-field textarea:focus {
    outline: none;
    border-color: #6c63ff;
  }

  /* Add Scene card */
  .sb-add-scene-card {
    background: transparent;
    border: 2px dashed #333;
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 200px;
    color: #888;
    cursor: pointer;
    transition: all 0.2s;
  }
  .sb-add-scene-card:hover {
    border-color: #6c63ff;
    color: #6c63ff;
    background: rgba(108, 99, 255, 0.05);
  }
  .sb-ai-scene-card {
    border-color: #4a3e8e;
    color: #bb86fc;
  }
  .sb-ai-scene-card:hover {
    border-color: #bb86fc;
    color: #fff;
    background: rgba(187, 134, 252, 0.15);
  }
  .sb-add-icon { font-size: 2rem; margin-bottom: 8px; }
  .sb-add-label { font-size: 0.9rem; font-weight: 600; }
`;
