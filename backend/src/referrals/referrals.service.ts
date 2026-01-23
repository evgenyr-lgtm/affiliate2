import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { CreateManualReferralDto } from './dto/create-manual-referral.dto';
import { UpdateReferralDto } from './dto/update-referral.dto';
import { ReferralStatus, PaymentStatus, AccountType } from '@prisma/client';

@Injectable()
export class ReferralsService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async createManualReferral(dto: CreateManualReferralDto, affiliateSlug: string) {
    const affiliate = await this.prisma.affiliate.findUnique({
      where: { slug: affiliateSlug },
    });

    if (!affiliate) {
      throw new NotFoundException('Affiliate not found');
    }

    if (affiliate.status !== 'active') {
      throw new BadRequestException('Affiliate account is not active');
    }

    const referral = await this.prisma.referral.create({
      data: {
        affiliateId: affiliate.id,
        accountType: dto.accountType,
        // Individual fields
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phone: dto.phone,
        contractDuration: dto.contractDuration,
        workCountry: dto.workCountry,
        nationality: dto.nationality,
        maritalStatus: dto.maritalStatus,
        // Company fields
        companyName: dto.companyName,
        country: dto.country,
        contactFirstName: dto.contactFirstName,
        contactLastName: dto.contactLastName,
        contactEmail: dto.contactEmail,
        contactPhone: dto.contactPhone,
        jobTitle: dto.jobTitle,
        linkedin: dto.linkedin,
        // Common
        notes: dto.notes,
        status: ReferralStatus.pending,
        paymentStatus: PaymentStatus.unpaid,
      },
    });

    // Send internal notification
    await this.emailService.sendNewReferralNotification(referral);

    // TODO: Create Zoho Desk ticket
    // This would be injected via ZohoModule if needed
    return referral;
  }

  async createReferralFromLink(dto: CreateManualReferralDto, affiliateSlug?: string, cookieSlug?: string) {
    // Use affiliateSlug from query param, fallback to cookie
    const slug = affiliateSlug || cookieSlug;
    
    if (!slug) {
      throw new BadRequestException('Affiliate slug is required');
    }

    return this.createManualReferral(dto, slug);
  }

  async updateReferral(id: string, dto: UpdateReferralDto, userId: string) {
    const referral = await this.prisma.referral.findUnique({
      where: { id },
      include: { affiliate: { include: { user: true } } },
    });

    if (!referral) {
      throw new NotFoundException('Referral not found');
    }

    const updated = await this.prisma.referral.update({
      where: { id },
      data: {
        ...dto,
        paymentDate: dto.paymentStatus === PaymentStatus.paid && !referral.paymentDate 
          ? new Date() 
          : referral.paymentDate,
      },
    });

    // If payment status changed to paid, notify affiliate
    if (dto.paymentStatus === PaymentStatus.paid && referral.paymentStatus === PaymentStatus.unpaid) {
      const amount = this.calculateCommission(referral.affiliate);
      await this.emailService.sendPaymentDone(
        referral.affiliate.user.email,
        `${referral.affiliate.firstName} ${referral.affiliate.lastName}`,
        amount,
      );
    }

    return updated;
  }

  async getReferrals(affiliateId?: string, filters?: {
    status?: ReferralStatus;
    paymentStatus?: PaymentStatus;
  }) {
    const where: any = {};

    if (affiliateId) {
      where.affiliateId = affiliateId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.paymentStatus) {
      where.paymentStatus = filters.paymentStatus;
    }

    return this.prisma.referral.findMany({
      where,
      include: {
        affiliate: {
          select: {
            id: true,
            slug: true,
            firstName: true,
            lastName: true,
            companyName: true,
          },
        },
      },
      orderBy: { entryDate: 'desc' },
    });
  }

  async getReferralById(id: string) {
    return this.prisma.referral.findUnique({
      where: { id },
      include: {
        affiliate: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  async deleteReferral(id: string) {
    return this.prisma.referral.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  private calculateCommission(affiliate: any): number {
    // This is a placeholder - actual calculation would depend on business logic
    // For now, return a fixed amount or percentage-based calculation
    if (affiliate.rateType === 'fixed') {
      return affiliate.rateValue;
    }
    // For percentage, you'd need the deal value - placeholder for now
    return 0;
  }
}
