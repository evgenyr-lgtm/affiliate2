import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { UpdateAffiliateDto } from './dto/update-affiliate.dto';
import { AffiliateStatus } from '@prisma/client';

@Injectable()
export class AffiliatesService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async getDashboard(userId: string) {
    const affiliate = await this.prisma.affiliate.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            email: true,
          },
        },
        referrals: {
          orderBy: { entryDate: 'desc' },
          select: {
            id: true,
            accountType: true,
            status: true,
            paymentStatus: true,
            entryDate: true,
            paymentDate: true,
            firstName: true,
            lastName: true,
            companyName: true,
            email: true,
            phone: true,
            contactFirstName: true,
            contactLastName: true,
            contactEmail: true,
            contactPhone: true,
            internalNotes: true,
          },
        },
      },
    });

    if (!affiliate) {
      throw new NotFoundException('Affiliate not found');
    }

    return {
      affiliate: {
        id: affiliate.id,
        affiliateNumber: affiliate.affiliateNumber,
        slug: affiliate.slug,
        status: affiliate.status,
        firstName: affiliate.firstName,
        lastName: affiliate.lastName,
        companyName: affiliate.companyName,
        jobTitle: affiliate.jobTitle,
        rateType: affiliate.rateType,
        rateValue: affiliate.rateValue,
        paymentTerm: affiliate.paymentTerm,
        currency: affiliate.currency,
        notifySystem: affiliate.notifySystem,
        notifyMarketing: affiliate.notifyMarketing,
        avatar: affiliate.avatar,
        email: affiliate.user?.email,
      },
      referrals: affiliate.referrals,
      stats: {
        total: affiliate.referrals.length,
        pending: affiliate.referrals.filter((r) => r.status === 'pending').length,
        approved: affiliate.referrals.filter((r) => r.status === 'approved').length,
        paid: affiliate.referrals.filter((r) => r.paymentStatus === 'paid').length,
      },
    };
  }

  async getAffiliateLink(userId: string) {
    const affiliate = await this.prisma.affiliate.findUnique({
      where: { userId },
    });

    if (!affiliate) {
      throw new NotFoundException('Affiliate not found');
    }

    const baseUrl = await this.getBaseUrl();
    return {
      link: `${baseUrl}?afl=${affiliate.slug}`,
      slug: affiliate.slug,
    };
  }

  async updateProfile(userId: string, updateDto: UpdateAffiliateDto) {
    const affiliate = await this.prisma.affiliate.findUnique({
      where: { userId },
    });

    if (!affiliate) {
      throw new NotFoundException('Affiliate not found');
    }

    return this.prisma.affiliate.update({
      where: { userId },
      data: updateDto,
    });
  }

  async updateStatus(affiliateId: string, status: AffiliateStatus, userEmail: string) {
    const affiliate = await this.prisma.affiliate.findUnique({
      where: { id: affiliateId },
      include: { user: true },
    });

    if (!affiliate) {
      throw new NotFoundException('Affiliate not found');
    }

    const updated = await this.prisma.affiliate.update({
      where: { id: affiliateId },
      data: { status },
    });

    // Send notification emails
    if (status === AffiliateStatus.active && affiliate.status === AffiliateStatus.pending) {
      await this.emailService.sendApplicationAccepted(
        affiliate.user.email,
        `${affiliate.firstName} ${affiliate.lastName}`,
      );
    } else if (status === AffiliateStatus.rejected && affiliate.status === AffiliateStatus.pending) {
      await this.emailService.sendApplicationRejected(
        affiliate.user.email,
        `${affiliate.firstName} ${affiliate.lastName}`,
      );
    }

    return updated;
  }

  async deleteAccount(userId: string) {
    const affiliate = await this.prisma.affiliate.findUnique({
      where: { userId },
    });

    if (!affiliate) {
      throw new NotFoundException('Affiliate not found');
    }

    const now = new Date();

    await this.prisma.affiliate.update({
      where: { userId },
      data: { deletedAt: now },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { deletedAt: now, isBlocked: true },
    });

    return { message: 'Account deleted' };
  }

  private async getBaseUrl(): Promise<string> {
    const setting = await this.prisma.setting.findUnique({
      where: { key: 'default_affiliate_url' },
    });

    return setting?.value || 'https://accessfinancial.com/referral_form';
  }
}
