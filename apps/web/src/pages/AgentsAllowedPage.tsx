import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listAllowedAgents } from "../api";
import { loadSession } from "../auth";
import type { Agent } from "../types";

export function AgentsAllowedPage() {
  const session = loadSession();
  const navigate = useNavigate();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.token) return;
    listAllowedAgents(session.token)
      .then(({ agents }) => {
        setAgents(agents);
        if (agents.length > 0) {
          setSelectedAgent(agents[0]);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <main className="page-layout"><p>Loading...</p></main>;

  return (
    <main className="page-layout">
      <div className="page-header">
        <h2>Allowed Agents</h2>
      </div>

      {agents.length === 0 ? (
        <p className="muted">No agents available for you.</p>
      ) : (
        <div style={{ display: "grid", gap: 24, maxWidth: 480 }}>
          <label style={{ display: "grid", gap: 8, fontSize: 14, fontWeight: 600, color: "var(--muted)" }}>
            Select an agent to chat with
            <select
              value={selectedAgent?.slug ?? ""}
              onChange={(e) => {
                const agent = agents.find((a) => a.slug === e.target.value) ?? null;
                setSelectedAgent(agent);
              }}
              style={{
                borderRadius: 14,
                border: "1px solid var(--line)",
                background: "rgba(255,255,255,0.72)",
                padding: "10px 14px",
                fontSize: 14,
                color: "var(--ink)",
                cursor: "pointer",
              }}
            >
              {agents.map((agent) => (
                <option key={agent.id} value={agent.slug}>
                  {agent.name}
                </option>
              ))}
            </select>
          </label>

          {selectedAgent && (
            <button
              className="primary-button"
              onClick={() => navigate(`/chats/agent/${selectedAgent.slug}`)}
              style={{ width: "fit-content" }}
            >
              Start Chat with {selectedAgent.name}
            </button>
          )}
        </div>
      )}
    </main>
  );
}
