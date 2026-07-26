export type RagDataStore = {
  id: string;
  description: string;
  connection: string;
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

export type Tool = {
  id: string;
  name: string;
  description: string | null;
  tool: string;
  package: string | null;
  isNative: boolean;
  createdAt: string;
};

export type AgentTool = {
  agentId: string;
  toolId: string;
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

export type AgentMcp = {
  id: string;
  agentId: string;
  mcpId: string;
};

export type Skill = {
  id: string;
  name: string;
  description: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type SavedQuery = {
  id: string;
  name: string;
  query: string;
  createdAt: string;
  updatedAt: string;
  triggerUrl: string;
};

export type AgentAction = {
  type: "store_query" | "list_queries" | "update_query" | "list_customers" | "execute_query";
  status: "success" | "error";
  message: string;
  data?: Array<{[key: string]: any}>;
  howToShow?: "table"  | "string"
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

export type ControlGroupRag = {
  id: string;
  title: string;
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

export type AgentChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type AgentRequest = {
  message: string;
  history: AgentChatMessage[];
};
