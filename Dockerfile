FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Cloud Run Job: runs the batch pipeline directly, exits with code 0 on success or 1 on failure.
# No HTTP port exposed — this is a batch Job, not a Service.
CMD ["python", "main.py"]
