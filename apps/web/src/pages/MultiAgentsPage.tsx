import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listAgents, listMultiAgents, createMultiAgent, updateMultiAgent, deleteMultiAgent } from "../api";
import { loadSession } from "../auth";
import type { Agent, MultiAgent } from "../types";

export function MultiAgentsPage() {
  const session = loadSession();
  const navigate = useNavigate();
  const [multiAgents, setMultiAgents] = useState<MultiAgent[]>([]);
  const [loading, setLoading] = useState(true);

  const [showFormModal, setShowFormModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formShortDescription, setFormShortDescription] = useState("");
  const [formNodes, setFormNodes] = useState<Array<{ id: string; triggerWhen: string }>>([]);
  const [allAgents, setAllAgents] = useState<Agent[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  async function loadMultiAgents() {
    if (!session?.token) return;
    try {
      const { multiAgents } = await listMultiAgents(session.token);
      setMultiAgents(multiAgents);
    } catch { }
    finally { setLoading(false); }
  }

  useEffect(() => { loadMultiAgents(); }, []);

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

  async function loadAllAgents() {
    if (!session?.token) return;
    try {
      const { agents } = await listAgents(session.token);
      setAllAgents(agents);
    } catch { }
  }

  async function openCreateModal() {
    setEditingId(null);
    setFormName("");
    setFormShortDescription("");
    setFormNodes([]);
    setShowFormModal(true);
    setSubmitting(false);
    await loadAllAgents();
  }

  async function openEditModal(multiAgent: MultiAgent) {
    setEditingId(multiAgent.id);
    setFormName(multiAgent.name);
    setFormShortDescription(multiAgent.shortDescription ?? "");
    setFormNodes(multiAgent.nodes ?? []);
    setShowFormModal(true);
    setSubmitting(false);
    await loadAllAgents();
  }

  function closeFormModal() {
    setShowFormModal(false);
    setEditingId(null);
    setFormName("");
    setFormShortDescription("");
    setFormNodes([]);
    setSubmitting(false);
  }

  function addNode() {
    setFormNodes((prev) => [...prev, { id: "", triggerWhen: "" }]);
  }

  function removeNode(index: number) {
    setFormNodes((prev) => prev.filter((_, i) => i !== index));
  }

  function updateNodeId(index: number, id: string) {
    setFormNodes((prev) => prev.map((node, i) => i === index ? { ...node, id } : node));
  }

  function updateNodeTriggerWhen(index: number, triggerWhen: string) {
    setFormNodes((prev) => prev.map((node, i) => i === index ? { ...node, triggerWhen } : node));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!session?.token || !formName.trim()) return;
    setSubmitting(true);
    try {
      const validNodes = formNodes.filter((n) => n.id && n.triggerWhen);

      if (editingId) {
        await updateMultiAgent(
          editingId,
          {
            name: formName.trim(),
            shortDescription: formShortDescription.trim() || undefined,
            nodes: validNodes.length > 0 ? validNodes : undefined,
          },
          session.token,
        );
      } else {
        const { multiAgent } = await createMultiAgent(
          {
            name: formName.trim(),
            shortDescription: formShortDescription.trim() || undefined,
            nodes: validNodes.length > 0 ? validNodes : undefined,
          },
          session.token,
        );
      }
      closeFormModal();
      await loadMultiAgents();
    } catch { }
    finally { setSubmitting(false); }
  }

  async function handleDelete(id: string) {
    if (!session?.token || !confirm("Are you sure you want to delete this multi agent?")) return;
    try {
      await deleteMultiAgent(id, session.token);
      await loadMultiAgents();
    } catch { }
  }

  if (loading) return <main className="page-layout"><p>Loading...</p></main>;

  return (
    <main className="page-layout">
      <div className="page-header">
        <h2>Multi Agents</h2>
        <button className="primary-button" onClick={openCreateModal}>
          New Multi Agent
        </button>
      </div>

      {multiAgents.length === 0 ? (
        <p className="muted">No multi agents found.</p>
      ) : (
        <div className="card-grid">
          {multiAgents.map((ma) => (
            <div key={ma.id} className="card" style={{ marginBottom: "70px" }}>
              <div className="card-menu">
                <button
                  className="ghost-button small dropdown-trigger"
                  onClick={(e) => { e.stopPropagation(); toggleDropdown(ma.id); }}
                >
                  ⋮
                </button>
                {openDropdownId === ma.id && (
                  <div className="dropdown-menu" onClick={(e) => e.stopPropagation()}>
                    <button className="dropdown-item" onClick={() => { setOpenDropdownId(null); navigate(`/chats/multi-agent/${ma.id}`); }}>
                      Chat
                    </button>
                    <button className="dropdown-item" onClick={() => { setOpenDropdownId(null); openEditModal(ma); }}>
                      Edit
                    </button>
                    <hr className="dropdown-divider" />
                    <button className="dropdown-item warn" onClick={() => { setOpenDropdownId(null); handleDelete(ma.id); }}>
                      Delete
                    </button>
                  </div>
                )}
              </div>
              <div className="card-body">
                <h3>{ma.name}</h3>
                <span className="badge">{ma.slug}</span>
                {ma.shortDescription && (
                  <p className="card-preview">{ma.shortDescription.slice(0, 120)}{ma.shortDescription.length > 120 ? "..." : ""}</p>
                )}
                {!ma.shortDescription && ma.nodes && ma.nodes.length > 0 && (
                  <p className="card-preview">{ma.nodes.map((n) => n.id).join(", ")}</p>
                )}
                {ma.nodes && ma.nodes.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    {ma.nodes.map((node) => (
                      <span key={node.id} className="badge" style={{ marginRight: 4, marginBottom: 4 }}>
                        {node.id}
                      </span>
                    ))}
                  </div>
                )}
                <small className="muted">Created {new Date(ma.createdAt).toLocaleDateString()}</small>
              </div>
            </div>
          ))}
        </div>
      )}

      {showFormModal && (
        <div className="modal-overlay" onClick={closeFormModal}>
          <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
            <h3>{editingId ? "Edit Multi Agent" : "New Multi Agent"}</h3>
            <form onSubmit={handleSubmit}>
              <label>
                Name
                <input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Multi agent name" required />
              </label>
              <label>
                Short Description
                <textarea value={formShortDescription} onChange={(e) => setFormShortDescription(e.target.value)} placeholder="Brief description of what this multi agent does..." rows={3} />
              </label>
              <div style={{ marginTop: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <label style={{ fontWeight: 600, margin: 0 }}>Nodes</label>
                  <button type="button" className="ghost-button" onClick={addNode}>
                    + Add Node
                  </button>
                </div>
                {formNodes.length === 0 && (
                  <p className="muted">No nodes added. Click "Add Node" to configure agent routing.</p>
                )}
                {formNodes.map((node, index) => (
                  <div key={index} style={{ border: "1px solid var(--border, #333)", borderRadius: 8, padding: 12, marginBottom: 8 }}>
                    <label>
                      Agent
                      <select value={node.id} onChange={(e) => updateNodeId(index, e.target.value)}>
                        <option value="">Select an agent...</option>
                        {allAgents.map((agent) => (
                          <option key={agent.id} value={agent.slug}>
                            {agent.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Trigger When
                      <textarea
                        value={node.triggerWhen}
                        onChange={(e) => updateNodeTriggerWhen(index, e.target.value)}
                        placeholder="When user wants to..."
                        rows={3}
                      />
                    </label>
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <button type="button" className="ghost-button warn" onClick={() => removeNode(index)}>
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
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
