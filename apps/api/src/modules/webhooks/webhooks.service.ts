import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
      return false;
    }

    const maxAttempts = this.configService.get<number>('worker.webhookRetryAttempts');
    const timeoutMs = this.configService.get<number>('worker.webhookTimeoutMs');

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        webhook.attempts = attempt + 1;
        await this.webhookRepository.save(webhook);

        const payload = JSON.stringify(webhook.payloadJson);
        const timestamp = Math.floor(Date.now() / 1000);
        const signature = signWebhookPayload(payload, webhook.merchant.webhookSecret!, timestamp);

        const response = await axios.post(webhook.merchant.webhookUrl, webhook.payloadJson, {
          headers: {
            'Content-Type': 'application/json',
            'X-sGate-Signature': signature,
          },
          timeout: timeoutMs,
        });

        if (response.status >= 200 && response.status < 300) {
          webhook.delivered = true;
          webhook.lastError = null;
          await this.webhookRepository.save(webhook);
          
          this.logger.log(`Webhook ${webhookId} delivered successfully`);
          return true;
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        const errorMessage = error.message || 'Unknown error';
        webhook.lastError = errorMessage;
        await this.webhookRepository.save(webhook);

        this.logger.warn(`Webhook ${webhookId} delivery attempt ${attempt + 1} failed: ${errorMessage}`);

        if (attempt < maxAttempts - 1) {
          const delay = exponentialBackoff(attempt);
          await sleep(delay);
        }
      }
    }

    this.logger.error(`Webhook ${webhookId} failed after ${maxAttempts} attempts`);
    return false;
  }

  async getPendingWebhooks(): Promise<WebhookDeliveryEntity[]> {
    return this.webhookRepository.find({
      where: { delivered: false },
      relations: ['merchant'],
    });
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