# Stage 1: Build static React SPA
FROM oven/bun:1.4.3-alpine AS builder

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

ARG VITE_AI_BASE_URL=/api/ai
ARG VITE_AI_API_KEY=
ARG VITE_AI_MODEL=antigravity/gemini-3-flash-preview
RUN bun run build

# Stage 2: Serve with Nginx, Processing Service Proxy, and AI Gateway Reverse Proxy
FROM nginx:1.27.5-alpine AS runtime

ENV PROCESSING_UPSTREAM_URL=http://processing:8000 \
    AI_UPSTREAM_URL=https://or.flux.id/v1/ \
    NGINX_RESOLVER=auto \
    NGINX_ENTRYPOINT_LOCAL_RESOLVERS=1 \
    NGINX_ENVSUBST_FILTER="^(PROCESSING_UPSTREAM_URL|AI_UPSTREAM_URL|NGINX_RESOLVER)$"

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY docker/16-verifin-env.envsh /docker-entrypoint.d/16-verifin-env.envsh
RUN sed -i 's/\r$//' /docker-entrypoint.d/16-verifin-env.envsh && chmod +x /docker-entrypoint.d/16-verifin-env.envsh

EXPOSE 80

HEALTHCHECK --interval=10s --timeout=5s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
