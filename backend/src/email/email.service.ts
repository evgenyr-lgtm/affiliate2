import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EmailService {
  private transporter?: nodemailer.Transporter;
  private isEnabled = false;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT');
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    if (host && port) {
      this.isEnabled = true;
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: user && pass ? { user, pass } : undefined,
      });
    }
  }

  async sendVerificationEmail(email: string, token: string) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const verificationUrl = `${frontendUrl}/verify-email?token=${token}`;

    const template = await this.getEmailTemplate('Application Pending');
    if (!template || !template.enabled) {
      // Fallback if template not configured
      return this.sendEmail({
        to: email,
        subject: 'Verify your email address',
        html: `
          <h2>Welcome to Access Financial Affiliate Portal</h2>
          <p>Please verify your email address by clicking the link below:</p>
          <a href="${verificationUrl}">Verify Email</a>
          <p>This link will expire in 24 hours.</p>
        `,
      });
    }

    const body = this.replaceVariables(template.body, {
      verification_url: verificationUrl,
    });

    return this.sendEmail({
      to: email,
      subject: template.subject,
      html: body,
    });
  }

  async sendPasswordResetEmail(email: string, token: string) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    return this.sendEmail({
      to: email,
      subject: 'Password Reset Request',
      html: `
        <h2>Password Reset Request</h2>
        <p>You requested to reset your password. Click the link below to reset it:</p>
        <a href="${resetUrl}">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    });
  }

  async sendNewAffiliateRegistration(affiliate: any) {
    const template = await this.getEmailTemplate('New Affiliate Registration');
    if (!template || !template.enabled) {
      return;
    }

    const managerEmails = await this.getManagerEmails();
    if (managerEmails.length === 0) {
      return;
    }

    const body = this.replaceVariables(template.body, {
      name: `${affiliate.firstName} ${affiliate.lastName}`,
      user_email: affiliate.user?.email || 'N/A',
      affiliate_id: affiliate.id,
      account_type: affiliate.accountType,
      company_name: affiliate.companyName || 'N/A',
    });

    return this.sendEmail({
      to: managerEmails,
      subject: template.subject,
      html: body,
    });
  }

  async sendApplicationAccepted(email: string, name: string) {
    const template = await this.getEmailTemplate('Application Accepted');
    if (!template || !template.enabled) {
      return;
    }

    const body = this.replaceVariables(template.body, {
      name,
    });

    return this.sendEmail({
      to: email,
      subject: template.subject,
      html: body,
    });
  }

  async sendApplicationRejected(email: string, name: string) {
    const template = await this.getEmailTemplate('Application Rejected');
    if (!template || !template.enabled) {
      return;
    }

    const body = this.replaceVariables(template.body, {
      name,
    });

    return this.sendEmail({
      to: email,
      subject: template.subject,
      html: body,
    });
  }

  async sendPaymentDone(email: string, name: string, amount: number) {
    const template = await this.getEmailTemplate('Payment Done');
    if (!template || !template.enabled) {
      return;
    }

    const body = this.replaceVariables(template.body, {
      name,
      amount: amount.toString(),
    });

    return this.sendEmail({
      to: email,
      subject: template.subject,
      html: body,
    });
  }

  async sendNewReferralNotification(referral: any) {
    const template = await this.getEmailTemplate('New Referral');
    if (!template || !template.enabled) {
      return;
    }

    const managerEmails = await this.getManagerEmails();
    if (managerEmails.length === 0) {
      return;
    }

    const body = this.replaceVariables(template.body, {
      referral_url: `/admin/referrals/${referral.id}`,
      affiliate_id: referral.affiliateId,
    });

    return this.sendEmail({
      to: managerEmails,
      subject: template.subject,
      html: body,
    });
  }

  private async sendEmail(options: {
    to: string | string[];
    subject: string;
    html: string;
  }) {
    if (!this.isEnabled || !this.transporter) {
      return;
    }

    try {
      const from = this.configService.get<string>('SMTP_FROM') || 'noreply@accessfinancial.com';
      
      await this.transporter.sendMail({
        from,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        html: options.html,
      });
    } catch (error) {
      console.error('Email sending error:', error);
      // Don't block user flows when SMTP is unavailable.
      return;
    }
  }

  private async getEmailTemplate(name: string) {
    return this.prisma.emailTemplate.findUnique({
      where: { name },
    });
  }

  private async getManagerEmails(): Promise<string[]> {
    const setting = await this.prisma.setting.findUnique({
      where: { key: 'manager_notification_emails' },
    });

    if (!setting) {
      return [];
    }

    try {
      return JSON.parse(setting.value);
    } catch {
      return [];
    }
  }

  private replaceVariables(text: string, variables: Record<string, string>): string {
    let result = text;
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
      result = result.replace(new RegExp(`\\{${key.replace('_', '')}\\}`, 'g'), value);
    }
    return result;
  }
}
