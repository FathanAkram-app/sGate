export default () => ({
  port: parseInt(process.env.PORT, 10) || 4000,
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',
  
  database: {
    url: process.env.DATABASE_URL,
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS, 10) || 20,
    minConnections: parseInt(process.env.DB_MIN_CONNECTIONS, 10) || 5,
    idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT, 10) || 30000,
    connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT, 10) || 2000,
    sslEnabled: process.env.DB_SSL_ENABLED === 'true',
  },

  redis: {
    url: process.env.REDIS_URL,
    prefix: process.env.REDIS_PREFIX || 'sgate',
    maxRetries: parseInt(process.env.REDIS_MAX_RETRIES, 10) || 3,
    connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT, 10) || 5000,
  },

  stacks: {
    network: process.env.STACKS_NETWORK || 'testnet',
    hiroApiBase: process.env.HIRO_API_BASE || 'https://api.testnet.hiro.so',
    sbtcAssetIdentifier: process.env.SBTC_ASSET_IDENTIFIER,
    gatewayAddress: process.env.GATEWAY_ADDRESS,
    requiredConfirmations: parseInt(process.env.REQUIRED_CONFIRMATIONS, 10) || 1,
  },

  security: {
    jwtSecret: process.env.JWT_SECRET || 'dev-secret',
    webhookSignatureSalt: process.env.WEBHOOK_SIGNATURE_SALT || 'dev-webhook-salt',
    apiKeySalt: process.env.API_KEY_SALT || 'dev-api-salt',
    helmetEnabled: process.env.HELMET_ENABLED === 'true',
    trustProxy: parseInt(process.env.TRUST_PROXY, 10) || 0,
  },

  urls: {
    apiBase: process.env.API_BASE_URL || 'http://localhost:4000',
    checkoutBase: process.env.CHECKOUT_BASE_URL || 'http://localhost:3000',
    dashboardBase: process.env.DASHBOARD_BASE_URL || 'http://localhost:3001',
  },

  rateLimit: {
    enabled: process.env.RATE_LIMIT_ENABLED === 'true',
    paymentCreation: parseInt(process.env.RATE_LIMIT_PAYMENT_CREATION, 10) || 100,
    paymentRetrieval: parseInt(process.env.RATE_LIMIT_PAYMENT_RETRIEVAL, 10) || 1000,
    publicApi: parseInt(process.env.RATE_LIMIT_PUBLIC_API, 10) || 500,
    default: parseInt(process.env.RATE_LIMIT_DEFAULT, 10) || 200,
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 60000,
  },

  worker: {
    watcherIntervalMs: parseInt(process.env.WATCHER_INTERVAL_MS, 10) || 10000,
    webhookRetryAttempts: parseInt(process.env.WEBHOOK_RETRY_ATTEMPTS, 10) || 3,
    webhookTimeoutMs: parseInt(process.env.WEBHOOK_TIMEOUT_MS, 10) || 5000,
    webhookBaseDelayMs: parseInt(process.env.WEBHOOK_BASE_DELAY_MS, 10) || 1000,
    webhookMaxDelayMs: parseInt(process.env.WEBHOOK_MAX_DELAY_MS, 10) || 300000,
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'pretty',
    disableConsole: process.env.LOG_DISABLE_CONSOLE === 'true',
  },

  monitoring: {
    enableMetrics: process.env.ENABLE_METRICS === 'true',
    metricsPort: parseInt(process.env.METRICS_PORT, 10) || 9090,
    enableHealthCheck: process.env.ENABLE_HEALTH_CHECK === 'true',
    healthCheckTimeout: parseInt(process.env.HEALTH_CHECK_TIMEOUT, 10) || 5000,
    sentryDsn: process.env.SENTRY_DSN,
    datadogApiKey: process.env.DATADOG_API_KEY,
  },

  cache: {
    ttlPaymentIntent: parseInt(process.env.CACHE_TTL_PAYMENT_INTENT, 10) || 300,
    ttlExchangeRates: parseInt(process.env.CACHE_TTL_EXCHANGE_RATES, 10) || 3600,
    ttlHealthCheck: parseInt(process.env.CACHE_TTL_HEALTH_CHECK, 10) || 60,
  },

  cors: {
    origin: process.env.CORS_ORIGIN,
    credentials: process.env.CORS_CREDENTIALS === 'true',
  },

  ssl: {
    certPath: process.env.SSL_CERT_PATH,
    keyPath: process.env.SSL_KEY_PATH,
  },

  backup: {
    enabled: process.env.BACKUP_ENABLED === 'true',
    schedule: process.env.BACKUP_SCHEDULE || '0 2 * * *',
    retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS, 10) || 30,
  },

  exchange: {
    usdPerBtc: parseFloat(process.env.USD_PER_BTC_TESTNET) || 65000,
  },
});