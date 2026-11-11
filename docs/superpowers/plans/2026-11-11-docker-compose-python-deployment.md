# Multi-Container Docker Compose Deployment with Python Processing Service Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Containerize `services/processing/` with CPU-only PyTorch and orchestrate it alongside the Vite/React Nginx frontend in a root `docker-compose.yml` with persistent model volumes and same-origin `/api/v1/` + `/health` proxying.

**Architecture:** A two-service Docker Compose stack runs `frontend` (`nginx:1.27-alpine` built from root `Dockerfile`) exposed on `${APP_PORT:-80}:80` and `processing` (`python:3.11-slim` + `uv` built from `services/processing/Dockerfile`) kept internal on port `8000`. Nginx renders `nginx.conf.template` at startup via `envsubst` and uses variable-based `proxy_pass` with Docker's `127.0.0.11` resolver so standalone `Dockerfile` builds still boot without Compose DNS, while `uv` resolves CPU-only PyTorch wheels on Linux (`sys_platform == 'linux'`) and persists EasyOCR/HuggingFace weights in named volumes.

**Tech Stack:** Docker, Docker Compose, Nginx 1.27 (`envsubst` templates), Bun 1, Python 3.11, `uv`, FastAPI / Uvicorn, PyTorch (CPU wheel index on Linux), EasyOCR, Faster-Whisper.

## Global Constraints

- Design spec: `docs/superpowers/specs/2026-11-11-docker-compose-python-deployment-design.md`.
- Topology: two Compose services (`frontend` exposed on `${APP_PORT:-80}:80`, `processing` internal on port `8000` with no host ports published).
- Compute & models: CPU-only PyTorch wheels on Linux (`sys_platform == 'linux'`) via `https://download.pytorch.org/whl/cpu` (`explicit = true`), keeping macOS/Windows local `uv` resolution intact; persist EasyOCR (`/root/.EasyOCR`) and HuggingFace/Whisper (`/root/.cache/huggingface`) in named Docker volumes (`easyocr_models`, `hf_cache`).
- Proxy contract: `PROCESSING_UPSTREAM_URL` must have **no** trailing slash (`http://processing:8000`); `AI_UPSTREAM_URL` must retain a trailing slash (`https://or.flux.id/v1/`); Nginx `/api/v1/` timeouts must be `300s` (`client_max_body_size 50M`).
- Do **not** modify `vite.config.ts`, `server.js`, or `netlify.toml` (preserve existing uncommitted local edits in `vite.config.ts`).

---

### Task 1: Python CPU PyTorch Resolution & Processing Container (`services/processing/`)

**Files:**
- Modify: `services/processing/pyproject.toml`
- Regenerate: `services/processing/uv.lock`
- Create: `services/processing/.dockerignore`
- Create: `services/processing/Dockerfile`

**Interfaces:**
- Consumes: `services/processing/app/main.py` (`app` ASGI object exposing `GET /health` and `/api/v1/*` on port `8000`), `services/processing/app/config.py` (`AppConfig` env vars).
- Produces: Buildable container image `services/processing/Dockerfile` exposing `8000` with `HEALTHCHECK` on `http://127.0.0.1:8000/health` and Linux CPU-only `torch`/`torchvision` locked in `services/processing/uv.lock`.

- [ ] **Step 1: Configure Linux CPU-only PyTorch source in `services/processing/pyproject.toml`**

Edit `services/processing/pyproject.toml` to append the explicit `pytorch-cpu` index and platform-scoped `[tool.uv.sources]` mapping for `torch` and `torchvision`:

