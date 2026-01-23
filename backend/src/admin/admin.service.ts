import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AffiliatesService } from '../affiliates/affiliates.service';
import { CreateAffiliateDto } from './dto/create-affiliate.dto';
import { UpdateCommissionDto } from './dto/update-commission.dto';
import { AffiliateStatus, RateType, PaymentTerm } from '@prisma/client';

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
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { companyName: { contains: filters.search, mode: 'insensitive' } },
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
            createdAt: true,
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

  async createAffiliateManually(dto: CreateAffiliateDto) {
    // This would create both user and affiliate
    // Implementation similar to registration but without email verification requirement
    // For brevity, showing structure
    throw new Error('Manual affiliate creation not yet implemented');
  }
}
