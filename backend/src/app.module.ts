import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AffiliatesModule } from './affiliates/affiliates.module';
import { ReferralsModule } from './referrals/referrals.module';
import { AdminModule } from './admin/admin.module';
import { DocumentsModule } from './documents/documents.module';
import { EmailModule } from './email/email.module';
import { ZohoModule } from './zoho/zoho.module';
import { SettingsModule } from './settings/settings.module';
import { AuditModule } from './audit/audit.module';
import { HealthModule } from './health/health.module';
import { EmailTemplatesModule } from './email-templates/email-templates.module';
import { UploadsModule } from './uploads/uploads.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    AffiliatesModule,
    ReferralsModule,
    AdminModule,
    DocumentsModule,
    EmailModule,
    ZohoModule,
    SettingsModule,
    EmailTemplatesModule,
    UploadsModule,
    AuditModule,
    HealthModule,
  ],
})
export class AppModule {}
