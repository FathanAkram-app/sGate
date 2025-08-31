import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PaymentIntentEntity, PaymentEntity } from '../../entities';
import { PaymentIntentsService } from '../payment-intents/payment-intents.service';
import { WebhooksService } from '../webhooks/webhooks.service';
import {
  PaymentIntentStatus,
  PaymentStatus,
  decodePaymentIntentMemo,
} from '@sgate/shared';
import axios from 'axios';

interface StacksTransaction {
  tx_id: string;
  tx_status: string;
  block_height: number;
  burn_block_time: number;
  canonical: boolean;
  ft_transfers?: Array<{
    asset_identifier: string;
    amount: string;
    sender: string;
    recipient: string;
  }>;
  events?: Array<{
    event_type: string;
    event_index: number;
    ft_transfer?: {
      asset_identifier: string;
      amount: string;
      sender: string;
      recipient: string;
    };
  }>;
  tx?: {
    memo?: string;
  };
}

@Injectable()
export class WatcherService {
  private readonly logger = new Logger(WatcherService.name);

  constructor(
    @InjectRepository(PaymentEntity)
    private paymentRepository: Repository<PaymentEntity>,
    private paymentIntentsService: PaymentIntentsService,
    private webhooksService: WebhooksService,
    private configService: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_10_SECONDS)
  async watchPayments() {
    const intervalMs = this.configService.get<number>('worker.watcherIntervalMs');
    
    // Use a more frequent interval if configured
    if (intervalMs !== 10000) {
      setTimeout(() => this.watchPayments(), intervalMs);
      return;
    }

    try {
      await this.processPaymentIntents();
      await this.processExpiredPaymentIntents();
      await this.retryFailedWebhooks();
    } catch (error) {
      this.logger.error('Error in payment watcher:', error);
    }
  }

  private async processPaymentIntents() {
    const paymentIntents = await this.paymentIntentsService.findRequiringPayment();
    
    for (const pi of paymentIntents) {
      try {
        await this.checkForPayments(pi);
      } catch (error) {
        this.logger.error(`Error processing payment intent ${pi.id}:`, error);
      }
    }
  }

  private async checkForPayments(paymentIntent: PaymentIntentEntity) {
    const hiroApiBase = this.configService.get<string>('stacks.hiroApiBase');
    const sbtcAssetId = this.configService.get<string>('stacks.sbtcAssetIdentifier');
    const gatewayAddress = this.configService.get<string>('stacks.gatewayAddress');
    const requiredConfirmations = this.configService.get<number>('stacks.requiredConfirmations');

    // Search for transactions to our gateway address
    const url = `${hiroApiBase}/extended/v1/address/${gatewayAddress}/transactions`;
    
    try {
      const response = await axios.get(url, {
        params: {
          limit: 50,
          offset: 0,
        },
      });

      const transactions: StacksTransaction[] = response.data.results || [];

      for (const tx of transactions) {
        if (tx.tx_status !== 'success' || !tx.canonical) {
          continue;
        }

        // Check for FT transfers in events
        const ftTransfers = this.extractFTTransfers(tx);
        
        for (const transfer of ftTransfers) {
          if (
            transfer.asset_identifier === sbtcAssetId &&
            transfer.recipient === gatewayAddress
          ) {
            // Check if memo matches our payment intent
            const memo = this.extractMemo(tx);
            if (memo && memo === paymentIntent.memoHex) {
              await this.processPayment(paymentIntent, tx, transfer, requiredConfirmations);
            }
          }
        }
      }
    } catch (error) {
      this.logger.error(`Error fetching transactions for ${gatewayAddress}:`, error);
    }
  }

  private extractFTTransfers(tx: StacksTransaction): Array<{
    asset_identifier: string;
    amount: string;
    sender: string;
    recipient: string;
  }> {
    const transfers = [];

    // Check direct ft_transfers
    if (tx.ft_transfers) {
      transfers.push(...tx.ft_transfers);
    }

    // Check events for ft_transfer
    if (tx.events) {
      for (const event of tx.events) {
        if (event.event_type === 'ft_transfer_event' && event.ft_transfer) {
          transfers.push(event.ft_transfer);
        }
      }
    }

    return transfers;
  }

