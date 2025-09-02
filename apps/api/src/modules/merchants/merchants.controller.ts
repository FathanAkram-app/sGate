import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MerchantsService } from './merchants.service';
import { AuthGuard } from '../auth/auth.guard';

interface CreateApiKeyDto {
  name: string;
}

@ApiTags('merchants')
@Controller('v1/merchants')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class MerchantsController {
  constructor(private merchantsService: MerchantsService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get merchant profile' })
  @ApiResponse({ status: 200, description: 'Merchant profile retrieved successfully' })
  async getProfile(@Request() req) {
    const merchant = req.merchant;
    return {
      id: merchant.id,
      name: merchant.name,
      email: merchant.email,
      webhookUrl: merchant.webhookUrl,
      webhookSecret: merchant.webhookSecret,
      createdAt: merchant.createdAt.toISOString(),
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getStats(@Request() req) {
    const merchant = req.merchant;
    return this.merchantsService.getDashboardStats(merchant.id);
  }

  @Get('api-keys')
  @ApiOperation({ summary: 'List API keys' })
  @ApiResponse({ status: 200, description: 'API keys retrieved successfully' })
  async getApiKeys(@Request() req) {
    const merchant = req.merchant;
    return this.merchantsService.getApiKeys(merchant.id);
  }

  @Post('api-keys')
  @ApiOperation({ summary: 'Create new API key' })
  @ApiResponse({ status: 201, description: 'API key created successfully' })
  async createApiKey(@Body() dto: CreateApiKeyDto, @Request() req) {
    const merchant = req.merchant;
    
    if (!dto.name || dto.name.trim().length === 0) {
      throw new HttpException(
        {
          error: 'invalid_request',
          message: 'API key name is required',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.merchantsService.createApiKey(merchant.id, dto.name.trim());
  }

  @Delete('api-keys/:id')
  @ApiOperation({ summary: 'Revoke API key' })
  @ApiResponse({ status: 200, description: 'API key revoked successfully' })
  async revokeApiKey(@Param('id') keyId: string, @Request() req) {
    const merchant = req.merchant;
    
    await this.merchantsService.revokeApiKey(merchant.id, keyId);
    
    return { message: 'API key revoked successfully' };
  }

  @Get('webhooks')
  @ApiOperation({ summary: 'List webhook endpoints' })
  @ApiResponse({ status: 200, description: 'Webhook endpoints retrieved successfully' })
  async getWebhooks(@Request() req) {
    const merchant = req.merchant;
    return this.merchantsService.getWebhookEndpoints(merchant.id);
  }

  @Post('webhooks')
  @ApiOperation({ summary: 'Create webhook endpoint' })
  @ApiResponse({ status: 201, description: 'Webhook endpoint created successfully' })
  async createWebhook(
    @Body() dto: { url: string; events: string[] },
    @Request() req,
  ) {
    const merchant = req.merchant;
    
    if (!dto.url || !dto.events || dto.events.length === 0) {
      throw new HttpException(
        {
          error: 'invalid_request',
          message: 'URL and events are required',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.merchantsService.createWebhookEndpoint(merchant.id, dto.url, dto.events);
  }
}