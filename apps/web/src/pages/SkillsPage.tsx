import { useEffect, useState } from "react";
import { createSkill, deleteSkill, listSkills, updateSkill } from "../api";
import { loadSession } from "../auth";
import type { Skill } from "../types";

export function SkillsPage() {
  const session = loadSession();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formContent, setFormContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [viewingSkill, setViewingSkill] = useState<Skill | null>(null);

  async function loadSkills() {
    if (!session?.token) return;
    try {
      const { skills } = await listSkills(session.token);
      setSkills(skills);
    } catch { }
    finally { setLoading(false); }
  }

  useEffect(() => { loadSkills(); }, []);

  function openCreateModal() {
    setEditingSkill(null);
    setFormName("");
    setFormDescription("");
    setFormContent("");
    setShowModal(true);
    setSubmitting(false);
  }

  function openEditModal(skill: Skill) {
    setEditingSkill(skill);
    setFormName(skill.name);
    setFormDescription(skill.description ?? "");
    setFormContent(skill.content);
    setShowModal(true);
    setSubmitting(false);
  }

  function closeModal() {
    setShowModal(false);
    setEditingSkill(null);
    setFormName("");
    setFormDescription("");
    setFormContent("");
    setSubmitting(false);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!session?.token) return;
    setSubmitting(true);
    try {
      if (editingSkill) {
        await updateSkill(
          editingSkill.id,
          {
            name: formName.trim(),
            description: formDescription.trim() || undefined,
            content: formContent.trim(),
          },
          session.token,
        );
      } else {
        await createSkill(
          {
            name: formName.trim(),
            description: formDescription.trim() || undefined,
            content: formContent.trim(),
          },
          session.token,
        );
      }
      closeModal();
      await loadSkills();
    } catch { }
    finally { setSubmitting(false); }
  }

  async function handleDelete(id: string) {
    if (!session?.token || !confirm("Are you sure you want to delete this skill?")) return;
    try {
      await deleteSkill(id, session.token);
      await loadSkills();
    } catch { }
  }

  if (loading) return <main className="page-layout"><p>Loading...</p></main>;

  return (
    <main className="page-layout">
      <div className="page-header">
        <h2>Skills</h2>
        <button className="primary-button" onClick={openCreateModal}>
          Add Skill
        </button>
      </div>

      {skills.length === 0 ? (
        <p className="muted">No skills found.</p>
      ) : (
        <div className="card-grid">
          {skills.map((skill) => (
            <div key={skill.id} className="card">
              <div className="card-body">
                <h3>{skill.name}</h3>
                {skill.description && <p>{skill.description}</p>}
              </div>
              <div className="card-actions">
                <button className="ghost-button" onClick={() => setViewingSkill(skill)}>
                  View Content
                </button>
                <button className="ghost-button" onClick={() => openEditModal(skill)}>
                  Edit
                </button>
                <button className="ghost-button warn" onClick={() => handleDelete(skill.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
            <h3>{editingSkill ? "Edit Skill" : "New Skill"}</h3>
            <form onSubmit={handleSubmit}>
              <label>
                Name
                <input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Skill name" required />
              </label>
              <label>
                Description
                <input value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Optional description" />
              </label>
              <label>
                Content
                <textarea
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="Skill content"
                  rows={8}
                  required
                  style={{ resize: "vertical" }}
                />
              </label>
              <div className="modal-actions">
                <button type="button" className="ghost-button" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="primary-button" disabled={submitting}>
                  {submitting ? "Saving..." : editingSkill ? "Update" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewingSkill && (
        <div className="modal-overlay" onClick={() => setViewingSkill(null)}>
          <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
            <h3>{viewingSkill.name}</h3>
            <label>
              Content
              <textarea
                value={viewingSkill.content}
                readOnly
                rows={12}
                style={{ resize: "none", backgroundColor: "#f5f5f5" }}
              />
            </label>
            <div className="modal-actions">
              <button
                type="button"
                className="primary-button"
                onClick={() => setViewingSkill(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
