import { Controller, Get, Post, Param, UseGuards, Request } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  getTasks(@Request() req) {
    return this.tasksService.getTasks(req.user.userId);
  }

  @Post(':id/claim')
  claimTask(@Request() req, @Param('id') taskId: string) {
    return this.tasksService.claimTask(req.user.userId, taskId);
  }

  @Get('stats')
  getTaskStats(@Request() req) {
    return this.tasksService.getTaskStats(req.user.userId);
  }
}