```toml
[project]
name = "verifin-processing"
version = "0.1.0"
description = "VeriFin Python Processing Service for OCR/ICR and Voice Analytics"
readme = "README.md"
requires-python = ">=3.10"
dependencies = [
    "fastapi>=0.110.0",
    "uvicorn[standard]>=0.28.0",
    "pydantic>=2.6.0",
    "python-multipart>=0.0.9",
    "pillow>=10.2.0",
    "opencv-python-headless>=4.9.0",
    "numpy>=1.26.0",
    "easyocr>=1.7.1",
    "faster-whisper>=1.0.0",
    "pydantic-settings>=2.0.0",
    "img2table>=1.2.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0.0",
    "pytest-asyncio>=0.23.0",
    "httpx>=0.27.0",
]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.hatch.build.targets.wheel]
packages = ["app"]

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

[tool.pytest.ini_options]
testpaths = ["tests"]
pythonpath = ["."]
asyncio_default_fixture_loop_scope = "function"
```

- [ ] **Step 2: Regenerate `services/processing/uv.lock` and verify Linux CPU wheels + local tests**

Run in `services/processing`:
```bash
uv lock
uv lock --check
uv run pytest -q
```
Expected:
- `uv lock` succeeds and updates `services/processing/uv.lock`.
- `uv.lock` references `https://download.pytorch.org/whl/cpu` for `torch` / `torchvision` Linux wheels instead of `cuda-toolkit` / `nvidia-cudnn-*` on Linux. Verify with a quick search (`rg "download\.pytorch\.org/whl/cpu" uv.lock`).
- `uv run pytest -q` passes all 115 existing tests.

- [ ] **Step 3: Create `services/processing/.dockerignore`**

Create `services/processing/.dockerignore`:

```dockerignore
.venv/
__pycache__/
*.py[cod]
.pytest_cache/
.ruff_cache/
*.egg-info/
.env
.env.*
.git/
tests/
```

- [ ] **Step 4: Create `services/processing/Dockerfile`**

Create `services/processing/Dockerfile`:

```dockerfile
# Stage 1: Install Python dependencies and application into /app/.venv using uv
FROM python:3.11-slim AS builder

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_NO_DEV=1 \
    UV_PYTHON_DOWNLOADS=0

WORKDIR /app

RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    uv sync --locked --no-install-project

COPY pyproject.toml uv.lock README.md ./
COPY app ./app

RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --locked --no-editable

# Stage 2: Minimal runtime image
FROM python:3.11-slim AS runtime

RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 \
    libglib2.0-0 \
    libgl1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /app/.venv /app/.venv
COPY --from=builder /app/app /app/app

ENV PATH="/app/.venv/bin:$PATH" \
    PYTHONUNBUFFERED=1 \
    HF_HUB_DISABLE_SYMLINKS_WARNING=1

EXPOSE 8000

HEALTHCHECK --interval=15s --timeout=5s --retries=5 --start-period=30s \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=3)" || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

- [ ] **Step 5: Build and smoke-test the Python Docker image**

Run:
```bash
docker build -t verifin-processing-test ./services/processing
docker run --rm -d --name verifin-proc-smoke -p 18000:8000 verifin-processing-test
```
Wait a few seconds for Uvicorn startup, then check `/health`, inspect imported `torch`/`cv2`/`faster_whisper`, and stop the test container:
```bash
docker exec verifin-proc-smoke python -c "import urllib.request, torch, cv2, easyocr, faster_whisper; print('cuda:', torch.cuda.is_available()); print(urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=5).read().decode())"
docker stop verifin-proc-smoke
docker rmi verifin-processing-test
```
Expected:
- Build completes without downloading CUDA wheels (`torch.cuda.is_available()` prints `False`).
- `GET http://127.0.0.1:8000/health` returns `200 OK` JSON containing `"status":"healthy"`.

- [ ] **Step 6: Commit Task 1**

```bash
git add services/processing/pyproject.toml services/processing/uv.lock services/processing/.dockerignore services/processing/Dockerfile
git commit -m "build(processing): add CPU-only Dockerfile and uv PyTorch CPU index"
```

---

### Task 2: Frontend Container, `.dockerignore`, & Nginx Proxy Template

