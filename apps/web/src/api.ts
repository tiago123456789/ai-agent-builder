import type {
  Agent,
  AgentChatMessage,
  AgentRequest,
  AgentResponse,
  AuthResponse,
  ControlGroupRag,
  GroupToolsAllowed,
  GroupTool,
  Mcp,
  ModelInfo,
  MultiAgent,
  RagDataStore,
  Skill,
  Tool,
  User,
  UserQuestionNoAnswer,
} from "./types";

// @ts-ignore
const API_BASE_URL = import.meta.env.VITE_API_URL

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message ?? "Request failed");
  }

  return data as T;
}

function authHeader(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

export function login(email: string, password: string) {
  return request<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function sendAgentMessage(
  agentSlug: string,
  message: string,
  history: AgentChatMessage[],
  token: string,
) {
  const payload: AgentRequest = { agentSlug, message, history };

  return request<AgentResponse>("/agents", {
    method: "POST",
    body: JSON.stringify(payload),
    headers: authHeader(token),
  });
}

export function listAgents(token: string) {
  return request<{ agents: Agent[] }>("/agents", {
    headers: authHeader(token),
  });
}

export function createAgent(
  data: { name: string; systemPrompt: string; hasRagEnabled?: boolean; ragDataStoreId?: string; guardrailEnabled?: boolean; guardrailRules?: string; tracingEnabled?: boolean; tracingUrl?: string; tracingAigatewayId?: string; hasSemanticCache?: boolean; hasPersistSessionMessage?: boolean; model?: string; temperature?: number },
  token: string,
) {
  return request<{ agent: Agent }>("/agents/create", {
    method: "POST",
    body: JSON.stringify(data),
    headers: authHeader(token),
  });
}

export function updateAgent(
  slug: string,
  data: { name?: string; systemPrompt?: string; hasRagEnabled?: boolean; ragDataStoreId?: string | null; guardrailEnabled?: boolean; guardrailRules?: string | null; tracingEnabled?: boolean; tracingUrl?: string | null; tracingAigatewayId?: string | null; hasSemanticCache?: boolean; hasPersistSessionMessage?: boolean; model?: string; temperature?: number },
  token: string,
) {
  return request<{ agent: Agent }>(`/agents/${slug}`, {
    method: "PUT",
    body: JSON.stringify(data),
    headers: authHeader(token),
  });
}

export function listRagDataStores(token: string) {
  return request<{ ragDataStores: RagDataStore[] }>("/rag-data-stores", {
    headers: authHeader(token),
  });
}

export function createRagDataStore(
  data: { description: string; connection: string; groupRagId?: string | null },
  token: string,
) {
  return request<{ ragDataStore: RagDataStore }>("/rag-data-stores", {
    method: "POST",
    body: JSON.stringify(data),
    headers: authHeader(token),
  });
}

export function addDocumentToDataStore(id: string, text: string, token: string, groupRagId?: string | null) {
  return request<{ success: boolean }>(`/rag-data-stores/${id}/documents`, {
    method: "POST",
    body: JSON.stringify({ text, groupRagId: groupRagId ?? null }),
    headers: authHeader(token),
  });
}

export function searchRagDocuments(storeId: string, query: string, token: string) {
  return request<{ results: { id: string; content: string; score: number }[] }>(
    `/rag-data-stores/${storeId}/search?q=${encodeURIComponent(query)}`,
    { headers: authHeader(token) },
  );
}

export function updateRagDocument(storeId: string, docId: string, content: string, token: string) {
  return request<{ success: boolean }>(`/rag-data-stores/${storeId}/documents/${docId}`, {
    method: "PUT",
    body: JSON.stringify({ content }),
    headers: authHeader(token),
  });
}

export function deleteRagDocument(storeId: string, docId: string, token: string) {
  return request<{ success: boolean }>(`/rag-data-stores/${storeId}/documents/${docId}`, {
    method: "DELETE",
    headers: authHeader(token),
  });
}

export function deleteAgent(slug: string, token: string) {
  return request<void>(`/agents/${slug}`, {
    method: "DELETE",
    headers: authHeader(token),
  });
}

export function createTool(
  data: { name: string; description?: string; tool: string; package?: string; isNative?: boolean },
  token: string,
) {
  return request<{ tool: Tool }>("/tools", {
    method: "POST",
    body: JSON.stringify(data),
    headers: authHeader(token),
  });
}

export function listTools(token: string) {
  return request<{ tools: Tool[] }>("/tools", {
    headers: authHeader(token),
  });
}

export function deleteTool(id: string, token: string) {
  return request<void>(`/tools/${id}`, {
    method: "DELETE",
    headers: authHeader(token),
  });
}

export function getAgentTools(slug: string, token: string) {
  return request<{ tools: Tool[] }>(`/agents/${slug}/tools`, {
    headers: authHeader(token),
  });
}

export function linkAgentTools(
  slug: string,
  toolIds: string[],
  token: string,
) {
  return request<void>(`/agents/${slug}/tools`, {
    method: "POST",
    body: JSON.stringify({ toolIds }),
    headers: authHeader(token),
  });
}

export function unlinkAgentTool(
  slug: string,
  toolId: string,
  token: string,
) {
  return request<void>(`/agents/${slug}/tools/${toolId}`, {
    method: "DELETE",
    headers: authHeader(token),
  });
}

export function listMcps(token: string) {
  return request<{ mcps: Mcp[] }>("/mcps", {
    headers: authHeader(token),
  });
}

export function createMcp(
  data: { description?: string; url?: string; headers?: Record<string, string>; type: "remote" | "stdio"; command?: string; args?: string; envs?: string },
  token: string,
) {
  return request<{ mcp: Mcp }>("/mcps", {
    method: "POST",
    body: JSON.stringify(data),
    headers: authHeader(token),
  });
}

export function deleteMcp(id: string, token: string) {
  return request<void>(`/mcps/${id}`, {
    method: "DELETE",
    headers: authHeader(token),
  });
}

export function getAgentMcps(slug: string, token: string) {
  return request<{ mcps: Mcp[] }>(`/agents/${slug}/mcps`, {
    headers: authHeader(token),
  });
}

export function linkAgentMcps(
  slug: string,
  mcpIds: string[],
  token: string,
) {
  return request<void>(`/agents/${slug}/mcps`, {
    method: "POST",
    body: JSON.stringify({ mcpIds }),
    headers: authHeader(token),
  });
}

export function unlinkAgentMcp(
  slug: string,
  mcpId: string,
  token: string,
) {
  return request<void>(`/agents/${slug}/mcps/${mcpId}`, {
    method: "DELETE",
    headers: authHeader(token),
  });
}

export function listUsers(token: string) {
  return request<{ users: User[] }>("/users", {
    headers: authHeader(token),
  });
}

export function createUser(
  data: { name: string; email: string; password: string; rule: "admin" | "employee"; groupToolsAllowedId?: string | null; controlGroupRagId?: string | null },
  token: string,
) {
  return request<{ user: User }>("/users", {
    method: "POST",
    body: JSON.stringify(data),
    headers: authHeader(token),
  });
}

export function updateUser(
  id: string,
  data: { name?: string; email?: string; password?: string; rule?: "admin" | "employee"; groupToolsAllowedId?: string | null; controlGroupRagId?: string | null },
  token: string,
) {
  return request<{ user: User }>(`/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
    headers: authHeader(token),
  });
}

export function deleteUser(id: string, token: string) {
  return request<void>(`/users/${id}`, {
    method: "DELETE",
    headers: authHeader(token),
  });
}

export function listAllowedAgents(token: string) {
  return request<{ agents: Agent[] }>("/agents/allowed", {
    headers: authHeader(token),
  });
}

export function getAgentUsers(slug: string, token: string) {
  return request<{ users: User[] }>(`/agents/${slug}/users`, {
    headers: authHeader(token),
  });
}

export function unlinkAgentUser(slug: string, userId: string, token: string) {
  return request<void>(`/agents/${slug}/users/${userId}`, {
    method: "DELETE",
    headers: authHeader(token),
  });
}

export function listModels(token: string) {
  return request<ModelInfo[]>("/models", {
    headers: authHeader(token),
  });
}

export function getAgentSkills(slug: string, token: string) {
  return request<{ skills: Skill[] }>(`/agents/${slug}/skills`, {
    headers: authHeader(token),
  });
}

export function linkAgentSkills(slug: string, skillIds: string[], token: string) {
  return request<void>(`/agents/${slug}/skills`, {
    method: "POST",
    body: JSON.stringify({ skillIds }),
    headers: authHeader(token),
  });
}

export function unlinkAgentSkill(slug: string, skillId: string, token: string) {
  return request<void>(`/agents/${slug}/skills/${skillId}`, {
    method: "DELETE",
    headers: authHeader(token),
  });
}

export function listSkills(token: string) {
  return request<{ skills: Skill[] }>("/skills", {
    headers: authHeader(token),
  });
}

export function getSkillById(id: string, token: string) {
  return request<{ skill: Skill }>(`/skills/${id}`, {
    headers: authHeader(token),
  });
}

export function createSkill(
  data: { name: string; description?: string; content: string },
  token: string,
) {
  return request<{ skill: Skill }>("/skills", {
    method: "POST",
    body: JSON.stringify(data),
    headers: authHeader(token),
  });
}

export function updateSkill(
  id: string,
  data: { name?: string; description?: string; content?: string },
  token: string,
) {
  return request<{ skill: Skill }>(`/skills/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
    headers: authHeader(token),
  });
}

export function deleteSkill(id: string, token: string) {
  return request<void>(`/skills/${id}`, {
    method: "DELETE",
    headers: authHeader(token),
  });
}

export function generateAgentApiKey(slug: string, token: string) {
  return request<{ apiKey: string }>(`/agents/${slug}/api-key`, {
    method: "POST",
    headers: authHeader(token),
  });
}

export function revokeAgentApiKey(slug: string, token: string) {
  return request<void>(`/agents/${slug}/api-key`, {
    method: "DELETE",
    headers: authHeader(token),
  });
}

export function linkAgentUsers(
  slug: string,
  userIds: string[],
  token: string,
) {
  return request<void>(`/agents/${slug}/users`, {
    method: "POST",
    body: JSON.stringify({ userIds }),
    headers: authHeader(token),
  });
}

export function listAgentQuestionsNoAnswer(
  slug: string,
  token: string,
  offset = 0,
  limit = 20,
) {
  return request<{ questions: UserQuestionNoAnswer[]; hasMore: boolean }>(
    `/agents/${slug}/questions-no-answer?offset=${offset}&limit=${limit}`,
    { headers: authHeader(token) },
  );
}

export function getPublicAgentInfo(apiKey: string) {
  return request<{ name: string; slug: string }>(
    `/agents/public/info?apiKey=${encodeURIComponent(apiKey)}`,
  );
}

export function sendPublicAgentMessage(
  apiKey: string,
  message: string,
  history: AgentChatMessage[],
  sessionId: string,
) {
  return request<AgentResponse>("/agents/public/chat", {
    method: "POST",
    body: JSON.stringify({ apiKey, sessionId, message, history }),
  });
}

export function listMultiAgents(token: string) {
  return request<{ multiAgents: MultiAgent[] }>("/multi-agents", {
    headers: authHeader(token),
  });
}

export function getMultiAgent(id: string, token: string) {
  return request<{ multiAgent: MultiAgent; agents: Agent[] }>(`/multi-agents/${id}`, {
    headers: authHeader(token),
  });
}

export function createMultiAgent(
  data: { name: string; shortDescription?: string; nodes?: Array<{ id: string; triggerWhen: string }> },
  token: string,
) {
  return request<{ multiAgent: MultiAgent }>("/multi-agents/create", {
    method: "POST",
    body: JSON.stringify(data),
    headers: authHeader(token),
  });
}

export function updateMultiAgent(
  id: string,
  data: { name?: string; shortDescription?: string | null; nodes?: Array<{ id: string; triggerWhen: string }> | null },
  token: string,
) {
  return request<{ multiAgent: MultiAgent }>(`/multi-agents/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
    headers: authHeader(token),
  });
}

export function deleteMultiAgent(id: string, token: string) {
  return request<void>(`/multi-agents/${id}`, {
    method: "DELETE",
    headers: authHeader(token),
  });
}

export function linkMultiAgentAgents(id: string, agentIds: string[], token: string) {
  return request<void>(`/multi-agents/${id}/agents`, {
    method: "POST",
    body: JSON.stringify({ agentIds }),
    headers: authHeader(token),
  });
}

export function unlinkMultiAgentAgent(id: string, agentId: string, token: string) {
  return request<void>(`/multi-agents/${id}/agents/${agentId}`, {
    method: "DELETE",
    headers: authHeader(token),
  });
}

export function listGroupToolsAllowed(token: string) {
  return request<{ groups: GroupToolsAllowed[] }>("/group-tools-allowed", {
    headers: authHeader(token),
  });
}

export function createGroupToolsAllowed(
  data: { title: string; description: string },
  token: string,
) {
  return request<{ group: GroupToolsAllowed }>("/group-tools-allowed", {
    method: "POST",
    body: JSON.stringify(data),
    headers: authHeader(token),
  });
}

export function getGroupToolsAllowed(id: string, token: string) {
  return request<{ group: GroupToolsAllowed }>(`/group-tools-allowed/${id}`, {
    headers: authHeader(token),
  });
}

export function updateGroupToolsAllowed(
  id: string,
  data: { title?: string; description?: string },
  token: string,
) {
  return request<{ group: GroupToolsAllowed }>(`/group-tools-allowed/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
    headers: authHeader(token),
  });
}

