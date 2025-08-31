import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebhookDeliveryEntity } from '../../entities';
import { WebhooksService } from './webhooks.service';

@Module({
  imports: [TypeOrmModule.forFeature([WebhookDeliveryEntity])],
  providers: [WebhooksService],
  exports: [WebhooksService],
})
export class WebhooksModule {}