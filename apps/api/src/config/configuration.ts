export default () => ({
  port: parseInt(process.env.PORT, 10) || 4000,
  database: {
    url: process.env.DATABASE_URL,
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
  },
  urls: {
    apiBase: process.env.API_BASE_URL || 'http://localhost:4000',
    checkoutBase: process.env.CHECKOUT_BASE_URL || 'http://localhost:3000',
  },
  exchange: {
    usdPerBtc: parseFloat(process.env.USD_PER_BTC_TESTNET) || 65000,
  },
  worker: {
    watcherIntervalMs: parseInt(process.env.WATCHER_INTERVAL_MS, 10) || 10000,
    webhookRetryAttempts: parseInt(process.env.WEBHOOK_RETRY_ATTEMPTS, 10) || 3,
    webhookTimeoutMs: parseInt(process.env.WEBHOOK_TIMEOUT_MS, 10) || 5000,
  },
});