export function deleteGroupToolsAllowed(id: string, token: string) {
  return request<void>(`/group-tools-allowed/${id}`, {
    method: "DELETE",
    headers: authHeader(token),
  });
}

export function listGroupToolsAllowedTools(id: string, token: string) {
  return request<{ tools: GroupTool[] }>(`/group-tools-allowed/${id}/tools`, {
    headers: authHeader(token),
  });
}

export function linkGroupToolsAllowedTools(
  id: string,
  entries: Array<{ toolId: string; type: "TOOL" | "MCP" }>,
  token: string,
) {
  return request<void>(`/group-tools-allowed/${id}/tools`, {
    method: "POST",
    body: JSON.stringify({ entries }),
    headers: authHeader(token),
  });
}

export function unlinkGroupToolsAllowedTool(
  id: string,
  toolId: string,
  type: "TOOL" | "MCP",
  token: string,
) {
  return request<void>(`/group-tools-allowed/${id}/tools/${toolId}?type=${type}`, {
    method: "DELETE",
    headers: authHeader(token),
  });
}

export function listControlGroupRag(token: string) {
  return request<{ groups: ControlGroupRag[] }>("/control-group-rag", {
    headers: authHeader(token),
  });
}

export function createControlGroupRag(
  data: { title: string },
  token: string,
) {
  return request<{ group: ControlGroupRag }>("/control-group-rag", {
    method: "POST",
    body: JSON.stringify(data),
    headers: authHeader(token),
  });
}

export function updateControlGroupRag(
  id: string,
  data: { title?: string },
  token: string,
) {
  return request<{ group: ControlGroupRag }>(`/control-group-rag/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
    headers: authHeader(token),
  });
}

export function deleteControlGroupRag(id: string, token: string) {
  return request<void>(`/control-group-rag/${id}`, {
    method: "DELETE",
    headers: authHeader(token),
  });
}

export function sendMultiAgentMessage(
  id: string,
  message: string,
  history: AgentChatMessage[],
  token: string,
) {
  return request<AgentResponse>(`/multi-agents/${id}/chat`, {
    method: "POST",
    body: JSON.stringify({ message, history }),
    headers: authHeader(token),
  });
}
