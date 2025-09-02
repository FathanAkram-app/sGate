import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as promClient from 'prom-client';

@Injectable()
export class MetricsService implements OnModuleInit {
  private readonly logger = new Logger(MetricsService.name);
  private register: promClient.Registry;

  // HTTP Metrics
  private httpRequestsTotal: promClient.Counter<string>;
  private httpRequestDuration: promClient.Histogram<string>;
  private httpRequestsInFlight: promClient.Gauge<string>;

  // Business Metrics
  private paymentIntentsTotal: promClient.Counter<string>;
  private paymentIntentsStatus: promClient.Gauge<string>;
  private paymentsConfirmed: promClient.Counter<string>;
  private webhookDeliveries: promClient.Counter<string>;
  private webhookDeliveryDuration: promClient.Histogram<string>;

  // System Metrics
  private redisConnections: promClient.Gauge<string>;
  private databaseConnections: promClient.Gauge<string>;
  private blockchainHeight: promClient.Gauge<string>;

  // Error Metrics
  private errorsTotal: promClient.Counter<string>;
  private apiKeyErrors: promClient.Counter<string>;

  constructor(private configService: ConfigService) {
    this.register = new promClient.Registry();
  }

  async onModuleInit() {
    if (!this.configService.get<boolean>('monitoring.enableMetrics')) {
      this.logger.warn('Metrics disabled in configuration');
      return;
    }

    this.initializeMetrics();
    this.startDefaultMetrics();
    this.logger.log('Metrics service initialized');
  }

  private initializeMetrics() {
    // HTTP Metrics
    this.httpRequestsTotal = new promClient.Counter({
      name: 'sgate_http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'endpoint', 'status_code', 'status_class'],
      registers: [this.register],
    });

    this.httpRequestDuration = new promClient.Histogram({
      name: 'sgate_http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'endpoint', 'status_code'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
      registers: [this.register],
    });

    this.httpRequestsInFlight = new promClient.Gauge({
      name: 'sgate_http_requests_in_flight',
      help: 'Number of HTTP requests currently being processed',
      labelNames: ['method', 'endpoint'],
      registers: [this.register],
    });

    // Business Metrics
    this.paymentIntentsTotal = new promClient.Counter({
      name: 'sgate_payment_intents_total',
      help: 'Total number of payment intents created',
      labelNames: ['merchant_id', 'currency', 'source'],
      registers: [this.register],
    });

    this.paymentIntentsStatus = new promClient.Gauge({
      name: 'sgate_payment_intents_by_status',
      help: 'Number of payment intents by status',
      labelNames: ['status'],
      registers: [this.register],
    });

    this.paymentsConfirmed = new promClient.Counter({
      name: 'sgate_payments_confirmed_total',
      help: 'Total number of confirmed payments',
      labelNames: ['merchant_id', 'currency'],
      registers: [this.register],
    });

    this.webhookDeliveries = new promClient.Counter({
      name: 'sgate_webhook_deliveries_total',
      help: 'Total number of webhook deliveries',
      labelNames: ['event_type', 'status', 'merchant_id'],
      registers: [this.register],
    });

    this.webhookDeliveryDuration = new promClient.Histogram({
      name: 'sgate_webhook_delivery_duration_seconds',
      help: 'Webhook delivery duration in seconds',
      labelNames: ['event_type', 'status'],
      buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
      registers: [this.register],
    });

    // System Metrics
    this.redisConnections = new promClient.Gauge({
      name: 'sgate_redis_connections',
      help: 'Number of Redis connections',
      registers: [this.register],
    });

    this.databaseConnections = new promClient.Gauge({
      name: 'sgate_database_connections',
      help: 'Number of database connections',
      labelNames: ['state'],
      registers: [this.register],
    });

    this.blockchainHeight = new promClient.Gauge({
      name: 'sgate_blockchain_height',
      help: 'Current blockchain height',
      labelNames: ['network'],
      registers: [this.register],
    });

    // Error Metrics
    this.errorsTotal = new promClient.Counter({
      name: 'sgate_errors_total',
      help: 'Total number of errors',
      labelNames: ['type', 'component', 'severity'],
      registers: [this.register],
    });

    this.apiKeyErrors = new promClient.Counter({
      name: 'sgate_api_key_errors_total',
      help: 'Total number of API key authentication errors',
      labelNames: ['error_type'],
      registers: [this.register],
    });
  }

  private startDefaultMetrics() {
    // Collect default Node.js metrics
    promClient.collectDefaultMetrics({
      register: this.register,
      prefix: 'sgate_nodejs_',
    });
  }

  // HTTP Metrics Methods
  recordHttpRequest(method: string, endpoint: string, statusCode: number, duration: number) {
    const statusClass = Math.floor(statusCode / 100) + 'xx';
    
    this.httpRequestsTotal.inc({
      method,
      endpoint,
      status_code: statusCode.toString(),
      status_class: statusClass,
    });

    this.httpRequestDuration.observe(
      { method, endpoint, status_code: statusCode.toString() },
      duration,
    );
  }

