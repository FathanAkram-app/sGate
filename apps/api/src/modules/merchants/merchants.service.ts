import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { MerchantEntity, PaymentIntentEntity } from '../../entities';
import { generateApiKey, hashApiKey, verifyApiKey, PaymentIntentStatus } from '@sgate/shared';
import * as crypto from 'crypto';

export interface ApiKeyRecord {
  id: string;
  keyPrefix: string;
  name: string;
  createdAt: string;
  lastUsedAt?: string;
}

@Injectable()
export class MerchantsService {
  constructor(
    @InjectRepository(MerchantEntity)
    private merchantRepository: Repository<MerchantEntity>,
    @InjectRepository(PaymentIntentEntity)
    private paymentIntentRepository: Repository<PaymentIntentEntity>,
    private configService: ConfigService,
  ) {}

  async findByApiKey(apiKey: string): Promise<MerchantEntity | null> {
    const salt = this.configService.get<string>('security.apiKeySalt');
    const merchants = await this.merchantRepository.find();
    
    for (const merchant of merchants) {
      if (verifyApiKey(apiKey, merchant.apiKeyHash, salt)) {
        return merchant;
      }
    }
    
    return null;
  }

  async findById(id: string): Promise<MerchantEntity | null> {
    return this.merchantRepository.findOne({ where: { id } });
  }

  async create(name: string, webhookUrl?: string): Promise<{ merchant: MerchantEntity; apiKey: string }> {
    const apiKey = generateApiKey();
    const salt = this.configService.get<string>('security.apiKeySalt');
    const apiKeyHash = hashApiKey(apiKey, salt);

    const merchant = this.merchantRepository.create({
      name,
      apiKeyHash,
      webhookUrl,
      webhookSecret: webhookUrl ? this.generateWebhookSecret() : undefined,
    });

    await this.merchantRepository.save(merchant);
    
    return { merchant, apiKey };
  }

  async updateWebhook(id: string, webhookUrl: string): Promise<MerchantEntity> {
    const merchant = await this.findById(id);
    if (!merchant) {
      throw new Error('Merchant not found');
    }

    merchant.webhookUrl = webhookUrl;
    merchant.webhookSecret = this.generateWebhookSecret();
    
    return this.merchantRepository.save(merchant);
  }

  private generateWebhookSecret(): string {
    return require('crypto').randomBytes(32).toString('hex');
  }

  async getDashboardStats(merchantId: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get all payment intents for this merchant
    const allPayments = await this.paymentIntentRepository.find({
      where: { merchantId },
    });

    const recentPayments = await this.paymentIntentRepository.find({
      where: { 
        merchantId,
        createdAt: MoreThan(thirtyDaysAgo),
      },
    });

    const confirmedPayments = allPayments.filter(
      p => p.status === PaymentIntentStatus.CONFIRMED
    );
    
    const pendingPayments = allPayments.filter(
      p => p.status === PaymentIntentStatus.REQUIRES_PAYMENT
    );

    const totalVolume = confirmedPayments.reduce(
      (sum, p) => sum + parseInt(p.amountSats), 
      0
    );

    const recentVolume = recentPayments
      .filter(p => p.status === PaymentIntentStatus.CONFIRMED)
      .reduce((sum, p) => sum + parseInt(p.amountSats), 0);

    return {
      totalPayments: allPayments.length,
      confirmedPayments: confirmedPayments.length,
      pendingPayments: pendingPayments.length,
      totalVolume,
      last30Days: {
        payments: recentPayments.length,
        volume: recentVolume,
      },
    };
  }

  async getApiKeys(merchantId: string): Promise<ApiKeyRecord[]> {
    // For now, return mock data since we don't have a separate API keys table
    // In production, you'd want a separate ApiKey entity
    const merchant = await this.findById(merchantId);
    if (!merchant) return [];

    // Mock response - in production you'd query a proper api_keys table
    return [
      {
        id: 'ak_' + crypto.randomBytes(8).toString('hex'),
        keyPrefix: 'sk_test_',
        name: 'Default API Key',
        createdAt: merchant.createdAt.toISOString(),
        lastUsedAt: new Date().toISOString(),
      }
    ];
  }

  async createApiKey(merchantId: string, name: string) {
    // Generate new API key
    const apiKey = 'sk_test_' + crypto.randomBytes(24).toString('hex');
    const keyId = 'ak_' + crypto.randomBytes(8).toString('hex');
    
    // In production, you'd save this to an api_keys table
    // For now, just return the generated key
    return {
      id: keyId,
      key: apiKey,
      name,
    };
  }

  async revokeApiKey(merchantId: string, keyId: string) {
    // In production, you'd delete from api_keys table
    // For now, just return success
    return true;
  }

  async getWebhookEndpoints(merchantId: string) {
    // Mock webhook endpoints - in production you'd have a webhooks table
    const merchant = await this.findById(merchantId);
    if (!merchant || !merchant.webhookUrl) return [];

    return [
      {
        id: 'we_' + crypto.randomBytes(8).toString('hex'),
        url: merchant.webhookUrl,
        events: [
          'payment_intent.created',
          'payment_intent.confirmed',
          'payment_intent.expired'
        ],
        active: true,
        createdAt: merchant.createdAt.toISOString(),
      }
    ];
  }

  async createWebhookEndpoint(merchantId: string, url: string, events: string[]) {
    // In production, you'd create a new webhook endpoint record
    // For now, update the merchant's webhook URL
    await this.merchantRepository.update(merchantId, {
      webhookUrl: url,
    });

    return {
      id: 'we_' + crypto.randomBytes(8).toString('hex'),
      url,
      events,
      active: true,
      createdAt: new Date().toISOString(),
    };
  }

  async updateWebhookEndpoint(
    merchantId: string,
    id: string,
    data: { url?: string; events?: string[]; active?: boolean },
  ) {
    const merchant = await this.findById(merchantId);
    if (!merchant) return null;

    if (data.active === false) {
      await this.merchantRepository.update(merchantId, {
        webhookUrl: null,
        webhookSecret: null,
      });
      return {
        id,
        url: merchant.webhookUrl,
        events: data.events || [],
        active: false,
        createdAt: merchant.createdAt.toISOString(),
      };
    }

    if (data.url) {
      await this.merchantRepository.update(merchantId, { webhookUrl: data.url });
    }

    return {
      id,
      url: data.url || merchant.webhookUrl,
      events: data.events || [
        'payment_intent.created',
        'payment_intent.confirmed',
        'payment_intent.expired',
      ],
      active: data.active ?? true,
      createdAt: merchant.createdAt.toISOString(),
    };
  }

  async deleteWebhookEndpoint(merchantId: string, id: string) {
    await this.merchantRepository.update(merchantId, {
      webhookUrl: null,
      webhookSecret: null,
    });
    return { message: 'Webhook endpoint deleted' };
  }
}