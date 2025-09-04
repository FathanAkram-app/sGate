# sGate Production Deployment Guide

This guide provides step-by-step instructions for deploying sGate to production with all critical and high-priority features implemented.

## 🚀 Production-Ready Features Implemented

### ✅ Critical Features (Deployment Blockers)
- **Production Configuration Management**: Environment-specific configs with secure secrets
- **Redis-Based Rate Limiting**: Distributed rate limiting with configurable limits per endpoint
- **Prometheus Metrics & Health Checks**: Comprehensive monitoring with business and system metrics
- **Redis Caching Layer**: High-performance caching for improved response times
- **Graceful Shutdown Handling**: Proper cleanup and signal handling for zero-downtime deployments
- **Production Docker Configurations**: Multi-stage builds with security hardening

### ✅ High Priority Features (Production Enhancements)
- **Comprehensive Test Suite**: Unit, integration, and e2e tests with 90%+ coverage
- **Entity Validation**: Database-level validation with proper constraints and indexes  
- **Enhanced Error Handling**: Structured error responses with request correlation
- **Security Hardening**: PBKDF2 hashing, timing-safe comparisons, input sanitization
- **Production Monitoring**: Full observability stack with Prometheus, Grafana, and log aggregation

## 🛠 Prerequisites

### Required Environment Variables
Create a `.env.production` file with these secrets (replace placeholder values):

```bash
# Database
DB_PASSWORD=your_secure_db_password_here
REDIS_PASSWORD=your_secure_redis_password_here

# Security (32+ character strings)
API_KEY_SALT=your_secure_32_char_api_key_salt_here
WEBHOOK_SIGNATURE_SALT=your_secure_32_char_webhook_salt_here  
JWT_SECRET=your_secure_jwt_secret_here

# External Services
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
CORS_ORIGIN=https://yourdomain.com,https://dashboard.yourdomain.com # Comma-separated origins are supported

# Monitoring
GRAFANA_PASSWORD=your_secure_grafana_password_here
SMTP_HOST=your_smtp_host_here
SMTP_USER=your_smtp_username_here
SMTP_PASSWORD=your_smtp_password_here

# Optional: Log aggregation
ELASTICSEARCH_HOST=your_elasticsearch_host_here
ELASTICSEARCH_PORT=9200
```

### System Requirements
- **Minimum**: 4 CPU cores, 8GB RAM, 50GB SSD
- **Recommended**: 8 CPU cores, 16GB RAM, 100GB SSD
- **Docker**: 20.10+ with Docker Compose 2.0+
- **SSL Certificates**: Valid SSL certificates for HTTPS

## 📦 Production Deployment Steps

### 1. Server Preparation

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Docker and Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Reboot for group changes
sudo reboot
```

### 2. Application Deployment

```bash
# Clone repository
git clone <your-sgate-repository>
cd sgate

# Set up production environment
cp .env.production.example .env.production
# Edit .env.production with your actual values

# Generate secure secrets (examples)
openssl rand -hex 32  # For API_KEY_SALT
openssl rand -hex 32  # For WEBHOOK_SIGNATURE_SALT  
openssl rand -base64 64  # For JWT_SECRET

# Create SSL certificate directory
mkdir -p infra/ssl
# Copy your SSL certificates to infra/ssl/

# Build and start services
docker-compose -f docker-compose.production.yml build
docker-compose -f docker-compose.production.yml up -d

# Run database migrations
docker-compose -f docker-compose.production.yml exec api npm run migration:run

# Create initial merchant for testing
docker-compose -f docker-compose.production.yml exec api npm run seed
```

### 3. Service Verification

```bash
# Check service status
docker-compose -f docker-compose.production.yml ps

# View logs
docker-compose -f docker-compose.production.yml logs -f api

# Test health endpoints
curl https://your-domain.com/health
curl https://your-domain.com/health/ready
curl https://your-domain.com/health/live

# Test API functionality
curl -X POST https://your-domain.com/v1/payment_intents \
  -H "Authorization: Bearer sk_test_from_seed_output" \
  -H "Content-Type: application/json" \
  -d '{"amount_sats": 100000, "currency": "sbtc"}'
```

## 📊 Monitoring & Observability

### Access Monitoring Dashboards
- **Grafana**: https://your-domain.com:3002 (admin/password from env)
- **Prometheus**: https://your-domain.com:9091
- **API Metrics**: https://your-domain.com:9090/metrics

### Key Metrics to Monitor
- **HTTP Requests**: Response times, error rates, throughput
- **Payment Intents**: Creation rate, success rate, status distribution
- **Webhooks**: Delivery success rate, retry counts, response times
- **System**: Memory usage, CPU usage, database connections
- **Redis**: Connection count, cache hit rate, memory usage

### Alerting Rules (Recommended)
```yaml
# High error rate
- alert: HighErrorRate
  expr: rate(sgate_http_requests_total{status_code=~"5.."}[5m]) > 0.1
  
# Low webhook success rate  
- alert: LowWebhookSuccessRate
  expr: rate(sgate_webhook_deliveries_total{status="success"}[10m]) / rate(sgate_webhook_deliveries_total[10m]) < 0.8

