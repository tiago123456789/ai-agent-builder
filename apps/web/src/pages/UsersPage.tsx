import { useEffect, useState } from "react";
import {
  createUser,
  deleteUser,
  listUsers,
  updateUser,
  listGroupToolsAllowed,
  createGroupToolsAllowed,
  deleteGroupToolsAllowed,
  listGroupToolsAllowedTools,
  linkGroupToolsAllowedTools,
  listTools,
  listMcps,
  listControlGroupRag,
} from "../api";
import { loadSession } from "../auth";
import type { User, GroupToolsAllowed, ControlGroupRag, Tool, Mcp } from "../types";

export function UsersPage() {
  const session = loadSession();
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<GroupToolsAllowed[]>([]);
  const [controlGroups, setControlGroups] = useState<ControlGroupRag[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRule, setFormRule] = useState<"admin" | "employee">("employee");
  const [formGroupId, setFormGroupId] = useState<string>("");
  const [formControlGroupRagId, setFormControlGroupRagId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupFormTitle, setGroupFormTitle] = useState("");
  const [groupFormDescription, setGroupFormDescription] = useState("");
  const [savingGroup, setSavingGroup] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [allTools, setAllTools] = useState<Tool[]>([]);
  const [allMcps, setAllMcps] = useState<Mcp[]>([]);
  const [linkedToolIds, setLinkedToolIds] = useState<Set<string>>(new Set());
  const [linkedMcpIds, setLinkedMcpIds] = useState<Set<string>>(new Set());
  const [savingGroupTools, setSavingGroupTools] = useState(false);

  async function loadUsers() {
    if (!session?.token) return;
    try {
      const { users } = await listUsers(session.token);
      setUsers(users);
    } catch { }
    finally { setLoading(false); }
  }

  async function loadGroups() {
    if (!session?.token) return;
    try {
      const { groups } = await listGroupToolsAllowed(session.token);
      setGroups(groups);
    } catch { }
  }

  async function loadControlGroups() {
    if (!session?.token) return;
    try {
      const { groups } = await listControlGroupRag(session.token);
      setControlGroups(groups);
    } catch { }
  }

  useEffect(() => { loadUsers(); loadGroups(); loadControlGroups(); }, []);

  function openCreateModal() {
    setEditingUser(null);
    setFormName("");
    setFormEmail("");
    setFormPassword("");
    setFormRule("employee");
    setFormGroupId("");
    setFormControlGroupRagId("");
    setShowModal(true);
    setSubmitting(false);
  }

  function openEditModal(user: User) {
    setEditingUser(user);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormPassword("");
    setFormRule(user.rule);
    setFormGroupId(user.groupToolsAllowedId ?? "");
    setFormControlGroupRagId(user.controlGroupRagId ?? "");
    setShowModal(true);
    setSubmitting(false);
  }

  function closeModal() {
    setShowModal(false);
    setEditingUser(null);
    setFormName("");
    setFormEmail("");
    setFormPassword("");
    setFormRule("employee");
    setFormGroupId("");
    setFormControlGroupRagId("");
    setSubmitting(false);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!session?.token) return;
    setSubmitting(true);
    try {
      if (editingUser) {
        const payload: { name: string; email: string; rule: "admin" | "employee"; password?: string; groupToolsAllowedId?: string | null; controlGroupRagId?: string | null } = {
          name: formName.trim(),
          email: formEmail.trim(),
          rule: formRule,
          groupToolsAllowedId: formRule === "employee" ? (formGroupId || null) : null,
          controlGroupRagId: formControlGroupRagId || null,
        };
        if (formPassword.trim()) {
          payload.password = formPassword.trim();
        }
        await updateUser(editingUser.id, payload, session.token);
      } else {
        await createUser(
          {
            name: formName.trim(),
            email: formEmail.trim(),
            password: formPassword.trim(),
            rule: formRule,
            groupToolsAllowedId: formRule === "employee" ? (formGroupId || null) : null,
            controlGroupRagId: formControlGroupRagId || null,
          },
          session.token,
        );
      }
      closeModal();
      await loadUsers();
    } catch { }
    finally { setSubmitting(false); }
  }

  async function handleDelete(id: string) {
    if (!session?.token || !confirm("Are you sure you want to delete this user?")) return;
    try {
      await deleteUser(id, session.token);
      await loadUsers();
    } catch { }
  }

  async function openGroupModal() {
    setShowGroupModal(true);
    setGroupFormTitle("");
    setGroupFormDescription("");
    setSelectedGroupId("");
    setAllTools([]);
    setAllMcps([]);
    setLinkedToolIds(new Set());
    setLinkedMcpIds(new Set());
    await loadGroups();
  }

  async function handleCreateGroup(event: React.FormEvent) {
    event.preventDefault();
    if (!session?.token || !groupFormTitle.trim() || !groupFormDescription.trim()) return;
    setSavingGroup(true);
    try {
      await createGroupToolsAllowed(
        { title: groupFormTitle.trim(), description: groupFormDescription.trim() },
        session.token,
      );
      setGroupFormTitle("");
      setGroupFormDescription("");
      await loadGroups();
    } catch { }
    finally { setSavingGroup(false); }
  }

  async function handleSelectGroup(groupId: string) {
    setSelectedGroupId(groupId);
    if (!groupId || !session?.token) {
      setAllTools([]);
      setAllMcps([]);
      setLinkedToolIds(new Set());
      setLinkedMcpIds(new Set());
      return;
    }
    try {
      const [allT, allM, linked] = await Promise.all([
        listTools(session.token),
        listMcps(session.token),
        listGroupToolsAllowedTools(groupId, session.token),
      ]);
      setAllTools(allT.tools);
      setAllMcps(allM.mcps);
      const toolIds = linked.tools.filter((t) => t.type === "TOOL").map((t) => t.toolId);
      const mcpIds = linked.tools.filter((t) => t.type === "MCP").map((t) => t.toolId);
      setLinkedToolIds(new Set(toolIds));
      setLinkedMcpIds(new Set(mcpIds));
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

  function toggleMcp(mcpId: string) {
    setLinkedMcpIds((prev) => {
      const next = new Set(prev);
      if (next.has(mcpId)) next.delete(mcpId);
      else next.add(mcpId);
      return next;
    });
  }

  async function handleSaveGroupTools() {
    if (!session?.token || !selectedGroupId) return;
    setSavingGroupTools(true);
    try {
      const entries = [
        ...Array.from(linkedToolIds).map((id) => ({ toolId: id, type: "TOOL" as const })),
        ...Array.from(linkedMcpIds).map((id) => ({ toolId: id, type: "MCP" as const })),
      ];
      await linkGroupToolsAllowedTools(selectedGroupId, entries, session.token);
    } catch { }
    finally { setSavingGroupTools(false); }
  }

  async function handleDeleteGroup(groupId: string) {
    if (!session?.token || !confirm("Are you sure you want to delete this group? Users assigned to it will have no group.")) return;
    try {
      await deleteGroupToolsAllowed(groupId, session.token);
      if (selectedGroupId === groupId) {
        setSelectedGroupId("");
        setAllTools([]);
        setAllMcps([]);
        setLinkedToolIds(new Set());
        setLinkedMcpIds(new Set());
      }
      await loadGroups();
      await loadUsers();
    } catch { }
  }

  if (loading) return <main className="page-layout"><p>Loading...</p></main>;

  return (
    <main className="page-layout">
      <div className="page-header">
        <h2>Users</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="ghost-button" onClick={openGroupModal}>
            Group of Tools
          </button>
          <button className="primary-button" onClick={openCreateModal}>
            New User
          </button>
        </div>
      </div>

      {users.length === 0 ? (
        <p className="muted">No users found.</p>
      ) : (
        <table className="payload-table" style={{ width: "100%" }}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Group</th>
              <th>Control Group RAG</th>
              <th>Created at</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>
                  <span className={`badge ${user.rule === "admin" ? "badge-native" : "badge-external"}`}>
                    {user.rule === "admin" ? "Admin" : "Employee"}
                  </span>
                </td>
                <td>
                  {user.groupToolsAllowedId
                    ? groups.find((g) => g.id === user.groupToolsAllowedId)?.title ?? "-"
                    : <span className="muted">-</span>
                  }
                </td>
                <td>
                  {user.controlGroupRagId
                    ? controlGroups.find((g) => g.id === user.controlGroupRagId)?.title ?? "-"
                    : <span className="muted">-</span>
                  }
                </td>
                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                <td>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="ghost-button small" onClick={() => openEditModal(user)}>
                      Edit
                    </button>
                    <button className="ghost-button small warn" onClick={() => handleDelete(user.id)}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editingUser ? "Edit User" : "New User"}</h3>
            <form onSubmit={handleSubmit}>
              <label>
                Name
                <input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="User name" required />
              </label>
              <label>
                Email
                <input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="email@example.com" required />
              </label>
              <label>
                Password{editingUser ? " (leave blank to keep)" : ""}
                <input
                  type="password"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder={editingUser ? "New password..." : "Password"}
                  required={!editingUser}
                />
              </label>
              <label>
                Role
                <select value={formRule} onChange={(e) => setFormRule(e.target.value as "admin" | "employee")}>
                  <option value="employee">Employee</option>
                  <option value="admin">Admin</option>
                </select>
              </label>
              {formRule === "employee" && (
                <label>
                  Group
                  <select value={formGroupId} onChange={(e) => setFormGroupId(e.target.value)}>
                    <option value="">No group</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>{g.title}</option>
                    ))}
                  </select>
                </label>
              )}
              <label>
                Control Group RAG
                <select value={formControlGroupRagId} onChange={(e) => setFormControlGroupRagId(e.target.value)}>
                  <option value="">No group</option>
                  {controlGroups.map((g) => (
                    <option key={g.id} value={g.id}>{g.title}</option>
                  ))}
                </select>
              </label>
              <div className="modal-actions">
                <button type="button" className="ghost-button" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="primary-button" disabled={submitting}>
                  {submitting ? "Saving..." : editingUser ? "Save" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showGroupModal && (
        <div className="modal-overlay" onClick={() => setShowGroupModal(false)}>
          <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
            <h3>Group of Tools</h3>

            <div style={{ display: "flex", gap: 24, marginBottom: 20 }}>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: "0 0 8px" }}>Create New Group</h4>
                <form onSubmit={handleCreateGroup}>
                  <label>
                    Title
                    <input value={groupFormTitle} onChange={(e) => setGroupFormTitle(e.target.value)} placeholder="Group name" required />
                  </label>
                  <label>
                    Description
                    <input value={groupFormDescription} onChange={(e) => setGroupFormDescription(e.target.value)} placeholder="Group description" required />
                  </label>
                  <button type="submit" className="primary-button" disabled={savingGroup} style={{ marginTop: 4 }}>
                    {savingGroup ? "Creating..." : "Create Group"}
                  </button>
                </form>
              </div>

              <div style={{ flex: 1 }}>
                <h4 style={{ margin: "0 0 8px" }}>Select Group to Configure</h4>
                {groups.length === 0 ? (
                  <p className="muted">No groups created yet.</p>
                ) : (
                  <label>
                    Group
                    <select value={selectedGroupId} onChange={(e) => handleSelectGroup(e.target.value)}>
                      <option value="">Choose a group...</option>
                      {groups.map((g) => (
                        <option key={g.id} value={g.id}>{g.title}</option>
                      ))}
                    </select>
                  </label>
                )}
                {selectedGroupId && (
                  <button
                    className="ghost-button warn"
                    style={{ marginTop: 8 }}
                    onClick={() => handleDeleteGroup(selectedGroupId)}
                  >
                    Delete Group
                  </button>
                )}
              </div>
            </div>

            {selectedGroupId && (
              <>
                <hr className="dropdown-divider" style={{ margin: "12px 0" }} />
                <h4 style={{ margin: "0 0 8px" }}>Allowed Tools</h4>
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
                      </tr>
                    </thead>
                    <tbody>
                      {allTools.map((tool) => (
                        <tr key={tool.id}>
                          <td>
                            <input type="checkbox" checked={linkedToolIds.has(tool.id)} onChange={() => toggleTool(tool.id)} />
                          </td>
                          <td>{tool.name}</td>
                          <td>{tool.description ?? "-"}</td>
                          <td>{tool.isNative ? "Native" : "External"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                <h4 style={{ margin: "16px 0 8px" }}>Allowed MCPs</h4>
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
                      </tr>
                    </thead>
                    <tbody>
                      {allMcps.map((mcp) => (
                        <tr key={mcp.id}>
                          <td>
                            <input type="checkbox" checked={linkedMcpIds.has(mcp.id)} onChange={() => toggleMcp(mcp.id)} />
                          </td>
                          <td><span className={`badge ${mcp.type === "stdio" ? "badge-stdio" : "badge-remote"}`}>{mcp.type}</span></td>
                          <td>{mcp.description ?? "-"}</td>
                          <td><code>{mcp.type === "remote" ? mcp.url : mcp.command}</code></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            )}

            <div className="modal-actions">
              <button className="ghost-button" onClick={() => setShowGroupModal(false)}>
                Close
              </button>
              {selectedGroupId && (
                <button className="primary-button" onClick={handleSaveGroupTools} disabled={savingGroupTools}>
                  {savingGroupTools ? "Saving..." : "Save Tools"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
