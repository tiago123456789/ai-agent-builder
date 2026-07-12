# AI Agent Builder

## ABOUT

The project has focus to allow create AI agents with a simple interface, but only it you
can set the agents for specific employees.


## Features

- [x] Create AI agents
- [x] Set agents for specific employees
- [x] Chat with AI agents
- [x] Login
- [x] Tools(to execute actions on third apps). PS: the tools are using the Plugin architecture to allow add new tools easier without change the core code.
- [x] Remote Mcps integration where you can set the Mpcs servers the agents can access. PS: the mcps servers are using the Plugin architecture to allow add new Mpc server easier without change the core code.
- [x] RAG integration where you can set the RAG data store the agents can access.
   - [x] Add data on RAG
   - [x] Remove data from RAG
   - [x] Update RAG's data 
- [x] Create and set Skills to the agents you consider import to access the skill.
- [x] Admin panel
- [x] Track token cost, total requests, avg tokens per requests and track the user messages to the agents. PS: using MLflow for tracing.
- [x] Semantic cache to avoid interacting with LLMs for frequently asked questions, improving response time and reducing costs.
- [x] Persist messages exchanged between users and agents for conversation history and audit purposes.
- [x] Tool to track and save user questions/actions executed in background to avoid impacting user experience, helping admins improve prompts, RAG, and add new tools/MCPs to agents.

Monorepo with:

- `apps/api`: API in Bun + Express + LangChainJS + OpenAI + RAG(Postgres) + Tool + Mcp servers
- `apps/web`: React + Vite SPA for login and chat

## Architecture

![Architecture Flow](flow-architecture.png)

## Environment Variables

Copy `apps/api/.env.example` to `apps/api/.env` and fill in:

```env
PORT=3001

CORS_ORIGIN=http://localhost:5173
JWT_SECRET=
OPENAI_API_KEY=

DATABASE_URL=

SERPAPI_API_KEY=

DEFAULT_ADMIN_EMAIL= // default email
DEFAULT_ADMIN_PASSWORD= // default password

ENCRYPT_KEY=  # 64-character hex key for AES-256
```

> **ENCRYPT_KEY** is used by the AES-256-CBC algorithm to encrypt sensitive data at rest, such as MCP server headers and RAG data store connection strings. It must be a 256-bit (32-byte) key encoded as a 64-character hex string.

To generate a secure random key:

```bash
# Using openssl
openssl rand -hex 32

# Using bun
bun -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using node
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Example output: `a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2`

## Web Environment Variables

`apps/web/.env`:

```env
VITE_API_URL=http://localhost:3001
```

`VITE_API_URL` is the base URL of the API server (see `PORT` in the API config). Vite exposes this to the client via `import.meta.env`.

## Development

```bash
cd apps/api && bun install && bun run dev
cd apps/web && bun install && bun run dev
```

## Docker

Make sure [Docker](https://docs.docker.com/engine/install/) and [Docker Compose](https://docs.docker.com/compose/install/) are installed.

```bash
# Copy and configure environment variables (see "Environment Variables" above)
cp apps/api/.env.example apps/api/.env

# Build and start all services in detached mode
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down
```

The API will be available at `http://localhost:3001` and the web app at `http://localhost:5173`.

## How to Use the Agent API Outside the Agent Dashboard

1. Access the dashboard and navigate to the **/agents** page
2. Select the agent you want to interact with
3. Click on **Generate API Key** to create an API key for the agent
4. Use the API key to make requests to the public chat endpoint:

```bash
curl --request POST 'http://localhost:3001/agents/public/chat' \
  --header 'Content-Type: application/json' \
  --data-raw '{
    "apiKey": "your_api_key_here",
    "message": "Quais são os produtos oferecidos pela mi...",
    "history": []
  }'
```

Or with `agentSlug` and `history`:

```bash
curl --request POST 'http://localhost:3001/agents/public/chat' \
  --header 'Content-Type: application/json' \
  --data-raw '{
    "apiKey": "your_api_key_here",
    "agentSlug": "suporte-agente",
    "message": "user_question_now",
    "history": [
      {
        "role": "user",
        "content": "user_text_here"
      },
      {
        "role": "assistant",
        "content": "assistant_text_here"
      }
    ]
  }'
```