  incrementHttpRequestsInFlight(method: string, endpoint: string) {
    this.httpRequestsInFlight.inc({ method, endpoint });
  }

  decrementHttpRequestsInFlight(method: string, endpoint: string) {
    this.httpRequestsInFlight.dec({ method, endpoint });
  }

  // Business Metrics Methods
  recordPaymentIntentCreated(merchantId: string, currency: string, source: string = 'api') {
    this.paymentIntentsTotal.inc({ merchant_id: merchantId, currency, source });
  }

  updatePaymentIntentStatus(status: string, count: number) {
    this.paymentIntentsStatus.set({ status }, count);
  }

  recordPaymentConfirmed(merchantId: string, currency: string) {
    this.paymentsConfirmed.inc({ merchant_id: merchantId, currency });
  }

  recordWebhookDelivery(eventType: string, status: string, merchantId: string, duration?: number) {
    this.webhookDeliveries.inc({ 
      event_type: eventType, 
      status, 
      merchant_id: merchantId,
    });

    if (duration !== undefined) {
      this.webhookDeliveryDuration.observe(
        { event_type: eventType, status },
        duration,
      );
    }
  }

  // System Metrics Methods
  updateRedisConnections(count: number) {
    this.redisConnections.set(count);
  }

  updateDatabaseConnections(active: number, idle: number, total: number) {
    this.databaseConnections.set({ state: 'active' }, active);
    this.databaseConnections.set({ state: 'idle' }, idle);
    this.databaseConnections.set({ state: 'total' }, total);
  }

  updateBlockchainHeight(height: number, network: string = 'testnet') {
    this.blockchainHeight.set({ network }, height);
  }

  // Error Metrics Methods
  recordError(type: string, component: string, severity: string = 'error') {
    this.errorsTotal.inc({ type, component, severity });
  }

  recordApiKeyError(errorType: string) {
    this.apiKeyErrors.inc({ error_type: errorType });
  }

  // Utility Methods
  async getMetrics(): Promise<string> {
    return this.register.metrics();
  }

  getRegister(): promClient.Registry {
    return this.register;
  }

  // Business Intelligence Methods
  async getBusinessMetrics(): Promise<{
    paymentIntents: { total: number; byStatus: Record<string, number> };
    payments: { confirmed: number };
    webhooks: { delivered: number; failed: number };
    errors: { total: number; byType: Record<string, number> };
  }> {
    const metrics = await this.register.getMetricsAsJSON();

    // Extract business metrics
    const paymentIntentsTotal = metrics.find(m => m.name === 'sgate_payment_intents_total');
    const paymentIntentsStatus = metrics.find(m => m.name === 'sgate_payment_intents_by_status');
    const paymentsConfirmed = metrics.find(m => m.name === 'sgate_payments_confirmed_total');
    const webhookDeliveries = metrics.find(m => m.name === 'sgate_webhook_deliveries_total');
    const errorsTotal = metrics.find(m => m.name === 'sgate_errors_total');

    const result = {
      paymentIntents: {
        total: 0,
        byStatus: {} as Record<string, number>,
      },
      payments: {
        confirmed: 0,
      },
      webhooks: {
        delivered: 0,
        failed: 0,
      },
      errors: {
        total: 0,
        byType: {} as Record<string, number>,
      },
    };

    // Process payment intents total
    if (paymentIntentsTotal?.values) {
      result.paymentIntents.total = paymentIntentsTotal.values.reduce(
        (sum, v) => sum + (v.value || 0),
        0,
      );
    }

    // Process payment intents by status
    if (paymentIntentsStatus?.values) {
      for (const value of paymentIntentsStatus.values) {
        const status = value.labels?.status;
        if (status) {
          result.paymentIntents.byStatus[status] = value.value || 0;
        }
      }
    }

    // Process confirmed payments
    if (paymentsConfirmed?.values) {
      result.payments.confirmed = paymentsConfirmed.values.reduce(
        (sum, v) => sum + (v.value || 0),
        0,
      );
    }

    // Process webhook deliveries
    if (webhookDeliveries?.values) {
      for (const value of webhookDeliveries.values) {
        const status = value.labels?.status;
        if (status === 'success') {
          result.webhooks.delivered += value.value || 0;
        } else if (status === 'failed') {
          result.webhooks.failed += value.value || 0;
        }
      }
    }

    // Process errors
    if (errorsTotal?.values) {
      result.errors.total = errorsTotal.values.reduce(
        (sum, v) => sum + (v.value || 0),
        0,
      );

      for (const value of errorsTotal.values) {
        const type = value.labels?.type;
        if (type) {
          result.errors.byType[type] = (result.errors.byType[type] || 0) + (value.value || 0);
        }
      }
    }

    return result;
  }

  // Health check for metrics service
  async healthCheck(): Promise<{ status: string; metricsCount: number }> {
    try {
      const metrics = await this.register.getMetricsAsJSON();
      return {
        status: 'healthy',
        metricsCount: metrics.length,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        metricsCount: 0,
      };
    }
  }

  // Reset metrics (for testing)
  resetMetrics() {
    this.register.clear();
    this.initializeMetrics();
    this.startDefaultMetrics();
  }
}