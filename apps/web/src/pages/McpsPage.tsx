import { useEffect, useState } from "react";
import { createMcp, deleteMcp, listMcps } from "../api";
import { loadSession } from "../auth";
import type { Mcp } from "../types";

export function McpsPage() {
  const session = loadSession();
  const [mcps, setMcps] = useState<Mcp[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formType, setFormType] = useState<"remote" | "stdio">("remote");
  const [formUrl, setFormUrl] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formHeaders, setFormHeaders] = useState("");
  const [formCommand, setFormCommand] = useState("");
  const [formArgs, setFormArgs] = useState("");
  const [formEnvs, setFormEnvs] = useState("");
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
    setFormType("remote");
    setFormUrl("");
    setFormDescription("");
    setFormHeaders("");
    setFormCommand("");
    setFormArgs("");
    setFormEnvs("");
    setShowModal(true);
    setSubmitting(false);
  }

  function closeModal() {
    setShowModal(false);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!session?.token) return;
    setSubmitting(true);

    if (formType === "remote") {
      if (!formUrl.trim()) { setSubmitting(false); return; }
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
          type: "remote",
          url: formUrl.trim(),
          description: formDescription.trim() || undefined,
          headers,
        }, session.token);
        closeModal();
        load();
      } catch { }
      finally { setSubmitting(false); }
    } else {
      if (!formCommand.trim()) { setSubmitting(false); return; }
      try {
        await createMcp({
          type: "stdio",
          command: formCommand.trim(),
          description: formDescription.trim() || undefined,
          args: formArgs.trim() || undefined,
          envs: formEnvs.trim() || undefined,
        }, session.token);
        closeModal();
        load();
      } catch { }
      finally { setSubmitting(false); }
    }
  }

  async function handleDelete(mcp: Mcp) {
    if (!session?.token || !confirm(`Are you sure you want to delete the MCP "${mcp.description || mcp.url || mcp.command}"?`)) return;
    try {
      await deleteMcp(mcp.id, session.token);
      load();
    } catch { }
  }

  function formatEnvs(envs: string | null): string {
    if (!envs) return "-";
    return envs.split("\n").join(", ");
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
        <table className="payload-table tool-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Description</th>
              <th>Endpoint</th>
              <th>Args / Headers</th>
              <th>Created</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {mcps.map((mcp) => (
              <tr key={mcp.id}>
                <td>
                  <span className={`badge ${mcp.type === "stdio" ? "badge-stdio" : "badge-remote"}`}>
                    {mcp.type}
                  </span>
                </td>
                <td>{mcp.description || "No description"}</td>
                <td>
                  {mcp.type === "remote" ? (
                    <code className="tool-identifier">{mcp.url}</code>
                  ) : (
                    <code className="tool-identifier">{mcp.command}</code>
                  )}
                </td>
                <td style={{ fontSize: "0.8rem", whiteSpace: "normal", wordBreak: "break-all" }}>
                  {mcp.type === "remote" ? (
                    mcp.headers ? (
                      <pre className="muted" style={{ margin: 0, fontSize: "0.75rem" }}>
                        {JSON.stringify(mcp.headers, null, 2)}
                      </pre>
                    ) : "-"
                  ) : (
                    <>
                      {mcp.args ? <div><strong>Args:</strong> {mcp.args}</div> : null}
                      {mcp.envs ? <div><strong>Envs:</strong> {formatEnvs(mcp.envs)}</div> : null}
                      {!mcp.args && !mcp.envs ? "-" : null}
                    </>
                  )}
                </td>
                <td><small className="muted">{new Date(mcp.createdAt).toLocaleDateString()}</small></td>
                <td>
                  <button className="ghost-button warn" onClick={() => handleDelete(mcp)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>New MCP</h3>
            <form onSubmit={handleSubmit}>
              <label>
                Type
                <select value={formType} onChange={(e) => setFormType(e.target.value as "remote" | "stdio")}>
                  <option value="remote">Remote (HTTP)</option>
                  <option value="stdio">Stdio</option>
                </select>
              </label>

              {formType === "remote" ? (
                <>
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
                </>
              ) : (
                <>
                  <label>
                    Command
                    <input value={formCommand} onChange={(e) => setFormCommand(e.target.value)} placeholder="e.g. bunx or uvx or docker" required />
                  </label>
                  <label>
                    Args
                    <input value={formArgs} onChange={(e) => setFormArgs(e.target.value)} placeholder="e.g. -y @node2flow/telegram-bot-mcp" />
                  </label>
                  <label>
                    Description
                    <input value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Optional description" />
                  </label>
                  <label>
                    Envs (one per line, KEY=VALUE)
                    <textarea
                      value={formEnvs}
                      onChange={(e) => setFormEnvs(e.target.value)}
                      placeholder={"TELEGRAM_BOT_TOKEN=abc123\nNODE_ENV=production"}
                      rows={4}
                      style={{ fontFamily: "monospace", fontSize: "0.85rem" }}
                    />
                  </label>
                </>
              )}

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
