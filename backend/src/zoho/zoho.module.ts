import { Module } from '@nestjs/common';
import { ZohoService } from './zoho.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ZohoService],
  exports: [ZohoService],
})
export class ZohoModule {}
