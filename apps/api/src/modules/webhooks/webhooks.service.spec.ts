import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { WebhooksService } from './webhooks.service';
import { WebhookDeliveryEntity } from '../../entities/webhook-delivery.entity';
import { PaymentIntentEntity } from '../../entities/payment-intent.entity';
import { WebhookEventType, PaymentIntentStatus } from '@sgate/shared';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('WebhooksService', () => {
  let service: WebhooksService;
  let webhookRepository: Repository<WebhookDeliveryEntity>;
  let configService: ConfigService;

  const mockWebhookRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        'worker.webhookRetryAttempts': 3,
        'worker.webhookTimeoutMs': 10000,
        'worker.webhookBaseDelayMs': 1000,
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhooksService,
        {
          provide: getRepositoryToken(WebhookDeliveryEntity),
          useValue: mockWebhookRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<WebhooksService>(WebhooksService);
    webhookRepository = module.get<Repository<WebhookDeliveryEntity>>(
      getRepositoryToken(WebhookDeliveryEntity),
    );
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createWebhook', () => {
    const mockPaymentIntent: PaymentIntentEntity = {
      id: 'pi_test123',
      merchantId: 'merchant_123',
      amountSats: '100000',
      currency: 'sbtc',
      status: PaymentIntentStatus.CONFIRMED,
      metadata: { order_id: '12345' },
      createdAt: new Date('2025-01-01T00:00:00Z'),
    } as PaymentIntentEntity;

    it('should create a webhook delivery record', async () => {
      const mockWebhook = {
        id: 'webhook_123',
        merchantId: 'merchant_123',
        event: WebhookEventType.PAYMENT_INTENT_SUCCEEDED,
        payloadJson: expect.any(Object),
        delivered: false,
        attempts: 0,
      };

      mockWebhookRepository.create.mockReturnValue(mockWebhook);
      mockWebhookRepository.save.mockResolvedValue(mockWebhook);

      const result = await service.createWebhook(
        'merchant_123',
        WebhookEventType.PAYMENT_INTENT_SUCCEEDED,
        mockPaymentIntent,
      );

      expect(mockWebhookRepository.create).toHaveBeenCalledWith({
        merchantId: 'merchant_123',
        event: WebhookEventType.PAYMENT_INTENT_SUCCEEDED,
        payloadJson: {
          id: expect.stringMatching(/^evt_/),
          event: WebhookEventType.PAYMENT_INTENT_SUCCEEDED,
          created: expect.any(Number),
          data: {
            object: {
              id: 'pi_test123',
              amount_sats: 100000,
              currency: 'sbtc',
              status: PaymentIntentStatus.CONFIRMED,
              metadata: { order_id: '12345' },
              created_at: '2025-01-01T00:00:00.000Z',
            },
          },
        },
        delivered: false,
        attempts: 0,
      });

      expect(result).toBe(mockWebhook);
    });

    it('should generate unique event ID', async () => {
      mockWebhookRepository.create.mockReturnValue({});
      mockWebhookRepository.save.mockResolvedValue({});

      await service.createWebhook(
        'merchant_123',
        WebhookEventType.PAYMENT_INTENT_SUCCEEDED,
        mockPaymentIntent,
      );

      const createCall = mockWebhookRepository.create.mock.calls[0][0];
      expect(createCall.payloadJson.id).toMatch(/^evt_\d+/);
    });
  });

  describe('deliverWebhook', () => {
    const mockWebhook = {
      id: 'webhook_123',
      merchantId: 'merchant_123',
      event: WebhookEventType.PAYMENT_INTENT_SUCCEEDED,
      payloadJson: {
        id: 'evt_123',
        event: WebhookEventType.PAYMENT_INTENT_SUCCEEDED,
        data: { object: { id: 'pi_test123' } },
      },
      delivered: false,
      attempts: 0,
      merchant: {
        id: 'merchant_123',
        webhookUrl: 'https://example.com/webhooks',
        webhookSecret: 'whsec_test123',
      },
    };

    it('should deliver webhook successfully on first attempt', async () => {
      mockWebhookRepository.findOne.mockResolvedValue(mockWebhook);
      mockWebhookRepository.save.mockResolvedValue({});

      mockedAxios.post.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'application/json' },
        data: { received: true },
      });

      const result = await service.deliverWebhook('webhook_123');

      expect(result).toBe(true);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://example.com/webhooks',
        mockWebhook.payloadJson,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-sGate-Signature': expect.any(String),
            'X-sGate-Timestamp': expect.any(String),
            'User-Agent': 'sGate-Webhook/1.0',
          },
          timeout: 10000,
          validateStatus: expect.any(Function),
        },
      );

      // Check that webhook was marked as delivered
      const saveCall = mockWebhookRepository.save.mock.calls.find(
        call => call[0].delivered === true,
      );
      expect(saveCall).toBeDefined();
      expect(saveCall[0]).toMatchObject({
        delivered: true,
        deliveredAt: expect.any(Date),
        responseStatus: 200,
        lastError: null,
      });
    });

    it('should retry on HTTP error with exponential backoff', async () => {
      mockWebhookRepository.findOne.mockResolvedValue(mockWebhook);
      mockWebhookRepository.save.mockResolvedValue({});

      // First two attempts fail, third succeeds
      mockedAxios.post
        .mockResolvedValueOnce({
          status: 500,
          statusText: 'Internal Server Error',
          headers: {},
          data: 'Server Error',
        })
        .mockResolvedValueOnce({
          status: 503,
          statusText: 'Service Unavailable',
          headers: {},
          data: 'Service Unavailable',
        })
        .mockResolvedValueOnce({
          status: 200,
          statusText: 'OK',
          headers: {},
          data: { received: true },
        });

      const result = await service.deliverWebhook('webhook_123');

      expect(result).toBe(true);
      expect(mockedAxios.post).toHaveBeenCalledTimes(3);

      // Verify attempts were incremented
      expect(mockWebhookRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          attempts: 1,
        }),
      );
    });

    it('should mark as failed after max attempts', async () => {
      mockWebhookRepository.findOne.mockResolvedValue(mockWebhook);
      mockWebhookRepository.save.mockResolvedValue({});

      // All attempts fail
      mockedAxios.post.mockResolvedValue({
        status: 500,
        statusText: 'Internal Server Error',
        headers: {},
        data: 'Server Error',
      });

      const result = await service.deliverWebhook('webhook_123');

      expect(result).toBe(false);
      expect(mockedAxios.post).toHaveBeenCalledTimes(3); // Max attempts

      // Check that webhook was marked as failed
      const saveCall = mockWebhookRepository.save.mock.calls.find(
        call => call[0].failed === true,
      );
      expect(saveCall).toBeDefined();
      expect(saveCall[0]).toMatchObject({
        failed: true,
        failedAt: expect.any(Date),
        lastError: 'HTTP 500: Internal Server Error',
      });
    });

    it('should handle network errors', async () => {
      mockWebhookRepository.findOne.mockResolvedValue(mockWebhook);
      mockWebhookRepository.save.mockResolvedValue({});

      mockedAxios.post.mockRejectedValue({
        code: 'ECONNREFUSED',
        message: 'Connection refused',
      });

      const result = await service.deliverWebhook('webhook_123');

      expect(result).toBe(false);

      // Check that error was properly recorded
      const saveCall = mockWebhookRepository.save.mock.calls.find(
        call => call[0].lastError === 'Connection refused',
      );
      expect(saveCall).toBeDefined();
    });

    it('should handle timeout errors', async () => {
      mockWebhookRepository.findOne.mockResolvedValue(mockWebhook);
      mockWebhookRepository.save.mockResolvedValue({});

      mockedAxios.post.mockRejectedValue({
        code: 'ECONNABORTED',
        message: 'timeout of 10000ms exceeded',
      });

      const result = await service.deliverWebhook('webhook_123');

      expect(result).toBe(false);

      const saveCall = mockWebhookRepository.save.mock.calls.find(
        call => call[0].lastError === 'Request timeout after 10000ms',
      );
      expect(saveCall).toBeDefined();
    });

    it('should return false for non-existent webhook', async () => {
      mockWebhookRepository.findOne.mockResolvedValue(null);

      const result = await service.deliverWebhook('nonexistent_webhook');

      expect(result).toBe(false);
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it('should return true for already delivered webhook', async () => {
      const deliveredWebhook = {
        ...mockWebhook,
        delivered: true,
      };

      mockWebhookRepository.findOne.mockResolvedValue(deliveredWebhook);

      const result = await service.deliverWebhook('webhook_123');

      expect(result).toBe(true);
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it('should return false when webhook URL is not configured', async () => {
      const webhookWithoutUrl = {
        ...mockWebhook,
        merchant: {
          ...mockWebhook.merchant,
          webhookUrl: null,
        },
      };

      mockWebhookRepository.findOne.mockResolvedValue(webhookWithoutUrl);

      const result = await service.deliverWebhook('webhook_123');

      expect(result).toBe(false);
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });
  });

  describe('getPendingWebhooks', () => {
    it('should return pending webhooks within 24 hours', async () => {
      const mockPendingWebhooks = [
        {
          id: 'webhook_1',
          delivered: false,
          failed: false,
          createdAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
        },
        {
          id: 'webhook_2',
          delivered: false,
          failed: false,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12 hours ago
        },
      ];

      mockWebhookRepository.find.mockResolvedValue(mockPendingWebhooks);

      const result = await service.getPendingWebhooks();

      expect(result).toBe(mockPendingWebhooks);
      expect(mockWebhookRepository.find).toHaveBeenCalledWith({
        where: {
          delivered: false,
          failed: false,
          createdAt: expect.any(Object), // MoreThan matcher
        },
        relations: ['merchant'],
        order: { createdAt: 'ASC' },
      });
    });
  });

  describe('getFailedWebhooks', () => {
    it('should return failed webhooks with default limit', async () => {
      const mockFailedWebhooks = [
        {
          id: 'webhook_1',
          failed: true,
          failedAt: new Date(),
        },
      ];

      mockWebhookRepository.find.mockResolvedValue(mockFailedWebhooks);

      const result = await service.getFailedWebhooks();

      expect(result).toBe(mockFailedWebhooks);
      expect(mockWebhookRepository.find).toHaveBeenCalledWith({
        where: { failed: true },
        relations: ['merchant'],
        order: { failedAt: 'DESC' },
        take: 100,
      });
    });

    it('should respect custom limit', async () => {
      mockWebhookRepository.find.mockResolvedValue([]);

      await service.getFailedWebhooks(50);

      expect(mockWebhookRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50,
        }),
      );
    });
  });

  describe('retryFailedWebhook', () => {
    const mockFailedWebhook = {
      id: 'webhook_123',
      failed: true,
      delivered: false,
      attempts: 3,
      lastError: 'Previous error',
      failedAt: new Date(),
      merchant: {
        webhookUrl: 'https://example.com/webhooks',
        webhookSecret: 'whsec_test123',
      },
    };

    it('should reset webhook state and retry delivery', async () => {
      mockWebhookRepository.findOne.mockResolvedValue(mockFailedWebhook);
      mockWebhookRepository.save.mockResolvedValue({});

      // Mock successful delivery on retry
      mockedAxios.post.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        headers: {},
        data: { received: true },
      });

      const result = await service.retryFailedWebhook('webhook_123');

      expect(result).toBe(true);

      // Check that webhook state was reset
      expect(mockWebhookRepository.save).toHaveBeenCalledWith({
        ...mockFailedWebhook,
        failed: false,
        delivered: false,
        attempts: 0,
        lastError: null,
        failedAt: null,
      });
    });

    it('should return false for non-existent webhook', async () => {
      mockWebhookRepository.findOne.mockResolvedValue(null);

      const result = await service.retryFailedWebhook('nonexistent_webhook');

      expect(result).toBe(false);
    });
  });

  describe('firePaymentIntentSucceeded', () => {
    const mockPaymentIntent = {
      id: 'pi_test123',
      merchantId: 'merchant_123',
      merchant: {
        id: 'merchant_123',
        webhookUrl: 'https://example.com/webhooks',
        webhookSecret: 'whsec_test123',
      },
    } as PaymentIntentEntity;

    it('should create and deliver webhook for payment intent succeeded', async () => {
      const mockWebhook = { id: 'webhook_123' };

      mockWebhookRepository.create.mockReturnValue(mockWebhook);
      mockWebhookRepository.save.mockResolvedValue(mockWebhook);
      mockWebhookRepository.findOne.mockResolvedValue({
        ...mockWebhook,
        merchant: mockPaymentIntent.merchant,
        delivered: false,
      });

      mockedAxios.post.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        headers: {},
        data: {},
      });

      await service.firePaymentIntentSucceeded(mockPaymentIntent);

      expect(mockWebhookRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          merchantId: 'merchant_123',
          event: WebhookEventType.PAYMENT_INTENT_SUCCEEDED,
        }),
      );
    });

    it('should skip webhook when URL not configured', async () => {
      const paymentIntentWithoutWebhook = {
        ...mockPaymentIntent,
        merchant: {
          ...mockPaymentIntent.merchant,
          webhookUrl: null,
        },
      };

      await service.firePaymentIntentSucceeded(paymentIntentWithoutWebhook);

      expect(mockWebhookRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('firePaymentIntentFailed', () => {
    const mockPaymentIntent = {
      id: 'pi_test123',
      merchantId: 'merchant_123',
      merchant: {
        id: 'merchant_123',
        webhookUrl: 'https://example.com/webhooks',
        webhookSecret: 'whsec_test123',
      },
    } as PaymentIntentEntity;

    it('should create and deliver webhook for payment intent failed', async () => {
      const mockWebhook = { id: 'webhook_123' };

      mockWebhookRepository.create.mockReturnValue(mockWebhook);
      mockWebhookRepository.save.mockResolvedValue(mockWebhook);
      mockWebhookRepository.findOne.mockResolvedValue({
        ...mockWebhook,
        merchant: mockPaymentIntent.merchant,
        delivered: false,
      });

      mockedAxios.post.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        headers: {},
        data: {},
      });

      await service.firePaymentIntentFailed(mockPaymentIntent);

      expect(mockWebhookRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          merchantId: 'merchant_123',
          event: WebhookEventType.PAYMENT_INTENT_FAILED,
        }),
      );
    });
  });

  describe('firePaymentIntentExpired', () => {
    const mockPaymentIntent = {
      id: 'pi_test123',
      merchantId: 'merchant_123',
      merchant: {
        id: 'merchant_123',
        webhookUrl: 'https://example.com/webhooks',
        webhookSecret: 'whsec_test123',
      },
    } as PaymentIntentEntity;

    it('should create and deliver webhook for payment intent expired', async () => {
      const mockWebhook = { id: 'webhook_123' };

      mockWebhookRepository.create.mockReturnValue(mockWebhook);
      mockWebhookRepository.save.mockResolvedValue(mockWebhook);
      mockWebhookRepository.findOne.mockResolvedValue({
        ...mockWebhook,
        merchant: mockPaymentIntent.merchant,
        delivered: false,
      });

      mockedAxios.post.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        headers: {},
        data: {},
      });

      await service.firePaymentIntentExpired(mockPaymentIntent);

      expect(mockWebhookRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          merchantId: 'merchant_123',
          event: WebhookEventType.PAYMENT_INTENT_EXPIRED,
        }),
      );
    });
  });
});