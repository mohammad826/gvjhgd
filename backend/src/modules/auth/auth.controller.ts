import { Controller, Post, Body, Req } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('telegram')
  async login(@Body('initData') initData: string, @Body('referralCode') referralCode?: string) {
    return this.authService.validateTelegramLogin(initData, referralCode);
  }
}