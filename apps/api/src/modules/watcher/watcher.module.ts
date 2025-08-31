import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentEntity } from '../../entities';
import { PaymentIntentsModule } from '../payment-intents/payment-intents.module';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { WatcherService } from './watcher.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([PaymentEntity]),
    PaymentIntentsModule,
    WebhooksModule,
  ],
  providers: [WatcherService],
  exports: [WatcherService],
})
export class WatcherModule {}