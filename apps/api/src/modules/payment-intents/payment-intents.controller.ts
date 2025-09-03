import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PaymentIntentsService } from './payment-intents.service';
import { AuthGuard } from '../auth/auth.guard';
import { CreatePaymentIntentDto, PaymentIntentResponseDto } from '@sgate/shared';

@ApiTags('payment-intents')
@Controller('v1/payment_intents')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class PaymentIntentsController {
  constructor(private paymentIntentsService: PaymentIntentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a payment intent' })
  @ApiResponse({ status: 201, description: 'Payment intent created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @Body() createDto: CreatePaymentIntentDto,
    @Request() req,
  ): Promise<PaymentIntentResponseDto> {
    try {
      const merchant = req.merchant;
      return await this.paymentIntentsService.create(merchant.id, createDto);
    } catch (error) {
      throw new HttpException(
        {
          error: 'payment_intent_creation_failed',
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get()
  @ApiOperation({ summary: 'List payment intents' })
  @ApiResponse({ status: 200, description: 'Payment intents retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of results to return (default: 20)' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'from', required: false, description: 'Filter from date (ISO 8601)' })
  @ApiQuery({ name: 'to', required: false, description: 'Filter to date (ISO 8601)' })
  async findAll(
    @Request() req,
    @Query('limit') limit?: string,
    @Query('page') page?: string,
    @Query('status') status?: string,
    @Query('from') fromDate?: string,
    @Query('to') toDate?: string,
  ) {
    const merchant = req.merchant;
    const limitNum = parseInt(limit || '20', 10);
    const pageNum = parseInt(page || '1', 10);
    
    return this.paymentIntentsService.findAll(merchant.id, {
      limit: limitNum,
      page: pageNum,
      status,
      fromDate,
      toDate,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a payment intent' })
  @ApiResponse({ status: 200, description: 'Payment intent retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Payment intent not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findOne(
    @Param('id') id: string,
    @Request() req,
  ): Promise<PaymentIntentResponseDto> {
    const merchant = req.merchant;
    const paymentIntent = await this.paymentIntentsService.findOne(id, merchant.id);
    
    if (!paymentIntent) {
      throw new HttpException(
        {
          error: 'payment_intent_not_found',
          message: 'Payment intent not found',
        },
        HttpStatus.NOT_FOUND,
      );
    }

    return paymentIntent;
  }
}