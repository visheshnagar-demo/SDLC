FROM python:3.11-slim

WORKDIR /app

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8080

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY server/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY server /app/server

EXPOSE 8080

CMD ["uvicorn", "server.main:app", "--host", "0.0.0.0", "--port", "8080"]
