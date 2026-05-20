import { Controller, Post, UseGuards, Request } from '@nestjs/common';
import { AdService } from './ad.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

@Controller('ad')
@UseGuards(JwtAuthGuard)
export class AdController {
  constructor(private readonly adService: AdService) {}

  @Post('reward')
  async claimReward(@Request() req) {
    return this.adService.claimReward(req.user.userId);
  }
}
