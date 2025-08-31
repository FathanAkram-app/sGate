import { AppDataSource } from '../config/database';
import { MerchantEntity } from '../entities';
import { generateApiKey, hashApiKey } from '@sgate/shared';

async function seed() {
  try {
    await AppDataSource.initialize();
    console.log('Database connected');

    const merchantRepository = AppDataSource.getRepository(MerchantEntity);

    // Check if demo merchant already exists
    const existingMerchant = await merchantRepository.findOne({
      where: { name: 'Demo Merchant' },
    });

    if (existingMerchant) {
      console.log('Demo merchant already exists');
      return;
    }

    // Create demo merchant
    const apiKey = generateApiKey();
    const apiKeySalt = process.env.API_KEY_SALT || 'dev-api-salt';
    const apiKeyHash = hashApiKey(apiKey, apiKeySalt);
    const webhookSecret = require('crypto').randomBytes(32).toString('hex');

    const merchant = merchantRepository.create({
      name: 'Demo Merchant',
      apiKeyHash,
      webhookUrl: 'https://smee.io/your-unique-channel', // Replace with your webhook endpoint
      webhookSecret,
    });

    await merchantRepository.save(merchant);

    console.log('✅ Demo merchant created successfully!');
    console.log('📋 Merchant Details:');
    console.log(`   ID: ${merchant.id}`);
    console.log(`   Name: ${merchant.name}`);
    console.log(`   API Key: ${apiKey}`);
    console.log(`   Webhook URL: ${merchant.webhookUrl}`);
    console.log(`   Webhook Secret: ${merchant.webhookSecret}`);
    console.log('');
    console.log('💡 Quick Start:');
    console.log('   1. Copy the API Key above');
    console.log('   2. Use it in your requests: Authorization: Bearer <API_KEY>');
    console.log('   3. Update webhook URL to your endpoint (optional)');
    console.log('   4. Test with: curl -X POST http://localhost:4000/v1/payment_intents \\');
    console.log('      -H "Authorization: Bearer <API_KEY>" \\');
    console.log('      -H "Content-Type: application/json" \\');
    console.log('      -d \'{"amount_sats": 100000, "currency": "sbtc"}\'');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

seed();