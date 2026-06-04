# AI Agent Builder

## ABOUT

The project has focus to allow create AI agents with a simple interface, but only it you
can set the agents for specific employees.

## TODO:

- [] Create docker images for apps/api and apps/web
- [] Create a docker-compose file to run the project


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


Monorepo with:

- `apps/api`: API in Bun + Express + LangChainJS + OpenAI
- `apps/web`: React + Vite SPA for login and chat

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
bun install
bun run dev:api
bun run dev:web
```

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

