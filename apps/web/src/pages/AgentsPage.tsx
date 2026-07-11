import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createAgent, deleteAgent, generateAgentApiKey, getAgentMcps, getAgentSkills, getAgentTools, getAgentUsers, linkAgentMcps, linkAgentSkills, linkAgentTools, linkAgentUsers, listAgents, listMcps, listModels, listRagDataStores, listSkills, listTools, listUsers, revokeAgentApiKey, unlinkAgentMcp, unlinkAgentSkill, unlinkAgentTool, unlinkAgentUser, updateAgent } from "../api";
import { loadSession } from "../auth";
import type { Agent, Mcp, ModelInfo, RagDataStore, Skill, Tool, User } from "../types";

export function AgentsPage() {
  const session = loadSession();
  const navigate = useNavigate();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  const [showFormModal, setShowFormModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [formName, setFormName] = useState("");
  const [formPrompt, setFormPrompt] = useState("");
  const [formHasRag, setFormHasRag] = useState(false);
  const [formRagStoreId, setFormRagStoreId] = useState("");
  const [formGuardrailEnabled, setFormGuardrailEnabled] = useState(false);
  const [formGuardrailRules, setFormGuardrailRules] = useState("");
  const [formTracingEnabled, setFormTracingEnabled] = useState(false);
  const [formTracingUrl, setFormTracingUrl] = useState("");
  const [formTracingAigatewayId, setFormTracingAigatewayId] = useState("");
  const [formHasSemanticCache, setFormHasSemanticCache] = useState(false);
  const [formModel, setFormModel] = useState("gpt-4.1-mini");
  const [formTemperature, setFormTemperature] = useState(0.2);
  const [ragDataStores, setRagDataStores] = useState<RagDataStore[]>([]);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [toolsModalAgent, setToolsModalAgent] = useState<Agent | null>(null);
  const [allTools, setAllTools] = useState<Tool[]>([]);
  const [linkedToolIds, setLinkedToolIds] = useState<Set<string>>(new Set());
  const [savingTools, setSavingTools] = useState(false);

  const [mcpsModalAgent, setMcpsModalAgent] = useState<Agent | null>(null);
  const [allMcps, setAllMcps] = useState<Mcp[]>([]);
  const [linkedMcpIds, setLinkedMcpIds] = useState<Set<string>>(new Set());
  const [savingMcps, setSavingMcps] = useState(false);

  const [usersModalAgent, setUsersModalAgent] = useState<Agent | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [linkedUserIds, setLinkedUserIds] = useState<Set<string>>(new Set());
  const [savingUsers, setSavingUsers] = useState(false);

  const [skillsModalAgent, setSkillsModalAgent] = useState<Agent | null>(null);
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [linkedSkillIds, setLinkedSkillIds] = useState<Set<string>>(new Set());
  const [savingSkills, setSavingSkills] = useState(false);

  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const [apiKeyModalAgent, setApiKeyModalAgent] = useState<Agent | null>(null);
  const [apiKeyValue, setApiKeyValue] = useState<string | null>(null);
  const [generatingKey, setGeneratingKey] = useState(false);
  const [copied, setCopied] = useState(false);

  async function loadAgents() {
    if (!session?.token) return;
    try {
      const { agents } = await listAgents(session.token);
      setAgents(agents);
    } catch { }
    finally { setLoading(false); }
  }

  useEffect(() => { loadAgents(); }, []);

  useEffect(() => {
    function handleClickOutside() {
      setOpenDropdownId(null);
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  function toggleDropdown(id: string) {
    setOpenDropdownId((prev) => (prev === id ? null : id));
  }

  async function openCreateModal() {
    setEditingAgent(null);
    setFormName("");
    setFormPrompt("");
    setFormHasRag(false);
    setFormRagStoreId("");
    setFormGuardrailEnabled(false);
    setFormGuardrailRules("");
    setFormTracingEnabled(false);
    setFormTracingUrl("");
    setFormTracingAigatewayId("");
    setFormHasSemanticCache(false);
    setFormModel("gpt-4.1-mini");
    setFormTemperature(0.2);
    setRagDataStores([]);
    setModels([]);
    setShowFormModal(true);
    setSubmitting(false);
    if (session?.token) {
      try {
        const [ragResult, modelsResult] = await Promise.all([
          listRagDataStores(session.token),
          listModels(session.token),
        ]);
        setRagDataStores(ragResult.ragDataStores);
        setModels(modelsResult);
      } catch {}
    }
  }

  async function openEditModal(agent: Agent) {
    setEditingAgent(agent);
    setFormName(agent.name);
    setFormPrompt(agent.systemPrompt);
    setFormHasRag(agent.hasRagEnabled);
    setFormRagStoreId(agent.ragDataStoreId ?? "");
    setFormGuardrailEnabled(agent.guardrailEnabled);
    setFormGuardrailRules(agent.guardrailRules ?? "");
    setFormTracingEnabled(agent.tracingEnabled);
    setFormTracingUrl(agent.tracingUrl ?? "");
    setFormTracingAigatewayId(agent.tracingAigatewayId ?? "");
    setFormHasSemanticCache(agent.hasSemanticCache);
    setFormModel(agent.model);
    setFormTemperature(agent.temperature);
    setRagDataStores([]);
    setModels([]);
    setShowFormModal(true);
    setSubmitting(false);
    if (session?.token) {
      try {
        const [ragResult, modelsResult] = await Promise.all([
          listRagDataStores(session.token),
          listModels(session.token),
        ]);
        setRagDataStores(ragResult.ragDataStores);
        setModels(modelsResult);
      } catch {}
    }
  }

  function closeFormModal() {
    setShowFormModal(false);
    setEditingAgent(null);
    setFormName("");
    setFormPrompt("");
    setFormHasRag(false);
    setFormRagStoreId("");
    setFormGuardrailEnabled(false);
    setFormGuardrailRules("");
    setFormTracingEnabled(false);
    setFormTracingUrl("");
    setFormTracingAigatewayId("");
    setFormHasSemanticCache(false);
    setFormModel("gpt-4.1-mini");
    setFormTemperature(0.2);
    setRagDataStores([]);
    setModels([]);
    setSubmitting(false);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!session?.token || !formName.trim() || !formPrompt.trim()) return;
    setSubmitting(true);
    try {
      if (editingAgent) {
        await updateAgent(
          editingAgent.slug,
          {
            name: formName.trim(),
            systemPrompt: formPrompt.trim(),
            hasRagEnabled: formHasRag,
            ragDataStoreId: formHasRag ? formRagStoreId || null : null,
            guardrailEnabled: formGuardrailEnabled,
            guardrailRules: formGuardrailEnabled ? formGuardrailRules.trim() || null : null,
            tracingEnabled: formTracingEnabled,
            tracingUrl: formTracingEnabled ? formTracingUrl.trim() || null : null,
            tracingAigatewayId: formTracingEnabled ? formTracingAigatewayId.trim() || null : null,
            hasSemanticCache: formHasSemanticCache,
            model: formModel.trim() || "gpt-4.1-mini",
            temperature: formTemperature,
          },
          session.token,
        );
      } else {
        await createAgent(
          {
            name: formName.trim(),
            systemPrompt: formPrompt.trim(),
            hasRagEnabled: formHasRag,
            ragDataStoreId: formHasRag ? formRagStoreId || undefined : undefined,
            guardrailEnabled: formGuardrailEnabled,
            guardrailRules: formGuardrailEnabled ? formGuardrailRules.trim() || undefined : undefined,
            tracingEnabled: formTracingEnabled,
            tracingUrl: formTracingEnabled ? formTracingUrl.trim() || undefined : undefined,
            tracingAigatewayId: formTracingEnabled ? formTracingAigatewayId.trim() || undefined : undefined,
            hasSemanticCache: formHasSemanticCache,
            model: formModel.trim() || "gpt-4.1-mini",
            temperature: formTemperature,
          },
          session.token,
        );
      }
      closeFormModal();
      await loadAgents();
    } catch { }
    finally { setSubmitting(false); }
  }

  async function handleDelete(slug: string) {
    if (!session?.token || !confirm("Are you sure you want to delete this agent?")) return;
    try {
      await deleteAgent(slug, session.token);
      await loadAgents();
    } catch { }
  }

  async function openToolsModal(agent: Agent) {
    if (!session?.token) return;
    setToolsModalAgent(agent);
    try {
      const [{ tools }, { tools: linked }] = await Promise.all([
        listTools(session.token),
        getAgentTools(agent.slug, session.token),
      ]);
      setAllTools(tools);
      setLinkedToolIds(new Set(linked.map((t) => t.id)));
    } catch { }
  }

  function toggleTool(toolId: string) {
    setLinkedToolIds((prev) => {
      const next = new Set(prev);
      if (next.has(toolId)) next.delete(toolId);
      else next.add(toolId);
      return next;
    });
  }

  async function handleSaveTools() {
    if (!session?.token || !toolsModalAgent) return;
    setSavingTools(true);
    try {
      await linkAgentTools(toolsModalAgent.slug, Array.from(linkedToolIds), session.token);
      setToolsModalAgent(null);
    } catch { }
    finally { setSavingTools(false); }
  }

  async function openMcpsModal(agent: Agent) {
    if (!session?.token) return;
    setMcpsModalAgent(agent);
    try {
      const [{ mcps }, { mcps: linked }] = await Promise.all([
        listMcps(session.token),
        getAgentMcps(agent.slug, session.token),
      ]);
      setAllMcps(mcps);
      setLinkedMcpIds(new Set(linked.map((m) => m.id)));
    } catch { }
  }

  function toggleMcp(mcpId: string) {
    setLinkedMcpIds((prev) => {
      const next = new Set(prev);
      if (next.has(mcpId)) next.delete(mcpId);
      else next.add(mcpId);
      return next;
    });
  }

  async function handleSaveMcps() {
    if (!session?.token || !mcpsModalAgent) return;
    setSavingMcps(true);
    try {
      await linkAgentMcps(mcpsModalAgent.slug, Array.from(linkedMcpIds), session.token);
      setMcpsModalAgent(null);
    } catch { }
    finally { setSavingMcps(false); }
  }

  async function handleUnlinkMcp(mcpId: string) {
    if (!session?.token || !mcpsModalAgent) return;
    try {
      await unlinkAgentMcp(mcpsModalAgent.slug, mcpId, session.token);
      const { mcps: linked } = await getAgentMcps(mcpsModalAgent.slug, session.token);
      setLinkedMcpIds(new Set(linked.map((m) => m.id)));
    } catch { }
  }

  async function handleUnlinkTool(toolId: string) {
    if (!session?.token || !toolsModalAgent) return;
    try {
      await unlinkAgentTool(toolsModalAgent.slug, toolId, session.token);
      const { tools: linked } = await getAgentTools(toolsModalAgent.slug, session.token);
      setLinkedToolIds(new Set(linked.map((t) => t.id)));
    } catch { }
  }

  async function openUsersModal(agent: Agent) {
    if (!session?.token) return;
    setUsersModalAgent(agent);
    try {
      const [{ users }, { users: linked }] = await Promise.all([
        listUsers(session.token),
        getAgentUsers(agent.slug, session.token),
      ]);
      setAllUsers(users);
      setLinkedUserIds(new Set(linked.map((u) => u.id)));
    } catch { }
  }

  function toggleUser(userId: string) {
    setLinkedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  async function handleUnlinkUser(userId: string) {
    if (!session?.token || !usersModalAgent) return;
    try {
      await unlinkAgentUser(usersModalAgent.slug, userId, session.token);
      const { users: linked } = await getAgentUsers(usersModalAgent.slug, session.token);
      setLinkedUserIds(new Set(linked.map((u) => u.id)));
    } catch { }
  }

  async function openSkillsModal(agent: Agent) {
    if (!session?.token) return;
    setSkillsModalAgent(agent);
    try {
      const [{ skills }, { skills: linked }] = await Promise.all([
        listSkills(session.token),
        getAgentSkills(agent.slug, session.token),
      ]);
      setAllSkills(skills);
      setLinkedSkillIds(new Set(linked.map((s) => s.id)));
    } catch { }
  }

  function toggleSkill(skillId: string) {
    setLinkedSkillIds((prev) => {
      const next = new Set(prev);
      if (next.has(skillId)) next.delete(skillId);
      else next.add(skillId);
      return next;
    });
  }

  async function handleSaveSkills() {
    if (!session?.token || !skillsModalAgent) return;
    setSavingSkills(true);
    try {
      await linkAgentSkills(skillsModalAgent.slug, Array.from(linkedSkillIds), session.token);
      setSkillsModalAgent(null);
    } catch { }
    finally { setSavingSkills(false); }
  }

  async function handleUnlinkSkill(skillId: string) {
    if (!session?.token || !skillsModalAgent) return;
    try {
      await unlinkAgentSkill(skillsModalAgent.slug, skillId, session.token);
      const { skills: linked } = await getAgentSkills(skillsModalAgent.slug, session.token);
      setLinkedSkillIds(new Set(linked.map((s) => s.id)));
    } catch { }
  }

  async function handleSaveUsers() {
    if (!session?.token || !usersModalAgent) return;
    setSavingUsers(true);
    try {
      await linkAgentUsers(usersModalAgent.slug, Array.from(linkedUserIds), session.token);
      setUsersModalAgent(null);
    } catch { }
    finally { setSavingUsers(false); }
  }

  async function openApiKeyModal(agent: Agent) {
    setApiKeyModalAgent(agent);
    setApiKeyValue(agent.apiKey);
    setCopied(false);
  }

  async function handleGenerateApiKey() {
    if (!session?.token || !apiKeyModalAgent) return;
    setGeneratingKey(true);
    try {
      const { apiKey } = await generateAgentApiKey(apiKeyModalAgent.slug, session.token);
      setApiKeyValue(apiKey);
      setCopied(false);
      const { agents } = await listAgents(session.token);
      setAgents(agents);
    } catch { }
    finally { setGeneratingKey(false); }
  }

  async function handleRevokeApiKey() {
    if (!session?.token || !apiKeyModalAgent) return;
    try {
      await revokeAgentApiKey(apiKeyModalAgent.slug, session.token);
      setApiKeyValue(null);
      setCopied(false);
      const { agents } = await listAgents(session.token);
      setAgents(agents);
    } catch { }
  }

  async function handleCopyApiKey() {
    if (apiKeyValue) {
      try {
        await navigator.clipboard.writeText(apiKeyValue);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch { }
    }
  }

  if (loading) return <main className="page-layout"><p>Loading...</p></main>;

  return (
    <main className="page-layout">
      <div className="page-header">
        <h2>Agents</h2>
        <button className="primary-button" onClick={openCreateModal}>
          New Agent
        </button>
      </div>

      {agents.length === 0 ? (
        <p className="muted">No agents found.</p>
      ) : (
        <div className="card-grid">
          {agents.map((agent) => (
            <div key={agent.id} className="card">
              <div className="card-body">
                <h3>{agent.name}</h3>
                <span className="badge">{agent.slug}</span>
                <p className="card-preview">{agent.systemPrompt.slice(0, 120)}{agent.systemPrompt.length > 120 ? "..." : ""}</p>
                <small className="muted">Created {new Date(agent.createdAt).toLocaleDateString()}</small>
              </div>
              <div className="card-actions">
                <div className="dropdown-container">
                  <button
                    className="ghost-button dropdown-trigger"
                    onClick={(e) => { e.stopPropagation(); toggleDropdown(agent.id); }}
                  >
                    Actions ▾
                  </button>
                  {openDropdownId === agent.id && (
                    <div className="dropdown-menu" onClick={(e) => e.stopPropagation()}>
                      <button className="dropdown-item" onClick={() => { setOpenDropdownId(null); navigate(`/chats/agent/${agent.slug}`); }}>
                        Chat
                      </button>
                      <button className="dropdown-item" onClick={() => { setOpenDropdownId(null); openEditModal(agent); }}>
                        Edit
                      </button>
                      <hr className="dropdown-divider" />
                      <button className="dropdown-item" onClick={() => { setOpenDropdownId(null); openToolsModal(agent); }}>
                        Tools
                      </button>
                      <button className="dropdown-item" onClick={() => { setOpenDropdownId(null); openMcpsModal(agent); }}>
                        MCPs
                      </button>
                      <button className="dropdown-item" onClick={() => { setOpenDropdownId(null); openSkillsModal(agent); }}>
                        Skills
                      </button>
                      <button className="dropdown-item" onClick={() => { setOpenDropdownId(null); openUsersModal(agent); }}>
                        Users
                      </button>
                      <button className="dropdown-item" onClick={() => { setOpenDropdownId(null); openApiKeyModal(agent); }}>
                        API Key
                      </button>
                      <hr className="dropdown-divider" />
                      <button className="dropdown-item warn" onClick={() => { setOpenDropdownId(null); handleDelete(agent.slug); }}>
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showFormModal && (
        <div className="modal-overlay" onClick={closeFormModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editingAgent ? "Edit Agent" : "New Agent"}</h3>
            <form onSubmit={handleSubmit}>
              <label>
                Name
                <input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Agent name" required />
              </label>
              <label>
                System Prompt
                <textarea value={formPrompt} onChange={(e) => setFormPrompt(e.target.value)} placeholder="System instructions for the agent..." rows={8} required />
              </label>
              <label className="toggle-label">
                <span>Enable RAG</span>
                <div
                  className={`toggle-root ${formHasRag ? "toggle-on" : "toggle-off"}`}
                  onClick={() => setFormHasRag((prev) => !prev)}
                  role="switch"
                  aria-checked={formHasRag}
                  tabIndex={0}
                >
                  <div className="toggle-thumb" />
                </div>
              </label>
              {formHasRag && (
                <label>
                  Data Store
                  <select
                    value={formRagStoreId}
                    onChange={(e) => setFormRagStoreId(e.target.value)}
                  >
                    <option value="">Select a data store...</option>
                    {ragDataStores.map((ds) => (
                      <option key={ds.id} value={ds.id}>
                        {ds.description}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <label className="toggle-label">
                <span>Enable Guardrail</span>
                <div
                  className={`toggle-root ${formGuardrailEnabled ? "toggle-on" : "toggle-off"}`}
                  onClick={() => setFormGuardrailEnabled((prev) => !prev)}
                  role="switch"
                  aria-checked={formGuardrailEnabled}
                  tabIndex={0}
                >
                  <div className="toggle-thumb" />
                </div>
              </label>
              {formGuardrailEnabled && (
                  <label>
                    Guardrail Rules
                    <textarea
                      value={formGuardrailRules}
                      onChange={(e) => setFormGuardrailRules(e.target.value)}
                      placeholder="Define guardrail rules for the agent..."
                      rows={4}
                    />
                  </label>
              )}
              <label className="toggle-label">
                <span>Enable Tracing</span>
                <div
                  className={`toggle-root ${formTracingEnabled ? "toggle-on" : "toggle-off"}`}
                  onClick={() => setFormTracingEnabled((prev) => !prev)}
                  role="switch"
                  aria-checked={formTracingEnabled}
                  tabIndex={0}
                >
                  <div className="toggle-thumb" />
                </div>
              </label>
              {formTracingEnabled && (
                <>
                  <label>
                    Tracing URL
                    <input
                      value={formTracingUrl}
                      onChange={(e) => setFormTracingUrl(e.target.value)}
                      placeholder="http://localhost:5000/gateway/mlflow/v1"
                    />
                  </label>
                  <label>
                    AI Gateway ID
                    <input
                      value={formTracingAigatewayId}
                      onChange={(e) => setFormTracingAigatewayId(e.target.value)}
                      placeholder="aigateway-id"
                    />
                  </label>
                </>
              )}
              <label className="toggle-label">
                <span>Enable Semantic Cache</span>
                <div
                  className={`toggle-root ${formHasSemanticCache ? "toggle-on" : "toggle-off"}`}
                  onClick={() => setFormHasSemanticCache((prev) => !prev)}
                  role="switch"
                  aria-checked={formHasSemanticCache}
                  tabIndex={0}
                >
                  <div className="toggle-thumb" />
                </div>
              </label>
              <label>
                Model
                {models.length > 0 ? (
                  <select value={formModel} onChange={(e) => setFormModel(e.target.value)}>
                    {models.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input value={formModel} onChange={(e) => setFormModel(e.target.value)} placeholder="gpt-4.1-mini" />
                )}
              </label>
              <label>
                Temperature: {formTemperature}
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.2"
                  value={formTemperature}
                  onChange={(e) => setFormTemperature(Number(e.target.value))}
                />
              </label>
              <div className="modal-actions">
                <button type="button" className="ghost-button" onClick={closeFormModal}>
                  Cancel
                </button>
                <button type="submit" className="primary-button" disabled={submitting}>
                  {submitting ? "Saving..." : editingAgent ? "Save" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {mcpsModalAgent && (
        <div className="modal-overlay" onClick={() => setMcpsModalAgent(null)}>
          <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
            <h3>MCPs - {mcpsModalAgent.name}</h3>
            {allMcps.length === 0 ? (
              <p className="muted">No MCPs available.</p>
            ) : (
              <table className="payload-table tool-table">
                <thead>
                  <tr>
                    <th></th>
                    <th>Type</th>
                    <th>Description</th>
                    <th>Endpoint</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {allMcps.map((mcp) => {
                    const isLinked = linkedMcpIds.has(mcp.id);
                    return (
                      <tr key={mcp.id}>
                        <td>
                          <input type="checkbox" checked={isLinked} onChange={() => toggleMcp(mcp.id)} />
                        </td>
                        <td><span className={`badge ${mcp.type === "stdio" ? "badge-stdio" : "badge-remote"}`}>{mcp.type}</span></td>
                        <td>{mcp.description ?? "-"}</td>
                        <td><code>{mcp.type === "remote" ? mcp.url : mcp.command}</code></td>
                        <td>
                          {isLinked && (
                            <button className="ghost-button warn small" onClick={() => handleUnlinkMcp(mcp.id)}>
                              Remove
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
            <div className="modal-actions">
              <button className="ghost-button" onClick={() => setMcpsModalAgent(null)}>
                Cancel
              </button>
              <button className="primary-button" onClick={handleSaveMcps} disabled={savingMcps}>
                {savingMcps ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toolsModalAgent && (
        <div className="modal-overlay" onClick={() => setToolsModalAgent(null)}>
          <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
            <h3>Tools - {toolsModalAgent.name}</h3>
            {allTools.length === 0 ? (
              <p className="muted">No tools available.</p>
            ) : (
              <table className="payload-table tool-table">
                <thead>
                  <tr>
                    <th></th>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Type</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {allTools.map((tool) => {
                    const isLinked = linkedToolIds.has(tool.id);
                    return (
                      <tr key={tool.id}>
                        <td>
                          <input type="checkbox" checked={isLinked} onChange={() => toggleTool(tool.id)} />
                        </td>
                        <td>{tool.name}</td>
                        <td>{tool.description ?? "-"}</td>
                        <td>{tool.isNative ? "Native" : "External"}</td>
                        <td>
                          {isLinked && (
                            <button className="ghost-button warn small" onClick={() => handleUnlinkTool(tool.id)}>
                              Remove
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
            <div className="modal-actions">
              <button className="ghost-button" onClick={() => setToolsModalAgent(null)}>
                Cancel
              </button>
              <button className="primary-button" onClick={handleSaveTools} disabled={savingTools}>
                {savingTools ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {usersModalAgent && (
        <div className="modal-overlay" onClick={() => setUsersModalAgent(null)}>
          <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
            <h3>Users - {usersModalAgent.name}</h3>
            {allUsers.length === 0 ? (
              <p className="muted">No users available.</p>
            ) : (
              <table className="payload-table tool-table">
                <thead>
                  <tr>
                    <th></th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {allUsers.map((user) => {
                    const isLinked = linkedUserIds.has(user.id);
                    return (
                      <tr key={user.id}>
                        <td>
                          <input type="checkbox" checked={isLinked} onChange={() => toggleUser(user.id)} />
                        </td>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>
                          <span className={`badge ${user.rule === "admin" ? "badge-native" : "badge-external"}`}>
                            {user.rule === "admin" ? "Admin" : "Employee"}
                          </span>
                        </td>
                        <td>
                          {isLinked && (
                            <button className="ghost-button warn small" onClick={() => handleUnlinkUser(user.id)}>
                              Remove
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
            <div className="modal-actions">
              <button className="ghost-button" onClick={() => setUsersModalAgent(null)}>
                Cancel
              </button>
              <button className="primary-button" onClick={handleSaveUsers} disabled={savingUsers}>
                {savingUsers ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {skillsModalAgent && (
        <div className="modal-overlay" onClick={() => setSkillsModalAgent(null)}>
          <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
            <h3>Skills - {skillsModalAgent.name}</h3>
            {allSkills.length === 0 ? (
              <p className="muted">No skills available.</p>
            ) : (
              <table className="payload-table tool-table">
                <thead>
                  <tr>
                    <th></th>
                    <th>Name</th>
                    <th>Description</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {allSkills.map((skill) => {
                    const isLinked = linkedSkillIds.has(skill.id);
                    return (
                      <tr key={skill.id}>
                        <td>
                          <input type="checkbox" checked={isLinked} onChange={() => toggleSkill(skill.id)} />
                        </td>
                        <td>{skill.name}</td>
                        <td>{skill.description ?? "-"}</td>
                        <td>
                          {isLinked && (
                            <button className="ghost-button warn small" onClick={() => handleUnlinkSkill(skill.id)}>
                              Remove
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
            <div className="modal-actions">
              <button className="ghost-button" onClick={() => setSkillsModalAgent(null)}>
                Cancel
              </button>
              <button className="primary-button" onClick={handleSaveSkills} disabled={savingSkills}>
                {savingSkills ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {apiKeyModalAgent && (
        <div className="modal-overlay" onClick={() => setApiKeyModalAgent(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>API Key - {apiKeyModalAgent.name}</h3>
            {apiKeyValue ? (
              <>
                <label>
                  API Key
                  <input value={apiKeyValue} readOnly style={{ fontFamily: "monospace" }} />
                </label>
                <div className="modal-actions" style={{ justifyContent: "space-between" }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="ghost-button" onClick={handleCopyApiKey}>
                      {copied ? "Copied!" : "Copy"}
                    </button>
                    <button className="ghost-button" onClick={handleRevokeApiKey}>
                      Revoke
                    </button>
                  </div>
                  <div>
                    <button className="primary-button" onClick={handleGenerateApiKey} disabled={generatingKey}>
                      {generatingKey ? "Generating..." : "Regenerate"}
                    </button>
                    <button className="ghost-button" style={{ marginLeft: 8 }} onClick={() => setApiKeyModalAgent(null)}>
                      Close
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <p className="muted">No API key generated yet.</p>
                <div className="modal-actions">
                  <button className="ghost-button" onClick={() => setApiKeyModalAgent(null)}>
                    Close
                  </button>
                  <button className="primary-button" onClick={handleGenerateApiKey} disabled={generatingKey}>
                    {generatingKey ? "Generating..." : "Generate API Key"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
