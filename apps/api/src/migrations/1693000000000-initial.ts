import { MigrationInterface, QueryRunner } from 'typeorm';

export class Initial1693000000000 implements MigrationInterface {
  name = 'Initial1693000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "merchants" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "api_key_hash" character varying NOT NULL,
        "webhook_url" character varying,
        "webhook_secret" character varying,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_merchants" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_merchants_api_key_hash" ON "merchants" ("api_key_hash")`);

    await queryRunner.query(`
      CREATE TYPE "payment_intent_status_enum" AS ENUM('requires_payment', 'processing', 'confirmed', 'failed', 'expired')
    `);

    await queryRunner.query(`
      CREATE TABLE "payment_intents" (
        "id" character varying NOT NULL,
        "merchant_id" uuid NOT NULL,
        "amount_sats" bigint NOT NULL,
        "currency" character varying NOT NULL DEFAULT 'sbtc',
        "status" "payment_intent_status_enum" NOT NULL DEFAULT 'requires_payment',
        "client_secret" character varying NOT NULL,
        "pay_address" character varying NOT NULL,
        "memo_hex" character varying NOT NULL,
        "expires_at" TIMESTAMP NOT NULL,
        "metadata" jsonb,
        "description" character varying,
        "success_url" character varying,
        "cancel_url" character varying,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_payment_intents" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_payment_intents_merchant_id" ON "payment_intents" ("merchant_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_payment_intents_status" ON "payment_intents" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_payment_intents_memo_hex" ON "payment_intents" ("memo_hex")`);

    await queryRunner.query(`
      CREATE TYPE "payment_status_enum" AS ENUM('seen', 'confirmed', 'reorged')
    `);

    await queryRunner.query(`
      CREATE TABLE "payments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "payment_intent_id" character varying NOT NULL,
        "tx_id" character varying NOT NULL,
        "amount_sats" bigint NOT NULL,
        "confirmations" integer NOT NULL DEFAULT 0,
        "status" "payment_status_enum" NOT NULL DEFAULT 'seen',
        "raw_tx" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_payments" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_payments_tx_id" ON "payments" ("tx_id")`);

    await queryRunner.query(`
      CREATE TYPE "webhook_event_type_enum" AS ENUM('payment_intent.succeeded', 'payment_intent.failed', 'payment_intent.expired')
    `);

    await queryRunner.query(`
      CREATE TABLE "webhook_deliveries" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "merchant_id" uuid NOT NULL,
        "event" "webhook_event_type_enum" NOT NULL,
        "payload_json" jsonb NOT NULL,
        "delivered" boolean NOT NULL DEFAULT false,
        "attempts" integer NOT NULL DEFAULT 0,
        "last_error" character varying,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_webhook_deliveries" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_webhook_deliveries_merchant_id" ON "webhook_deliveries" ("merchant_id")`);

    await queryRunner.query(`
      ALTER TABLE "payment_intents" 
      ADD CONSTRAINT "FK_payment_intents_merchant_id" 
      FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "payments" 
      ADD CONSTRAINT "FK_payments_payment_intent_id" 
      FOREIGN KEY ("payment_intent_id") REFERENCES "payment_intents"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "webhook_deliveries" 
      ADD CONSTRAINT "FK_webhook_deliveries_merchant_id" 
      FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "webhook_deliveries" DROP CONSTRAINT "FK_webhook_deliveries_merchant_id"`);
    await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_payments_payment_intent_id"`);
    await queryRunner.query(`ALTER TABLE "payment_intents" DROP CONSTRAINT "FK_payment_intents_merchant_id"`);
    
    await queryRunner.query(`DROP INDEX "IDX_webhook_deliveries_merchant_id"`);
    await queryRunner.query(`DROP TABLE "webhook_deliveries"`);
    await queryRunner.query(`DROP TYPE "webhook_event_type_enum"`);
    
    await queryRunner.query(`DROP INDEX "IDX_payments_tx_id"`);
    await queryRunner.query(`DROP TABLE "payments"`);
    await queryRunner.query(`DROP TYPE "payment_status_enum"`);
    
    await queryRunner.query(`DROP INDEX "IDX_payment_intents_memo_hex"`);
    await queryRunner.query(`DROP INDEX "IDX_payment_intents_status"`);
    await queryRunner.query(`DROP INDEX "IDX_payment_intents_merchant_id"`);
    await queryRunner.query(`DROP TABLE "payment_intents"`);
    await queryRunner.query(`DROP TYPE "payment_intent_status_enum"`);
    
    await queryRunner.query(`DROP INDEX "IDX_merchants_api_key_hash"`);
    await queryRunner.query(`DROP TABLE "merchants"`);
  }
}