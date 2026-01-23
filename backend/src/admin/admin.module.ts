import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AffiliatesModule } from '../affiliates/affiliates.module';
import { ReferralsModule } from '../referrals/referrals.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [PrismaModule, AffiliatesModule, ReferralsModule, EmailModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
