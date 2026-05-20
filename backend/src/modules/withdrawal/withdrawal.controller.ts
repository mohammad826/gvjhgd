import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { WithdrawalService } from './withdrawal.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

@Controller('withdrawal')
@UseGuards(JwtAuthGuard)
export class WithdrawalController {
  constructor(private readonly withdrawalService: WithdrawalService) {}

  @Post('request')
  async requestWithdrawal(
    @Request() req,
    @Body('amount') amount: number,
    @Body('method') method: string,
    @Body('walletAddress') walletAddress: string,
  ) {
    return this.withdrawalService.requestWithdrawal(req.user.userId, amount, method, walletAddress);
  }

  @Get('history')
  async getHistory(@Request() req) {
    return this.withdrawalService.getUserWithdrawals(req.user.userId);
  }
}
