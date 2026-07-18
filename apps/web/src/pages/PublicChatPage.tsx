import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getPublicAgentInfo, sendPublicAgentMessage } from "../api";
import type { AgentChatMessage, AgentResponse } from "../types";
import ReactMarkdown from "react-markdown";

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

export function PublicChatPage() {
  const [searchParams] = useSearchParams();
  const apiKey = searchParams.get("apiKey") || "";
  const sessionId = searchParams.get("sessionId") || (() => {
    const stored = sessionStorage.getItem("public-chat-session-id");
    if (stored) return stored;
    const generated = crypto.randomUUID();
    sessionStorage.setItem("public-chat-session-id", generated);
    return generated;
  })();

  const [agentName, setAgentName] = useState<string>("");
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [infoError, setInfoError] = useState("");

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!apiKey) {
      setInfoError("Missing API key. Please provide a valid link.");
      setLoadingInfo(false);
      return;
    }

    getPublicAgentInfo(apiKey)
      .then((info) => {
        setAgentName(info.name);
        setMessages([{
          id: crypto.randomUUID(),
          role: "assistant",
          content: `Connected to agent: ${info.name}`,
        }]);
      })
      .catch(() => {
        setInfoError("Invalid or expired API key.");
      })
      .finally(() => setLoadingInfo(false));
  }, [apiKey]);

  function buildHistory(sourceMessages: ChatMessage[]): AgentChatMessage[] {
    return sourceMessages.map((message) => ({
      role: message.role,
      content: message.content,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!input.trim() || !apiKey) return;

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
      const payload = await sendPublicAgentMessage(
        apiKey,
        userMessage.content,
        history,
        sessionId,
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

  if (loadingInfo) {
    return (
      <main className="chat-layout">
        <section className="chat-panel">
          <p className="muted" style={{ textAlign: "center", padding: 40 }}>Loading...</p>
        </section>
      </main>
    );
  }

  if (infoError) {
    return (
      <main className="chat-layout">
        <section className="chat-panel">
          <p className="error-text" style={{ textAlign: "center", padding: 40 }}>{infoError}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="chat-layout">
      <section className="chat-panel">
        <div className="chat-public-header">
          <h3>{agentName}</h3>
        </div>

        <div className="chat-thread">
          {messages.map((message) => (
            <article
              key={message.id}
              className={`message-card ${message.role === "user" ? "user" : "assistant"}`}
            >
              <div className="message-meta">
                <span>{message.role === "user" ? "You" : agentName}</span>
              </div>

              <div className="prose max-w-none">
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </div>

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
