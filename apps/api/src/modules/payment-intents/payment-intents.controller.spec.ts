import { Test, TestingModule } from '@nestjs/testing';
import { PaymentIntentsController } from './payment-intents.controller';
import { PaymentIntentsService } from './payment-intents.service';
import { CreatePaymentIntentDto, PaymentIntentStatus } from '@sgate/shared';
import { NotFoundException } from '@nestjs/common';

describe('PaymentIntentsController', () => {
  let controller: PaymentIntentsController;
  let service: PaymentIntentsService;

  const mockPaymentIntentsService = {
    create: jest.fn(),
    findOne: jest.fn(),
    findAll: jest.fn(),
  };

  const mockMerchant = {
    id: 'merchant_123',
    name: 'Test Merchant',
    apiKeyHash: 'hash123',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentIntentsController],
      providers: [
        {
          provide: PaymentIntentsService,
          useValue: mockPaymentIntentsService,
        },
      ],
    }).compile();

    controller = module.get<PaymentIntentsController>(PaymentIntentsController);
    service = module.get<PaymentIntentsService>(PaymentIntentsService);
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

    const mockRequest = {
      merchant: mockMerchant,
    };

    it('should create a payment intent successfully', async () => {
      const mockPaymentIntentResponse = {
        id: 'pi_test123',
        client_secret: 'pi_test123_secret_xyz',
        pay_address: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
        amount_sats: 100000,
        currency: 'sbtc',
        status: PaymentIntentStatus.REQUIRES_PAYMENT,
        description: 'Test payment',
        metadata: { order_id: '12345' },
        expires_at: '2025-09-04T23:59:59.000Z',
        checkout_url: 'http://localhost:3000/pi/pi_test123',
        success_url: 'https://example.com/success',
        cancel_url: 'https://example.com/cancel',
        created_at: '2025-09-04T23:44:59.000Z',
      };

      mockPaymentIntentsService.create.mockResolvedValue(mockPaymentIntentResponse);

      const result = await controller.create(createDto, mockRequest);

      expect(mockPaymentIntentsService.create).toHaveBeenCalledWith(
        'merchant_123',
        createDto,
      );
      expect(result).toBe(mockPaymentIntentResponse);
    });

    it('should pass merchant ID from authenticated request', async () => {
      mockPaymentIntentsService.create.mockResolvedValue({});

      await controller.create(createDto, mockRequest);

      expect(mockPaymentIntentsService.create).toHaveBeenCalledWith(
        mockMerchant.id,
        createDto,
      );
    });
  });

  describe('findOne', () => {
    const mockRequest = {
      merchant: mockMerchant,
    };

    it('should return a payment intent when found', async () => {
      const mockPaymentIntentResponse = {
        id: 'pi_test123',
        amount_sats: 100000,
        status: PaymentIntentStatus.CONFIRMED,
        created_at: '2025-09-04T23:44:59.000Z',
      };

      mockPaymentIntentsService.findOne.mockResolvedValue(mockPaymentIntentResponse);

      const result = await controller.findOne('pi_test123', mockRequest);

      expect(mockPaymentIntentsService.findOne).toHaveBeenCalledWith(
        'pi_test123',
        'merchant_123',
      );
      expect(result).toBe(mockPaymentIntentResponse);
    });

    it('should throw NotFoundException when payment intent not found', async () => {
      mockPaymentIntentsService.findOne.mockResolvedValue(null);

      await expect(
        controller.findOne('pi_nonexistent', mockRequest),
      ).rejects.toThrow(NotFoundException);

      expect(mockPaymentIntentsService.findOne).toHaveBeenCalledWith(
        'pi_nonexistent',
        'merchant_123',
      );
    });

    it('should use merchant ID from authenticated request', async () => {
      mockPaymentIntentsService.findOne.mockResolvedValue({});

      await controller.findOne('pi_test123', mockRequest);

      expect(mockPaymentIntentsService.findOne).toHaveBeenCalledWith(
        'pi_test123',
        mockMerchant.id,
      );
    });
  });

  describe('findAll', () => {
    const mockRequest = {
      merchant: mockMerchant,
    };

    it('should return paginated payment intents with default parameters', async () => {
      const mockResponse = {
        data: [
          {
            id: 'pi_test123',
            amount_sats: 100000,
            status: PaymentIntentStatus.CONFIRMED,
            created_at: '2025-09-04T23:44:59.000Z',
          },
        ],
        total: 1,
        page: 1,
        pages: 1,
        limit: 20,
      };

      mockPaymentIntentsService.findAll.mockResolvedValue(mockResponse);

      const result = await controller.findAll(mockRequest, {});

      expect(mockPaymentIntentsService.findAll).toHaveBeenCalledWith(
        'merchant_123',
        {
          limit: 20,
          page: 1,
        },
      );
      expect(result).toBe(mockResponse);
    });

    it('should pass query parameters to service', async () => {
      const queryParams = {
        limit: '10',
        page: '2',
        status: 'confirmed',
        fromDate: '2025-01-01',
        toDate: '2025-12-31',
      };

      mockPaymentIntentsService.findAll.mockResolvedValue({
        data: [],
        total: 0,
        page: 2,
        pages: 0,
        limit: 10,
      });

      await controller.findAll(mockRequest, queryParams);

      expect(mockPaymentIntentsService.findAll).toHaveBeenCalledWith(
        'merchant_123',
        {
          limit: 10,
          page: 2,
          status: 'confirmed',
          fromDate: '2025-01-01',
          toDate: '2025-12-31',
        },
      );
    });

    it('should enforce maximum limit', async () => {
      const queryParams = {
        limit: '500', // Exceeds max of 100
      };

      mockPaymentIntentsService.findAll.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        pages: 0,
        limit: 100,
      });

      await controller.findAll(mockRequest, queryParams);

      expect(mockPaymentIntentsService.findAll).toHaveBeenCalledWith(
        'merchant_123',
        {
          limit: 100, // Should be capped at 100
          page: 1,
        },
      );
    });

    it('should enforce minimum limit', async () => {
      const queryParams = {
        limit: '0', // Below minimum of 1
      };

      mockPaymentIntentsService.findAll.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        pages: 0,
        limit: 1,
      });

      await controller.findAll(mockRequest, queryParams);

      expect(mockPaymentIntentsService.findAll).toHaveBeenCalledWith(
        'merchant_123',
        {
          limit: 1, // Should be set to minimum 1
          page: 1,
        },
      );
    });

    it('should enforce minimum page number', async () => {
      const queryParams = {
        page: '0', // Below minimum of 1
      };

      mockPaymentIntentsService.findAll.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        pages: 0,
        limit: 20,
      });

      await controller.findAll(mockRequest, queryParams);

      expect(mockPaymentIntentsService.findAll).toHaveBeenCalledWith(
        'merchant_123',
        {
          limit: 20,
          page: 1, // Should be set to minimum 1
        },
      );
    });
  });
});