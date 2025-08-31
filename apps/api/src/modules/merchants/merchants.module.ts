import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MerchantEntity } from '../../entities';
import { MerchantsService } from './merchants.service';

@Module({
  imports: [TypeOrmModule.forFeature([MerchantEntity])],
  providers: [MerchantsService],
  exports: [MerchantsService],
})
export class MerchantsModule {}