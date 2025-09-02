import { Injectable, Logger, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ShutdownHook {
  name: string;
  priority: number; // Higher priority runs first (1-10)
  timeout: number; // Timeout in milliseconds
  execute: () => Promise<void>;
}

@Injectable()
export class GracefulShutdownService implements OnApplicationShutdown {
  private readonly logger = new Logger(GracefulShutdownService.name);
  private readonly shutdownHooks: ShutdownHook[] = [];
  private shutdownInProgress = false;
  private readonly maxShutdownTime = 30000; // 30 seconds max
  private shutdownTimer: NodeJS.Timeout;

  constructor(private configService: ConfigService) {
    this.setupProcessListeners();
  }

  registerShutdownHook(hook: ShutdownHook): void {
    this.shutdownHooks.push(hook);
    // Sort by priority (highest first)
    this.shutdownHooks.sort((a, b) => b.priority - a.priority);
    this.logger.debug(`Registered shutdown hook: ${hook.name} (priority: ${hook.priority})`);
  }

  private setupProcessListeners(): void {
    // Handle graceful shutdown signals
    process.on('SIGTERM', () => this.handleShutdown('SIGTERM'));
    process.on('SIGINT', () => this.handleShutdown('SIGINT'));
    
    // Handle uncaught exceptions and rejections
    process.on('uncaughtException', (error) => {
      this.logger.error('Uncaught Exception:', error);
      this.handleShutdown('uncaughtException', 1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      this.logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      this.handleShutdown('unhandledRejection', 1);
    });
  }

  private async handleShutdown(signal: string, exitCode = 0): Promise<void> {
    if (this.shutdownInProgress) {
      this.logger.warn(`Shutdown already in progress, ignoring ${signal}`);
      return;
    }

    this.shutdownInProgress = true;
    this.logger.log(`Received ${signal}, starting graceful shutdown...`);

    // Set a hard limit for shutdown time
    this.shutdownTimer = setTimeout(() => {
      this.logger.error('Shutdown timed out, forcing exit');
      process.exit(1);
    }, this.maxShutdownTime);

    try {
      await this.executeShutdownHooks();
      this.logger.log('Graceful shutdown completed successfully');
    } catch (error) {
      this.logger.error('Error during graceful shutdown:', error);
      exitCode = 1;
    } finally {
      clearTimeout(this.shutdownTimer);
      process.exit(exitCode);
    }
  }

  private async executeShutdownHooks(): Promise<void> {
    this.logger.log(`Executing ${this.shutdownHooks.length} shutdown hooks...`);

    for (const hook of this.shutdownHooks) {
      try {
        this.logger.debug(`Executing shutdown hook: ${hook.name}`);
        
        const hookPromise = hook.execute();
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Hook timeout')), hook.timeout);
        });

        await Promise.race([hookPromise, timeoutPromise]);
        this.logger.debug(`Shutdown hook completed: ${hook.name}`);
      } catch (error) {
        this.logger.error(`Error in shutdown hook ${hook.name}:`, error);
        // Continue with other hooks even if one fails
      }
    }
  }

  async onApplicationShutdown(signal?: string): Promise<void> {
    if (signal && !this.shutdownInProgress) {
      await this.handleShutdown(signal);
    }
  }

  // Method to trigger shutdown programmatically
  async triggerShutdown(reason: string = 'programmatic', exitCode: number = 0): Promise<void> {
    this.logger.log(`Triggering shutdown: ${reason}`);
    await this.handleShutdown(reason, exitCode);
  }

  isShuttingDown(): boolean {
    return this.shutdownInProgress;
  }
}