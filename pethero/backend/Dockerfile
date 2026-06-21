# Local/backend-only Docker image for PetHero.
# Build context: pethero/backend (or use docker-compose from pethero/).

FROM python:3.11-slim

WORKDIR /app

# Install core dependencies first for layer caching.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code.
COPY . .

# Ensure SQLite/data directory exists.
RUN mkdir -p /app/data

EXPOSE 8000
EXPOSE 5007/udp

# Listen on all interfaces so phone + robot can reach it over the LAN/hotspot.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
