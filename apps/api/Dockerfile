FROM oven/bun:1 AS deps
WORKDIR /app
COPY package.json ./
RUN bun install --production

FROM oven/bun:1-alpine AS production

# Install Python, curl, and necessary certificates for uv
RUN apk add --no-cache \
    python3 \
    py3-pip \
    curl \
    ca-certificates

# Install uv & uvx natively from the official Astral repository
ADD https://astral.sh/uv/install.sh /uv-installer.sh
RUN sh /uv-installer.sh && rm /uv-installer.sh

# Expose uvx binaries and set environment variables
ENV PATH="/root/.local/bin:$PATH" \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy

# Verify installations
RUN bunx --version && uvx --version

# Install Docker CLI
RUN apk add --no-cache docker-cli

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3001
CMD ["bun", "src/index.ts"]
