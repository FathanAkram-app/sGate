import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { MerchantEntity } from '../../entities';
import { generateApiKey, hashApiKey, verifyApiKey } from '@sgate/shared';

@Injectable()
export class MerchantsService {
  constructor(
    @InjectRepository(MerchantEntity)
    private merchantRepository: Repository<MerchantEntity>,
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
}