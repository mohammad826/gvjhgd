import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { validateTelegramInitData, parseTelegramInitData } from '../../common/utils/telegram.util';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateTelegramLogin(initData: string, referralCode?: string) {
    const botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    if (!botToken) {
      throw new UnauthorizedException('Telegram bot token is not configured');
    }

    if (!validateTelegramInitData(initData, botToken)) {
      throw new UnauthorizedException('Invalid Telegram data');
    }

    const tgUser = parseTelegramInitData(initData);
    if (!tgUser || !tgUser.id) {
      throw new UnauthorizedException('Invalid user data');
    }

    let user = await this.prisma.user.findUnique({
      where: { telegramId: BigInt(tgUser.id) },
    });

    let referredById: string | undefined;

    if (!user) {
      if (referralCode) {
        const referrer = await this.prisma.user.findUnique({
          where: { referralCode },
        });
        if (referrer && String(referrer.telegramId) !== tgUser.id) {
          referredById = referrer.id;
        }
      }

      const newReferralCode = crypto.randomBytes(4).toString('hex').toUpperCase();
      user = await this.prisma.user.create({
        data: {
          telegramId: BigInt(tgUser.id),
          username: tgUser.username,
          firstName: tgUser.first_name,
          photoUrl: tgUser.photo_url,
          languageCode: tgUser.language_code,
          referralCode: newReferralCode,
          referredById,
        },
      });
    } else {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          username: tgUser.username,
          firstName: tgUser.first_name,
          photoUrl: tgUser.photo_url,
        },
      });
    }

    if (user.isBanned) {
      throw new UnauthorizedException('User is banned');
    }

    const payload = { sub: user.id, telegramId: user.telegramId.toString(), isAdmin: user.isAdmin };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        telegramId: user.telegramId.toString(),
        username: user.username,
        firstName: user.firstName,
        balance: Number(user.balance),
        isAdmin: user.isAdmin,
        referralCode: user.referralCode,
        referredById: user.referredById,
        streak: user.streak,
        vipTier: user.vipTier,
        referralCount: await this.prisma.user.count({ where: { referredById: user.id } }),
      }
    };
  }
}
