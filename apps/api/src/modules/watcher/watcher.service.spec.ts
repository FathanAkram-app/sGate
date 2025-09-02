import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { WatcherService } from './watcher.service';
import { PaymentEntity } from '../../entities/payment.entity';
import { PaymentIntentsService } from '../payment-intents/payment-intents.service';
import { WebhooksService } from '../webhooks/webhooks.service';
import { PaymentIntentStatus, PaymentStatus } from '@sgate/shared';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('WatcherService', () => {
  let service: WatcherService;
  let paymentRepository: Repository<PaymentEntity>;
  let paymentIntentsService: PaymentIntentsService;
  let webhooksService: WebhooksService;
  let configService: ConfigService;

  const mockPaymentRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockPaymentIntentsService = {
    findRequiringPayment: jest.fn(),
    findExpiredPaymentIntents: jest.fn(),
    updateStatus: jest.fn(),
    findById: jest.fn(),
  };

  const mockWebhooksService = {
    firePaymentIntentSucceeded: jest.fn(),
    firePaymentIntentExpired: jest.fn(),
    getPendingWebhooks: jest.fn(),
    deliverWebhook: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        'worker.watcherIntervalMs': 10000,
        'stacks.hiroApiBase': 'https://api.testnet.hiro.so',
        'stacks.sbtcAssetIdentifier': 'ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT.sbtc-token::sbtc',
        'stacks.gatewayAddress': 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
        'stacks.requiredConfirmations': 1,
        'worker.webhookRetryAttempts': 3,
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WatcherService,
        {
          provide: getRepositoryToken(PaymentEntity),
          useValue: mockPaymentRepository,
        },
        {
          provide: PaymentIntentsService,
          useValue: mockPaymentIntentsService,
        },
        {
          provide: WebhooksService,
          useValue: mockWebhooksService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<WatcherService>(WatcherService);
    paymentRepository = module.get<Repository<PaymentEntity>>(
      getRepositoryToken(PaymentEntity),
    );
    paymentIntentsService = module.get<PaymentIntentsService>(PaymentIntentsService);
    webhooksService = module.get<WebhooksService>(WebhooksService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('watchPayments', () => {
    it('should process payment intents and expired intents', async () => {
      const mockPaymentIntents = [
        {
          id: 'pi_test123',
          memoHex: '70695f7465737431323321',
          amountSats: '100000',
          status: PaymentIntentStatus.REQUIRES_PAYMENT,
          merchant: { id: 'merchant_123' },
        },
      ];

      const mockExpiredPaymentIntents = [
        {
          id: 'pi_expired',
          status: PaymentIntentStatus.REQUIRES_PAYMENT,
        },
      ];

      const mockPendingWebhooks = [
        {
          id: 'webhook_123',
          attempts: 1,
        },
      ];

      mockPaymentIntentsService.findRequiringPayment.mockResolvedValue(mockPaymentIntents);
      mockPaymentIntentsService.findExpiredPaymentIntents.mockResolvedValue(mockExpiredPaymentIntents);
      mockWebhooksService.getPendingWebhooks.mockResolvedValue(mockPendingWebhooks);

      // Mock successful transaction API call
      mockedAxios.get.mockResolvedValue({
        data: {
          results: [],
        },
      });

      await service.watchPayments();

      expect(mockPaymentIntentsService.findRequiringPayment).toHaveBeenCalled();
      expect(mockPaymentIntentsService.findExpiredPaymentIntents).toHaveBeenCalled();
      expect(mockWebhooksService.getPendingWebhooks).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      mockPaymentIntentsService.findRequiringPayment.mockRejectedValue(
        new Error('Database error'),
      );

      // Should not throw
      await expect(service.watchPayments()).resolves.not.toThrow();
    });
  });

  describe('checkForPayments', () => {
    const mockPaymentIntent = {
      id: 'pi_test123',
      memoHex: '70695f7465737431323321',
      amountSats: '100000',
      status: PaymentIntentStatus.REQUIRES_PAYMENT,
      merchant: { id: 'merchant_123' },
    };

    it('should detect and process a valid payment', async () => {
      const mockTransaction = {
        tx_id: '0x123456',
        tx_status: 'success',
        canonical: true,
        block_height: 100,
        ft_transfers: [
          {
            asset_identifier: 'ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT.sbtc-token::sbtc',
            amount: '100000',
            sender: 'ST1SENDER',
            recipient: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
          },
        ],
        tx: {
          memo: '70695f7465737431323321', // Matches payment intent memo
        },
      };

      mockedAxios.get
        .mockResolvedValueOnce({
          data: {
            results: [mockTransaction],
          },
        })
        .mockResolvedValueOnce({
          data: {
            results: [{ height: 102 }], // Current block height
          },
        });

      mockPaymentRepository.findOne.mockResolvedValue(null); // No existing payment
      mockPaymentRepository.create.mockReturnValue({
        paymentIntentId: 'pi_test123',
        txId: '0x123456',
        amountSats: '100000',
        confirmations: 3,
        status: PaymentStatus.CONFIRMED,
      });

      // Use the actual method instead of mocking the private method
      const checkForPaymentsSpy = jest.spyOn(service as any, 'checkForPayments');
      await (service as any).checkForPayments(mockPaymentIntent);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.testnet.hiro.so/extended/v1/address/ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM/transactions',
        {
          params: {
            limit: 50,
            offset: 0,
          },
        },
      );
    });

    it('should skip non-canonical transactions', async () => {
      const mockTransaction = {
        tx_id: '0x123456',
        tx_status: 'success',
        canonical: false, // Non-canonical
        block_height: 100,
      };

      mockedAxios.get.mockResolvedValue({
        data: {
          results: [mockTransaction],
        },
      });

      await (service as any).checkForPayments(mockPaymentIntent);

      expect(mockPaymentRepository.create).not.toHaveBeenCalled();
    });

    it('should skip failed transactions', async () => {
      const mockTransaction = {
        tx_id: '0x123456',
        tx_status: 'abort_by_response', // Failed transaction
        canonical: true,
        block_height: 100,
      };

      mockedAxios.get.mockResolvedValue({
        data: {
          results: [mockTransaction],
        },
      });

      await (service as any).checkForPayments(mockPaymentIntent);

      expect(mockPaymentRepository.create).not.toHaveBeenCalled();
    });

    it('should handle API errors gracefully', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network error'));

      await expect(
        (service as any).checkForPayments(mockPaymentIntent),
      ).resolves.not.toThrow();
    });
  });

  describe('extractFTTransfers', () => {
    it('should extract transfers from ft_transfers field', () => {
      const transaction = {
        ft_transfers: [
          {
            asset_identifier: 'ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT.sbtc-token::sbtc',
            amount: '100000',
            sender: 'ST1SENDER',
            recipient: 'ST1RECIPIENT',
          },
        ],
      };

      const transfers = (service as any).extractFTTransfers(transaction);

      expect(transfers).toHaveLength(1);
      expect(transfers[0]).toEqual({
        asset_identifier: 'ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT.sbtc-token::sbtc',
        amount: '100000',
        sender: 'ST1SENDER',
        recipient: 'ST1RECIPIENT',
      });
    });

    it('should extract transfers from events field', () => {
      const transaction = {
        events: [
          {
            event_type: 'ft_transfer_event',
            ft_transfer: {
              asset_identifier: 'ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT.sbtc-token::sbtc',
              amount: '100000',
              sender: 'ST1SENDER',
              recipient: 'ST1RECIPIENT',
            },
          },
        ],
      };

      const transfers = (service as any).extractFTTransfers(transaction);

      expect(transfers).toHaveLength(1);
      expect(transfers[0]).toEqual({
        asset_identifier: 'ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT.sbtc-token::sbtc',
        amount: '100000',
        sender: 'ST1SENDER',
        recipient: 'ST1RECIPIENT',
      });
    });

    it('should return empty array when no transfers found', () => {
      const transaction = {};

      const transfers = (service as any).extractFTTransfers(transaction);

      expect(transfers).toHaveLength(0);
    });
  });

  describe('extractMemo', () => {
    it('should extract memo from transaction', () => {
      const transaction = {
        tx: {
          memo: '70695f7465737431323321',
        },
      };

      const memo = (service as any).extractMemo(transaction);

      expect(memo).toBe('70695f7465737431323321');
    });

    it('should return null when no memo present', () => {
      const transaction = {};

      const memo = (service as any).extractMemo(transaction);

      expect(memo).toBeNull();
    });

    it('should handle extraction errors', () => {
      const transaction = {
        tx: {
          memo: null,
        },
      };

      const memo = (service as any).extractMemo(transaction);

      expect(memo).toBeNull();
    });
  });

  describe('processPayment', () => {
    const mockPaymentIntent = {
      id: 'pi_test123',
      amountSats: '100000',
      status: PaymentIntentStatus.REQUIRES_PAYMENT,
    };

    const mockTransaction = {
      tx_id: '0x123456',
      block_height: 100,
    };

    const mockTransfer = {
      amount: '100000',
    };

    it('should create new payment when none exists', async () => {
      mockPaymentRepository.findOne.mockResolvedValue(null);
      
      mockedAxios.get.mockResolvedValue({
        data: {
          results: [{ height: 102 }],
        },
      });

      const mockPayment = {
        paymentIntentId: 'pi_test123',
        txId: '0x123456',
        amountSats: '100000',
        confirmations: 3,
        status: PaymentStatus.CONFIRMED,
      };

      mockPaymentRepository.create.mockReturnValue(mockPayment);
      mockPaymentRepository.save.mockResolvedValue(mockPayment);

      await (service as any).processPayment(
        mockPaymentIntent,
        mockTransaction,
        mockTransfer,
        1,
      );

      expect(mockPaymentRepository.create).toHaveBeenCalledWith({
        paymentIntentId: 'pi_test123',
        txId: '0x123456',
        amountSats: 100000,
        confirmations: 3,
        status: PaymentStatus.CONFIRMED,
        rawTx: mockTransaction,
      });

      expect(mockPaymentRepository.save).toHaveBeenCalledWith(mockPayment);
    });

    it('should update existing payment confirmations', async () => {
      const existingPayment = {
        id: 'payment_123',
        txId: '0x123456',
        paymentIntentId: 'pi_test123',
        confirmations: 2,
        status: PaymentStatus.SEEN,
      };

      mockPaymentRepository.findOne.mockResolvedValue(existingPayment);
      
      mockedAxios.get.mockResolvedValue({
        data: {
          results: [{ height: 103 }],
        },
      });

      await (service as any).processPayment(
        mockPaymentIntent,
        mockTransaction,
        mockTransfer,
        1,
      );

      expect(existingPayment.confirmations).toBe(4); // 103 - 100 + 1
      expect(existingPayment.status).toBe(PaymentStatus.CONFIRMED);
      expect(mockPaymentRepository.save).toHaveBeenCalledWith(existingPayment);
    });

    it('should confirm payment intent when confirmations meet requirement', async () => {
      mockPaymentRepository.findOne.mockResolvedValue(null);
      
      mockedAxios.get.mockResolvedValue({
        data: {
          results: [{ height: 102 }],
        },
      });

      const mockPayment = {
        paymentIntentId: 'pi_test123',
        txId: '0x123456',
        amountSats: '100000',
        confirmations: 3,
        status: PaymentStatus.CONFIRMED,
      };

      mockPaymentRepository.create.mockReturnValue(mockPayment);

      const confirmPaymentIntentSpy = jest.spyOn(service as any, 'confirmPaymentIntent');

      await (service as any).processPayment(
        mockPaymentIntent,
        mockTransaction,
        mockTransfer,
        1,
      );

      expect(confirmPaymentIntentSpy).toHaveBeenCalledWith(mockPaymentIntent);
    });

    it('should handle underpayment', async () => {
      const underpaidTransfer = {
        amount: '50000', // Less than required 100000
      };

      mockPaymentRepository.findOne.mockResolvedValue(null);
      
      mockedAxios.get.mockResolvedValue({
        data: {
          results: [{ height: 102 }],
        },
      });

      const mockPayment = {
        paymentIntentId: 'pi_test123',
        txId: '0x123456',
        amountSats: '50000',
        confirmations: 3,
        status: PaymentStatus.CONFIRMED,
      };

      mockPaymentRepository.create.mockReturnValue(mockPayment);

      await (service as any).processPayment(
        mockPaymentIntent,
        mockTransaction,
        underpaidTransfer,
        1,
      );

      // Payment intent should remain in requires_payment status
      expect(mockPaymentIntentsService.updateStatus).not.toHaveBeenCalled();
    });
  });

  describe('confirmPaymentIntent', () => {
    it('should update status and fire webhook', async () => {
      const mockPaymentIntent = {
        id: 'pi_test123',
        status: PaymentIntentStatus.PROCESSING,
      };

      const mockUpdatedPaymentIntent = {
        id: 'pi_test123',
        status: PaymentIntentStatus.CONFIRMED,
      };

      mockPaymentIntentsService.updateStatus.mockResolvedValue(mockUpdatedPaymentIntent);
      mockPaymentIntentsService.findById.mockResolvedValue(mockUpdatedPaymentIntent);

      await (service as any).confirmPaymentIntent(mockPaymentIntent);

      expect(mockPaymentIntentsService.updateStatus).toHaveBeenCalledWith(
        'pi_test123',
        PaymentIntentStatus.CONFIRMED,
      );

      expect(mockWebhooksService.firePaymentIntentSucceeded).toHaveBeenCalledWith(
        mockUpdatedPaymentIntent,
      );
    });
  });

  describe('getCurrentBlockHeight', () => {
    it('should return current block height', async () => {
      mockedAxios.get.mockResolvedValue({
        data: {
          results: [{ height: 12345 }],
        },
      });

      const height = await (service as any).getCurrentBlockHeight();

      expect(height).toBe(12345);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.testnet.hiro.so/extended/v1/block',
      );
    });

    it('should return 0 on API error', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network error'));

      const height = await (service as any).getCurrentBlockHeight();

      expect(height).toBe(0);
    });
  });
});