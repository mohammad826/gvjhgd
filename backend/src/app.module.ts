import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { AdModule } from './modules/ad/ad.module';
import { WithdrawalModule } from './modules/withdrawal/withdrawal.module';
import { AdminModule } from './modules/admin/admin.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { TransferModule } from './modules/transfer/transfer.module';
import { NotificationModule } from './modules/notification/notification.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UserModule,
    AdModule,
    WithdrawalModule,
    AdminModule,
    TasksModule,
    TransferModule,
    NotificationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
