# Stage 1: Build static React SPA
FROM oven/bun:1-alpine AS builder

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

ARG VITE_AI_BASE_URL=/api/ai
ARG VITE_AI_API_KEY=
ARG VITE_AI_MODEL=antigravity/gemini-3-flash-preview
ENV VITE_AI_BASE_URL=${VITE_AI_BASE_URL} \
    VITE_AI_API_KEY=${VITE_AI_API_KEY} \
    VITE_AI_MODEL=${VITE_AI_MODEL}

COPY . .
RUN bun run build

# Stage 2: Serve with Nginx, Processing Service Proxy, and AI Gateway Reverse Proxy
FROM nginx:1.27-alpine AS runtime

ENV PROCESSING_UPSTREAM_URL=http://processing:8000 \
    AI_UPSTREAM_URL=https://or.flux.id/v1/ \
    NGINX_RESOLVER=127.0.0.11 \
    NGINX_ENVSUBST_FILTER="^(PROCESSING_UPSTREAM_URL|AI_UPSTREAM_URL|NGINX_RESOLVER)$"

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

EXPOSE 80

HEALTHCHECK --interval=10s --timeout=5s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
