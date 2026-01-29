import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AffiliatesService } from '../affiliates/affiliates.service';
import { CreateAffiliateDto } from './dto/create-affiliate.dto';
import { UpdateCommissionDto } from './dto/update-commission.dto';
import { UpdateAffiliateAdminDto } from './dto/update-affiliate-admin.dto';
import { UpdateAdminProfileDto } from './dto/update-admin-profile.dto';
import { AffiliateStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private affiliatesService: AffiliatesService,
  ) {}

  async getAllAffiliates(filters?: {
    status?: AffiliateStatus;
    search?: string;
  }) {
    const where: any = {
      deletedAt: null,
      user: {
        is: { deletedAt: null },
      },
    };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { companyName: { contains: filters.search, mode: 'insensitive' } },
        { user: { email: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

    return this.prisma.affiliate.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            emailVerified: true,
            isBlocked: true,
            createdAt: true,
            deletedAt: true,
          },
        },
        _count: {
          select: {
            referrals: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateAffiliateStatus(affiliateId: string, status: AffiliateStatus, userEmail: string) {
    return this.affiliatesService.updateStatus(affiliateId, status, userEmail);
  }

  async getAdminProfile(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        role: true,
      },
    });
  }

  async updateAdminProfile(userId: string, dto: UpdateAdminProfileDto) {
    if (dto.email) {
      const existing = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (existing && existing.id !== userId) {
        throw new BadRequestException('Email already in use');
      }
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        role: true,
      },
    });
  }

  async updateAdminAvatar(userId: string, avatarUrl: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { avatar: avatarUrl },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        role: true,
      },
    });
  }

  async updateCommission(affiliateId: string, dto: UpdateCommissionDto) {
    return this.prisma.affiliate.update({
      where: { id: affiliateId },
      data: {
        rateType: dto.rateType,
        rateValue: dto.rateValue,
        paymentTerm: dto.paymentTerm,
      },
    });
  }

  async updateAffiliate(affiliateId: string, dto: UpdateAffiliateAdminDto) {
    const data: any = {
      ...dto,
    };

    if (data.currency) {
      data.currency = data.currency.toUpperCase();
    }

    if (data.status) {
      await this.affiliatesService.updateStatus(affiliateId, data.status, 'admin');
      delete data.status;
    }

    if (Object.keys(data).length === 0) {
      return this.prisma.affiliate.findUnique({ where: { id: affiliateId } });
    }

    return this.prisma.affiliate.update({
      where: { id: affiliateId },
      data,
    });
  }

  async resetAffiliatePassword(affiliateId: string, newPassword: string) {
    const affiliate = await this.prisma.affiliate.findUnique({
      where: { id: affiliateId },
      include: { user: true },
    });

    if (!affiliate) {
      throw new NotFoundException('Affiliate not found');
    }

    if (!newPassword || newPassword.length < 8) {
      throw new BadRequestException('New password must be at least 8 characters');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: affiliate.userId },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    return { message: 'Password updated' };
  }

  async setAffiliateBlocked(affiliateId: string, blocked: boolean) {
    const affiliate = await this.prisma.affiliate.findUnique({
      where: { id: affiliateId },
    });

    if (!affiliate) {
      throw new NotFoundException('Affiliate not found');
    }

    await this.prisma.user.update({
      where: { id: affiliate.userId },
      data: { isBlocked: blocked },
    });

    return { message: blocked ? 'User blocked' : 'User unblocked' };
  }

  async deleteAffiliate(affiliateId: string) {
    const affiliate = await this.prisma.affiliate.findUnique({
      where: { id: affiliateId },
    });

    if (!affiliate) {
      throw new NotFoundException('Affiliate not found');
    }

    await this.prisma.user.delete({
      where: { id: affiliate.userId },
    });

    return { message: 'Affiliate deleted permanently' };
  }

  async createAffiliateManually(dto: CreateAffiliateDto) {
    // This would create both user and affiliate
    // Implementation similar to registration but without email verification requirement
    // For brevity, showing structure
    throw new Error('Manual affiliate creation not yet implemented');
  }
}
