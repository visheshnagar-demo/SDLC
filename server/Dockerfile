FROM python:3.11-slim

WORKDIR /app

COPY server/requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY server/ .
COPY schemas/ ./schemas/

# Cloud Run Job batch entrypoint
CMD ["python", "main.py"]
