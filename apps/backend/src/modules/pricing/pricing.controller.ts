import { Controller, Post, Body } from '@nestjs/common';
import { PricingService, PriceQuoteInput } from './pricing.service';

@Controller('api/v1/pricing')
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Post('quote')
  async getQuote(@Body() input: PriceQuoteInput) {
    const quote = await this.pricingService.calculateQuote(input);
    return {
      success: true,
      data: quote,
    };
  }
}
