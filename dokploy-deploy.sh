mkdir -p apps/api && cat > apps/api/.env.production << 'EOF'
# ================================
# sGate API - Production Configuration
# ================================

# Environment
NODE_ENV=production

# Server Configuration
PORT=4000
HOST=0.0.0.0

# Database (PostgreSQL)
DATABASE_URL=postgresql://sgate_prod:${DB_PASSWORD}@postgres:5432/sgate_production
DB_MAX_CONNECTIONS=20
DB_MIN_CONNECTIONS=5
DB_IDLE_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=2000
DB_SSL_ENABLED=true

# Redis Configuration
REDIS_URL=redis://default:${REDIS_PASSWORD}@redis:6379
REDIS_PREFIX=sgate
REDIS_MAX_RETRIES=3
REDIS_CONNECT_TIMEOUT=5000

# Security Configuration
API_KEY_SALT=${API_KEY_SALT}
WEBHOOK_SIGNATURE_SALT=${WEBHOOK_SIGNATURE_SALT}
JWT_SECRET=${JWT_SECRET}

# Stacks Blockchain Configuration
STACKS_NETWORK=testnet
HIRO_API_BASE=https://api.testnet.hiro.so
SBTC_ASSET_IDENTIFIER=ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.sbtc-token::sbtc
GATEWAY_ADDRESS=ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM
REQUIRED_CONFIRMATIONS=1

# Application URLs
API_BASE_URL=https://api.sgate.com
CHECKOUT_BASE_URL=https://checkout.sgate.com
DASHBOARD_BASE_URL=https://dashboard.sgate.com

# Rate Limiting Configuration
RATE_LIMIT_ENABLED=true
RATE_LIMIT_PAYMENT_CREATION=100
RATE_LIMIT_PAYMENT_RETRIEVAL=1000
RATE_LIMIT_PUBLIC_API=500
RATE_LIMIT_DEFAULT=200
RATE_LIMIT_WINDOW_MS=60000

# Worker/Background Jobs Configuration
WATCHER_INTERVAL_MS=10000
WEBHOOK_RETRY_ATTEMPTS=5
WEBHOOK_TIMEOUT_MS=10000
WEBHOOK_BASE_DELAY_MS=1000
WEBHOOK_MAX_DELAY_MS=300000

# Logging Configuration
LOG_LEVEL=info
LOG_FORMAT=json
LOG_DISABLE_CONSOLE=false

# Monitoring Configuration
ENABLE_METRICS=true
METRICS_PORT=9090
ENABLE_HEALTH_CHECK=true
HEALTH_CHECK_TIMEOUT=5000

# External Monitoring Services
SENTRY_DSN=${SENTRY_DSN}
DATADOG_API_KEY=${DATADOG_API_KEY}

# Performance Configuration
NODE_OPTIONS=--max-old-space-size=2048
UV_THREADPOOL_SIZE=4

# Cache Configuration
CACHE_TTL_PAYMENT_INTENT=300
CACHE_TTL_EXCHANGE_RATES=3600
CACHE_TTL_HEALTH_CHECK=60

# CORS Configuration
CORS_ORIGIN=${CORS_ORIGIN}
CORS_CREDENTIALS=true

# Security Headers
HELMET_ENABLED=true
TRUST_PROXY=1

# SSL Configuration
SSL_CERT_PATH=/etc/ssl/certs/sgate.crt
SSL_KEY_PATH=/etc/ssl/private/sgate.key

# Backup Configuration
BACKUP_ENABLED=true
BACKUP_SCHEDULE=0 2 * * *
BACKUP_RETENTION_DAYS=30
EOF
docker-compose -f ./docker-compose.production.yml up -d --build --remove-orphans
