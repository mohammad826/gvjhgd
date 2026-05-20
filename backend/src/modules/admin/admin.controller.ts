import { Controller, Get, Post, Body, Param, UseGuards, Query } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { AdminGuard } from '../../guards/admin.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  getStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('users')
  getUsers(@Query('page') page: string) {
    return this.adminService.getUsers(parseInt(page) || 1);
  }

  @Get('withdrawals')
  getWithdrawals(@Query('status') status: string) {
    return this.adminService.getWithdrawals(status);
  }

  @Post('withdrawal/:id/status')
  updateWithdrawalStatus(
    @Param('id') id: string,
    @Body('status') status: 'APPROVED' | 'REJECTED' | 'PAID',
    @Body('adminNote') adminNote?: string,
  ) {
    return this.adminService.updateWithdrawalStatus(id, status, adminNote);
  }

  @Post('user/:id/ban')
  banUser(@Param('id') id: string, @Body('reason') reason: string) {
    return this.adminService.banUser(id, reason);
  }
}
