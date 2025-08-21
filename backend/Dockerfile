# syntax=docker/dockerfile:1

# --- Build stage ---
FROM golang:1.24-bookworm AS builder
WORKDIR /app

# Enable CGO for github.com/mattn/go-sqlite3
ENV CGO_ENABLED=1

# Build deps for CGO
RUN apt-get update && apt-get install -y --no-install-recommends build-essential && rm -rf /var/lib/apt/lists/*

# Cache go modules first
COPY go.mod go.sum ./
RUN go mod download

# Copy the rest and build
COPY . .
RUN go build -o server .

# --- Runtime stage ---
FROM scratch AS runner

WORKDIR /app

COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/ca-certificates.crt
COPY --from=builder /app/server /app/server

# App config
ENV PORT=8080 \
    DB_PATH=/data/dogtracker.db

# Persistent SQLite storage
VOLUME ["/data"]

EXPOSE 8080
USER appuser
ENTRYPOINT ["/app/server"]
