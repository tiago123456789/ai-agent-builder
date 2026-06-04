import { FormEvent, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { sendAgentMessage } from "../api";
import { loadSession } from "../auth";
import type { AgentChatMessage, AgentResponse } from "../types";
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

export function AgentChatPage() {
  const session = loadSession();
  const { agentSlug } = useParams<{ agentSlug: string }>();
  const [input, setInput] = useState("");

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: crypto.randomUUID(),
      role: "assistant",
      content: `Connected to agent: ${agentSlug}`,
    },
  ]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");

  function buildHistory(sourceMessages: ChatMessage[]): AgentChatMessage[] {
    return sourceMessages.map((message) => ({
      role: message.role,
      content: message.content,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!input.trim() || !session?.token || !agentSlug) {
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
        agentSlug,
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
        <div className="chat-thread">
          {messages.map((message) => (
            <article
              key={message.id}
              className={`message-card ${message.role === "user" ? "user" : "assistant"}`}
            >
              <div className="message-meta">
                <span>{message.role === "user" ? "You" : agentSlug}</span>
              </div>

              <div className="prose max-w-none">
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </div>
              {/* <p style={{ whiteSpace: "pre-line" }}>{!isJson(message.content) && message.content}</p> */}

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
                            {action.type}: <br/>{action.message}
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
                            {item?.name && <span>Name: {item?.name}</span>}
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
            placeholder="Type your message..."
            rows={4}
          />
          <div className="chat-form-footer">
            {error ? <p className="error-text">{error}</p> : <span />}
            <button className="primary-button" disabled={isSending} type="submit">
              {isSending ? "Sending..." : "Send"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