  private extractMemo(tx: StacksTransaction): string | null {
    // Try to extract memo from transaction
    // This is a simplified implementation - real implementation would depend on how memo is encoded
    try {
      if (tx.tx?.memo) {
        return tx.tx.memo;
      }
      // Could also check transaction inputs/outputs for memo data
      return null;
    } catch {
      return null;
    }
  }

  private async processPayment(
    paymentIntent: PaymentIntentEntity,
    tx: StacksTransaction,
    transfer: any,
    requiredConfirmations: number,
  ) {
    // Check if we already processed this transaction
    const existingPayment = await this.paymentRepository.findOne({
      where: { txId: tx.tx_id, paymentIntentId: paymentIntent.id },
    });

    if (existingPayment) {
      // Update confirmations if needed
      const currentHeight = await this.getCurrentBlockHeight();
      const confirmations = currentHeight - tx.block_height + 1;
      
      if (confirmations !== existingPayment.confirmations) {
        existingPayment.confirmations = confirmations;
        existingPayment.status = confirmations >= requiredConfirmations 
          ? PaymentStatus.CONFIRMED 
          : PaymentStatus.SEEN;
        await this.paymentRepository.save(existingPayment);

        // Update payment intent status if confirmed
        if (confirmations >= requiredConfirmations && paymentIntent.status !== PaymentIntentStatus.CONFIRMED) {
          await this.confirmPaymentIntent(paymentIntent);
        }
      }
      return;
    }

    // Create new payment record
    const currentHeight = await this.getCurrentBlockHeight();
    const confirmations = currentHeight - tx.block_height + 1;
    const amountSats = parseInt(transfer.amount);

    const payment = this.paymentRepository.create({
      paymentIntentId: paymentIntent.id,
      txId: tx.tx_id,
      amountSats: amountSats.toString(),
      confirmations,
      status: confirmations >= requiredConfirmations ? PaymentStatus.CONFIRMED : PaymentStatus.SEEN,
      rawTx: tx,
    });

    await this.paymentRepository.save(payment);

    // Update payment intent status
    if (paymentIntent.status === PaymentIntentStatus.REQUIRES_PAYMENT) {
      const targetAmount = parseInt(paymentIntent.amountSats);
      
      if (amountSats >= targetAmount) {
        if (confirmations >= requiredConfirmations) {
          await this.confirmPaymentIntent(paymentIntent);
        } else {
          await this.paymentIntentsService.updateStatus(paymentIntent.id, PaymentIntentStatus.PROCESSING);
        }
      } else {
        // Underpayment - keep in requires_payment status
        this.logger.warn(`Underpayment for ${paymentIntent.id}: received ${amountSats}, expected ${targetAmount}`);
      }
    }
  }

  private async confirmPaymentIntent(paymentIntent: PaymentIntentEntity) {
    await this.paymentIntentsService.updateStatus(paymentIntent.id, PaymentIntentStatus.CONFIRMED);
    
    // Fire webhook
    const updatedPI = await this.paymentIntentsService.findById(paymentIntent.id);
    if (updatedPI) {
      await this.webhooksService.firePaymentIntentSucceeded(updatedPI);
    }
  }

  private async getCurrentBlockHeight(): Promise<number> {
    const hiroApiBase = this.configService.get<string>('stacks.hiroApiBase');
    
    try {
      const response = await axios.get(`${hiroApiBase}/extended/v1/block`);
      return response.data.results[0]?.height || 0;
    } catch {
      return 0;
    }
  }

  private async processExpiredPaymentIntents() {
    const expiredPIs = await this.paymentIntentsService.findExpiredPaymentIntents();
    
    for (const pi of expiredPIs) {
      try {
        await this.paymentIntentsService.updateStatus(pi.id, PaymentIntentStatus.EXPIRED);
        await this.webhooksService.firePaymentIntentExpired(pi);
        this.logger.log(`Payment intent ${pi.id} marked as expired`);
      } catch (error) {
        this.logger.error(`Error expiring payment intent ${pi.id}:`, error);
      }
    }
  }

  private async retryFailedWebhooks() {
    const pendingWebhooks = await this.webhooksService.getPendingWebhooks();
    const maxAttempts = this.configService.get<number>('worker.webhookRetryAttempts');
    
    for (const webhook of pendingWebhooks) {
      if (webhook.attempts < maxAttempts) {
        try {
          await this.webhooksService.deliverWebhook(webhook.id);
        } catch (error) {
          this.logger.error(`Error retrying webhook ${webhook.id}:`, error);
        }
      }
    }
  }
}