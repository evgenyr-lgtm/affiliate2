import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
    await this.ensureSchema();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  private async ensureSchema() {
    try {
      await this.$executeRawUnsafe(
        'ALTER TABLE "Affiliate" ADD COLUMN IF NOT EXISTS "totalEarnings" DOUBLE PRECISION NOT NULL DEFAULT 0;'
      );
    } catch (error) {
      // Keep startup resilient if DB is unavailable.
      console.error('Failed to ensure schema:', error);
    }
  }
}
