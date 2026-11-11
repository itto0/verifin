# Stage 1: Install Python dependencies and application into /app/.venv using uv
FROM python:3.11.18-slim AS builder

COPY --from=ghcr.io/astral-sh/uv:0.11.21 /uv /uvx /bin/

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
FROM python:3.11.18-slim AS runtime

RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 \
    libglib2.0-0 \
    libgl1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN groupadd --gid 10001 --system appuser \
    && useradd --uid 10001 --gid appuser --system --create-home --home-dir /home/appuser appuser \
    && mkdir -p /var/cache/verifin/easyocr /var/cache/verifin/huggingface \
    && chown -R appuser:appuser /app /var/cache/verifin

COPY --from=builder --chown=appuser:appuser /app/.venv /app/.venv

ENV PATH="/app/.venv/bin:$PATH" \
    PYTHONUNBUFFERED=1 \
    HF_HUB_DISABLE_SYMLINKS_WARNING=1 \
    EASYOCR_MODULE_PATH=/var/cache/verifin/easyocr \
    HF_HOME=/var/cache/verifin/huggingface

USER appuser

EXPOSE 8000

HEALTHCHECK --interval=15s --timeout=5s --retries=5 --start-period=30s \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=3)" || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
