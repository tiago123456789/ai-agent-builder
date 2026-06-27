// import { useEffect, useState } from "react";
// import { listAgents, listMultiAgents, createMultiAgent, updateMultiAgent, deleteMultiAgent, getMultiAgent, runMultiAgent } from "../api";
// import { loadSession } from "../auth";
// import type { Agent, AgentChatMessage, MultiAgent } from "../types";

// export function MultiAgentsPage() {
//   const session = loadSession();
//   const [multiAgents, setMultiAgents] = useState<MultiAgent[]>([]);
//   const [loading, setLoading] = useState(true);

//   const [showFormModal, setShowFormModal] = useState(false);
//   const [editingId, setEditingId] = useState<string | null>(null);
//   const [formName, setFormName] = useState("");
//   const [formDescription, setFormDescription] = useState("");
//   const [formSystemPrompt, setFormSystemPrompt] = useState("");
//   const [allAgents, setAllAgents] = useState<Agent[]>([]);
//   const [selectedAgentIds, setSelectedAgentIds] = useState<Set<string>>(new Set());
//   const [submitting, setSubmitting] = useState(false);

//   const [runModal, setRunModal] = useState<MultiAgent | null>(null);
//   const [runMessage, setRunMessage] = useState("");
//   const [runHistory, setRunHistory] = useState<AgentChatMessage[]>([]);
//   const [runOutput, setRunOutput] = useState("");
//   const [running, setRunning] = useState(false);

//   const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

//   async function loadMultiAgents() {
//     if (!session?.token) return;
//     try {
//       const { multiAgents } = await listMultiAgents(session.token);
//       setMultiAgents(multiAgents);
//     } catch { }
//     finally { setLoading(false); }
//   }

//   useEffect(() => { loadMultiAgents(); }, []);

//   useEffect(() => {
//     function handleClickOutside() {
//       setOpenDropdownId(null);
//     }
//     document.addEventListener("click", handleClickOutside);
//     return () => document.removeEventListener("click", handleClickOutside);
//   }, []);

//   function toggleDropdown(id: string) {
//     setOpenDropdownId((prev) => (prev === id ? null : id));
//   }

//   async function loadAllAgents() {
//     if (!session?.token) return;
//     try {
//       const { agents } = await listAgents(session.token);
//       setAllAgents(agents);
//     } catch { }
//   }

//   async function openCreateModal() {
//     setEditingId(null);
//     setFormName("");
//     setFormDescription("");
//     setFormSystemPrompt("");
//     setSelectedAgentIds(new Set());
//     setShowFormModal(true);
//     setSubmitting(false);
//     await loadAllAgents();
//   }

//   async function openEditModal(multiAgent: MultiAgent) {
//     setEditingId(multiAgent.id);
//     setFormName(multiAgent.name);
//     setFormDescription(multiAgent.description ?? "");
//     setFormSystemPrompt(multiAgent.systemPrompt);
//     setShowFormModal(true);
//     setSubmitting(false);
//     await loadAllAgents();
//     if (session?.token) {
//       try {
//         const { agents } = await getMultiAgent(multiAgent.id, session.token);
//         setSelectedAgentIds(new Set(agents.map((a) => a.id)));
//       } catch { }
//     }
//   }

//   function closeFormModal() {
//     setShowFormModal(false);
//     setEditingId(null);
//     setFormName("");
//     setFormDescription("");
//     setFormSystemPrompt("");
//     setSelectedAgentIds(new Set());
//     setSubmitting(false);
//   }

//   function toggleAgent(agentId: string) {
//     setSelectedAgentIds((prev) => {
//       const next = new Set(prev);
//       if (next.has(agentId)) next.delete(agentId);
//       else next.add(agentId);
//       return next;
//     });
//   }

//   async function handleSubmit(event: React.FormEvent) {
//     event.preventDefault();
//     if (!session?.token || !formName.trim() || !formSystemPrompt.trim()) return;
//     setSubmitting(true);
//     try {
//       if (editingId) {
//         await updateMultiAgent(
//           editingId,
//           {
//             name: formName.trim(),
//             description: formDescription.trim() || undefined,
//             systemPrompt: formSystemPrompt.trim(),
//             agentIds: Array.from(selectedAgentIds),
//           },
//           session.token,
//         );
//       } else {
//         await createMultiAgent(
//           {
//             name: formName.trim(),
//             description: formDescription.trim() || undefined,
//             systemPrompt: formSystemPrompt.trim(),
//             agentIds: Array.from(selectedAgentIds),
//           },
//           session.token,
//         );
//       }
//       closeFormModal();
//       await loadMultiAgents();
//     } catch { }
//     finally { setSubmitting(false); }
//   }

//   async function handleDelete(id: string) {
//     if (!session?.token || !confirm("Are you sure you want to delete this multi agent?")) return;
//     try {
//       await deleteMultiAgent(id, session.token);
//       await loadMultiAgents();
//     } catch { }
//   }

//   async function openRunModal(multiAgent: MultiAgent) {
//     setRunModal(multiAgent);
//     setRunMessage("");
//     setRunHistory([]);
//     setRunOutput("");
//   }

