import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AffiliatesService } from '../affiliates/affiliates.service';
import { CreateAffiliateDto } from './dto/create-affiliate.dto';
import { UpdateCommissionDto } from './dto/update-commission.dto';
import { UpdateAffiliateAdminDto } from './dto/update-affiliate-admin.dto';
import { UpdateAdminProfileDto } from './dto/update-admin-profile.dto';
import { AffiliateStatus, UserRole, PaymentTerm, RateType } from '@prisma/client';
import * as bcrypt from 'bcrypt';
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

  async resendAffiliateVerification(affiliateId: string) {
    const affiliate = await this.prisma.affiliate.findUnique({
      where: { id: affiliateId },
      include: { user: true },
    });

    if (!affiliate) {
      throw new NotFoundException('Affiliate not found');
    }

    if (affiliate.user.emailVerified) {
      throw new BadRequestException('Affiliate email is already verified');
    }

    const token = uuidv4();
    const expires = new Date();
    expires.setHours(expires.getHours() + 24);

    await this.prisma.user.update({
      where: { id: affiliate.userId },
      data: {
        emailVerifyToken: token,
        emailVerifyExpires: expires,
        emailVerified: false,
      },
    });

    await this.emailService.sendVerificationEmail(affiliate.user.email, token, {
      firstName: affiliate.firstName,
      lastName: affiliate.lastName,
    });

    return { message: 'Verification email sent' };
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

    const now = new Date();

    await this.prisma.referral.updateMany({
      where: { affiliateId: affiliate.id },
      data: { deletedAt: now },
    });

    await this.prisma.user.delete({
      where: { id: affiliate.userId },
    });

    return { message: 'Affiliate deleted permanently' };
  }

  async createAffiliateManually(dto: CreateAffiliateDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }

    if (!dto.password || dto.password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const slug = await this.generateAffiliateSlug(dto.firstName, dto.lastName);

    const status = AffiliateStatus.active;
    const paymentTerm = dto.paymentTerm ?? PaymentTerm.monthly;
    const rateType = dto.rateType ?? RateType.percent;
    const rateValue = dto.rateValue ?? 0;
    const currency = dto.currency ?? 'USD';

    return this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        role: UserRole.AFFILIATE,
        emailVerified: true,
        affiliate: {
          create: {
            slug,
            accountType: dto.accountType,
            firstName: dto.firstName,
            lastName: dto.lastName,
            companyName: dto.companyName,
            jobTitle: dto.jobTitle,
            phone: dto.phone,
            internalNotes: dto.internalNotes,
            status,
            paymentTerm,
            rateType,
            rateValue,
            currency,
          },
        },
      },
      include: { affiliate: true },
    });
  }

  private async generateAffiliateSlug(firstName: string, lastName: string): Promise<string> {
    const baseSlug = `${firstName.toLowerCase()}${lastName.toLowerCase()}`.replace(/[^a-z0-9]/g, '');
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await this.prisma.affiliate.findUnique({
        where: { slug },
      });

      if (!existing) {
        return slug;
      }

      slug = `${baseSlug}${counter}`;
      counter++;
    }
  }
}
