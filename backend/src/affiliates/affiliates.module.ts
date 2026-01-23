import { Module } from '@nestjs/common';
import { AffiliatesService } from './affiliates.service';
import { AffiliatesController } from './affiliates.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [PrismaModule, EmailModule],
  controllers: [AffiliatesController],
  providers: [AffiliatesService],
  exports: [AffiliatesService],
})
export class AffiliatesModule {}
