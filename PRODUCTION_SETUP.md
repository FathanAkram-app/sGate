# sGate Production Setup Guide

## Overview

This guide provides instructions for running sGate in production mode locally with minimal resource usage. All monitoring services (Fluentd, Grafana, Prometheus) have been removed to reduce resource consumption.

## Files Created/Modified

### New Files:
- `docker-compose.production.clean.yml` - Clean production configuration without monitoring
- `.env.production.example` - Example environment variables
- `infra/nginx/nginx.simple.conf` - Simple nginx configuration
- `PRODUCTION_SETUP.md` - This setup guide

### Modified Files:
- Removed monitoring service directories: `infra/fluentd/`, `infra/grafana/`, `infra/prometheus/`
- Updated original `docker-compose.production.yml` (removed monitoring services)

## Quick Start

### 1. Prerequisites
- Docker Desktop installed and running
- At least 4GB RAM available
- Ports 3000, 4000, 5432, 6379 available

### 2. Setup Environment
```bash
# Copy environment template
cp .env.production.example .env.production

# Edit .env.production with your values (optional for local testing)
# The defaults will work for local testing
```

### 3. Start Services
```bash
# Start all core services (PostgreSQL, Redis, API, Web Dashboard)
docker-compose -f docker-compose.production.clean.yml up -d

# Or start with nginx reverse proxy
docker-compose -f docker-compose.production.clean.yml --profile nginx up -d

# View logs
docker-compose -f docker-compose.production.clean.yml logs -f api
```

### 4. Verify Services
- API: http://localhost:4000 (with Swagger docs at http://localhost:4000/docs)
- Web Dashboard: http://localhost:3000  
- PostgreSQL: localhost:5432
- Redis: localhost:6379

### 5. Initialize Database
```bash
# Run migrations and seed data
docker-compose -f docker-compose.production.clean.yml exec api sh -c "cd apps/api && npm run migration:run && npm run seed"
```

## Resource Usage

### Optimized Configuration:
- **PostgreSQL**: 1-2GB RAM, 0.5-1.0 CPU
- **Redis**: 256-512MB RAM, 0.25-0.5 CPU  
- **API**: 512MB-1GB RAM, 0.5-1.0 CPU
- **Web**: 256-512MB RAM, 0.25-0.5 CPU
- **Nginx** (optional): 128-256MB RAM, 0.1-0.25 CPU

**Total**: ~2-4GB RAM, 1.6-3.25 CPU cores

### Removed Services:
- ❌ Fluentd (was using 256-512MB RAM)
- ❌ Grafana (was using 512MB-1GB RAM)  
- ❌ Prometheus (was using 1-2GB RAM)

**Savings**: ~1.8-3.5GB RAM, ~1.0-1.5 CPU cores

## Service Configuration

### Core Services Only:
1. **postgres** - Primary database
2. **redis** - Caching and sessions
3. **api** - NestJS backend API
4. **web** - Next.js dashboard/checkout pages

### Optional Services:
5. **nginx** - Reverse proxy (use `--profile nginx` to enable)

## Environment Variables

Key production settings in `.env.production`:

```bash
# Security (CHANGE THESE!)
DB_PASSWORD=your_secure_postgres_password_here
REDIS_PASSWORD=your_secure_redis_password_here
API_KEY_SALT=your_32_character_api_key_salt_here_change_this
WEBHOOK_SIGNATURE_SALT=your_32_character_webhook_salt_here_change_this
JWT_SECRET=your_jwt_secret_key_change_in_production

# Network Configuration
STACKS_NETWORK=testnet
HIRO_API_BASE=https://api.testnet.hiro.so
SBTC_ASSET_IDENTIFIER=ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.sbtc-token::sbtc

# URLs
API_BASE_URL=http://localhost:4000
CHECKOUT_BASE_URL=http://localhost:3000
```

## Common Commands

```bash
# Build images
docker-compose -f docker-compose.production.clean.yml build

# Start services in background
docker-compose -f docker-compose.production.clean.yml up -d

# View service status
docker-compose -f docker-compose.production.clean.yml ps

# View logs
docker-compose -f docker-compose.production.clean.yml logs -f [service_name]

# Stop services
docker-compose -f docker-compose.production.clean.yml down

# Stop and remove volumes (WARNING: deletes data)
docker-compose -f docker-compose.production.clean.yml down -v
```

## Troubleshooting

### Docker Desktop Issues
If you see "pipe/dockerDesktopLinuxEngine" errors:
1. Restart Docker Desktop
2. Wait 1-2 minutes for full startup
3. Verify with `docker ps`

### Port Conflicts
If ports are in use:
- Stop other services using ports 3000, 4000, 5432, 6379
- Or modify port mappings in the compose file

### Memory Issues
If services crash due to memory:
- Reduce resource limits in the compose file
- Close other applications
- Consider using Docker Desktop with WSL 2 backend

### Build Failures
If Docker builds fail:
```bash
# Clean build
docker-compose -f docker-compose.production.clean.yml build --no-cache

# Check Dockerfile paths exist
ls -la apps/api/Dockerfile.simple.working
ls -la infra/Dockerfile.dashboard.simple
```

## Testing the Setup

1. **Health Checks**: All services have health checks that Docker will monitor
2. **API Test**: `curl http://localhost:4000/health`
3. **Web Test**: Open http://localhost:3000 in browser
4. **Database Test**: Services will fail if database isn't accessible
5. **Redis Test**: API will fail if Redis isn't accessible

## Production Deployment Notes

For actual production deployment:
1. Change all default passwords and secrets
2. Use proper domain names in environment variables
3. Set up SSL certificates for nginx
4. Consider using a managed database service
5. Implement proper backup strategies
6. Set up external logging and monitoring if needed

## Rollback

If you need monitoring services back:
1. Use the original `docker-compose.production.yml`
2. Restore the monitoring directories from git
3. Add back the prometheus/grafana volumes