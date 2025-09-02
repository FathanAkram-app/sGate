import { Controller, Get, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { RedisCacheService } from '../../common/services/redis-cache.service';
import { MetricsService } from '../../common/services/metrics.service';
import axios from 'axios';

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  version: string;
  services: {
    database: ServiceHealth;
    redis: ServiceHealth;
    blockchain: ServiceHealth;
    metrics?: ServiceHealth;
  };
  system: {
    memory: NodeJS.MemoryUsage;
    cpu: {
      loadAverage: number[];
    };
  };
  checks: {
    readiness: boolean;
    liveness: boolean;
  };
}

export interface ServiceHealth {
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime?: number;
  details?: any;
  error?: string;
}

@Controller('health')
export class HealthController {
  constructor(
    private dataSource: DataSource,
    private configService: ConfigService,
    private redisCacheService: RedisCacheService,
    private metricsService?: MetricsService,
  ) {}

  @Get()
  async healthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    // Run all health checks in parallel
    const [
      databaseHealth,
      redisHealth,
      blockchainHealth,
      metricsHealth,
    ] = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkBlockchain(),
      this.checkMetrics(),
    ]);

    const services = {
      database: this.getServiceResult(databaseHealth),
      redis: this.getServiceResult(redisHealth),
      blockchain: this.getServiceResult(blockchainHealth),
      ...(this.metricsService && { metrics: this.getServiceResult(metricsHealth) }),
    };

    // Determine overall status
    const serviceStatuses = Object.values(services).map(s => s.status);
    const overallStatus = this.determineOverallStatus(serviceStatuses);

    const result: HealthCheckResult = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      services,
      system: {
        memory: process.memoryUsage(),
        cpu: {
          loadAverage: require('os').loadavg(),
        },
      },
      checks: {
        readiness: this.checkReadiness(services),
        liveness: this.checkLiveness(services),
      },
    };

    return result;
  }

  @Get('ready')
  async readinessCheck(): Promise<{ status: string; ready: boolean }> {
    const [databaseHealth, redisHealth] = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
    ]);

    const database = this.getServiceResult(databaseHealth);
    const redis = this.getServiceResult(redisHealth);

    const ready = database.status === 'healthy' && redis.status !== 'unhealthy';

    return {
      status: ready ? 'ready' : 'not ready',
      ready,
    };
  }

  @Get('live')
  async livenessCheck(): Promise<{ status: string; alive: boolean }> {
    // Basic liveness check - just ensure the service is responding
    const alive = true; // If we're here, the service is alive

    return {
      status: alive ? 'alive' : 'dead',
      alive,
    };
  }

  @Get('metrics')
  async metricsEndpoint(): Promise<string> {
    if (!this.metricsService) {
      throw new Error('Metrics service not available');
    }
    return this.metricsService.getMetrics();
  }

  private async checkDatabase(): Promise<ServiceHealth> {
    const startTime = Date.now();
    
    try {
      // Simple connectivity check
      await this.dataSource.query('SELECT 1');
      
      // Get connection pool stats if available
      const pool = (this.dataSource.driver as any).master;
      const details: any = {
        connected: this.dataSource.isInitialized,
      };

      if (pool) {
        details.poolSize = pool.totalCount || 0;
        details.idleConnections = pool.idleCount || 0;
        details.activeConnections = pool.totalCount - pool.idleCount || 0;
      }

      return {
        status: 'healthy',
        responseTime: Date.now() - startTime,
        details,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error.message,
      };
    }
  }

  private async checkRedis(): Promise<ServiceHealth> {
    const startTime = Date.now();

    try {
      const result = await this.redisCacheService.healthCheck();
      
      if (result.status === 'healthy') {
        const stats = await this.redisCacheService.getStats();
        return {
          status: 'healthy',
          responseTime: result.responseTime || (Date.now() - startTime),
          details: stats,
        };
      }

      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: result.error,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error.message,
      };
    }
  }

  private async checkBlockchain(): Promise<ServiceHealth> {
    const startTime = Date.now();
    const timeout = this.configService.get<number>('monitoring.healthCheckTimeout') || 5000;

    try {
      const hiroApiBase = this.configService.get<string>('stacks.hiroApiBase');
      
      const response = await axios.get(`${hiroApiBase}/extended/v1/info/network_block_times`, {
        timeout,
      });

      if (response.status === 200) {
        return {
          status: 'healthy',
          responseTime: Date.now() - startTime,
          details: {
            network: this.configService.get<string>('stacks.network'),
            apiEndpoint: hiroApiBase,
            blockTime: response.data?.mainnet?.target_block_time,
          },
        };
      }

      return {
        status: 'degraded',
        responseTime: Date.now() - startTime,
        details: { statusCode: response.status },
      };
    } catch (error) {
      const status = error.code === 'ECONNABORTED' ? 'degraded' : 'unhealthy';
      
      return {
        status,
        responseTime: Date.now() - startTime,
        error: error.message,
      };
    }
  }

  private async checkMetrics(): Promise<ServiceHealth> {
    if (!this.metricsService) {
      return {
        status: 'unhealthy',
        error: 'Metrics service not available',
      };
    }

    const startTime = Date.now();

    try {
      const result = await this.metricsService.healthCheck();
      
      return {
        status: result.status === 'healthy' ? 'healthy' : 'unhealthy',
        responseTime: Date.now() - startTime,
        details: { metricsCount: result.metricsCount },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error.message,
      };
    }
  }

  private getServiceResult(settled: PromiseSettledResult<ServiceHealth>): ServiceHealth {
    if (settled.status === 'fulfilled') {
      return settled.value;
    }

    return {
      status: 'unhealthy',
      error: settled.reason?.message || 'Unknown error',
    };
  }

  private determineOverallStatus(serviceStatuses: Array<'healthy' | 'unhealthy' | 'degraded'>): 'healthy' | 'unhealthy' | 'degraded' {
    if (serviceStatuses.every(status => status === 'healthy')) {
      return 'healthy';
    }

    if (serviceStatuses.some(status => status === 'unhealthy')) {
      return 'unhealthy';
    }

    return 'degraded';
  }

  private checkReadiness(services: Record<string, ServiceHealth>): boolean {
    // Service is ready if database is healthy and Redis is not unhealthy
    return services.database.status === 'healthy' && 
           services.redis.status !== 'unhealthy';
  }

  private checkLiveness(services: Record<string, ServiceHealth>): boolean {
    // Service is alive if at least the database is responding
    // (more lenient than readiness)
    return services.database.status !== 'unhealthy';
  }
}