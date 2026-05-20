import { Controller, Get, Post, UseGuards, Request, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

@Controller('user')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  getProfile(@Request() req) {
    return this.userService.getProfile(req.user.userId);
  }

  @Get('stats')
  getStats(@Request() req) {
    return this.userService.getStats(req.user.userId);
  }

  @Get('leaderboard')
  getLeaderboard(@Request() req) {
    return this.userService.getLeaderboard(req.user.userId);
  }

  @Get('transactions')
  getTransactions(@Request() req, @Query('page') page: string, @Query('limit') limit: string) {
    return this.userService.getTransactionHistory(
      req.user.userId,
      parseInt(page) || 1,
      parseInt(limit) || 20,
    );
  }

  @Post('daily-bonus')
  claimDailyBonus(@Request() req) {
    return this.userService.claimDailyBonus(req.user.userId);
  }
}