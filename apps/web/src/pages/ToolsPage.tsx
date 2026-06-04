import { useEffect, useState } from "react";
import { createTool, deleteTool, listTools } from "../api";
import { loadSession } from "../auth";
import type { Tool } from "../types";

export function ToolsPage() {
  const session = loadSession();
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formTool, setFormTool] = useState("");
  const [formPackage, setFormPackage] = useState("");
  const [formIsNative, setFormIsNative] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  function load() {
    if (!session?.token) return;
    listTools(session.token)
      .then(({ tools }) => setTools(tools))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  function openModal() {
    setFormName("");
    setFormDescription("");
    setFormTool("");
    setFormPackage("");
    setFormIsNative(true);
    setShowModal(true);
    setSubmitting(false);
  }

  function closeModal() {
    setShowModal(false);
  }

  async function handleDelete(id: string) {
    if (!session?.token || !confirm("Are you sure you want to delete this tool?")) return;
    try {
      await deleteTool(id, session.token);
      load();
    } catch { }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!session?.token || !formName.trim() || !formTool.trim()) return;
    setSubmitting(true);
    try {
      await createTool({
        name: formName.trim(),
        description: formDescription.trim() || undefined,
        tool: formTool.trim(),
        package: formPackage.trim() || undefined,
        isNative: formIsNative,
      }, session.token);
      closeModal();
      load();
    } catch { }
    finally { setSubmitting(false); }
  }

  if (loading) return <main className="page-layout"><p>Loading...</p></main>;

  return (
    <main className="page-layout">
      <div className="page-header">
        <h2>Tools</h2>
        <button className="primary-button" onClick={openModal}>
          New Tool
        </button>
      </div>

      {tools.length === 0 ? (
        <p className="muted">No tools found.</p>
      ) : (
        <div className="card-grid">
          {tools.map((tool) => (
            <div key={tool.id} className="card">
              <div className="card-body">
                <h3>{tool.name}</h3>
                <span className={`badge ${tool.isNative ? "badge-native" : "badge-external"}`}>
                  {tool.isNative ? "Native" : "External"}
                </span>
                {tool.description && <p>{tool.description}</p>}
                <code className="tool-identifier">{tool.tool}</code>
                {tool.package && <small className="muted">pkg: {tool.package}</small>}
              </div>
              <div className="card-actions">
                <button className="ghost-button warn" onClick={() => handleDelete(tool.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>New Tool</h3>
            <form onSubmit={handleSubmit}>
              <label>
                Name
                <input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Tool name" required />
              </label>
              <label>
                Description
                <input value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Optional description" />
              </label>
              <label>
                Tool Identifier
                <input value={formTool} onChange={(e) => setFormTool(e.target.value)} placeholder="Ex: listQueries" required />
              </label>
              <label className="toggle-label">
                <div className="toggle-wrapper">
                  <span>Native</span>
                  <button
                    type="button"
                    className={`toggle-root ${formIsNative ? "toggle-on" : "toggle-off"}`}
                    onClick={() => setFormIsNative((v) => !v)}
                    role="switch"
                    aria-checked={formIsNative}
                  >
                    <span className="toggle-thumb" />
                  </button>
                </div>
              </label>
              <label>
                Package
                <input value={formPackage} onChange={(e) => setFormPackage(e.target.value)} placeholder="Nome do pacote npm" />
              </label>
              <div className="modal-actions">
                <button type="button" className="ghost-button" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="primary-button" disabled={submitting}>
                  {submitting ? "Saving..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
