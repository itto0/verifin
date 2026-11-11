# Design Spec: Multi-Container Docker Compose Deployment with Python Processing Service

- **Date:** 2026-11-11
- **Status:** Approved
- **Topic:** Update VeriFin deployment configuration to build, orchestrate, and reverse-proxy the `services/processing/` FastAPI service alongside the React/Vite Nginx frontend using Docker Compose.

---

## 1. Overview & Objectives

Currently, VeriFin's container deployment (`Dockerfile` and `nginx.conf`) only builds the Vite/React frontend and proxies `/api/ai/` to an external AI gateway (`https://or.flux.id/v1/`). The frontend's `src/services/processingClient.ts` expects same-origin `/health` and `/api/v1/*` routes served by the Python FastAPI service in `services/processing/` (OCR, table extraction, ICR, and faster-whisper voice analytics).

### Key Goals
1. **Multi-Container Docker Compose Topology**: Orchestrate `frontend` (Nginx) and `processing` (Python/FastAPI) together on an internal bridge network with service health checks and a single `docker compose up -d --build` workflow.
2. **Same-Origin Reverse Proxy with Standalone Safety**: Proxy `/api/v1/` and `/health` from Nginx to `processing` with 300s inference timeouts and 52MB upload headroom (above FastAPI's 50MB audio limit), while preserving standalone `Dockerfile` boot safety when `processing` or `/api/ai/` upstreams are unavailable.
3. **Lean CPU-Only Python Container**: Avoid downloading ~3+ GB of unused NVIDIA CUDA wheels on Linux builds by directing `uv` to PyTorch's CPU wheel index on Linux (`sys_platform == 'linux'`) without disrupting macOS/Windows local development.
4. **Non-Root Runtime & Persistent ML Model Weights**: Run the Python service as non-root `appuser` (`uid=10001`, `gid=10001`) and persist EasyOCR (`/var/cache/verifin/easyocr` via `EASYOCR_MODULE_PATH`) and HuggingFace/Faster-Whisper (`/var/cache/verifin/huggingface` via `HF_HOME`) caches in named Docker volumes so model weights download once and survive container restarts and image rebuilds.
5. **Configurable Host Exposure & Environment**: Expose only `frontend` on `${APP_PORT:-80}:80`, keeping `processing` internal on the Docker network, and document all build/runtime environment variables in `.env.example`.

### Out of Scope
- GPU/CUDA Compose profiles or multi-node orchestration (Kubernetes/Swarm).
- Modifying Express `server.js` or `netlify.toml` (Netlify cannot host the stateful Python ML service).
- Modifying `vite.config.ts` (preserve existing local working-tree configuration untouched).

---

## 2. Architecture & Compose Topology

```text
Browser ──▶ [frontend: Nginx :80] (host port ${APP_PORT:-80}:80)
               ├── /          ──▶ Static React/Vite SPA (/usr/share/nginx/html)
               ├── /api/ai/   ──▶ External AI Gateway (${AI_UPSTREAM_URL}, default https://or.flux.id/v1/)
               ├── /api/v1/*  ──▶ [processing: FastAPI :8000] (internal network only)
               └── /health    ──▶ [processing: FastAPI :8000] /health
                                      ├── volume: easyocr_models ──▶ /var/cache/verifin/easyocr
                                      └── volume: hf_cache       ──▶ /var/cache/verifin/huggingface
```

### Root `docker-compose.yml`
Defines a stable Compose project name (`name: ${COMPOSE_PROJECT_NAME:-verifin}`), two services on a shared Compose network, and two named volumes:

- **`processing` service**:
  - `build`: context `./services/processing`, `dockerfile: Dockerfile`.
  - `expose`: `["8000"]` (internal network only; no host `ports` published).
  - `restart: unless-stopped`.
  - `environment`: forwards configurable `AppConfig` values with defaults:
    - `WHISPER_MODEL_SIZE=${WHISPER_MODEL_SIZE:-small}`
    - `WHISPER_DEVICE=${WHISPER_DEVICE:-cpu}`
    - `WHISPER_COMPUTE_TYPE=${WHISPER_COMPUTE_TYPE:-int8}`
    - `BLUR_THRESHOLD=${BLUR_THRESHOLD:-100.0}`
    - `MIN_IMAGE_WIDTH=${MIN_IMAGE_WIDTH:-600}`
    - `HESITATION_SILENCE_THRESHOLD=${HESITATION_SILENCE_THRESHOLD:-1.5}`
    - `CORS_ORIGINS='${CORS_ORIGINS:-["*"]}'` (single-quoted in YAML so Pydantic's JSON `List[str]` parser always receives valid JSON even if unset or empty)
  - `volumes`:
    - `easyocr_models:/var/cache/verifin/easyocr`
    - `hf_cache:/var/cache/verifin/huggingface`
  - `healthcheck`: probes `http://127.0.0.1:8000/health` via Python `urllib.request` every `15s` (`timeout: 5s`, `retries: 5`, `start_period: 30s`).
- **`frontend` service**:
  - `build`: context `.`, `dockerfile: Dockerfile`, with optional `args`:
    - `VITE_AI_BASE_URL=${VITE_AI_BASE_URL:-/api/ai}`
    - `VITE_AI_API_KEY=${VITE_AI_API_KEY:-}`
    - `VITE_AI_MODEL=${VITE_AI_MODEL:-antigravity/gemini-3-flash-preview}`
  - `ports`: `["${APP_PORT:-80}:80"]`.
  - `restart: unless-stopped`.
  - `environment`:
    - `PROCESSING_UPSTREAM_URL=${PROCESSING_UPSTREAM_URL:-http://processing:8000}`
    - `AI_UPSTREAM_URL=${AI_UPSTREAM_URL:-https://or.flux.id/v1/}`
    - `NGINX_RESOLVER=${NGINX_RESOLVER:-auto}`
  - `depends_on`: `processing: condition: service_healthy`.
- **Named Volumes**:
  - `easyocr_models:`
  - `hf_cache:`

### Root `.env.example`
Expand `.env.example` to document:
- Frontend build-time variables (`VITE_AI_BASE_URL="/api/ai"`, `VITE_AI_API_KEY=""` optional override, `VITE_AI_MODEL="antigravity/gemini-3-flash-preview"`).
- Compose & Nginx runtime variables (`COMPOSE_PROJECT_NAME=verifin`, `APP_PORT=80`, `PROCESSING_UPSTREAM_URL=http://processing:8000` with trailing slashes stripped on startup, `AI_UPSTREAM_URL=https://or.flux.id/v1/` normalized with a trailing slash on startup to strip `/api/ai/` prefix cleanly, `NGINX_RESOLVER=auto` where `auto` reads `/etc/resolv.conf` — `127.0.0.11` inside Compose — or accepts an explicit DNS IP).
- Python processing runtime variables (`WHISPER_MODEL_SIZE=small`, `WHISPER_DEVICE=cpu`, `WHISPER_COMPUTE_TYPE=int8`, `BLUR_THRESHOLD=100.0`, `MIN_IMAGE_WIDTH=600`, `HESITATION_SILENCE_THRESHOLD=1.5`, `CORS_ORIGINS='["*"]'`).

---

## 3. Frontend Build, `.dockerignore`, & Nginx Proxy

### Root `.dockerignore`
Prevent Python virtual environments, caches, and local env overrides from bloating the frontend Docker build context:
- Keep existing entries: `node_modules`, `dist`, `.git`, `.env`, `.cache`.
- Add: `services/`, `.env.*`, `!.env.example`, `**/__pycache__/`, `.pytest_cache/`, `.ruff_cache/`, `.DS_Store`.

### Root `Dockerfile`
- **Builder stage (`oven/bun:1.4.3-alpine AS builder`)**:
  - Copy application sources first (`COPY . .`), then declare `ARG VITE_AI_BASE_URL=/api/ai`, `ARG VITE_AI_API_KEY=`, `ARG VITE_AI_MODEL=antigravity/gemini-3-flash-preview` straight before `RUN bun run build` (without redundant `ENV VITE_AI_*` declarations, preserving `src/services/aiService.ts` fallback behavior if unset and avoiding baking `"sk-your-ai-api-key"` placeholder accidentally if `.env` is absent).
- **Runtime stage (`nginx:1.27.5-alpine AS runtime`)**:
  - Set default `ENV` values:
    - `PROCESSING_UPSTREAM_URL=http://processing:8000`
    - `AI_UPSTREAM_URL=https://or.flux.id/v1/`
    - `NGINX_RESOLVER=auto`
    - `NGINX_ENTRYPOINT_LOCAL_RESOLVERS=1`
    - `NGINX_ENVSUBST_FILTER=^(PROCESSING_UPSTREAM_URL|AI_UPSTREAM_URL|NGINX_RESOLVER)$`
  - Copy `nginx.conf.template` to `/etc/nginx/templates/default.conf.template` and `docker/16-verifin-env.envsh` to `/docker-entrypoint.d/16-verifin-env.envsh` (with `+x`) so `16-verifin-env.envsh` runs right after built-in `15-local-resolvers.envsh` and before `20-envsubst-on-templates.sh`:
    - Strips any trailing `/` from `PROCESSING_UPSTREAM_URL`.
    - Normalizes `AI_UPSTREAM_URL` to end with a single `/` if non-empty.
    - Resolves `NGINX_RESOLVER` to `${NGINX_LOCAL_RESOLVERS:-127.0.0.11}` when empty or `auto` (preserving explicit IP overrides).
  - Keep `HEALTHCHECK` hitting `http://127.0.0.1:80/` so the frontend container health check remains independent of backend availability.

### Nginx Template (`nginx.conf.template`, replacing `nginx.conf`)
Replace `nginx.conf` with `nginx.conf.template` so there is a single source of truth:
- Retain `listen 80;`, `server_name _;`, `server_tokens off;`, security headers (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`), gzip, `index.html` `no-cache`, `/assets/` 1-year immutable cache, and SPA fallback (`location / { try_files $uri $uri/ /index.html; }`).
- Set `client_max_body_size 52M;` to give multipart boundary overhead headroom above FastAPI's `50MB` audio limit.
- Configure `/api/ai/` reverse proxy with deferred variable resolution via `location ~ ^/api/ai/(.*)$`:
  - `set $ai_upstream "${AI_UPSTREAM_URL}";`
  - `proxy_pass $ai_upstream$1$is_args$args;`
  - `proxy_ssl_server_name on;`, `proxy_ssl_name $proxy_host;`, `proxy_http_version 1.1;`, `proxy_set_header Host $proxy_host;`, forwarding headers, and `proxy_set_header Accept-Encoding "";`.
- Add `resolver ${NGINX_RESOLVER} valid=30s ipv6=off;` and proxy blocks for the Python service:
  - `location = /health`:
    - `set $processing_upstream "${PROCESSING_UPSTREAM_URL}";`
    - `proxy_pass $processing_upstream;`
    - Standard forwarding headers (`Host`, `X-Real-IP`, `X-Forwarded-For`, `X-Forwarded-Proto`), `proxy_connect_timeout 5s;`, `proxy_read_timeout 15s;`.
  - `location /api/v1/`:
    - `set $processing_upstream "${PROCESSING_UPSTREAM_URL}";`
    - `proxy_pass $processing_upstream;`
    - Standard forwarding headers (`Host`, `X-Real-IP`, `X-Forwarded-For`, `X-Forwarded-Proto`), `proxy_http_version 1.1;`, `proxy_connect_timeout 10s;`, `proxy_send_timeout 300s;`, `proxy_read_timeout 300s;`.
- Note on variable-based `proxy_pass`: using `set $processing_upstream` and `set $ai_upstream` with `resolver` defers DNS lookup to request time across all upstream proxy routes, preventing standalone `docker run` deployments (or unreachable upstream hostnames) from failing on Nginx boot. Entrypoint script `16-verifin-env.envsh` ensures `PROCESSING_UPSTREAM_URL` has no trailing slash (so `/health` and `/api/v1/...` forward intact) and `AI_UPSTREAM_URL` ends with a single `/` (so `$ai_upstream$1$is_args$args` strips `/api/ai/` cleanly).

---

## 4. Python Processing Container & CPU PyTorch Configuration

### CPU-Only PyTorch Resolution (`services/processing/pyproject.toml` & `uv.lock`)
- Update `services/processing/pyproject.toml` to declare an explicit PyTorch CPU index and map `torch` and `torchvision` to it only on Linux:
  ```toml
  [tool.uv.sources]
  torch = [
      { index = "pytorch-cpu", marker = "sys_platform == 'linux'" },
  ]
  torchvision = [
      { index = "pytorch-cpu", marker = "sys_platform == 'linux'" },
  ]

  [[tool.uv.index]]
  name = "pytorch-cpu"
  url = "https://download.pytorch.org/whl/cpu"
  explicit = true
  ```
- Regenerate `services/processing/uv.lock` with `uv lock` so Linux builds pull lightweight CPU wheels while macOS and Windows developer setups continue resolving standard PyPI wheels cleanly.

### `services/processing/.dockerignore`
Exclude local development artifacts and test assets from the Python build context:
- `.venv/`, `**/__pycache__/`, `**/*.py[cod]`, `.pytest_cache/`, `.ruff_cache/`, `**/*.egg-info/`, `.env`, `.env.*`, `.git/`, `tests/`.

### `services/processing/Dockerfile`
Use a multi-stage `uv` build on pinned `python:3.11.18-slim`:
1. **Builder stage (`python:3.11.18-slim AS builder`)**:
   - Copy `uv` binary from pinned `ghcr.io/astral-sh/uv:0.11.21` (`COPY --from=ghcr.io/astral-sh/uv:0.11.21 /uv /uvx /bin/`).
   - Set `UV_COMPILE_BYTECODE=1`, `UV_LINK_MODE=copy`, `UV_NO_DEV=1`, `UV_PYTHON_DOWNLOADS=0`.
   - `WORKDIR /app`.
   - Install dependencies first using bind/cache mounts for layer caching:
     `RUN --mount=type=cache,target=/root/.cache/uv --mount=type=bind,source=uv.lock,target=uv.lock --mount=type=bind,source=pyproject.toml,target=pyproject.toml uv sync --locked --no-install-project`
   - Copy `pyproject.toml`, `uv.lock`, `README.md`, and `app/` into `/app`, then run `uv sync --locked --no-editable` to install `verifin-processing`.
2. **Runtime stage (`python:3.11.18-slim AS runtime`)**:
   - Install minimal shared runtime libraries required by OpenCV, EasyOCR, and CTranslate2 (`libgomp1`, `libglib2.0-0`, `libgl1`) and clean apt lists (`rm -rf /var/lib/apt/lists/*`).
   - Create non-root group/user `appuser` (`--gid 10001`, `--uid 10001`, `--system --create-home --home-dir /home/appuser`), create `/var/cache/verifin/easyocr` and `/var/cache/verifin/huggingface`, and `chown -R appuser:appuser /app /var/cache/verifin`.
   - Copy `/app/.venv` from `builder` with `--chown=appuser:appuser` (without duplicating `/app/app` or copying up `.venv` layers, so Uvicorn imports directly from the precompiled non-editable wheel in `/app/.venv`).
   - Set `PATH="/app/.venv/bin:$PATH"`, `PYTHONUNBUFFERED=1`, `HF_HUB_DISABLE_SYMLINKS_WARNING=1`, `EASYOCR_MODULE_PATH=/var/cache/verifin/easyocr`, `HF_HOME=/var/cache/verifin/huggingface`.
   - Switch to `USER appuser`.
   - `EXPOSE 8000`.
   - `HEALTHCHECK --interval=15s --timeout=5s --retries=5 --start-period=30s CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=3)" || exit 1`.
   - `CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]` (single worker so lazy-loaded EasyOCR and Faster-Whisper models are not duplicated across worker processes in RAM).

---

## 5. Error Handling & Edge Cases

1. **Cold-start model downloads**: First OCR or Voice request triggers EasyOCR (`/var/cache/verifin/easyocr`) or HuggingFace Faster-Whisper (`/var/cache/verifin/huggingface`) downloads into mounted named volumes owned by `appuser`. Nginx's `300s` `proxy_read_timeout`/`proxy_send_timeout` prevents premature `504 Gateway Timeout` during initial weight download or slower CPU inference, and named volumes preserve weights across restarts and rebuilds.
2. **Oversized uploads**: Nginx (`client_max_body_size 52M`) provides multipart overhead headroom above FastAPI router limits (`15MB` images, `50MB` audio).
3. **Standalone frontend container compatibility**: Because Nginx uses variable-based `proxy_pass` + `resolver` on `/health`, `/api/v1/`, and `/api/ai/`, auto-detects `/etc/resolv.conf` via `NGINX_RESOLVER=auto` (`15-local-resolvers.envsh` + `16-verifin-env.envsh`), and checks `/` in its own `HEALTHCHECK`, building and running the root `Dockerfile` alone continues serving the SPA without startup crashes even when upstream DNS names are absent.
4. **Build-arg safety**: `Dockerfile` must avoid overriding `src/services/aiService.ts` defaults with empty strings (`VITE_AI_API_KEY=""` would be truthy-check safe via `||`, whereas placeholder text like `"sk-your-ai-api-key"` must not be passed into production builds by Compose). In `docker-compose.yml`, only pass `VITE_AI_*` build args when set or default `VITE_AI_BASE_URL` to `/api/ai` and `VITE_AI_MODEL` to `antigravity/gemini-3-flash-preview` while leaving `VITE_AI_API_KEY` empty by default so `aiService.ts` falls back cleanly unless overridden.

---

## 6. Verification Plan

After implementation, validate both unit checks and live Compose integration:
1. **Compose & lockfile validation**:
   - `uv lock --check` (or `uv sync --extra dev` / `pytest` inside `services/processing/`).
   - `docker compose config` validates syntax and variable interpolation without errors.
2. **Image builds**:
   - `docker compose build` builds both `frontend` and `processing` cleanly (verifying CPU-only PyTorch wheels are installed in `processing`).
3. **Runtime & reverse proxy verification**:
   - `docker compose up -d` brings both `processing` and `frontend` to `healthy` status.
   - `GET http://localhost:${APP_PORT:-80}/` serves the React SPA (`200 OK`).
   - `GET http://localhost:${APP_PORT:-80}/health` proxies to `processing` and returns `{"status":"healthy",...}` (`200 OK`).
   - `POST http://localhost:${APP_PORT:-80}/api/v1/...` proxies cleanly to `processing` (verifying invalid/sample multipart upload reaches FastAPI and returns expected status/validation rather than `404`/`502`/`405`).
   - Volume persistence verified (`docker volume ls` shows `easyocr_models` and `hf_cache`).
4. **Existing checks**:
   - Frontend typecheck: `bun run lint`.
   - Python tests: `pytest` in `services/processing/`.
