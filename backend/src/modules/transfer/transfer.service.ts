import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TransferService {
  constructor(private prisma: PrismaService) {}

  async transfer(userId: string, targetUsername: string, amount: number) {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    if (amount < 0.01) {
      throw new BadRequestException('Minimum transfer amount is $0.01');
    }

    const sender = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!sender) {
      throw new NotFoundException('Sender not found');
    }

    const target = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username: targetUsername },
          { firstName: targetUsername },
        ],
      },
    });

    if (!target) {
      throw new NotFoundException('Target user not found');
    }

    if (target.id === userId) {
      throw new BadRequestException('Cannot transfer to yourself');
    }

    const senderBalance = Number(sender.balance);
    if (senderBalance < amount) {
      throw new BadRequestException('Insufficient balance');
    }

    return await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { balance: { decrement: amount } },
      });

      await tx.user.update({
        where: { id: target.id },
        data: { balance: { increment: amount } },
      });

      await tx.transaction.create({
        data: {
          userId,
          amount: -amount,
          type: 'TRANSFER_SENT',
          metadata: {
            transfer: true,
            targetUserId: target.id,
            targetUsername: target.username || target.firstName,
          },
        },
      });

      await tx.transaction.create({
        data: {
          userId: target.id,
          amount: amount,
          type: 'TRANSFER_RECEIVED',
          metadata: {
            transfer: true,
            fromUserId: userId,
            fromUsername: sender.username || sender.firstName,
          },
        },
      });

      const updatedSender = await tx.user.findUnique({ where: { id: userId } });

      return {
        success: true,
        amount,
        newBalance: updatedSender?.balance,
        targetUsername: target.username || target.firstName,
      };
    });
  }

  async getHistory(userId: string, page: number = 1, limit: number = 20) {
    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where: {
          userId,
          metadata: { path: ['transfer'], equals: true },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.transaction.count({
        where: {
          userId,
          metadata: { path: ['transfer'], equals: true },
        },
      }),
    ]);

    return {
      transactions,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async checkBalance(username: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username: username },
          { firstName: username },
        ],
      },
      select: { id: true, username: true, firstName: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      exists: true,
      username: user.username || user.firstName,
    };
  }
}