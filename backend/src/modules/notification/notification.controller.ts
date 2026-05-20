import { Controller, Get, Patch, Post, Param, Query, UseGuards, Request } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  getNotifications(
    @Request() req,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    return this.notificationService.getNotifications(
      req.user.userId,
      parseInt(page) || 1,
      parseInt(limit) || 20,
    );
  }

  @Patch(':id/read')
  markAsRead(@Request() req, @Param('id') id: string) {
    return this.notificationService.markAsRead(id, req.user.userId);
  }

  @Post('read-all')
  markAllAsRead(@Request() req) {
    return this.notificationService.markAllAsRead(req.user.userId);
  }

  @Get('unread-count')
  getUnreadCount(@Request() req) {
    return this.notificationService.getUnreadCount(req.user.userId);
  }
}