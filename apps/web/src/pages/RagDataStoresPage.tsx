import { useEffect, useState } from "react";
import {
  createRagDataStore,
  listRagDataStores,
  addDocumentToDataStore,
  searchRagDocuments,
  updateRagDocument,
  deleteRagDocument,
  listControlGroupRag,
  createControlGroupRag,
  updateControlGroupRag,
  deleteControlGroupRag,
} from "../api";
import { loadSession } from "../auth";
import type { RagDataStore, ControlGroupRag } from "../types";

export function RagDataStoresPage() {
  const session = loadSession();
  const [stores, setStores] = useState<RagDataStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formDescription, setFormDescription] = useState("");
  const [formConnection, setFormConnection] = useState("");
  const [formGroupRagId, setFormGroupRagId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addStoreId, setAddStoreId] = useState<string | null>(null);
  const [addText, setAddText] = useState("");
  const [addGroupRagId, setAddGroupRagId] = useState<string>("");
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateStoreId, setUpdateStoreId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ id: string; content: string; score: number }[]>([]);
  const [searching, setSearching] = useState(false);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [updateSubmitting, setUpdateSubmitting] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const [controlGroups, setControlGroups] = useState<ControlGroupRag[]>([]);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupFormTitle, setGroupFormTitle] = useState("");
  const [savingGroup, setSavingGroup] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editGroupTitle, setEditGroupTitle] = useState("");

  async function loadStores() {
    if (!session?.token) return;
    try {
      const { ragDataStores } = await listRagDataStores(session.token);
      setStores(ragDataStores);
    } catch {}
    finally { setLoading(false); }
  }

  async function loadControlGroups() {
    if (!session?.token) return;
    try {
      const { groups } = await listControlGroupRag(session.token);
      setControlGroups(groups);
    } catch {}
  }

  useEffect(() => { loadStores(); loadControlGroups(); }, []);

  function openCreateModal() {
    setFormDescription("");
    setFormConnection("");
    setFormGroupRagId(session?.user?.controlGroupRagId ?? "");
    setShowModal(true);
    setSubmitting(false);
  }

  function closeModal() {
    setShowModal(false);
    setFormDescription("");
    setFormConnection("");
    setFormGroupRagId("");
    setSubmitting(false);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!session?.token || !formDescription.trim() || !formConnection.trim()) return;
    setSubmitting(true);
    try {
      await createRagDataStore(
        { description: formDescription.trim(), connection: formConnection.trim() },
        session.token,
      );
      closeModal();
      await loadStores();
    } catch {}
    finally { setSubmitting(false); }
  }

  function openAddModal(storeId: string) {
    setAddStoreId(storeId);
    setAddText("");
    setAddGroupRagId(session?.user?.controlGroupRagId ?? "");
    setAddSubmitting(false);
    setShowAddModal(true);
  }

  function closeAddModal() {
    setShowAddModal(false);
    setAddStoreId(null);
    setAddText("");
    setAddGroupRagId("");
    setAddSubmitting(false);
  }

  async function handleAddDocument(event: React.FormEvent) {
    event.preventDefault();
    if (!session?.token || !addStoreId || !addText.trim()) return;
    setAddSubmitting(true);
    try {
      await addDocumentToDataStore(addStoreId, addText.trim(), session.token, addGroupRagId || null);
      closeAddModal();
    } catch {}
    finally { setAddSubmitting(false); }
  }

  function openUpdateModal(storeId: string) {
    setUpdateStoreId(storeId);
    setSearchQuery("");
    setSearchResults([]);
    setEditingDocId(null);
    setEditContent("");
    setSearching(false);
    setUpdateSubmitting(false);
    setUpdateError(null);
    setShowUpdateModal(true);
  }

  function closeUpdateModal() {
    setShowUpdateModal(false);
    setUpdateStoreId(null);
    setSearchQuery("");
    setSearchResults([]);
    setEditingDocId(null);
    setEditContent("");
    setSearching(false);
    setUpdateSubmitting(false);
    setUpdateError(null);
  }

  async function handleSearch() {
    if (!session?.token || !updateStoreId || !searchQuery.trim()) return;
    setSearching(true);
    setEditingDocId(null);
    setUpdateError(null);
    try {
      const { results } = await searchRagDocuments(updateStoreId, searchQuery.trim(), session.token);
      setSearchResults(results);
    } catch (e) {
      setUpdateError(e instanceof Error ? e.message : "Search failed");
    }
    finally { setSearching(false); }
  }

  function startEdit(doc: { id: string; content: string }) {
    setEditingDocId(doc.id);
    setEditContent(doc.content);
  }

  function cancelEdit() {
    setEditingDocId(null);
    setEditContent("");
  }

  async function handleUpdate() {
    if (!session?.token || !updateStoreId || !editingDocId || !editContent.trim()) return;
    setUpdateSubmitting(true);
    setUpdateError(null);
    try {
      await updateRagDocument(updateStoreId, editingDocId, editContent.trim(), session.token);
      setEditingDocId(null);
      setEditContent("");
      setSearchResults((prev) =>
        prev.map((r) => (r.id === editingDocId ? { ...r, content: editContent.trim() } : r)),
      );
    } catch (e) {
      setUpdateError(e instanceof Error ? e.message : "Update failed");
    }
    finally { setUpdateSubmitting(false); }
  }

  async function handleRemove(docId: string) {
    if (!session?.token || !updateStoreId) return;
    if (!window.confirm("Are you sure you want to remove this document?")) return;
    setUpdateError(null);
    try {
      await deleteRagDocument(updateStoreId, docId, session.token);
      setSearchResults((prev) => prev.filter((r) => r.id !== docId));
    } catch (e) {
      setUpdateError(e instanceof Error ? e.message : "Remove failed");
    }
  }

  function openGroupModal() {
    setShowGroupModal(true);
    setGroupFormTitle("");
    setEditingGroupId(null);
    setEditGroupTitle("");
    loadControlGroups();
  }

  async function handleCreateGroup(event: React.FormEvent) {
    event.preventDefault();
    if (!session?.token || !groupFormTitle.trim()) return;
    setSavingGroup(true);
    try {
      await createControlGroupRag({ title: groupFormTitle.trim() }, session.token);
      setGroupFormTitle("");
      await loadControlGroups();
    } catch {}
    finally { setSavingGroup(false); }
  }

  function startEditGroup(group: ControlGroupRag) {
    setEditingGroupId(group.id);
    setEditGroupTitle(group.title);
  }

  function cancelEditGroup() {
    setEditingGroupId(null);
    setEditGroupTitle("");
  }

  async function handleUpdateGroup(id: string) {
    if (!session?.token || !editGroupTitle.trim()) return;
    try {
      await updateControlGroupRag(id, { title: editGroupTitle.trim() }, session.token);
      setEditingGroupId(null);
      setEditGroupTitle("");
      await loadControlGroups();
    } catch {}
  }

  async function handleDeleteGroup(id: string) {
    if (!session?.token || !window.confirm("Are you sure you want to delete this group?")) return;
    try {
      await deleteControlGroupRag(id, session.token);
      await loadControlGroups();
    } catch {}
  }

  if (loading) return <main className="page-layout"><p>Loading...</p></main>;

  return (
    <main className="page-layout">
      <div className="page-header">
        <h2>RAG Data Stores</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="ghost-button" onClick={openGroupModal}>
            Groups
          </button>
          <button className="primary-button" onClick={openCreateModal}>
            New Data Store
          </button>
        </div>
      </div>

      {stores.length === 0 ? (
        <p className="muted">No data stores found.</p>
      ) : (
        <table className="payload-table" style={{ width: "100%" }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Description</th>
              <th>Created at</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {stores.map((store) => (
              <tr key={store.id}>
                <td><code>{store.id.slice(0, 8)}...</code></td>
                <td>{store.description}</td>
                <td>{new Date(store.createdAt).toLocaleDateString()}</td>
                <td>
                  <button className="primary-button" onClick={() => openAddModal(store.id)} style={{ marginRight: 8 }}>
                    Add data
                  </button>
                  <button className="primary-button" onClick={() => openUpdateModal(store.id)}>
                    Update data
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
            <h3>New Data Store</h3>
            <form onSubmit={handleSubmit}>
              <label>
                Description
                <input
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Data store description..."
                  required
                />
              </label>
              <label>
                Connection (PostgreSQL)
                <input
                  value={formConnection}
                  onChange={(e) => setFormConnection(e.target.value)}
                  placeholder="postgresql://user:password@host:5432/dbname"
                  required
                />
              </label>
              <label>
                Control Group RAG
                <select value={formGroupRagId} onChange={(e) => setFormGroupRagId(e.target.value)}>
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
                  {submitting ? "Saving..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="modal-overlay" onClick={closeAddModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Add Document</h3>
            <form onSubmit={handleAddDocument}>
              <label>
                Text
                <textarea
                  value={addText}
                  onChange={(e) => setAddText(e.target.value)}
                  placeholder="Document content..."
                  rows={8}
                  required
                  style={{ width: "100%", resize: "vertical" }}
                />
              </label>
              <label>
                Control Group RAG
                <select value={addGroupRagId} onChange={(e) => setAddGroupRagId(e.target.value)}>
                  <option value="">No group</option>
                  {controlGroups.map((g) => (
                    <option key={g.id} value={g.id}>{g.title}</option>
                  ))}
                </select>
              </label>
              <div className="modal-actions">
                <button type="button" className="ghost-button" onClick={closeAddModal}>
                  Cancel
                </button>
                <button type="submit" className="primary-button" disabled={addSubmitting}>
                  {addSubmitting ? "Saving..." : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showUpdateModal && (
        <div className="modal-overlay" onClick={closeUpdateModal}>
          <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
            <h3>Update data</h3>

            <label>
              Search
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Type to search..."
                  onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
                />
                <button
                  className="primary-button"
                  onClick={handleSearch}
                  disabled={searching || !searchQuery.trim()}
                  style={{ whiteSpace: "nowrap" }}
                >
                  {searching ? "Searching..." : "Search"}
                </button>
              </div>
            </label>

            {searchResults.length > 0 && (
              <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
                {searchResults.map((doc) => (
                  <div
                    key={doc.id}
                    style={{
                      padding: 12,
                      borderRadius: 14,
                      border: "1px solid var(--line)",
                      background: "var(--surface-strong)",
                    }}
                  >
                    {editingDocId === doc.id ? (
                      <>
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={6}
                          style={{ width: "100%", resize: "vertical", marginBottom: 8 }}
                        />
                        <div className="modal-actions" style={{ margin: 0 }}>
                          <button className="ghost-button" onClick={cancelEdit}>
                            Cancel
                          </button>
                          <button
                            className="primary-button"
                            onClick={handleUpdate}
                            disabled={updateSubmitting || !editContent.trim()}
                          >
                            {updateSubmitting ? "Updating..." : "Confirm update"}
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <p style={{ margin: "0 0 8px", fontSize: 14, lineHeight: 1.5 }}>{doc.content}</p>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <small className="muted">Score: {(doc.score * 100).toFixed(1)}%</small>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button className="primary-button" onClick={() => startEdit(doc)}>
                              Update
                            </button>
                            <button className="ghost-button warn" onClick={() => {
                              console.log(doc)
                              handleRemove(doc.id)
                              }}>
                              Remove
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}

            {!searching && searchResults.length === 0 && searchQuery && (
              <p className="muted" style={{ marginTop: 16 }}>No results found.</p>
            )}

            {updateError && (
              <p className="error-text" style={{ marginTop: 16 }}>{updateError}</p>
            )}

            <div className="modal-actions">
              <button className="ghost-button" onClick={closeUpdateModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showGroupModal && (
        <div className="modal-overlay" onClick={() => setShowGroupModal(false)}>
          <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
            <h3>Control Group RAG</h3>

            <div style={{ marginBottom: 16 }}>
              <h4 style={{ margin: "0 0 8px" }}>Create New Group</h4>
              <form onSubmit={handleCreateGroup} style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                <label style={{ flex: 1, margin: 0 }}>
                  Title
                  <input
                    value={groupFormTitle}
                    onChange={(e) => setGroupFormTitle(e.target.value)}
                    placeholder="Group name"
                    required
                  />
                </label>
                <button type="submit" className="primary-button" disabled={savingGroup} style={{ height: 36 }}>
                  {savingGroup ? "Creating..." : "Create"}
                </button>
              </form>
            </div>

            <hr className="dropdown-divider" style={{ margin: "12px 0" }} />

            <h4 style={{ margin: "0 0 8px" }}>Existing Groups</h4>
            {controlGroups.length === 0 ? (
              <p className="muted">No groups created yet.</p>
            ) : (
              <table className="payload-table" style={{ width: "100%" }}>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Created at</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {controlGroups.map((group) => (
                    <tr key={group.id}>
                      <td>
                        {editingGroupId === group.id ? (
                          <input
                            value={editGroupTitle}
                            onChange={(e) => setEditGroupTitle(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") handleUpdateGroup(group.id); }}
                            style={{ width: "100%" }}
                          />
                        ) : (
                          group.title
                        )}
                      </td>
                      <td>{new Date(group.createdAt).toLocaleDateString()}</td>
                      <td>
                        {editingGroupId === group.id ? (
                          <div style={{ display: "flex", gap: 6 }}>
                            <button className="primary-button" onClick={() => handleUpdateGroup(group.id)}>
                              Save
                            </button>
                            <button className="ghost-button" onClick={cancelEditGroup}>
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: "flex", gap: 6 }}>
                            <button className="ghost-button" onClick={() => startEditGroup(group)}>
                              Edit
                            </button>
                            <button className="ghost-button warn" onClick={() => handleDeleteGroup(group.id)}>
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <div className="modal-actions">
              <button className="ghost-button" onClick={() => setShowGroupModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
