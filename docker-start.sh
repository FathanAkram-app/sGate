#!/bin/bash

# sGate Docker Startup Script
# Use this script to start the sGate development environment

set -e

echo "🚀 Starting sGate sBTC Payment Gateway..."

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
fi

echo "📋 Checking Docker Compose configuration..."
if ! docker compose config >/dev/null 2>&1; then
    echo "❌ Docker Compose configuration is invalid"
    exit 1
fi

echo "✅ Configuration valid"

# Stop existing containers if running
echo "🛑 Stopping existing containers..."
docker compose down --remove-orphans 2>/dev/null || true

# Start services
echo "🔧 Starting services..."
docker compose up --build -d

echo "⏳ Waiting for services to be ready..."

# Wait for database to be healthy
echo "  📊 Waiting for PostgreSQL..."
timeout 60 bash -c 'until docker compose exec -T postgres pg_isready -U sgate -d sgate; do sleep 2; done' || {
    echo "❌ PostgreSQL failed to start"
    docker compose logs postgres
    exit 1
}

# Wait for Redis to be healthy
echo "  💾 Waiting for Redis..."
timeout 30 bash -c 'until docker compose exec -T redis redis-cli --no-auth-warning -a sgate_redis ping | grep -q PONG; do sleep 2; done' || {
    echo "❌ Redis failed to start"
    docker compose logs redis
    exit 1
}

# Wait for API to be healthy
echo "  🔌 Waiting for API..."
timeout 90 bash -c 'until curl -sf http://localhost:9022/health >/dev/null; do sleep 5; done' || {
    echo "❌ API failed to start"
    docker compose logs api
    exit 1
}

# Wait for Web to be healthy
echo "  🌐 Waiting for Web..."
timeout 60 bash -c 'until curl -sf http://localhost:9023 >/dev/null; do sleep 5; done' || {
    echo "❌ Web failed to start"
    docker compose logs web
    exit 1
}

echo ""
echo "✅ All services are running!"
echo ""
echo "🔗 Service URLs:"
echo "   API (with Swagger):  http://localhost:9022"
echo "   Web Dashboard:       http://localhost:9023"
echo "   PostgreSQL:          localhost:9020"
echo "   Redis:               localhost:9021"
echo ""
echo "📊 View logs:           docker compose logs -f"
echo "🛑 Stop services:       docker compose down"
echo ""