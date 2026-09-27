import { useEffect, useState } from "react";
import { createWebhook, deleteWebhook, listAgents, listMultiAgents, listWebhookIntegrations, listWebhooks, updateWebhook } from "../api";
import { loadSession } from "../auth";
import type { Agent, MultiAgent, Webhook } from "../types";

type ConfigEntry = { key: string; value: string };

const DEFAULT_CONFIG_ENTRIES: ConfigEntry[] = [
  { key: "sessionId", value: "message.chat.id" },
  { key: "text", value: "message.text" },
  { key: "telegramBotToken", value: "" },
  { key: "telegramChatId", value: "message.chat.id" },
];

function configToEntries(config: Record<string, string> | undefined): ConfigEntry[] {
  if (!config || Object.keys(config).length === 0) {
    return DEFAULT_CONFIG_ENTRIES.map((e) => ({ ...e }));
  }
  return Object.entries(config).map(([key, value]) => ({ key, value }));
}

function entriesToConfig(entries: ConfigEntry[]): Record<string, string> {
  const config: Record<string, string> = {};
  for (const entry of entries) {
    const key = entry.key.trim();
    if (!key) continue;
    config[key] = entry.value;
  }
  return config;
}

export function WebhooksPage() {
  const session = loadSession();
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);

  const [showFormModal, setShowFormModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formTypeAgent, setFormTypeAgent] = useState<"ai_agent" | "multi_agent">("ai_agent");
  const [formAgentId, setFormAgentId] = useState("");
  const [formIntegrationName, setFormIntegrationName] = useState("telegram");
  const [integrations, setIntegrations] = useState<string[]>(["telegram"]);
  const [configEntries, setConfigEntries] = useState<ConfigEntry[]>(
    DEFAULT_CONFIG_ENTRIES.map((e) => ({ ...e })),
  );
  const [allAgents, setAllAgents] = useState<Agent[]>([]);
  const [allMultiAgents, setAllMultiAgents] = useState<MultiAgent[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  async function loadWebhooks() {
    if (!session?.token) return;
    try {
      const { webhooks } = await listWebhooks(session.token);
      setWebhooks(webhooks);
    } catch { }
    finally { setLoading(false); }
  }

  useEffect(() => { loadWebhooks(); loadIntegrations(); }, []);

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

  async function loadIntegrations() {
    if (!session?.token) return;
    try {
      const { integrations } = await listWebhookIntegrations(session.token);
      setIntegrations(integrations);
    } catch { }
  }

  async function loadAgentOptions(typeAgent: "ai_agent" | "multi_agent") {    if (!session?.token) return;
    try {
      if (typeAgent === "ai_agent") {
        const { agents } = await listAgents(session.token);
        setAllAgents(agents);
      } else {
        const { multiAgents } = await listMultiAgents(session.token);
        setAllMultiAgents(multiAgents);
      }
    } catch { }
  }

  async function openCreateModal() {
    setEditingId(null);
    setFormName("");
    setFormTypeAgent("ai_agent");
    setFormAgentId("");
    setFormIntegrationName(integrations[0] ?? "telegram");
    setConfigEntries(DEFAULT_CONFIG_ENTRIES.map((e) => ({ ...e })));
    setFormError(null);
    setShowFormModal(true);
    setSubmitting(false);
    await loadAgentOptions("ai_agent");
  }

  async function openEditModal(webhook: Webhook) {
    setEditingId(webhook.id);
    setFormName(webhook.name);
    setFormTypeAgent(webhook.typeAgent);
    setFormAgentId(webhook.agentId);
    setFormIntegrationName(webhook.integrationName ?? integrations[0] ?? "telegram");
    setConfigEntries(configToEntries(webhook.config));
    setFormError(null);
    setShowFormModal(true);
    setSubmitting(false);
    await loadAgentOptions(webhook.typeAgent);
  }

  function closeFormModal() {
    setShowFormModal(false);
    setEditingId(null);
    setFormName("");
    setFormTypeAgent("ai_agent");
    setFormAgentId("");
    setFormIntegrationName(integrations[0] ?? "telegram");
    setConfigEntries(DEFAULT_CONFIG_ENTRIES.map((e) => ({ ...e })));
    setFormError(null);
    setSubmitting(false);
  }

  async function handleTypeAgentChange(typeAgent: "ai_agent" | "multi_agent") {
    setFormTypeAgent(typeAgent);
    setFormAgentId("");
    await loadAgentOptions(typeAgent);
  }

  function addConfigEntry() {
    setConfigEntries((prev) => [...prev, { key: "", value: "" }]);
  }

  function removeConfigEntry(index: number) {
    setConfigEntries((prev) => prev.filter((_, i) => i !== index));
  }

  function updateConfigEntry(index: number, field: "key" | "value", val: string) {
    setConfigEntries((prev) => prev.map((entry, i) => (i === index ? { ...entry, [field]: val } : entry)));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!session?.token) return;
    setFormError(null);
    if (!formName.trim()) {
      setFormError("Name is required.");
      return;
    }
    if (!formAgentId) {
      setFormError("Select an agent.");
      return;
    }
    if (!formIntegrationName) {
      setFormError("Select an integration.");
      return;
    }
    const config = entriesToConfig(configEntries);
    if (!config.text) {
      setFormError("Config must include a text key.");
      return;
    }
    if (!config.sessionId) {
      setFormError("Config must include a sessionId key.");
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        await updateWebhook(
          editingId,
          { name: formName.trim(), agentId: formAgentId, typeAgent: formTypeAgent, integrationName: formIntegrationName, config },
          session.token,
        );
      } else {
        await createWebhook(
          { name: formName.trim(), agentId: formAgentId, typeAgent: formTypeAgent, integrationName: formIntegrationName, config },
          session.token,
        );
      }
      closeFormModal();
      await loadWebhooks();
    } catch (error: any) {
      setFormError(error.message ?? "Failed to save webhook.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!session?.token || !confirm("Are you sure you want to delete this webhook?")) return;
    try {
      await deleteWebhook(id, session.token);
      await loadWebhooks();
    } catch { }
  }

  function copyTriggerUrl(slug: string) {
    const url = `${window.location.origin}/webhook/${slug}`;
    void navigator.clipboard?.writeText(`POST ${url}`);
  }

  if (loading) return <main className="page-layout"><p>Loading...</p></main>;

  const agentOptions = formTypeAgent === "ai_agent" ? allAgents : allMultiAgents;

  return (
    <main className="page-layout">
      <div className="page-header">
        <h2>Webhooks</h2>
        <button className="primary-button" onClick={openCreateModal}>
          New Webhook
        </button>
      </div>

      {webhooks.length === 0 ? (
        <p className="muted">No webhooks found.</p>
      ) : (
        <div className="card-grid">
          {webhooks.map((webhook) => (
            <div key={webhook.id} className="card" style={{ marginBottom: "70px" }}>
              <div className="card-menu">
                <button
                  className="ghost-button small dropdown-trigger"
                  onClick={(e) => { e.stopPropagation(); toggleDropdown(webhook.id); }}
                >
                  ⋮
                </button>
                {openDropdownId === webhook.id && (
                  <div className="dropdown-menu" onClick={(e) => e.stopPropagation()}>
                    <button className="dropdown-item" onClick={() => { setOpenDropdownId(null); copyTriggerUrl(webhook.slug); }}>
                      Copy trigger URL
                    </button>
                    <button className="dropdown-item" onClick={() => { setOpenDropdownId(null); openEditModal(webhook); }}>
                      Edit
                    </button>
                    <hr className="dropdown-divider" />
                    <button className="dropdown-item warn" onClick={() => { setOpenDropdownId(null); handleDelete(webhook.id); }}>
                      Delete
                    </button>
                  </div>
                )}
              </div>
              <div className="card-body">
                <h3>{webhook.name}</h3>
                <span className="badge">{webhook.slug}</span>{" "}
                <span className="badge">{webhook.typeAgent}</span>{" "}
                <span className="badge">{webhook.integrationName}</span>
                <p className="card-preview">POST /webhook/{webhook.slug}</p>
                <small className="muted">Created {new Date(webhook.createdAt).toLocaleDateString()}</small>
              </div>
            </div>
          ))}
        </div>
      )}

      {showFormModal && (
        <div className="modal-overlay" onClick={closeFormModal}>
          <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
            <h3>{editingId ? "Edit Webhook" : "New Webhook"}</h3>
            <form onSubmit={handleSubmit}>
              <label>
                Name
                <input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Support Agent" required />
              </label>
              <label>
                Type
                <select value={formTypeAgent} onChange={(e) => handleTypeAgentChange(e.target.value as "ai_agent" | "multi_agent")}>
                  <option value="ai_agent">ai_agent</option>
                  <option value="multi_agent">multi_agent</option>
                </select>
              </label>
              <label>
                Integration
                <select value={formIntegrationName} onChange={(e) => setFormIntegrationName(e.target.value)}>
                  {integrations.map((integration) => (
                    <option key={integration} value={integration}>
                      {integration}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Agent
                <select value={formAgentId} onChange={(e) => setFormAgentId(e.target.value)}>
                  <option value="">Select an agent...</option>
                  {agentOptions.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name}
                    </option>
                  ))}
                </select>
              </label>
              <div style={{ marginTop: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <label style={{ fontWeight: 600, margin: 0 }}>Config</label>
                  <button type="button" className="ghost-button" onClick={addConfigEntry}>
                    + Add item
                  </button>
                </div>
                <p className="muted">Each value is a lodash path into the incoming body (e.g. message.text) or a literal value.</p>
                {configEntries.map((entry, index) => (
                  <div key={index} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    <input
                      value={entry.key}
                      onChange={(e) => updateConfigEntry(index, "key", e.target.value)}
                      placeholder="Key (e.g. text)"
                      style={{ flex: 1 }}
                    />
                    <input
                      value={entry.value}
                      onChange={(e) => updateConfigEntry(index, "value", e.target.value)}
                      placeholder="Value (e.g. message.text)"
                      type={entry.key === "telegramBotToken" ? "password" : "text"}
                      style={{ flex: 2 }}
                    />
                    <button type="button" className="ghost-button warn" onClick={() => removeConfigEntry(index)}>
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              {formError && <p className="error">{formError}</p>}
              <div className="modal-actions">
                <button type="button" className="ghost-button" onClick={closeFormModal}>
                  Cancel
                </button>
                <button type="submit" className="primary-button" disabled={submitting}>
                  {submitting ? "Saving..." : editingId ? "Save" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
