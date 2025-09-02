import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { WebhookDeliveryEntity, PaymentIntentEntity } from '../../entities';
import {
  WebhookEventType,
  WebhookPayloadDto,
  signWebhookPayload,
  exponentialBackoff,
  sleep,
} from '@sgate/shared';
import axios from 'axios';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    @InjectRepository(WebhookDeliveryEntity)
    private webhookRepository: Repository<WebhookDeliveryEntity>,
    private configService: ConfigService,
  ) {}

  async createWebhook(
    merchantId: string,
    event: WebhookEventType,
    paymentIntent: PaymentIntentEntity,
  ): Promise<WebhookDeliveryEntity> {
    const payload: WebhookPayloadDto = {
      id: `evt_${Date.now()}`,
      event,
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: paymentIntent.id,
          amount_sats: parseInt(paymentIntent.amountSats),
          currency: paymentIntent.currency,
          status: paymentIntent.status,
          metadata: paymentIntent.metadata,
          created_at: paymentIntent.createdAt.toISOString(),
        },
      },
    };

    const webhook = this.webhookRepository.create({
      merchantId,
      event,
      payloadJson: payload,
      delivered: false,
      attempts: 0,
    });

    return this.webhookRepository.save(webhook);
  }

  async deliverWebhook(webhookId: string): Promise<boolean> {
    const webhook = await this.webhookRepository.findOne({
      where: { id: webhookId },
      relations: ['merchant'],
    });

    if (!webhook || !webhook.merchant.webhookUrl) {
      this.logger.warn(`Webhook ${webhookId} not found or no webhook URL configured`);
      return false;
    }

    if (webhook.delivered) {
      this.logger.debug(`Webhook ${webhookId} already delivered`);
      return true;
    }

    const maxAttempts = this.configService.get<number>('worker.webhookRetryAttempts') || 5;
    const timeoutMs = this.configService.get<number>('worker.webhookTimeoutMs') || 10000;
    const baseDelayMs = this.configService.get<number>('worker.webhookBaseDelayMs') || 1000;

    let lastError: string = '';

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        // Update attempt count
        webhook.attempts = attempt + 1;
        webhook.lastAttempt = new Date();
        
        // Calculate exponential backoff delay (with jitter)
        if (attempt > 0) {
          const delayMs = exponentialBackoff(attempt, baseDelayMs);
          const jitter = Math.random() * 0.1 * delayMs; // 10% jitter
          const totalDelay = Math.floor(delayMs + jitter);
          
          this.logger.debug(`Webhook ${webhookId} attempt ${attempt + 1}, waiting ${totalDelay}ms`);
          await sleep(totalDelay);
        }

        await this.webhookRepository.save(webhook);

        const payload = JSON.stringify(webhook.payloadJson);
        const timestamp = Math.floor(Date.now() / 1000);
        const signature = signWebhookPayload(payload, webhook.merchant.webhookSecret!, timestamp);

        this.logger.debug(`Attempting webhook delivery ${webhookId} to ${webhook.merchant.webhookUrl} (attempt ${attempt + 1}/${maxAttempts})`);

        const response = await axios.post(webhook.merchant.webhookUrl, webhook.payloadJson, {
          headers: {
            'Content-Type': 'application/json',
            'X-sGate-Signature': signature,
            'X-sGate-Timestamp': timestamp.toString(),
            'User-Agent': 'sGate-Webhook/1.0',
          },
          timeout: timeoutMs,
          validateStatus: (status) => true, // Don't throw on HTTP error codes
        });

        // Update response info
        webhook.responseStatus = response.status;
        webhook.responseHeaders = JSON.stringify(response.headers);
        webhook.responseBody = typeof response.data === 'string' 
          ? response.data.slice(0, 1000) // Limit stored response body
          : JSON.stringify(response.data).slice(0, 1000);

        if (response.status >= 200 && response.status < 300) {
          webhook.delivered = true;
          webhook.deliveredAt = new Date();
          webhook.lastError = null;
          await this.webhookRepository.save(webhook);
          
          this.logger.log(`Webhook ${webhookId} delivered successfully on attempt ${attempt + 1} (HTTP ${response.status})`);
          return true;
        } else {
          lastError = `HTTP ${response.status}: ${response.statusText}`;
          this.logger.warn(`Webhook ${webhookId} attempt ${attempt + 1} failed with HTTP ${response.status}`);
        }
      } catch (error) {
        lastError = error.code === 'ECONNABORTED' 
          ? `Request timeout after ${timeoutMs}ms`
          : error.code === 'ECONNREFUSED'
          ? 'Connection refused'
          : error.code === 'ENOTFOUND'
          ? 'DNS resolution failed'
          : error.message || 'Unknown error';
        
        this.logger.warn(`Webhook ${webhookId} attempt ${attempt + 1} failed: ${lastError}`);
      }

      // Save error state after each attempt
      webhook.lastError = lastError;
      await this.webhookRepository.save(webhook);

      // Don't wait after the last attempt
      if (attempt === maxAttempts - 1) {
        break;
      }
    }

    // Mark as permanently failed after max attempts
    webhook.failed = true;
    webhook.failedAt = new Date();
    await this.webhookRepository.save(webhook);

    this.logger.error(`Webhook ${webhookId} permanently failed after ${maxAttempts} attempts. Last error: ${lastError}`);
    
    // TODO: Send alert to merchant about failed webhook
    await this.sendFailureAlert(webhook);
    
    return false;
  }

  async getPendingWebhooks(): Promise<WebhookDeliveryEntity[]> {
    const maxAge = new Date();
    maxAge.setHours(maxAge.getHours() - 24); // Don't retry webhooks older than 24 hours

    return this.webhookRepository.find({
      where: { 
        delivered: false, 
        failed: false,
        createdAt: MoreThan(maxAge),
      },
      relations: ['merchant'],
      order: { createdAt: 'ASC' },
    });
  }

  async getFailedWebhooks(limit: number = 100): Promise<WebhookDeliveryEntity[]> {
    return this.webhookRepository.find({
      where: { failed: true },
      relations: ['merchant'],
      order: { failedAt: 'DESC' },
      take: limit,
    });
  }

  async retryFailedWebhook(webhookId: string): Promise<boolean> {
    const webhook = await this.webhookRepository.findOne({
      where: { id: webhookId },
      relations: ['merchant'],
    });

    if (!webhook) return false;

    // Reset webhook state for retry
    webhook.failed = false;
    webhook.delivered = false;
    webhook.attempts = 0;
    webhook.lastError = null;
    webhook.failedAt = null;
    await this.webhookRepository.save(webhook);

    return this.deliverWebhook(webhookId);
  }

  private async sendFailureAlert(webhook: WebhookDeliveryEntity): Promise<void> {
    // In production, you might want to:
    // 1. Send email notification to merchant
    // 2. Log to external monitoring service (Datadog, Sentry, etc.)
    // 3. Update dashboard notification system
    // 4. Trigger Slack/Discord alerts
    
    this.logger.error(`WEBHOOK FAILURE ALERT: Webhook ${webhook.id} for merchant ${webhook.merchantId} failed permanently`, {
      webhookId: webhook.id,
      merchantId: webhook.merchantId,
      event: webhook.event,
      attempts: webhook.attempts,
      lastError: webhook.lastError,
      url: webhook.merchant?.webhookUrl,
    });

    // TODO: Implement actual alerting mechanism
    // Example: await this.notificationService.sendWebhookFailureAlert(webhook);
  }

  async firePaymentIntentSucceeded(paymentIntent: PaymentIntentEntity): Promise<void> {
    if (paymentIntent.merchant.webhookUrl) {
      const webhook = await this.createWebhook(
        paymentIntent.merchantId,
        WebhookEventType.PAYMENT_INTENT_SUCCEEDED,
        paymentIntent,
      );
      await this.deliverWebhook(webhook.id);
    }
  }

  async firePaymentIntentFailed(paymentIntent: PaymentIntentEntity): Promise<void> {
    if (paymentIntent.merchant.webhookUrl) {
      const webhook = await this.createWebhook(
        paymentIntent.merchantId,
        WebhookEventType.PAYMENT_INTENT_FAILED,
        paymentIntent,
      );
      await this.deliverWebhook(webhook.id);
    }
  }

  async firePaymentIntentExpired(paymentIntent: PaymentIntentEntity): Promise<void> {
    if (paymentIntent.merchant.webhookUrl) {
      const webhook = await this.createWebhook(
        paymentIntent.merchantId,
        WebhookEventType.PAYMENT_INTENT_EXPIRED,
        paymentIntent,
      );
      await this.deliverWebhook(webhook.id);
    }
  }
}