import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class WithdrawalService {
  constructor(private prisma: PrismaService) {}

  async requestWithdrawal(userId: string, amount: number, method: string, walletAddress: string) {
    const minWithdrawal = 10;
    const fee = 1;

    if (amount < minWithdrawal) {
      throw new BadRequestException(`Minimum withdrawal is $${minWithdrawal}`);
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    if (user.balance.toNumber() < amount) {
      throw new BadRequestException('Insufficient balance');
    }

    return await this.prisma.$transaction(async (tx) => {
      // 1. Deduct balance
      await tx.user.update({
        where: { id: userId },
        data: { balance: { decrement: amount } }
      });

      // 2. Create Withdrawal Record
      const withdrawal = await tx.withdrawal.create({
        data: {
          userId,
          amount,
          fee,
          method,
          walletAddress,
          status: 'PENDING',
        }
      });

      // 3. Log Transaction
      await tx.transaction.create({
        data: {
          userId,
          amount: -amount,
          type: 'WITHDRAWAL',
          metadata: { withdrawalId: withdrawal.id }
        }
      });

      return withdrawal;
    });
  }

  async getUserWithdrawals(userId: string) {
    return this.prisma.withdrawal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }
}
