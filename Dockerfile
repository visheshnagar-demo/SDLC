FROM python:3.11-slim

WORKDIR /app

# Set non-buffering and bytecode suppression
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

# Install runtime dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source and schemas
COPY server/ ./server/
COPY schemas/ ./schemas/
COPY sql/ ./sql/

# Create non-root user
RUN useradd -m -u 1001 appuser && chown -R appuser:appuser /app
USER appuser

# Cloud Run Job batch entrypoint
CMD ["python", "-m", "server.main"]
