FROM oven/bun:1-alpine AS build
WORKDIR /app
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
COPY package.json ./
RUN bun install
COPY . .
RUN bun run build

FROM oven/bun:1-alpine AS production
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY server.js ./
EXPOSE 80
CMD ["bun", "server.js"]
