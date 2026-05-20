import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class AdService {
  constructor(
    private prisma: PrismaService,
  ) {}

  async claimReward(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    // 1. Cooldown Validation (5 seconds)
    if (user.lastAdWatch) {
      const secondsSinceLastAd = (Date.now() - user.lastAdWatch.getTime()) / 1000;
      if (secondsSinceLastAd < 5) {
        throw new BadRequestException('Cooldown active. Wait 5 seconds.');
      }
    }

    // 2. Daily Limit Validation (20 ads)
    // Check if it's a new day to reset counter
    const now = new Date();
    const lastWatch = user.lastAdWatch || new Date(0);
    const isNewDay = now.toDateString() !== lastWatch.toDateString();

    let currentDailyAds = isNewDay ? 0 : user.dailyAdsCount;
    if (currentDailyAds >= 20) {
      throw new BadRequestException('Daily ad limit reached');
    }

    // 3. Reward Calculation
    const rewardAmount = 0.002; // Configurable

    // 4. Update User & Create Transactions (Atomic)
    return await this.prisma.$transaction(async (tx) => {
      // Update User
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          balance: { increment: rewardAmount },
          lastAdWatch: now,
          dailyAdsCount: currentDailyAds + 1,
        }
      });

      // Log Ad Reward
      await tx.adReward.create({
        data: {
          userId,
          amount: rewardAmount,
          network: 'monetag',
        }
      });

      // Log Transaction
      await tx.transaction.create({
        data: {
          userId,
          amount: rewardAmount,
          type: 'AD_REWARD',
        }
      });

      // 5. Referral Commission (10%)
      if (user.referredById) {
        const commission = rewardAmount * 0.1;
        await tx.user.update({
          where: { id: user.referredById },
          data: { balance: { increment: commission } }
        });

        await tx.transaction.create({
          data: {
            userId: user.referredById,
            amount: commission,
            type: 'REFERRAL_REWARD',
            metadata: { fromUserId: userId }
          }
        });
      }

      return {
        success: true,
        reward: rewardAmount,
        newBalance: updatedUser.balance,
      };
    });
  }
}
