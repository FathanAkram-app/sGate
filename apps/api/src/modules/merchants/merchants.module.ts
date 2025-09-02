import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MerchantEntity, PaymentIntentEntity } from '../../entities';
import { MerchantsService } from './merchants.service';
import { MerchantsController } from './merchants.controller';

@Module({
  imports: [TypeOrmModule.forFeature([MerchantEntity, PaymentIntentEntity])],
  controllers: [MerchantsController],
  providers: [MerchantsService],
  exports: [MerchantsService],
})
export class MerchantsModule {}