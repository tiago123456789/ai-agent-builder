export type SavedQuery = {
  id?: string;
  name: string;
  query: string;
  createdAt?: string;
  updatedAt?: string;
  triggerUrl?: string;
};

export type AgentAction = {
  type: "save_query" | "list_queries";
  status: "success" | "error";
  message: string;
  data?: Array<{ [key: string]: any }>;
  howToShow?: "table" | "string";
};

export type AgentChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type AgentResponse = {
  message: string;
  queries: SavedQuery[];
  actions: AgentAction[];
  metadata: {
    timestamp: string;
    model: string;
  };
};

export type AuthResponse = {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    rule: "admin" | "employee";
  };
};

export type User = {
  id: string;
  name: string;
  email: string;
  rule: "admin" | "employee";
  groupToolsAllowedId: string | null;
  createdAt: string;
};

export type RagDataStore = {
  id: string;
  description: string;
  createdAt: string;
};

export type Agent = {
  id: string;
  name: string;
  slug: string;
  systemPrompt: string;
  hasRagEnabled: boolean;
  ragDataStoreId: string | null;
  guardrailEnabled: boolean;
  guardrailRules: string | null;
  tracingEnabled: boolean;
  tracingUrl: string | null;
  tracingAigatewayId: string | null;
  hasSemanticCache: boolean;
  hasPersistSessionMessage: boolean;
  model: string;
  temperature: number;
  apiKey: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Mcp = {
  id: string;
  description: string | null;
  url: string | null;
  headers: Record<string, string> | null;
  type: "remote" | "stdio";
  command: string | null;
  args: string | null;
  envs: string | null;
  createdAt: string;
};

export type Tool = {
  id: string;
  name: string;
  description: string | null;
  tool: string;
  package: string | null;
  isNative: boolean;
  createdAt: string;
};

export type Skill = {
  id: string;
  name: string;
  description: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type GroupToolsAllowed = {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
};

export type GroupTool = {
  id: string;
  groupToolsAllowedId: string;
  toolId: string;
  type: "TOOL" | "MCP";
  createdAt: string;
  updatedAt: string;
};

export type ModelInfo = {
  id: string;
  name: string;
};

export type AgentRequest = {
  agentSlug: string;
  message: string;
  history: AgentChatMessage[];
};

export type UserQuestionNoAnswer = {
  id: string;
  question: string;
  sessionId: string;
  agentId: string;
  createdAt: string;
  updatedAt: string;
};

export type MultiAgent = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  nodes: Array<{ id: string; triggerWhen: string }> | null;
  createdAt: string;
  updatedAt: string;
};
