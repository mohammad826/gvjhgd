import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async getTasks(userId: string) {
    const tasks = await this.prisma.sponsorTask.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    const completions = await this.prisma.taskCompletion.findMany({
      where: { userId },
    });

    const completionMap = new Set(completions.map(c => c.taskId));

    return tasks.map(task => ({
      ...task,
      reward: Number(task.reward),
      isCompleted: completionMap.has(task.id),
    }));
  }

  async claimTask(userId: string, taskId: string) {
    const [user, task] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId } }),
      this.prisma.sponsorTask.findUnique({ where: { id: taskId } }),
    ]);

    if (!user) throw new BadRequestException('User not found');
    if (!task) throw new BadRequestException('Task not found');
    if (!task.isActive) throw new BadRequestException('Task is no longer active');

    const existing = await this.prisma.taskCompletion.findUnique({
      where: { userId_taskId: { userId, taskId } },
    });

    if (existing) {
      throw new BadRequestException('Task already completed');
    }

    const rewardAmount = Number(task.reward);

    return await this.prisma.$transaction(async (tx) => {
      await tx.taskCompletion.create({
        data: { userId, taskId },
      });

      await tx.user.update({
        where: { id: userId },
        data: { balance: { increment: rewardAmount } },
      });

      await tx.transaction.create({
        data: {
          userId,
          amount: rewardAmount,
          type: 'AD_REWARD',
          metadata: { taskId, taskTitle: task.title },
        },
      });

      await tx.sponsorTask.update({
        where: { id: taskId },
        data: { totalClaims: { increment: 1 } },
      });

      if (user.referredById) {
        await this.calculateReferralBonus(userId, rewardAmount, tx);
      }

      const updatedUser = await tx.user.findUnique({ where: { id: userId } });

      return {
        success: true,
        reward: rewardAmount,
        newBalance: updatedUser?.balance,
      };
    });
  }

  private async calculateReferralBonus(
    userId: string,
    reward: number,
    tx: any,
  ) {
    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user?.referredById) return;

    const commission = reward * 0.1;

    await tx.user.update({
      where: { id: user.referredById },
      data: { balance: { increment: commission } },
    });

    await tx.transaction.create({
      data: {
        userId: user.referredById,
        amount: commission,
        type: 'REFERRAL_REWARD',
        metadata: { fromUserId: userId, source: 'task' },
      },
    });
  }

  async getTaskStats(userId: string) {
    const [totalCount, completedCount] = await Promise.all([
      this.prisma.sponsorTask.count({ where: { isActive: true } }),
      this.prisma.taskCompletion.count({
        where: { userId, sponsorTask: { isActive: true } },
      }),
    ]);

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const bonusAvailable = user?.referredById ? true : false;

    return {
      completedCount,
      totalCount,
      bonusAvailable,
    };
  }
}