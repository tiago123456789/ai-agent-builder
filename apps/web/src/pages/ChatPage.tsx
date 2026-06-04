import { FormEvent, useEffect, useState } from "react";
import { listAgents, sendAgentMessage } from "../api";
import { loadSession } from "../auth";
import type { Agent, AgentChatMessage, AgentResponse } from "../types";
import ReactMarkdown from 'react-markdown';

type ChatMessage =
  | { id: string; role: "user"; content: string }
  | { id: string; role: "assistant"; content: string; payload?: AgentResponse };

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) return "-";
  if (typeof value === "object" && !Array.isArray(value)) {
    return Object.values(value as Record<string, unknown>).join(", ");
  }
  if (Array.isArray(value)) {
    return value.map((item) =>
      typeof item === "object" && item !== null
        ? Object.values(item as Record<string, unknown>).join(", ")
        : String(item)
    ).join(", ");
  }
  return String(value);
}

function formatSql(sql: string) {
  try {
    if (!sql) return;
    if (sql?.trim()?.length) return;
    return (sql)
      .replace(/\b(AND\s|,\s|SELECT|FROM|JOIN|LEFT JOIN|RIGHT JOIN|INNER JOIN|OUTER JOIN|WHERE|GROUP BY|ORDER BY|HAVING|LIMIT)\b/gi, "\n$1")
      .trim();
  } catch (err) {
    console.log(err)
    return sql
  }
}

export function ChatPage() {
  const session = loadSession();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: crypto.randomUUID(),
      role: "assistant",
      content:
        "Describe the query you want to create, or ask to save/list queries.",
    },
  ]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  useEffect(() => {
    if (!session?.token) return;
    listAgents(session.token).then(({ agents }) => {
      setAgents(agents);
      if (agents.length > 0) {
        setSelectedAgent(agents[0]);
      }
    }).catch(() => { });
  }, []);

  function buildHistory(sourceMessages: ChatMessage[]): AgentChatMessage[] {
    return sourceMessages.map((message) => ({
      role: message.role,
      content: message.content,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!input.trim() || !session?.token || !selectedAgent) {
      return;
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
    };
    const history = buildHistory(messages);

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setError("");
    setIsSending(true);

    try {
      const payload = await sendAgentMessage(
        selectedAgent.slug,
        userMessage.content,
        history,
        session.token,
      );
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: payload.message,
        payload,
      };

      setMessages((current) => [...current, assistantMessage]);
    } catch (sendError) {
      setError(
        sendError instanceof Error ? sendError.message : "Failed to query the agent",
      );
    } finally {
      setIsSending(false);
    }
  }

  function isJson(value: string) {
    try {
      JSON.parse(value)
      return true
    } catch {
      return false
    }
  }

  return (
    <main className="chat-layout">
      <section className="chat-panel">
        <div className="agent-selector">
          <label>Agent:</label>
          <select
            value={selectedAgent?.slug ?? ""}
            onChange={(e) => {
              const agent = agents.find((a) => a.slug === e.target.value) ?? null;
              setSelectedAgent(agent);
              setMessages([
                {
                  id: crypto.randomUUID(),
                  role: "assistant",
                  content: `Conectado ao agente: ${agent?.name}`,
                },
              ]);
            }}
          >
            {agents.map((agent) => (
              <option key={agent.id} value={agent.slug}>
                {agent.name}
              </option>
            ))}
          </select>
        </div>

        <div className="chat-thread">
          {messages.map((message) => (
            <article
              key={message.id}
              className={`message-card ${message.role === "user" ? "user" : "assistant"}`}
            >
              <div className="message-meta">
                <span>{message.role === "user" ? "You" : selectedAgent?.name ?? "Agent"}</span>
              </div>

              <div className="prose max-w-none">
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </div>

              {/* <p>{!isJson(message.content) && message.content}</p> */}

              {message.role === "assistant" && message.payload ? (
                <div className="payload-block">
                  {message.payload.actions.length > 0 ? (
                    <div className="action-list">
                      {message.payload.actions.map((action, index) =>
                        action.howToShow === "table" && action.data && action.data.length > 0 ? (
                          <div className="payload-table-wrapper" key={`${action.type}-${index}`}>
                            <table className="payload-table">
                              <thead>
                                <tr>
                                  {Object.keys(action.data![0]).map((key) => (
                                    <th key={key}>{key}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {action.data!.map((row, rowIndex) => (
                                  <tr key={rowIndex}>
                                    {Object.keys(action.data![0]).map((key) => (
                                      <td key={key}>{formatCellValue(row[key])}</td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <span style={{ whiteSpace: "pre-wrap" }} className="action-chip" key={`${action.type}-${index}`}>
                            {action.type}: {action.message}
                          </span>
                        )
                      )}
                    </div>
                  ) : null}

                  {message?.payload?.queries?.length > 0 &&
                    <>
                      {message?.payload?.queries.map(item => {
                        return (
                          <>
                            {item?.name && <span>Name: {item?.name}</span>
                            }
                            <pre style={{ marginTop: "-10px" }}>{(
                              item.query ?? ""
                            ).replace(/\b(AND\s|,\s|WHEN|SELECT|FROM|JOIN|LEFT JOIN|RIGHT JOIN|INNER JOIN|OUTER JOIN|WHERE|GROUP BY|ORDER BY|HAVING|LIMIT)\b/gi, "\n$1")
                            }</pre>
                          </>
                        )
                      })}

                    </>

                  }
                </div>
              ) : null}
            </article>
          ))}
        </div>

        <form className="chat-form" onSubmit={handleSubmit}>
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Create a query for monthly sales or list saved queries..."
            rows={4}
          />
          <div className="chat-form-footer">
            {error ? <p className="error-text">{error}</p> : <span />}
            <button className="primary-button" disabled={isSending || !selectedAgent} type="submit">
              {isSending ? "Sending..." : "Send"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
