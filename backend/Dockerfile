# backend/Dockerfile
FROM python:3.13

WORKDIR /app

# Install system dependencies (ffmpeg for audio processing, postgresql-client for backups)
RUN echo "Installing system packages..." && \
    apt-get update && \
    apt-get install -y --no-install-recommends \
    ffmpeg \
    libsndfile1 \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --upgrade pip && pip install --no-cache-dir -r requirements.txt

EXPOSE 8000

COPY . .

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]