**Files:**
- Modify: `.dockerignore`
- Create: `nginx.conf.template`
- Delete: `nginx.conf`
- Modify: `Dockerfile`

**Interfaces:**
- Consumes: `src/services/processingClient.ts` (`GET /health`, `POST /api/v1/*`), `src/services/aiService.ts` (`/api/ai/*` and `VITE_AI_*` build vars), `services/processing` internal port `8000`.
- Produces: Root `Dockerfile` + `nginx.conf.template` exposing port `80` with runtime `PROCESSING_UPSTREAM_URL` (default `http://processing:8000`), `AI_UPSTREAM_URL` (default `https://or.flux.id/v1/`), and `NGINX_RESOLVER` (default `127.0.0.11`).

- [ ] **Step 1: Update root `.dockerignore`**

Update `.dockerignore` to exclude `services/`, local `.env.*` files, and Python caches so the frontend build context stays small:

```dockerignore
node_modules
dist
.git
.env
.env.*
!.env.example
.cache
services/
__pycache__/
.pytest_cache/
.ruff_cache/
.DS_Store
```

- [ ] **Step 2: Create `nginx.conf.template` and remove `nginx.conf`**

Create `nginx.conf.template`:

```nginx
server {
    listen 80;
    server_name _;
    client_max_body_size 50M;

    server_tokens off;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    root /usr/share/nginx/html;
    index index.html;

    resolver ${NGINX_RESOLVER} valid=30s ipv6=off;

    # Gzip Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;

    location = /index.html {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
        try_files $uri =404;
    }

    # Python Processing Service health endpoint
    location = /health {
        set $processing_upstream "${PROCESSING_UPSTREAM_URL}";
        proxy_pass $processing_upstream;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 5s;
        proxy_read_timeout 15s;
    }

    # Python Processing Service API proxy (OCR, ICR, Table, Voice)
    location /api/v1/ {
        set $processing_upstream "${PROCESSING_UPSTREAM_URL}";
        proxy_pass $processing_upstream;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 10s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }

    # AI Gateway proxy
    location /api/ai/ {
        proxy_pass ${AI_UPSTREAM_URL};
        proxy_ssl_server_name on;
        proxy_http_version 1.1;
        proxy_set_header Host $proxy_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        # Disable upstream compression to prevent Brotli/double-gzip decoding errors in the browser
        proxy_set_header Accept-Encoding "";
    }

    # SPA client-side routing fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Delete the old `nginx.conf`:
```bash
git rm nginx.conf
```

- [ ] **Step 3: Update root `Dockerfile`**

Update `Dockerfile`:

```dockerfile
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
```

- [ ] **Step 4: Build and test standalone frontend container startup & rendered Nginx config**

Run:
```bash
docker build -t verifin-frontend-test .
docker run --rm -d --name verifin-fe-smoke -p 18080:80 verifin-frontend-test
```
Verify startup, rendered template, `nginx -t`, and SPA response, then clean up:
```bash
docker exec verifin-fe-smoke nginx -t
docker exec verifin-fe-smoke cat /etc/nginx/conf.d/default.conf
docker exec verifin-fe-smoke wget -qO- http://127.0.0.1:80/ | head -n 5
docker stop verifin-fe-smoke
docker rmi verifin-frontend-test
bun run lint
```
Expected:
- Standalone container starts cleanly without crashing even though `processing` does not exist on the network.
- `/etc/nginx/conf.d/default.conf` has `${PROCESSING_UPSTREAM_URL}`, `${AI_UPSTREAM_URL}`, and `${NGINX_RESOLVER}` substituted while `$uri`, `$host`, `$proxy_host`, `$remote_addr`, `$proxy_add_x_forwarded_for`, `$scheme`, and `$processing_upstream` remain intact.
- `wget` returns `<!doctype html>` (SPA HTML) and `bun run lint` passes with exit code `0`.

- [ ] **Step 5: Commit Task 2**

```bash
git add .dockerignore Dockerfile nginx.conf.template
git commit -m "build(frontend): add processing proxy template and envsubst config"
```

---

### Task 3: Docker Compose Orchestration, `.env.example`, & End-to-End Verification

**Files:**
- Create: `docker-compose.yml`
- Modify: `.env.example`

**Interfaces:**
- Consumes: Root `Dockerfile`, `services/processing/Dockerfile`, `.env` (optional user file based on `.env.example`).
- Produces: Root `docker-compose.yml` (`frontend` + `processing` + `easyocr_models` + `hf_cache`) and documented `.env.example`.

- [ ] **Step 1: Create `docker-compose.yml`**

Create `docker-compose.yml` at repository root:

```yaml
services:
  processing:
    build:
      context: ./services/processing
      dockerfile: Dockerfile
    expose:
      - "8000"
    restart: unless-stopped
    environment:
      WHISPER_MODEL_SIZE: ${WHISPER_MODEL_SIZE:-small}
      WHISPER_DEVICE: ${WHISPER_DEVICE:-cpu}
      WHISPER_COMPUTE_TYPE: ${WHISPER_COMPUTE_TYPE:-int8}
      BLUR_THRESHOLD: ${BLUR_THRESHOLD:-100.0}
      MIN_IMAGE_WIDTH: ${MIN_IMAGE_WIDTH:-600}
      HESITATION_SILENCE_THRESHOLD: ${HESITATION_SILENCE_THRESHOLD:-1.5}
      CORS_ORIGINS: '${CORS_ORIGINS:-["*"]}'
    volumes:
      - easyocr_models:/root/.EasyOCR
      - hf_cache:/root/.cache/huggingface
    healthcheck:
      test:
        [
          "CMD",
          "python",
          "-c",
          "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=3)",
        ]
      interval: 15s
      timeout: 5s
      retries: 5
      start_period: 30s

  frontend:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        VITE_AI_BASE_URL: ${VITE_AI_BASE_URL:-/api/ai}
        VITE_AI_API_KEY: ${VITE_AI_API_KEY:-}
        VITE_AI_MODEL: ${VITE_AI_MODEL:-antigravity/gemini-3-flash-preview}
    ports:
      - "${APP_PORT:-80}:80"
    restart: unless-stopped
    environment:
      PROCESSING_UPSTREAM_URL: ${PROCESSING_UPSTREAM_URL:-http://processing:8000}
      AI_UPSTREAM_URL: ${AI_UPSTREAM_URL:-https://or.flux.id/v1/}
      NGINX_RESOLVER: ${NGINX_RESOLVER:-127.0.0.11}
    depends_on:
      processing:
        condition: service_healthy

volumes:
  easyocr_models:
  hf_cache:
```

- [ ] **Step 2: Update `.env.example`**

Update `.env.example`:

```env
# --- Frontend Build-Time Config (Vite) ---
VITE_AI_BASE_URL="/api/ai"
VITE_AI_API_KEY=""
VITE_AI_MODEL="antigravity/gemini-3-flash-preview"

# --- Docker Compose & Nginx Proxy ---
APP_PORT=80
# Origin only (no trailing slash)
PROCESSING_UPSTREAM_URL=http://processing:8000
# Include trailing slash to strip /api/ai/ prefix when forwarding
AI_UPSTREAM_URL=https://or.flux.id/v1/
NGINX_RESOLVER=127.0.0.11

# --- Python Processing Service ---
WHISPER_MODEL_SIZE=small
WHISPER_DEVICE=cpu
WHISPER_COMPUTE_TYPE=int8
BLUR_THRESHOLD=100.0
MIN_IMAGE_WIDTH=600
HESITATION_SILENCE_THRESHOLD=1.5
CORS_ORIGINS='["*"]'
```

- [ ] **Step 3: Validate Compose configuration**

Run:
```bash
docker compose config
```
Expected: Outputs the resolved Compose YAML with zero syntax or interpolation warnings, showing `CORS_ORIGINS: '["*"]'`, `ports` binding `80:80` (or overridden `APP_PORT`), `processing` having no host `ports`, and `easyocr_models` + `hf_cache` volumes.

- [ ] **Step 4: Build and verify the full Compose stack end-to-end**

Run Compose on an isolated test port (`APP_PORT=18088`) so any existing host port 80 service is not disturbed:

On PowerShell (`pwsh`):
```powershell
$env:APP_PORT = "18088"
docker compose up -d --build
docker compose ps
```
On bash/zsh:
```bash
APP_PORT=18088 docker compose up -d --build
docker compose ps
```
Wait until both `processing` and `frontend` report `(healthy)`, then verify all routes through `frontend` (`http://127.0.0.1:18088`):
```bash
curl.exe -s -o NUL -w "SPA:%{http_code}\n" http://127.0.0.1:18088/
curl.exe -s -w "\nHEALTH:%{http_code}\n" http://127.0.0.1:18088/health
curl.exe -s -w "\nAPI_PROXY:%{http_code}\n" -X POST http://127.0.0.1:18088/api/v1/ocr/ktp
docker volume ls --filter name=verifin
```
Expected:
- `SPA:200` (React `index.html` served).
- `HEALTH:200` with JSON `{"status":"healthy","version":"0.1.0","device":"cpu",...}` proxied from `processing`.
- `API_PROXY:422` (FastAPI `Field required` validation error for missing `file` multipart field — proves `/api/v1/ocr/ktp` reached the Python FastAPI service through Nginx rather than returning Nginx `404`/`405`/`502`).
- `docker volume ls` lists `verifin_easyocr_models` and `verifin_hf_cache`.

Tear down the test deployment cleanly after verification (and clear `APP_PORT` if set in PowerShell):
```powershell
docker compose down
Remove-Item Env:APP_PORT -ErrorAction SilentlyContinue
```

- [ ] **Step 5: Run final regression checks and commit Task 3**

Run:
```bash
bun run lint
uv run pytest -q
```
(with `uv run pytest -q` run in `services/processing`), then commit:
```bash
git add docker-compose.yml .env.example
git commit -m "deploy: add Docker Compose setup for frontend and Python processing service"
```

---

## Plan Self-Review

1. **Spec coverage check:**
   - Multi-container `docker-compose.yml` (`frontend` + `processing`, `depends_on: service_healthy`, `APP_PORT:-80`, internal `8000`, `easyocr_models`, `hf_cache`, env forwarding) -> **Task 3**.
   - `.env.example` with frontend, Compose/Nginx, and Python processing vars -> **Task 3**.
   - Root `.dockerignore` excluding `services/`, `.env.*`, Python caches -> **Task 2**.
   - Root `Dockerfile` build args + `envsubst` template + `NGINX_ENVSUBST_FILTER` -> **Task 2**.
   - `nginx.conf.template` replacing `nginx.conf` with `/health`, `/api/v1/` (300s timeout, variable `proxy_pass` + `resolver`), `/api/ai/` (`$proxy_host`, `Accept-Encoding ""`) -> **Task 2**.
   - `services/processing/pyproject.toml` + `uv.lock` Linux `pytorch-cpu` index -> **Task 1**.
   - `services/processing/.dockerignore` & multi-stage `uv` `services/processing/Dockerfile` -> **Task 1**.
   - Preserve `vite.config.ts` untouched -> listed in Global Constraints and excluded from all `git add` steps.
2. **Placeholder scan:** No TBD/TODO/vague blocks; all file contents and commands are complete and concrete.
3. **Type & config consistency:** Image/container paths (`/root/.EasyOCR`, `/root/.cache/huggingface`, port `8000`, `PROCESSING_UPSTREAM_URL=http://processing:8000`, `AI_UPSTREAM_URL=https://or.flux.id/v1/`, `NGINX_RESOLVER=127.0.0.11`) match across all tasks and match the design spec verbatim.
