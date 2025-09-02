import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { PaymentIntentsService } from './payment-intents.service';
import { PaymentIntentEntity } from '../../entities/payment-intent.entity';
import { CreatePaymentIntentDto, PaymentIntentStatus } from '@sgate/shared';

describe('PaymentIntentsService', () => {
  let service: PaymentIntentsService;
  let repository: Repository<PaymentIntentEntity>;
  let configService: ConfigService;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    findAndCount: jest.fn(),
    update: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        'stacks.gatewayAddress': 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
        'urls.checkoutBase': 'http://localhost:3000',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentIntentsService,
        {
          provide: getRepositoryToken(PaymentIntentEntity),
          useValue: mockRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<PaymentIntentsService>(PaymentIntentsService);
    repository = module.get<Repository<PaymentIntentEntity>>(
      getRepositoryToken(PaymentIntentEntity),
    );
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: CreatePaymentIntentDto = {
      amount_sats: 100000,
      currency: 'sbtc',
      description: 'Test payment',
      metadata: { order_id: '12345' },
      success_url: 'https://example.com/success',
      cancel_url: 'https://example.com/cancel',
      expires_in: 900,
    };

    const merchantId = 'merchant_123';

    it('should create a payment intent successfully', async () => {
      const mockPaymentIntent = {
        id: 'pi_test123',
        merchantId,
        amountSats: '100000',
        currency: 'sbtc',
        status: PaymentIntentStatus.REQUIRES_PAYMENT,
        clientSecret: 'pi_test123_secret_xyz',
        payAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
        memoHex: '70695f7465737431323321',
        expiresAt: new Date(Date.now() + 900000),
        description: 'Test payment',
        metadata: { order_id: '12345' },
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
        createdAt: new Date(),
      };

      mockRepository.create.mockReturnValue(mockPaymentIntent);
      mockRepository.save.mockResolvedValue(mockPaymentIntent);

      const result = await service.create(merchantId, createDto);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          merchantId,
          amountSats: '100000',
          currency: 'sbtc',
          status: PaymentIntentStatus.REQUIRES_PAYMENT,
          payAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
          description: 'Test payment',
          metadata: { order_id: '12345' },
          successUrl: 'https://example.com/success',
          cancelUrl: 'https://example.com/cancel',
        }),
      );

      expect(mockRepository.save).toHaveBeenCalledWith(mockPaymentIntent);

      expect(result).toEqual({
        id: 'pi_test123',
        client_secret: 'pi_test123_secret_xyz',
        pay_address: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
        amount_sats: 100000,
        currency: 'sbtc',
        status: PaymentIntentStatus.REQUIRES_PAYMENT,
        description: 'Test payment',
        metadata: { order_id: '12345' },
        expires_at: mockPaymentIntent.expiresAt.toISOString(),
        checkout_url: 'http://localhost:3000/pi/pi_test123',
        success_url: 'https://example.com/success',
        cancel_url: 'https://example.com/cancel',
        created_at: mockPaymentIntent.createdAt.toISOString(),
      });
    });

    it('should use default expiration time when not provided', async () => {
      const dtoWithoutExpires = { ...createDto };
      delete dtoWithoutExpires.expires_in;

      const mockPaymentIntent = {
        id: 'pi_test123',
        merchantId,
        expiresAt: new Date(Date.now() + 900000), // 15 minutes default
        createdAt: new Date(),
        amountSats: '100000',
      };

      mockRepository.create.mockReturnValue(mockPaymentIntent);
      mockRepository.save.mockResolvedValue(mockPaymentIntent);

      await service.create(merchantId, dtoWithoutExpires);

      const createCall = mockRepository.create.mock.calls[0][0];
      const expiresAt = createCall.expiresAt;
      const timeDiff = expiresAt.getTime() - Date.now();

      // Should be approximately 15 minutes (900 seconds)
      expect(timeDiff).toBeGreaterThan(890000);
      expect(timeDiff).toBeLessThan(910000);
    });
  });

  describe('findOne', () => {
    it('should return a payment intent when found', async () => {
      const mockPaymentIntent = {
        id: 'pi_test123',
        merchantId: 'merchant_123',
        amountSats: '100000',
        currency: 'sbtc',
        status: PaymentIntentStatus.CONFIRMED,
        clientSecret: 'pi_test123_secret_xyz',
        payAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
        expiresAt: new Date(),
        createdAt: new Date(),
      };

      mockRepository.findOne.mockResolvedValue(mockPaymentIntent);

      const result = await service.findOne('pi_test123', 'merchant_123');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'pi_test123', merchantId: 'merchant_123' },
      });

      expect(result).toBeDefined();
      expect(result.id).toBe('pi_test123');
      expect(result.status).toBe(PaymentIntentStatus.CONFIRMED);
    });

    it('should return null when payment intent not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findOne('pi_nonexistent', 'merchant_123');

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should return payment intent with merchant relation', async () => {
      const mockPaymentIntent = {
        id: 'pi_test123',
        merchant: { id: 'merchant_123', name: 'Test Merchant' },
      };

      mockRepository.findOne.mockResolvedValue(mockPaymentIntent);

      const result = await service.findById('pi_test123');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'pi_test123' },
        relations: ['merchant'],
      });

      expect(result).toBe(mockPaymentIntent);
    });
  });

  describe('findAll', () => {
    it('should return paginated payment intents', async () => {
      const mockPaymentIntents = [
        {
          id: 'pi_test123',
          amountSats: '100000',
          status: PaymentIntentStatus.CONFIRMED,
          createdAt: new Date(),
        },
      ];

      mockRepository.findAndCount.mockResolvedValue([mockPaymentIntents, 1]);

      const result = await service.findAll('merchant_123', {
        limit: 10,
        page: 1,
      });

      expect(mockRepository.findAndCount).toHaveBeenCalledWith({
        where: { merchantId: 'merchant_123' },
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 10,
      });

      expect(result).toEqual({
        data: [
          {
            id: 'pi_test123',
            client_secret: undefined,
            pay_address: undefined,
            amount_sats: 100000,
            currency: undefined,
            status: PaymentIntentStatus.CONFIRMED,
            description: undefined,
            metadata: undefined,
            expires_at: undefined,
            checkout_url: 'http://localhost:3000/pi/pi_test123',
            success_url: undefined,
            cancel_url: undefined,
            created_at: mockPaymentIntents[0].createdAt.toISOString(),
          },
        ],
        total: 1,
        page: 1,
        pages: 1,
        limit: 10,
      });
    });

    it('should filter by status when provided', async () => {
      mockRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll('merchant_123', {
        limit: 10,
        page: 1,
        status: 'confirmed',
      });

      expect(mockRepository.findAndCount).toHaveBeenCalledWith({
        where: { merchantId: 'merchant_123', status: 'confirmed' },
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 10,
      });
    });
  });

  describe('findByMemoHex', () => {
    it('should return payment intent by memo hex', async () => {
      const mockPaymentIntent = {
        id: 'pi_test123',
        memoHex: '70695f7465737431323321',
        merchant: { id: 'merchant_123' },
      };

      mockRepository.findOne.mockResolvedValue(mockPaymentIntent);

      const result = await service.findByMemoHex('70695f7465737431323321');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { memoHex: '70695f7465737431323321' },
        relations: ['merchant'],
      });

      expect(result).toBe(mockPaymentIntent);
    });
  });

  describe('updateStatus', () => {
    it('should update payment intent status', async () => {
      const mockUpdatedPaymentIntent = {
        id: 'pi_test123',
        status: PaymentIntentStatus.CONFIRMED,
      };

      mockRepository.update.mockResolvedValue({ affected: 1 });
      mockRepository.findOne.mockResolvedValue(mockUpdatedPaymentIntent);

      const result = await service.updateStatus('pi_test123', PaymentIntentStatus.CONFIRMED);

      expect(mockRepository.update).toHaveBeenCalledWith('pi_test123', {
        status: PaymentIntentStatus.CONFIRMED,
      });

      expect(result).toBe(mockUpdatedPaymentIntent);
    });
  });

  describe('findExpiredPaymentIntents', () => {
    it('should return expired payment intents', async () => {
      const expiredPaymentIntents = [
        { id: 'pi_expired1', status: PaymentIntentStatus.REQUIRES_PAYMENT },
        { id: 'pi_expired2', status: PaymentIntentStatus.REQUIRES_PAYMENT },
      ];

      mockRepository.find.mockResolvedValue(expiredPaymentIntents);

      const result = await service.findExpiredPaymentIntents();

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: {
          status: PaymentIntentStatus.REQUIRES_PAYMENT,
          expiresAt: expect.any(Object), // LessThan matcher
        },
      });

      expect(result).toBe(expiredPaymentIntents);
    });
  });

  describe('findRequiringPayment', () => {
    it('should return payment intents requiring payment', async () => {
      const paymentIntents = [
        { id: 'pi_1', status: PaymentIntentStatus.REQUIRES_PAYMENT },
        { id: 'pi_2', status: PaymentIntentStatus.PROCESSING },
      ];

      mockRepository.find.mockResolvedValue(paymentIntents);

      const result = await service.findRequiringPayment();

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: [
          { status: PaymentIntentStatus.REQUIRES_PAYMENT },
          { status: PaymentIntentStatus.PROCESSING },
        ],
        relations: ['merchant', 'payments'],
      });

      expect(result).toBe(paymentIntents);
    });
  });
});