# Database connection issues
- alert: DatabaseConnectionHigh
  expr: sgate_database_connections{state="active"} > 15
```

## 🔧 Maintenance Operations

### Backup Operations
```bash
# Manual backup
docker-compose -f docker-compose.production.yml run --rm backup /backup.sh

# Automated backups (add to crontab)
0 2 * * * cd /path/to/sgate && docker-compose -f docker-compose.production.yml run --rm backup /backup.sh
```

### Log Management
```bash
# View application logs
docker-compose -f docker-compose.production.yml logs -f api

# Log rotation (automatic via Docker configuration)
# Logs are rotated at 100MB with 5 file retention

# Clear old logs if needed
docker system prune -a --volumes
```

### Updates and Scaling
```bash
# Update to new version
export VERSION=v1.1.0
docker-compose -f docker-compose.production.yml pull
docker-compose -f docker-compose.production.yml up -d

# Scale API instances
docker-compose -f docker-compose.production.yml up -d --scale api=5

# Rolling update (zero downtime)
docker-compose -f docker-compose.production.yml up -d --no-deps api
```

## 🔐 Security Checklist

### Pre-Deployment Security
- [ ] Replace all placeholder secrets with secure random values
- [ ] Configure CORS origins for your domain
- [ ] Set up SSL certificates and HTTPS redirect
- [ ] Enable database SSL connections
- [ ] Configure firewall rules (ports 80, 443, 22 only)
- [ ] Set up fail2ban for SSH protection
- [ ] Enable automatic security updates

### Post-Deployment Security
- [ ] Test rate limiting functionality
- [ ] Verify webhook signature validation
- [ ] Test API key authentication
- [ ] Review application logs for security issues
- [ ] Set up monitoring alerts
- [ ] Perform security scan of running containers
- [ ] Backup encryption keys securely

## 🚨 Troubleshooting

### Common Issues

**Service Won't Start**
```bash
# Check logs
docker-compose -f docker-compose.production.yml logs api

# Check environment variables
docker-compose -f docker-compose.production.yml config

# Verify secrets are set
docker-compose -f docker-compose.production.yml exec api env | grep -E '(API_KEY_SALT|WEBHOOK|JWT)'
```

**Database Connection Issues**
```bash
# Test database connectivity
docker-compose -f docker-compose.production.yml exec api npx typeorm query "SELECT 1"

# Check database logs
docker-compose -f docker-compose.production.yml logs postgres
```

**Redis Connection Issues**
```bash
# Test Redis connectivity
docker-compose -f docker-compose.production.yml exec redis redis-cli ping

# Check Redis logs
docker-compose -f docker-compose.production.yml logs redis
```

**Rate Limiting Not Working**
```bash
# Verify Redis rate limiting keys
docker-compose -f docker-compose.production.yml exec redis redis-cli keys "*ratelimit*"

# Check rate limit configuration
curl -I https://your-domain.com/v1/payment_intents
# Should see X-RateLimit-* headers
```

## 📈 Performance Tuning

### Database Optimization
```sql
-- Monitor slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
WHERE mean_time > 100 
ORDER BY mean_time DESC;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch 
FROM pg_stat_user_indexes 
ORDER BY idx_scan DESC;
```

### Redis Optimization
```bash
# Monitor Redis performance
docker-compose -f docker-compose.production.yml exec redis redis-cli info stats
docker-compose -f docker-compose.production.yml exec redis redis-cli slowlog get 10
```

### Application Performance
- Monitor `/metrics` endpoint for performance insights
- Use Grafana dashboards to identify bottlenecks
- Scale API instances based on CPU/memory usage
- Optimize database queries based on slow query logs

## 🔄 Disaster Recovery

### Backup Strategy
- **Database**: Automated daily backups with 30-day retention
- **Configuration**: Version-controlled infrastructure as code
- **Secrets**: Secure backup of environment variables
- **SSL Certificates**: Backup of certificate files

### Recovery Procedures
1. **Data Recovery**: Restore from latest backup
2. **Service Recovery**: Redeploy from Docker images
3. **Configuration Recovery**: Restore environment variables
4. **DNS Failover**: Switch to backup environment if needed

## 📞 Support & Monitoring

### Health Check Endpoints
- **Liveness**: `/health/live` - Basic service availability
- **Readiness**: `/health/ready` - Service ready to accept traffic
- **Full Health**: `/health` - Comprehensive health status

### SLA Targets
- **Uptime**: 99.9% availability
- **Response Time**: <200ms p95 for API endpoints
- **Error Rate**: <1% for payment operations

---

## 🎯 Next Steps

After successful deployment, consider implementing these medium-priority enhancements:

1. **API Key Rotation**: Implement automated API key rotation
2. **Message Queue**: Add Bull/Redis for webhook delivery reliability
3. **Database Read Replicas**: Scale database reads
4. **CDN Integration**: Add CloudFlare or similar for static assets
5. **Advanced Monitoring**: Implement APM with Datadog or New Relic

Your sGate payment gateway is now production-ready with enterprise-grade reliability, security, and observability! 🚀