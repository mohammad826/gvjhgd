import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats() {
    const totalUsers = await this.prisma.user.count();
    const activeToday = await this.prisma.user.count({
      where: { lastAdWatch: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } }
    });
    const totalWithdrawn = await this.prisma.withdrawal.aggregate({
      where: { status: 'PAID' },
      _sum: { amount: true }
    });
    const pendingWithdrawals = await this.prisma.withdrawal.count({
      where: { status: 'PENDING' }
    });

    return {
      totalUsers,
      activeToday,
      totalWithdrawn: Number(totalWithdrawn._sum.amount || 0),
      pendingWithdrawals,
    };
  }

  async getUsers(page: number = 1, limit: number = 20) {
    return this.prisma.user.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { referrals: true } }
      }
    });
  }

  async getWithdrawals(status?: string) {
    return this.prisma.withdrawal.findMany({
      where: status ? { status: status as any } : {},
      include: { user: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  async updateWithdrawalStatus(id: string, status: 'APPROVED' | 'REJECTED' | 'PAID', adminNote?: string) {
    const withdrawal = await this.prisma.withdrawal.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!withdrawal) throw new NotFoundException('Withdrawal not found');

    return await this.prisma.$transaction(async (tx) => {
      const updated = await tx.withdrawal.update({
        where: { id },
        data: { status, adminNote }
      });

      // If rejected, refund the user
      if (status === 'REJECTED') {
        await tx.user.update({
          where: { id: withdrawal.userId },
          data: { balance: { increment: withdrawal.amount } }
        });

        await tx.transaction.create({
          data: {
            userId: withdrawal.userId,
            amount: withdrawal.amount,
            type: 'ADMIN_ADJUSTMENT',
            metadata: { reason: 'Withdrawal rejected', withdrawalId: id }
          }
        });
      }

      return updated;
    });
  }

  async banUser(userId: string, reason: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { isBanned: true }
    });

    await this.prisma.fraudLog.create({
      data: { userId, reason, data: { action: 'BAN' } }
    });

    return { success: true };
  }
}
