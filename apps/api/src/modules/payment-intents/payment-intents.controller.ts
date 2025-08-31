import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
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