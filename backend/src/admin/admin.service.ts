import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AffiliatesService } from '../affiliates/affiliates.service';
import { CreateAffiliateDto } from './dto/create-affiliate.dto';
import { UpdateCommissionDto } from './dto/update-commission.dto';
import { UpdateAffiliateAdminDto } from './dto/update-affiliate-admin.dto';
import { AffiliateStatus } from '@prisma/client';
import { EmailService } from '../email/email.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private affiliatesService: AffiliatesService,
    private emailService: EmailService,
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

  async resetAffiliatePassword(affiliateId: string) {
    const affiliate = await this.prisma.affiliate.findUnique({
      where: { id: affiliateId },
      include: { user: true },
    });

    if (!affiliate) {
      throw new NotFoundException('Affiliate not found');
    }

    const resetToken = uuidv4();
    const resetExpires = new Date();
    resetExpires.setHours(resetExpires.getHours() + 1);

    await this.prisma.user.update({
      where: { id: affiliate.userId },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetExpires,
      },
    });

    await this.emailService.sendPasswordResetEmail(affiliate.user.email, resetToken);

    return { message: 'Password reset email sent' };
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

    const now = new Date();

    await this.prisma.affiliate.update({
      where: { id: affiliateId },
      data: { deletedAt: now },
    });

    await this.prisma.user.update({
      where: { id: affiliate.userId },
      data: { deletedAt: now, isBlocked: true },
    });

    return { message: 'Affiliate deleted' };
  }

  async createAffiliateManually(dto: CreateAffiliateDto) {
    // This would create both user and affiliate
    // Implementation similar to registration but without email verification requirement
    // For brevity, showing structure
    throw new Error('Manual affiliate creation not yet implemented');
  }
}
