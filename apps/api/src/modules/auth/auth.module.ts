import { Module } from '@nestjs/common';
import { MerchantsModule } from '../merchants/merchants.module';
import { AuthGuard } from './auth.guard';

@Module({
  imports: [MerchantsModule],
  providers: [AuthGuard],
  exports: [AuthGuard],
})
export class AuthModule {}