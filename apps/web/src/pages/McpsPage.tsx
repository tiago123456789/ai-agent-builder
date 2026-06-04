import { useEffect, useState } from "react";
import { createMcp, deleteMcp, listMcps } from "../api";
import { loadSession } from "../auth";
import type { Mcp } from "../types";

export function McpsPage() {
  const session = loadSession();
  const [mcps, setMcps] = useState<Mcp[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formUrl, setFormUrl] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formHeaders, setFormHeaders] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function load() {
    if (!session?.token) return;
    listMcps(session.token)
      .then(({ mcps }) => setMcps(mcps))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  function openModal() {
    setFormUrl("");
    setFormDescription("");
    setFormHeaders("");
    setShowModal(true);
    setSubmitting(false);
  }

  function closeModal() {
    setShowModal(false);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!session?.token || !formUrl.trim()) return;
    setSubmitting(true);
    let headers: Record<string, string> | undefined;
    if (formHeaders.trim()) {
      try {
        headers = JSON.parse(formHeaders.trim());
      } catch {
        alert("Invalid headers. Enter valid JSON or leave empty.");
        setSubmitting(false);
        return;
      }
    }
    try {
      await createMcp({
        url: formUrl.trim(),
        description: formDescription.trim() || undefined,
        headers,
      }, session.token);
      closeModal();
      load();
    } catch { }
    finally { setSubmitting(false); }
  }

  async function handleDelete(mcp: Mcp) {
    if (!session?.token || !confirm(`Are you sure you want to delete the MCP "${mcp.url}"?`)) return;
    try {
      await deleteMcp(mcp.id, session.token);
      load();
    } catch { }
  }

  if (loading) return <main className="page-layout"><p>Loading...</p></main>;

  return (
    <main className="page-layout">
      <div className="page-header">
        <h2>MCPs</h2>
        <button className="primary-button" onClick={openModal}>
          New MCP
        </button>
      </div>

      {mcps.length === 0 ? (
        <p className="muted">No MCPs found.</p>
      ) : (
        <div className="card-grid">
          {mcps.map((mcp) => (
            <div key={mcp.id} className="card">
              <div className="card-body">
                <h3>{mcp.description || "No description"}</h3>
                <code className="tool-identifier">{mcp.url}</code>
                {mcp.headers && (
                  <pre className="muted" style={{ fontSize: "0.75rem", margin: 0 }}>
                    {JSON.stringify(mcp.headers, null, 2)}
                  </pre>
                )}
                <small className="muted">Created at {new Date(mcp.createdAt).toLocaleDateString()}</small>
              </div>
              <div className="card-actions">
                <button className="ghost-button warn" onClick={() => handleDelete(mcp)}>
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
            <h3>New MCP</h3>
            <form onSubmit={handleSubmit}>
              <label>
                URL
                <input value={formUrl} onChange={(e) => setFormUrl(e.target.value)} placeholder="https://exemplo.com/mcp" required />
              </label>
              <label>
                Description
                <input value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Optional description" />
              </label>
              <label>
                Headers (JSON)
                <textarea
                  value={formHeaders}
                  onChange={(e) => setFormHeaders(e.target.value)}
                  placeholder='{"Authorization": "Bearer token"}'
                  rows={4}
                  style={{ fontFamily: "monospace", fontSize: "0.85rem" }}
                />
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