//   async function handleRun() {
//     if (!session?.token || !runModal || !runMessage.trim()) return;
//     setRunning(true);
//     try {
//       const { output } = await runMultiAgent(runModal.id, { message: runMessage, history: runHistory }, session.token);
//       setRunOutput(output);
//       setRunHistory((prev) => [...prev, { role: "user", content: runMessage }, { role: "assistant", content: output }]);
//       setRunMessage("");
//     } catch { }
//     finally { setRunning(false); }
//   }

//   if (loading) return <main className="page-layout"><p>Loading...</p></main>;

//   return (
//     <main className="page-layout">
//       <div className="page-header">
//         <h2>Multi Agents</h2>
//         <button className="primary-button" onClick={openCreateModal}>
//           New Multi Agent
//         </button>
//       </div>

//       {multiAgents.length === 0 ? (
//         <p className="muted">No multi agents found.</p>
//       ) : (
//         <div className="card-grid">
//           {multiAgents.map((ma) => (
//             <div key={ma.id} className="card">
//               <div className="card-body">
//                 <h3>{ma.name}</h3>
//                 <p className="card-preview">{ma.description ? ma.description.slice(0, 120) : "No description"}</p>
//                 <small className="muted">Created {new Date(ma.createdAt).toLocaleDateString()}</small>
//               </div>
//               <div className="card-actions">
//                 <div className="dropdown-container">
//                   <button
//                     className="ghost-button dropdown-trigger"
//                     onClick={(e) => { e.stopPropagation(); toggleDropdown(ma.id); }}
//                   >
//                     Actions ▾
//                   </button>
//                   {openDropdownId === ma.id && (
//                     <div className="dropdown-menu" onClick={(e) => e.stopPropagation()}>
//                       <button className="dropdown-item" onClick={() => { setOpenDropdownId(null); openRunModal(ma); }}>
//                         Run
//                       </button>
//                       <button className="dropdown-item" onClick={() => { setOpenDropdownId(null); openEditModal(ma); }}>
//                         Edit
//                       </button>
//                       <hr className="dropdown-divider" />
//                       <button className="dropdown-item warn" onClick={() => { setOpenDropdownId(null); handleDelete(ma.id); }}>
//                         Delete
//                       </button>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}

//       {showFormModal && (
//         <div className="modal-overlay" onClick={closeFormModal}>
//           <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
//             <h3>{editingId ? "Edit Multi Agent" : "New Multi Agent"}</h3>
//             <form onSubmit={handleSubmit}>
//               <label>
//                 Name
//                 <input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Multi agent name" required />
//               </label>
//               <label>
//                 Description
//                 <textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Brief description..." rows={3} />
//               </label>
//               <label>
//                 System Prompt
//                 <textarea value={formSystemPrompt} onChange={(e) => setFormSystemPrompt(e.target.value)} placeholder="Orchestrator system instructions..." rows={8} required />
//               </label>
//               <label style={{ marginTop: 16, fontWeight: 600 }}>
//                 Agents
//               </label>
//               {allAgents.length === 0 ? (
//                 <p className="muted">No agents available.</p>
//               ) : (
//                 <table className="payload-table tool-table">
//                   <thead>
//                     <tr>
//                       <th></th>
//                       <th>Name</th>
//                       <th>Slug</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {allAgents.map((agent) => {
//                       const isSelected = selectedAgentIds.has(agent.id);
//                       return (
//                         <tr key={agent.id}>
//                           <td>
//                             <input type="checkbox" checked={isSelected} onChange={() => toggleAgent(agent.id)} />
//                           </td>
//                           <td>{agent.name}</td>
//                           <td><code>{agent.slug}</code></td>
//                         </tr>
//                       );
//                     })}
//                   </tbody>
//                 </table>
//               )}
//               <div className="modal-actions">
//                 <button type="button" className="ghost-button" onClick={closeFormModal}>
//                   Cancel
//                 </button>
//                 <button type="submit" className="primary-button" disabled={submitting}>
//                   {submitting ? "Saving..." : editingId ? "Save" : "Create"}
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}

//       {runModal && (
//         <div className="modal-overlay" onClick={() => setRunModal(null)}>
//           <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
//             <h3>Run - {runModal.name}</h3>
//             <div className="chat-messages" style={{ maxHeight: 300, overflowY: "auto", marginBottom: 16 }}>
//               {runHistory.map((msg, i) => (
//                 <div key={i} className={`chat-message ${msg.role}`}>
//                   <strong>{msg.role === "user" ? "You" : "Assistant"}:</strong>
//                   <p>{msg.content}</p>
//                 </div>
//               ))}
//               {runOutput && runHistory.length === 0 && (
//                 <div className="chat-message assistant">
//                   <strong>Assistant:</strong>
//                   <p>{runOutput}</p>
//                 </div>
//               )}
//             </div>
//             <div className="chat-input-row" style={{ display: "flex", gap: 8 }}>
//               <input
//                 value={runMessage}
//                 onChange={(e) => setRunMessage(e.target.value)}
//                 placeholder="Type your message..."
//                 style={{ flex: 1 }}
//                 onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleRun(); } }}
//               />
//               <button className="primary-button" onClick={handleRun} disabled={running || !runMessage.trim()}>
//                 {running ? "Running..." : "Send"}
//               </button>
//             </div>
//             <div className="modal-actions" style={{ marginTop: 16 }}>
//               <button className="ghost-button" onClick={() => setRunModal(null)}>
//                 Close
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </main>
//   );
// }