## Create your custom tool

The platform supports a plugin architecture for tools. Each tool is an npm package that exports a default function returning one or more `DynamicStructuredTool` instances.

### Walkthrough: creating `tool-current-time`

**1. Project setup**

```bash
mkdir tools/current-time && cd tools/current-time && bun init
```

**2. Install dependencies**

```bash
bun add @langchain/core zod
```

**3. Create `index.ts`**

```typescript
import { DynamicStructuredTool } from "@langchain/core/tools";
import z from "zod";

export default (actions: Array<{ [key: string]: any }>) => {
  const tools: DynamicStructuredTool[] = [];

  tools.push(new DynamicStructuredTool({
    name: "current_time",
    description: "Get the current date and time",
    schema: z.object({
      timezone: z.string().optional().describe("Timezone, e.g. America/Sao_Paulo, UTC"),
    }),
    func: async ({ timezone }) => {
      try {
        const now = timezone
          ? new Date().toLocaleString("en-US", { timeZone: timezone })
          : new Date().toISOString();
        actions.push({
          type: "current_time",
          status: "success",
          message: `Current time: ${now}`,
        });
        return `The current time is ${now}`;
      } catch (error: any) {
        actions.push({
          type: "current_time",
          status: "error",
          message: error.message,
        });
        return `Error: ${error.message}`;
      }
    },
  }));

  return tools;
};
```

**4. Configure `package.json`**

Edit the generated `package.json` and set:

```json
{
  "name": "tool-current-time",
  "version": "1.0.0",
  "type": "module",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "prepublishOnly": "bun run build"
  }
}
```

**5. Add `tsconfig.json`**

```json
{
  "compilerOptions": {
    "lib": ["ESNext"],
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "outDir": "dist",
    "declaration": true,
    "strict": true,
    "skipLibCheck": true
  },
  "include": ["index.ts"]
}
```

**6. Build & publish**

```bash
bun run build
npm publish --public
```

**7. Install the package in the API**

```bash
cd apps/api
bun install tool-current-time
```

**8. Register the tool in the dashboard**

Navigate to `/tools` and create a new tool with:

- **Name**: `tool-current-time`
- **Description**: Get the current date and time
- **Tool Identifier**: `tool-current-time`
- **Native toggle**: disabled
- **Package**: `tool-current-time`

**9. Enable the tool for an agent**

Go to `/agents`, edit the desired agent, and enable the `tool-current-time` tool.

**10. Environment variables**

Set any required env vars only if your tool needs them. This example does not require any.

### How it works

When the API processes a chat request, `apps/api/src/tools/toolManager.ts` loads the configured tools:

- If `isNative` is `true`, the tool is looked up in the `nativeTools` map (built-in tools).
- If `isNative` is `false`, the package is dynamically imported via `import(tool.package)` and its default export is called with the `actions` array.

The `actions` array tracks what each tool did during execution, enabling the dashboard to display execution logs.

## MLflow Tracing

The platform supports tracing AI agent interactions with MLflow to monitor token costs, total requests, average tokens per request, and conversation history.

### Enabling Tracing for an Agent

1. Navigate to **/agents** and create or edit an agent
2. Enable the **Enable Tracing** toggle
3. Set **Tracing URL**:
   - Docker environment: `http://mlflow:5000/gateway/mlflow/v1` (when running via `docker compose up`)
   - Local development: the URL where your MLflow Gateway is exposed
4. Set **AI Gateway ID** to the name of the AI Gateway created on your MLflow platform (e.g. the gateway deployment name)
5. Save the agent

### Accessing MLflow Dashboard

1. Open [http://localhost:5000](http://localhost:5000) in your browser
2. Default credentials:
   - Login: `admin`
   - Password: `password123`

### Docker Setup

When using Docker Compose, MLflow is automatically started as part of the stack. The tracing URL `http://mlflow:5000/gateway/mlflow/v1` resolves via the internal Docker network.

