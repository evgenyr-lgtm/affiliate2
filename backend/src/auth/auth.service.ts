import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UserRole, AffiliateStatus } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
  ) {}

  async register(registerDto: RegisterDto) {
    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Generate affiliate slug
    const slug = await this.generateAffiliateSlug(registerDto);

    // Create user and affiliate
    const verificationToken = uuidv4();
    const verificationExpires = new Date();
    verificationExpires.setHours(verificationExpires.getHours() + 24);

    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        password: hashedPassword,
        role: UserRole.AFFILIATE,
        emailVerified: false,
        emailVerifyToken: verificationToken,
        emailVerifyExpires: verificationExpires,
        affiliate: {
          create: {
            slug,
            accountType: registerDto.accountType,
            firstName: registerDto.firstName,
            lastName: registerDto.lastName,
            companyName: registerDto.companyName,
            jobTitle: registerDto.jobTitle,
            phone: registerDto.phone || undefined,
            status: AffiliateStatus.pending,
          },
        },
      },
      include: { affiliate: true },
    });

    // Send internal notification
    await this.emailService.sendNewAffiliateRegistration(user.affiliate!);
    // Send verification email
    await this.emailService.sendVerificationEmail(user.email, verificationToken);

    // TODO: Create Zoho Desk ticket
    // const zohoService = new ZohoService(this.configService);
    // await zohoService.createAffiliateTicket(user.affiliate!);

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      message: 'Registration successful',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        affiliate: {
          id: user.affiliate?.id,
          slug: user.affiliate?.slug,
          status: user.affiliate?.status,
        },
      },
    };
  }

  async verifyEmail(token: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        emailVerifyToken: token,
        emailVerifyExpires: { gt: new Date() },
      },
      include: { affiliate: true },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerifyToken: null,
        emailVerifyExpires: null,
      },
    });

    if (updated?.email) {
      const name =
        user.affiliate?.firstName || user.affiliate?.lastName
          ? `${user.affiliate?.firstName || ''} ${user.affiliate?.lastName || ''}`.trim()
          : updated.email;
      await this.emailService.sendApplicationPending(updated.email, name);
    }

    return { message: 'Email verified successfully' };
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.isBlocked) {
      throw new UnauthorizedException('Your account has been blocked');
    }

    if (!user.emailVerified) {
      throw new UnauthorizedException('Please verify your email before logging in');
    }

    // Check affiliate status if user is affiliate
    if (user.role === UserRole.AFFILIATE && user.affiliate) {
      if (user.affiliate.status === AffiliateStatus.rejected) {
        throw new UnauthorizedException('Your application has been rejected');
      }
      if (user.affiliate.status === AffiliateStatus.pending) {
        throw new UnauthorizedException(
          'Your application has been received and is pending review. You will receive access once approved.'
        );
      }
      if (user.affiliate.status === AffiliateStatus.disabled) {
        throw new UnauthorizedException('Your account has been disabled');
      }
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        affiliate: user.affiliate ? {
          id: user.affiliate.id,
          slug: user.affiliate.slug,
          status: user.affiliate.status,
        } : null,
      },
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.usersService.findById(payload.sub);
      
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const tokens = await this.generateTokens(user.id, user.email, user.role);

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async requestPasswordReset(email: string) {
    const user = await this.usersService.findByEmail(email);
    
    if (!user) {
      // Don't reveal if email exists
      return { message: 'If the email exists, a password reset link has been sent' };
    }

    const resetToken = uuidv4();
    const resetExpires = new Date();
    resetExpires.setHours(resetExpires.getHours() + 1);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetExpires,
      },
    });

    await this.emailService.sendPasswordResetEmail(user.email, resetToken);

    return { message: 'If the email exists, a password reset link has been sent' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        resetPasswordToken: resetPasswordDto.token,
        resetPasswordExpires: { gt: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(resetPasswordDto.password, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    return { message: 'Password reset successfully' };
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const user = await this.usersService.findById(userId);
    
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isOldPasswordValid = await bcrypt.compare(changePasswordDto.oldPassword, user.password);
    
    if (!isOldPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return { message: 'Password changed successfully' };
  }

  private async generateTokens(userId: string, email: string, role: UserRole) {
    const payload = { sub: userId, email, role };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d',
    });

    return { accessToken, refreshToken };
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    
    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return null;
    }

    return {
      userId: user.id,
      email: user.email,
      role: user.role,
    };
  }

  private async generateAffiliateSlug(registerDto: RegisterDto): Promise<string> {
    const baseSlug = `${registerDto.firstName.toLowerCase()}${registerDto.lastName.toLowerCase()}`.replace(/[^a-z0-9]/g, '');
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
