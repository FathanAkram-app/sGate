import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, Between, FindManyOptions } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { PaymentIntentEntity } from '../../entities';
import {
  CreatePaymentIntentDto,
  PaymentIntentResponseDto,
  PaymentIntentStatus,
  generateId,
  generateClientSecret,
  encodePaymentIntentMemo,
} from '@sgate/shared';

@Injectable()
export class PaymentIntentsService {
  constructor(
    @InjectRepository(PaymentIntentEntity)
    private paymentIntentRepository: Repository<PaymentIntentEntity>,
    private configService: ConfigService,
  ) {}

  async create(
    merchantId: string,
    dto: CreatePaymentIntentDto,
  ): Promise<PaymentIntentResponseDto> {
    const id = generateId('pi');
    const clientSecret = generateClientSecret(id);
    const memoHex = encodePaymentIntentMemo(id);
    const gatewayAddress = this.configService.get<string>('stacks.gatewayAddress');
    const checkoutBaseUrl = this.configService.get<string>('urls.checkoutBase');
    
    const expiresAt = new Date();
    const expiresInSeconds = dto.expires_in || 900; // Default to 15 minutes if not provided
    expiresAt.setSeconds(expiresAt.getSeconds() + expiresInSeconds);

    const paymentIntent = this.paymentIntentRepository.create({
      id,
      merchantId,
      amountSats: dto.amount_sats.toString(),
      currency: dto.currency,
      status: PaymentIntentStatus.REQUIRES_PAYMENT,
      clientSecret,
      payAddress: gatewayAddress,
      memoHex,
      expiresAt,
      metadata: dto.metadata,
      description: dto.description,
      successUrl: dto.success_url,
      cancelUrl: dto.cancel_url,
    });

    await this.paymentIntentRepository.save(paymentIntent);

    return {
      id: paymentIntent.id,
      client_secret: paymentIntent.clientSecret,
      pay_address: paymentIntent.payAddress,
      amount_sats: parseInt(paymentIntent.amountSats),
      currency: paymentIntent.currency as 'sbtc',
      status: paymentIntent.status,
      description: paymentIntent.description,
      metadata: paymentIntent.metadata,
      expires_at: paymentIntent.expiresAt.toISOString(),
      checkout_url: `${checkoutBaseUrl}/pi/${paymentIntent.id}`,
      success_url: paymentIntent.successUrl,
      cancel_url: paymentIntent.cancelUrl,
      created_at: paymentIntent.createdAt.toISOString(),
    };
  }

  async findOne(
    id: string,
    merchantId: string,
  ): Promise<PaymentIntentResponseDto | null> {
    const paymentIntent = await this.paymentIntentRepository.findOne({
      where: { id, merchantId },
    });

    if (!paymentIntent) {
      return null;
    }

    const checkoutBaseUrl = this.configService.get<string>('urls.checkoutBase');

    return {
      id: paymentIntent.id,
      client_secret: paymentIntent.clientSecret,
      pay_address: paymentIntent.payAddress,
      amount_sats: parseInt(paymentIntent.amountSats),
      currency: paymentIntent.currency as 'sbtc',
      status: paymentIntent.status,
      description: paymentIntent.description,
      metadata: paymentIntent.metadata,
      expires_at: paymentIntent.expiresAt.toISOString(),
      checkout_url: `${checkoutBaseUrl}/pi/${paymentIntent.id}`,
      success_url: paymentIntent.successUrl,
      cancel_url: paymentIntent.cancelUrl,
      created_at: paymentIntent.createdAt.toISOString(),
    };
  }

  async findById(id: string): Promise<PaymentIntentEntity | null> {
    return this.paymentIntentRepository.findOne({
      where: { id },
      relations: ['merchant'],
    });
  }

  async findAll(merchantId: string, filters: {
    limit: number;
    page: number;
    status?: string;
    fromDate?: string;
    toDate?: string;
  }) {
    const { limit, page, status, fromDate, toDate } = filters;
    const skip = (page - 1) * limit;

    const where: any = { merchantId };

    // Add status filter
    if (status) {
      where.status = status;
    }

    // Add date range filter
    if (fromDate && toDate) {
      where.createdAt = Between(new Date(fromDate), new Date(toDate));
    } else if (fromDate) {
      where.createdAt = LessThan(new Date(fromDate));
    } else if (toDate) {
      where.createdAt = LessThan(new Date(toDate));
    }

    const [paymentIntents, total] = await this.paymentIntentRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    const checkoutBaseUrl = this.configService.get<string>('urls.checkoutBase');

    const data = paymentIntents.map(pi => ({
      id: pi.id,
      client_secret: pi.clientSecret,
      pay_address: pi.payAddress,
      amount_sats: parseInt(pi.amountSats),
      currency: pi.currency as 'sbtc',
      status: pi.status,
      description: pi.description,
      metadata: pi.metadata,
      expires_at: pi.expiresAt.toISOString(),
      checkout_url: `${checkoutBaseUrl}/pi/${pi.id}`,
      success_url: pi.successUrl,
      cancel_url: pi.cancelUrl,
      created_at: pi.createdAt.toISOString(),
    }));

    return {
      data,
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
    };
  }

  async findByMemoHex(memoHex: string): Promise<PaymentIntentEntity | null> {
    return this.paymentIntentRepository.findOne({
      where: { memoHex },
      relations: ['merchant'],
    });
  }

  async updateStatus(
    id: string,
    status: PaymentIntentStatus,
  ): Promise<PaymentIntentEntity> {
    await this.paymentIntentRepository.update(id, { status });
    return this.findById(id);
  }

  async findExpiredPaymentIntents(): Promise<PaymentIntentEntity[]> {
    return this.paymentIntentRepository.find({
      where: {
        status: PaymentIntentStatus.REQUIRES_PAYMENT,
        expiresAt: LessThan(new Date()),
      },
    });
  }

  async findRequiringPayment(): Promise<PaymentIntentEntity[]> {
    return this.paymentIntentRepository.find({
      where: [
        { status: PaymentIntentStatus.REQUIRES_PAYMENT },
        { status: PaymentIntentStatus.PROCESSING },
      ],
      relations: ['merchant', 'payments'],
    });
  }
}