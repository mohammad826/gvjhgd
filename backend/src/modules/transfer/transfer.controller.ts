import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { TransferService } from './transfer.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

@Controller('transfer')
@UseGuards(JwtAuthGuard)
export class TransferController {
  constructor(private readonly transferService: TransferService) {}

  @Post()
  transfer(
    @Request() req,
    @Body() body: { targetUsername: string; amount: number },
  ) {
    return this.transferService.transfer(req.user.userId, body.targetUsername, body.amount);
  }

  @Get('history')
  getHistory(
    @Request() req,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    return this.transferService.getHistory(
      req.user.userId,
      parseInt(page) || 1,
      parseInt(limit) || 20,
    );
  }

  @Get('balance-check/:username')
  checkBalance(@Param('username') username: string) {
    return this.transferService.checkBalance(username);
  }
}