import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: { referrals: true }
        }
      }
    });

    if (!user) throw new NotFoundException('User not found');

    const totalEarned = await this.prisma.transaction.aggregate({
      where: { userId, type: { not: 'WITHDRAWAL' } },
      _sum: { amount: true },
    });

    return {
      ...user,
      telegramId: user.telegramId.toString(),
      totalEarned: totalEarned._sum.amount || 0,
      referralCount: user._count.referrals,
    };
  }

  async getStats(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new NotFoundException('User not found');

    const totalEarned = await this.prisma.transaction.aggregate({
      where: { userId, type: { not: 'WITHDRAWAL' } },
      _sum: { amount: true },
    });

    const referralCount = await this.prisma.user.count({ where: { referredById: userId } });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const isNewDay = user.lastDailyClaim ? user.lastDailyClaim < todayStart : true;

    return {
      balance: user.balance,
      totalEarned: totalEarned._sum.amount || 0,
      referralCount,
      dailyAdsRemaining: 20 - user.dailyAdsCount,
      streak: user.streak,
      isVip: user.isVip,
      vipTier: user.vipTier,
      canClaimDaily: isNewDay,
      vipEarnings: user.vipEarnings,
      lastDailyClaim: user.lastDailyClaim,
    };
  }

  async getLeaderboard(currentUserId?: string) {
    const topUsers = await this.prisma.user.findMany({
      take: 20,
      orderBy: { balance: 'desc' },
      select: {
        id: true,
        username: true,
        firstName: true,
        photoUrl: true,
        balance: true,
        _count: { select: { referrals: true } }
      }
    });

    const formatted = topUsers.map((u, i) => ({
      rank: i + 1,
      id: u.id,
      username: u.username || u.firstName || 'Anonymous',
      photoUrl: u.photoUrl,
      balance: u.balance,
      referrals: u._count.referrals,
      isCurrentUser: u.id === currentUserId,
    }));

    const currentRank = currentUserId ? formatted.findIndex(u => u.isCurrentUser) + 1 : null;

    return { leaderboard: formatted, currentRank };
  }

  async claimDailyBonus(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    if (user.lastDailyClaim && user.lastDailyClaim >= todayStart) {
      throw new NotFoundException('Daily bonus already claimed today');
    }

    const yesterday = new Date(todayStart);
    yesterday.setDate(yesterday.getDate() - 1);
    const wasActiveYesterday = user.lastDailyClaim &&
      new Date(user.lastDailyClaim) >= yesterday &&
      new Date(user.lastDailyClaim) < todayStart;

    const newStreak = wasActiveYesterday ? user.streak + 1 : 1;

    const baseReward = 0.01;
    const streakBonus = (newStreak - 1) * 0.001;
    const vipMultiplier = 1 + (user.isVip ? user.vipTier * 0.2 : 0);
    const rewardAmount = Number((baseReward + streakBonus) * vipMultiplier);
    const newTier = this.calculateVipTier(newStreak);

    return await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          balance: { increment: rewardAmount },
          lastDailyClaim: new Date(),
          streak: newStreak,
          isVip: newTier > 0,
          vipTier: newTier,
        }
      });

      await tx.transaction.create({
        data: {
          userId,
          amount: rewardAmount,
          type: 'DAILY_BONUS',
          metadata: { streak: newStreak, vipTier: newTier }
        }
      });

      return {
        reward: rewardAmount,
        newStreak,
        vipTier: newTier,
        isVip: newTier > 0,
      };
    });
  }

  private calculateVipTier(streak: number): number {
    if (streak >= 30) return 5;
    if (streak >= 20) return 4;
    if (streak >= 14) return 3;
    if (streak >= 7) return 2;
    if (streak >= 3) return 1;
    return 0;
  }

  async getTransactionHistory(userId: string, page: number = 1, limit: number = 20) {
    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.transaction.count({ where: { userId } }),
    ]);

    return {
      transactions,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}