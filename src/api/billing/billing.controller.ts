import { Body, Controller, Get, Param, Post, UseGuards, Request } from '@nestjs/common';
import { BillingService } from './billing.service.js';
import { IssueChargeDto } from './dto/issue-charge.dto.js';
import { PayCardDto } from './dto/pay-card.dto.js';
import { SimulatePaymentDto } from './dto/simulate-payment.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@Controller('billing')
@UseGuards(JwtAuthGuard)
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('issue')
  async issueCharge(@Request() req: any, @Body() data: IssueChargeDto) {
    return this.billingService.issueCharge(req.user.userId, data);
  }

  @Post('simulate/:id')
  async simulatePayment(@Request() req: any, @Param('id') id: string, @Body() data: SimulatePaymentDto) {
    return this.billingService.simulatePayment(req.user.userId, id, data.paymentMethod);
  }

  @Post('pay-card')
  async payWithCreditCard(@Request() req: any, @Body() data: PayCardDto) {
    return this.billingService.payWithCreditCard(req.user.userId, data);
  }

  @Get('list')
  async listCharges(@Request() req: any) {
    return this.billingService.listCharges(req.user.userId);
  }
}
