# Multi-stage or slim Python 3.11 container for batch Cloud Run Job execution
FROM python:3.11-slim

WORKDIR /app

# Set environment variables for Python
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

# Install system dependencies if required
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code, schemas, and configurations
COPY server/ ./server/
COPY pipeline/ ./pipeline/
COPY schemas/ ./schemas/
COPY transformation_spec.json .
COPY env.deploy.json .

# Cloud Run Job entrypoint - executes batch pipeline and exits
CMD ["python", "-m", "server.pipeline"]
