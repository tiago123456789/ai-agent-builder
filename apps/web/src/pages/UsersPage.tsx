import { useEffect, useState } from "react";
import { createUser, deleteUser, listUsers, updateUser } from "../api";
import { loadSession } from "../auth";
import type { User } from "../types";

export function UsersPage() {
  const session = loadSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRule, setFormRule] = useState<"admin" | "employee">("employee");
  const [submitting, setSubmitting] = useState(false);

  async function loadUsers() {
    if (!session?.token) return;
    try {
      const { users } = await listUsers(session.token);
      setUsers(users);
    } catch { }
    finally { setLoading(false); }
  }

  useEffect(() => { loadUsers(); }, []);

  function openCreateModal() {
    setEditingUser(null);
    setFormName("");
    setFormEmail("");
    setFormPassword("");
    setFormRule("employee");
    setShowModal(true);
    setSubmitting(false);
  }

  function openEditModal(user: User) {
    setEditingUser(user);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormPassword("");
    setFormRule(user.rule);
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
    setSubmitting(false);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!session?.token) return;
    setSubmitting(true);
    try {
      if (editingUser) {
        const payload: { name: string; email: string; rule: "admin" | "employee"; password?: string } = {
          name: formName.trim(),
          email: formEmail.trim(),
          rule: formRule,
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

  if (loading) return <main className="page-layout"><p>Loading...</p></main>;

  return (
    <main className="page-layout">
      <div className="page-header">
        <h2>Users</h2>
        <button className="primary-button" onClick={openCreateModal}>
          New User
        </button>
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
    </main>
  );
}
