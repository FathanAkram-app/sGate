import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { MerchantEntity, PaymentIntentEntity } from '../src/entities';
import { PaymentIntentStatus } from '@sgate/shared';
import configuration from '../src/config/configuration';
import * as crypto from 'crypto';

describe('sGate API (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let testMerchant: MerchantEntity;
  let testApiKey: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          load: [configuration],
          isGlobal: true,
        }),
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT) || 5432,
          username: process.env.DB_USERNAME || 'sgate',
          password: process.env.DB_PASSWORD || 'sgate',
          database: process.env.DB_NAME || 'sgate_test',
          entities: [__dirname + '/../src/entities/*.entity{.ts,.js}'],
          synchronize: true, // Only for testing
          dropSchema: true, // Clean slate for each test run
        }),
        AppModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Apply global validation pipe like in production
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();
    
    dataSource = app.get(DataSource);
  });

  beforeEach(async () => {
    // Clean database and create test merchant
    await dataSource.synchronize(true);
    
    // Create test merchant with API key
    testApiKey = 'sk_test_' + crypto.randomBytes(32).toString('hex');
    const salt = process.env.API_KEY_SALT || 'test-salt';
    const apiKeyHash = crypto.pbkdf2Sync(testApiKey, salt, 10000, 64, 'sha512').toString('hex');

    const merchantRepository = dataSource.getRepository(MerchantEntity);
    testMerchant = merchantRepository.create({
      name: 'Test Merchant',
      apiKeyHash,
      webhookUrl: 'https://example.com/webhook',
      webhookSecret: 'test-webhook-secret',
    });
    
    await merchantRepository.save(testMerchant);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health Check', () => {
    it('/health (GET)', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status');
          expect(res.body).toHaveProperty('timestamp');
        });
    });
  });

  describe('Payment Intents API', () => {
    describe('POST /v1/payment_intents', () => {
      const validPaymentIntentDto = {
        amount_sats: 100000,
        currency: 'sbtc',
        description: 'Test payment intent',
        metadata: {
          order_id: 'order_123',
          customer_id: 'cust_456',
        },
        success_url: 'https://example.com/success',
        cancel_url: 'https://example.com/cancel',
        expires_in: 1800,
      };

      it('should create payment intent with valid data', () => {
        return request(app.getHttpServer())
          .post('/v1/payment_intents')
          .set('Authorization', `Bearer ${testApiKey}`)
          .send(validPaymentIntentDto)
          .expect(201)
          .expect((res) => {
            expect(res.body).toHaveProperty('id');
            expect(res.body.id).toMatch(/^pi_/);
            expect(res.body).toHaveProperty('client_secret');
            expect(res.body.client_secret).toMatch(new RegExp(`^${res.body.id}_secret_`));
            expect(res.body.amount_sats).toBe(100000);
            expect(res.body.currency).toBe('sbtc');
            expect(res.body.status).toBe(PaymentIntentStatus.REQUIRES_PAYMENT);
            expect(res.body).toHaveProperty('checkout_url');
            expect(res.body).toHaveProperty('expires_at');
            expect(res.body.metadata).toEqual(validPaymentIntentDto.metadata);
          });
      });

      it('should require authentication', () => {
        return request(app.getHttpServer())
          .post('/v1/payment_intents')
          .send(validPaymentIntentDto)
          .expect(401);
      });

      it('should reject invalid API key', () => {
        return request(app.getHttpServer())
          .post('/v1/payment_intents')
          .set('Authorization', 'Bearer sk_test_invalid')
          .send(validPaymentIntentDto)
          .expect(401);
      });

      it('should validate amount_sats is positive', () => {
        return request(app.getHttpServer())
          .post('/v1/payment_intents')
          .set('Authorization', `Bearer ${testApiKey}`)
          .send({
            ...validPaymentIntentDto,
            amount_sats: -100,
          })
          .expect(400);
      });

      it('should validate currency is sbtc', () => {
        return request(app.getHttpServer())
          .post('/v1/payment_intents')
          .set('Authorization', `Bearer ${testApiKey}`)
          .send({
            ...validPaymentIntentDto,
            currency: 'btc',
          })
          .expect(400);
      });

      it('should validate expires_in range', () => {
        return request(app.getHttpServer())
          .post('/v1/payment_intents')
          .set('Authorization', `Bearer ${testApiKey}`)
          .send({
            ...validPaymentIntentDto,
            expires_in: 30, // Less than minimum 60 seconds
          })
          .expect(400);
      });

      it('should validate metadata size', () => {
        const largeMetadata = {};
        // Create metadata with too many keys
        for (let i = 0; i < 25; i++) {
          largeMetadata[`key_${i}`] = 'value';
        }

        return request(app.getHttpServer())
          .post('/v1/payment_intents')
          .set('Authorization', `Bearer ${testApiKey}`)
          .send({
            ...validPaymentIntentDto,
            metadata: largeMetadata,
          })
          .expect(400);
      });

      it('should create payment intent with minimal data', () => {
        return request(app.getHttpServer())
          .post('/v1/payment_intents')
          .set('Authorization', `Bearer ${testApiKey}`)
          .send({
            amount_sats: 50000,
            currency: 'sbtc',
          })
          .expect(201)
          .expect((res) => {
            expect(res.body.amount_sats).toBe(50000);
            expect(res.body.currency).toBe('sbtc');
            expect(res.body.description).toBeUndefined();
            expect(res.body.metadata).toBeNull();
          });
      });
    });

    describe('GET /v1/payment_intents/:id', () => {
      let paymentIntent: any;

      beforeEach(async () => {
        // Create a test payment intent
        const response = await request(app.getHttpServer())
          .post('/v1/payment_intents')
          .set('Authorization', `Bearer ${testApiKey}`)
          .send({
            amount_sats: 100000,
            currency: 'sbtc',
            description: 'Test payment intent',
          });
        
        paymentIntent = response.body;
      });

      it('should retrieve payment intent by ID', () => {
        return request(app.getHttpServer())
          .get(`/v1/payment_intents/${paymentIntent.id}`)
          .set('Authorization', `Bearer ${testApiKey}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.id).toBe(paymentIntent.id);
            expect(res.body.amount_sats).toBe(100000);
            expect(res.body.status).toBe(PaymentIntentStatus.REQUIRES_PAYMENT);
          });
      });

      it('should require authentication', () => {
        return request(app.getHttpServer())
          .get(`/v1/payment_intents/${paymentIntent.id}`)
          .expect(401);
      });

      it('should return 404 for non-existent payment intent', () => {
        return request(app.getHttpServer())
          .get('/v1/payment_intents/pi_nonexistent')
          .set('Authorization', `Bearer ${testApiKey}`)
          .expect(404);
      });

      it('should not return payment intents from other merchants', async () => {
        // Create another merchant
        const otherApiKey = 'sk_test_' + crypto.randomBytes(32).toString('hex');
        const salt = process.env.API_KEY_SALT || 'test-salt';
        const otherApiKeyHash = crypto.pbkdf2Sync(otherApiKey, salt, 10000, 64, 'sha512').toString('hex');

        const merchantRepository = dataSource.getRepository(MerchantEntity);
        const otherMerchant = merchantRepository.create({
          name: 'Other Merchant',
          apiKeyHash: otherApiKeyHash,
        });
        
        await merchantRepository.save(otherMerchant);

        return request(app.getHttpServer())
          .get(`/v1/payment_intents/${paymentIntent.id}`)
          .set('Authorization', `Bearer ${otherApiKey}`)
          .expect(404);
      });
    });

    describe('GET /v1/payment_intents', () => {
      beforeEach(async () => {
        // Create multiple test payment intents
        for (let i = 0; i < 5; i++) {
          await request(app.getHttpServer())
            .post('/v1/payment_intents')
            .set('Authorization', `Bearer ${testApiKey}`)
            .send({
              amount_sats: 100000 + i * 10000,
              currency: 'sbtc',
              description: `Test payment intent ${i + 1}`,
            });
        }
      });

      it('should list payment intents with default pagination', () => {
        return request(app.getHttpServer())
          .get('/v1/payment_intents')
          .set('Authorization', `Bearer ${testApiKey}`)
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('data');
            expect(res.body).toHaveProperty('total', 5);
            expect(res.body).toHaveProperty('page', 1);
            expect(res.body).toHaveProperty('pages', 1);
            expect(res.body).toHaveProperty('limit', 20);
            expect(res.body.data).toHaveLength(5);
            
            // Should be ordered by created_at DESC
            expect(res.body.data[0].description).toBe('Test payment intent 5');
            expect(res.body.data[4].description).toBe('Test payment intent 1');
          });
      });

      it('should support pagination', () => {
        return request(app.getHttpServer())
          .get('/v1/payment_intents?limit=2&page=2')
          .set('Authorization', `Bearer ${testApiKey}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.data).toHaveLength(2);
            expect(res.body.page).toBe(2);
            expect(res.body.limit).toBe(2);
            expect(res.body.pages).toBe(3); // ceil(5/2)
            expect(res.body.total).toBe(5);
          });
      });

      it('should filter by status', () => {
        return request(app.getHttpServer())
          .get(`/v1/payment_intents?status=${PaymentIntentStatus.REQUIRES_PAYMENT}`)
          .set('Authorization', `Bearer ${testApiKey}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.data).toHaveLength(5);
            res.body.data.forEach(pi => {
              expect(pi.status).toBe(PaymentIntentStatus.REQUIRES_PAYMENT);
            });
          });
      });

      it('should require authentication', () => {
        return request(app.getHttpServer())
          .get('/v1/payment_intents')
          .expect(401);
      });

      it('should enforce maximum limit', () => {
        return request(app.getHttpServer())
          .get('/v1/payment_intents?limit=200')
          .set('Authorization', `Bearer ${testApiKey}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.limit).toBe(100); // Should be capped at 100
          });
      });
    });
  });

  describe('Public API', () => {
    let paymentIntent: any;

    beforeEach(async () => {
      // Create a test payment intent
      const response = await request(app.getHttpServer())
        .post('/v1/payment_intents')
        .set('Authorization', `Bearer ${testApiKey}`)
        .send({
          amount_sats: 100000,
          currency: 'sbtc',
          description: 'Public test payment',
          metadata: { sensitive: 'data' },
        });
      
      paymentIntent = response.body;
    });

    describe('GET /public/payment_intents/:id', () => {
      it('should return public payment intent data without authentication', () => {
        return request(app.getHttpServer())
          .get(`/public/payment_intents/${paymentIntent.id}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.id).toBe(paymentIntent.id);
            expect(res.body.amount_sats).toBe(100000);
            expect(res.body.status).toBe(PaymentIntentStatus.REQUIRES_PAYMENT);
            expect(res.body).toHaveProperty('memo_hex');
            
            // Sensitive fields should not be included
            expect(res.body).not.toHaveProperty('client_secret');
            expect(res.body).not.toHaveProperty('metadata');
          });
      });

      it('should return 404 for non-existent payment intent', () => {
        return request(app.getHttpServer())
          .get('/public/payment_intents/pi_nonexistent')
          .expect(404);
      });
    });
  });

  describe('Error Handling', () => {
    it('should return structured error response', () => {
      return request(app.getHttpServer())
        .post('/v1/payment_intents')
        .set('Authorization', `Bearer ${testApiKey}`)
        .send({
          amount_sats: 'invalid',
          currency: 'sbtc',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty('error');
          expect(res.body.error).toHaveProperty('type');
          expect(res.body.error).toHaveProperty('message');
          expect(res.body).toHaveProperty('request_id');
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body).toHaveProperty('status', 400);
        });
    });

    it('should sanitize sensitive data in errors', () => {
      return request(app.getHttpServer())
        .post('/v1/payment_intents')
        .set('Authorization', 'Bearer sk_test_sensitive_key')
        .send({
          amount_sats: 100000,
          currency: 'sbtc',
        })
        .expect(401)
        .expect((res) => {
          // API key should not be exposed in error response
          expect(JSON.stringify(res.body)).not.toContain('sk_test_sensitive_key');
        });
    });
  });

  describe('Rate Limiting', () => {
    it('should not apply rate limiting in development/test environment', async () => {
      // Make multiple rapid requests
      const promises = Array.from({ length: 10 }, () =>
        request(app.getHttpServer())
          .post('/v1/payment_intents')
          .set('Authorization', `Bearer ${testApiKey}`)
          .send({
            amount_sats: 100000,
            currency: 'sbtc',
          }),
      );

      const responses = await Promise.all(promises);
      
      // All should succeed (no rate limiting in test)
      responses.forEach(response => {
        expect(response.status).toBe(201);
      });
    });
  });

  describe('Request Validation', () => {
    it('should reject requests with extra fields', () => {
      return request(app.getHttpServer())
        .post('/v1/payment_intents')
        .set('Authorization', `Bearer ${testApiKey}`)
        .send({
          amount_sats: 100000,
          currency: 'sbtc',
          extra_field: 'not_allowed',
        })
        .expect(400);
    });

    it('should transform string numbers to integers', () => {
      return request(app.getHttpServer())
        .post('/v1/payment_intents')
        .set('Authorization', `Bearer ${testApiKey}`)
        .send({
          amount_sats: '100000', // String that should be transformed
          currency: 'sbtc',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.amount_sats).toBe(100000);
          expect(typeof res.body.amount_sats).toBe('number');
        });
    });
  });

  describe('Database Integration', () => {
    it('should persist payment intent to database', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/payment_intents')
        .set('Authorization', `Bearer ${testApiKey}`)
        .send({
          amount_sats: 100000,
          currency: 'sbtc',
          description: 'Database test',
        });

      expect(response.status).toBe(201);

      // Verify in database
      const paymentIntentRepository = dataSource.getRepository(PaymentIntentEntity);
      const savedPaymentIntent = await paymentIntentRepository.findOne({
        where: { id: response.body.id },
      });

      expect(savedPaymentIntent).toBeDefined();
      expect(savedPaymentIntent.amountSats).toBe('100000');
      expect(savedPaymentIntent.description).toBe('Database test');
      expect(savedPaymentIntent.merchantId).toBe(testMerchant.id);
    });

    it('should enforce database constraints', async () => {
      const paymentIntentRepository = dataSource.getRepository(PaymentIntentEntity);
      
      // Try to create payment intent with duplicate memo hex
      const existingPaymentIntent = paymentIntentRepository.create({
        id: 'pi_test1',
        merchantId: testMerchant.id,
        amountSats: '100000',
        currency: 'sbtc',
        status: PaymentIntentStatus.REQUIRES_PAYMENT,
        clientSecret: 'secret1',
        payAddress: 'ST1TEST',
        memoHex: 'duplicate_memo',
        expiresAt: new Date(Date.now() + 900000),
      });

      await paymentIntentRepository.save(existingPaymentIntent);

      const duplicatePaymentIntent = paymentIntentRepository.create({
        id: 'pi_test2',
        merchantId: testMerchant.id,
        amountSats: '100000',
        currency: 'sbtc',
        status: PaymentIntentStatus.REQUIRES_PAYMENT,
        clientSecret: 'secret2',
        payAddress: 'ST1TEST',
        memoHex: 'duplicate_memo', // Same memo hex
        expiresAt: new Date(Date.now() + 900000),
      });

      await expect(paymentIntentRepository.save(duplicatePaymentIntent)).rejects.toThrow();
    });
  });
});