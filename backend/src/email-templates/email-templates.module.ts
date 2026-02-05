import { Module } from '@nestjs/common';
import { EmailTemplatesService } from './email-templates.service';
import { EmailTemplatesController } from './email-templates.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [PrismaModule, EmailModule],
  controllers: [EmailTemplatesController],
  providers: [EmailTemplatesService],
})
export class EmailTemplatesModule {}
