import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSettingDto } from './dto/update-setting.dto';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getSetting(key: string) {
    return this.prisma.setting.findUnique({
      where: { key },
    });
  }

  async getAllSettings() {
    return this.prisma.setting.findMany({
      orderBy: { key: 'asc' },
    });
  }

  async updateSetting(key: string, dto: UpdateSettingDto, userId: string) {
    return this.prisma.setting.upsert({
      where: { key },
      update: {
        value: dto.value,
        description: dto.description,
        updatedBy: userId,
      },
      create: {
        key,
        value: dto.value,
        description: dto.description,
        updatedBy: userId,
      },
    });
  }

  async getDefaultAffiliateUrl(): Promise<string> {
    const setting = await this.getSetting('default_affiliate_url');
    return setting?.value || 'https://accessfinancial.com/referral_form';
  }

  async isMaintenanceMode(): Promise<boolean> {
    const setting = await this.getSetting('maintenance_mode');
    return setting?.value === 'true';
  }

  async requiresApproval(): Promise<boolean> {
    const setting = await this.getSetting('require_approval');
    return setting?.value !== 'false'; // Default to true
  }
}
