import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../prisma/prisma.service';
import { EmailTemplate } from '@prisma/client';

@Injectable()
export class EmailService {
  private transporter?: nodemailer.Transporter;
  private transporterKey?: string;
  private smtpSettings?: {
    host: string;
    port: number;
    username?: string;
    password?: string;
    fromEmail: string;
    fromName?: string;
    secure: boolean;
  };

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
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

    const affiliateName = `${affiliate.firstName} ${affiliate.lastName}`.trim();
    const dateOfRegistration = this.formatDate(affiliate.createdAt);
    const body = this.replaceVariables(template.body, {
      name: affiliateName,
      first_name: affiliate.firstName,
      last_name: affiliate.lastName,
      user_email: affiliate.user?.email || 'N/A',
      affiliate_id: affiliate.id,
      account_type: affiliate.accountType,
      company: affiliate.companyName || 'N/A',
      company_name: affiliate.companyName || 'N/A',
      phone: affiliate.phone || 'N/A',
      country: 'N/A',
      affiliate_name: affiliateName,
      affiliate_email: affiliate.user?.email || 'N/A',
      phone_number: affiliate.phone || 'N/A',
      job_title: affiliate.jobTitle || 'N/A',
      total_earnings: `${affiliate.totalEarnings ?? 0}`,
      registration_status: affiliate.status || 'pending',
      date_of_registration: dateOfRegistration || 'N/A',
      affiliate_account_type: affiliate.accountType,
      affiliate_first_name: affiliate.firstName,
      affiliate_last_name: affiliate.lastName,
      affiliate_company_name: affiliate.companyName || 'N/A',
      affiliate_company_country: 'N/A',
      affiliate_job_title: affiliate.jobTitle || 'N/A',
      affiliate_phone_number: affiliate.phone || 'N/A',
      affiliate_total_earnings: `${affiliate.totalEarnings ?? 0}`,
      affiliate_status: affiliate.status || 'pending',
      affiliate_payment_term: affiliate.paymentTerm || 'monthly',
      affiliate_rate_type: affiliate.rateType || 'percent',
      affiliate_rate: `${affiliate.rateValue ?? 0}`,
      affiliate_currency: affiliate.currency || 'USD',
      affiliate_notes: affiliate.internalNotes || 'N/A',
      affiliate_date_of_registration: dateOfRegistration || 'N/A',
      affiliate_marketing_emails_consent: affiliate.notifyMarketing ? 'yes' : 'no',
      affiliate_system_notifications_consent: affiliate.notifySystem ? 'yes' : 'no',
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
      first_name: name.split(' ')[0] || name,
      last_name: name.split(' ').slice(1).join(' ') || '',
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
      first_name: name.split(' ')[0] || name,
      last_name: name.split(' ').slice(1).join(' ') || '',
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
      first_name: name.split(' ')[0] || name,
      last_name: name.split(' ').slice(1).join(' ') || '',
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

    const referralRecord = await this.prisma.referral.findUnique({
      where: { id: referral.id },
      include: { affiliate: { include: { user: true } } },
    });
    const resolvedReferral = referralRecord || referral;

    const referralName =
      resolvedReferral.accountType === 'company'
        ? `${resolvedReferral.contactFirstName || ''} ${resolvedReferral.contactLastName || ''}`.trim()
        : `${resolvedReferral.firstName || ''} ${resolvedReferral.lastName || ''}`.trim();
    const contractParts = this.splitContractDuration(resolvedReferral.contractDuration);
    const dateOfRegistration = this.formatDate(resolvedReferral.entryDate);
    const affiliateName = `${resolvedReferral.affiliate?.firstName || ''} ${resolvedReferral.affiliate?.lastName || ''}`.trim();

    const body = this.replaceVariables(template.body, {
      referral_url: `/admin/referrals/${resolvedReferral.id}`,
      affiliate_id: resolvedReferral.affiliateId,
      first_name: resolvedReferral.firstName || resolvedReferral.contactFirstName || '',
      last_name: resolvedReferral.lastName || resolvedReferral.contactLastName || '',
      user_email: resolvedReferral.email || resolvedReferral.contactEmail || '',
      phone: resolvedReferral.phone || resolvedReferral.contactPhone || '',
      company: resolvedReferral.companyName || '',
      country: resolvedReferral.country || resolvedReferral.workCountry || '',
      name: referralName,
      account_type: resolvedReferral.accountType,
      affiliate_name: affiliateName || 'N/A',
      referral_name: referralName || 'N/A',
      affiliate_email: resolvedReferral.affiliate?.user?.email || 'N/A',
      referral_email: resolvedReferral.email || resolvedReferral.contactEmail || 'N/A',
      work_country: resolvedReferral.workCountry || 'N/A',
      nationality: resolvedReferral.nationality || 'N/A',
      contract_start_date: contractParts.start || 'N/A',
      contract_end_date: contractParts.end || 'N/A',
      marital_status: resolvedReferral.maritalStatus || 'N/A',
      phone_number: resolvedReferral.phone || resolvedReferral.contactPhone || 'N/A',
      company_name: resolvedReferral.companyName || 'N/A',
      job_title: resolvedReferral.jobTitle || 'N/A',
      total_earnings: `${resolvedReferral.affiliate?.totalEarnings ?? 0}`,
      payment_status: resolvedReferral.paymentStatus || 'unpaid',
      registration_status: resolvedReferral.status || 'pending',
      date_of_registration: dateOfRegistration || 'N/A',
      referral_account_type: resolvedReferral.accountType,
      referral_first_name: resolvedReferral.firstName || resolvedReferral.contactFirstName || 'N/A',
      referral_last_name: resolvedReferral.lastName || resolvedReferral.contactLastName || 'N/A',
      referral_company_name: resolvedReferral.companyName || 'N/A',
      referral_company_country: resolvedReferral.country || 'N/A',
      referral_job_title: resolvedReferral.jobTitle || 'N/A',
      referral_phone_number: resolvedReferral.phone || resolvedReferral.contactPhone || 'N/A',
      referral_work_country: resolvedReferral.workCountry || 'N/A',
      referral_nationality: resolvedReferral.nationality || 'N/A',
      referral_contract_start_date: contractParts.start || 'N/A',
      referral_contract_end_date: contractParts.end || 'N/A',
      referral_marital_status: resolvedReferral.maritalStatus || 'N/A',
      referral_additional_information: resolvedReferral.internalNotes || 'N/A',
      referral_notes: resolvedReferral.notes || 'N/A',
    });

    return this.sendEmail({
      to: managerEmails,
      subject: template.subject,
      html: body,
    });
  }

  async sendReferralApproved(email: string, name: string) {
    const template = await this.getEmailTemplate('Referral Approved');
    if (!template || !template.enabled) {
      return;
    }

    const body = this.replaceVariables(template.body, {
      name,
      first_name: name.split(' ')[0] || name,
      last_name: name.split(' ').slice(1).join(' ') || '',
    });

    return this.sendEmail({
      to: email,
      subject: template.subject,
      html: body,
    });
  }

  async sendTestTemplateEmail(template: EmailTemplate, to: string, overrides?: { subject?: string; body?: string }) {
    const settings = await this.ensureTransporter(true);
    const variables = this.buildSampleVariables();
    const subject = this.replaceVariables(overrides?.subject ?? template.subject, variables);
    const body = this.replaceVariables(overrides?.body ?? template.body, variables);

    return this.sendEmail({
      to,
      subject,
      html: body,
      requireTransporter: true,
      from: settings.fromEmail,
      fromName: settings.fromName,
    });
  }

  private async sendEmail(options: {
    to: string | string[];
    subject: string;
    html: string;
    requireTransporter?: boolean;
    from?: string;
    fromName?: string;
  }) {
    const settings = await this.ensureTransporter(options.requireTransporter);
    if (!settings) return;

    try {
      const fromEmail = options.from || settings.fromEmail;
      const fromName = options.fromName || settings.fromName;
      const from = fromName ? `"${fromName}" <${fromEmail}>` : fromEmail;

      await this.transporter.sendMail({
        from,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        html: options.html,
      });
    } catch (error) {
      console.error('Email sending error:', error);
      if (options.requireTransporter) {
        throw new BadRequestException('Failed to send email. Check SMTP settings.');
      }
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

  private buildSampleVariables(): Record<string, string> {
    const today = this.formatDate(new Date()) || '2026-01-23';
    return {
      affiliate_account_type: 'individual',
      affiliate_first_name: 'Alex',
      affiliate_last_name: 'Morgan',
      affiliate_company_name: 'Example Ltd',
      affiliate_company_country: 'United Kingdom',
      affiliate_job_title: 'Account Manager',
      affiliate_email: 'affiliate@example.com',
      affiliate_phone_number: '+44 20 1234 5678',
      affiliate_total_earnings: '1250',
      affiliate_status: 'pending',
      affiliate_payment_term: 'monthly',
      affiliate_rate_type: 'percent',
      affiliate_rate: '5',
      affiliate_currency: 'USD',
      affiliate_notes: 'Notes for affiliate',
      affiliate_date_of_registration: today,
      affiliate_marketing_emails_consent: 'yes',
      affiliate_system_notifications_consent: 'yes',
      referral_account_type: 'individual',
      referral_first_name: 'Jamie',
      referral_last_name: 'Taylor',
      referral_company_name: 'Example Ltd',
      referral_company_country: 'United Kingdom',
      referral_job_title: 'Analyst',
      referral_email: 'referral@example.com',
      referral_phone_number: '+44 20 5555 5555',
      referral_work_country: 'United Kingdom',
      referral_nationality: 'British',
      referral_contract_start_date: today,
      referral_contract_end_date: today,
      referral_marital_status: 'single',
      referral_additional_information: 'Additional info',
      referral_notes: 'Referral notes',
    };
  }

  private splitContractDuration(value?: string) {
    if (!value) {
      return { start: '', end: '' };
    }
    const [start, end] = value.split(' - ');
    return {
      start: (start || '').trim(),
      end: (end || '').trim(),
    };
  }

  private formatDate(value?: Date | string) {
    if (!value) return '';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('en-GB').format(date);
  }

  private async ensureTransporter(requireTransporter?: boolean) {
    const settings = await this.loadSmtpSettings();
    if (!settings) {
      if (requireTransporter) {
        throw new BadRequestException('SMTP settings are not configured.');
      }
      return null;
    }

    const key = JSON.stringify(settings);
    if (!this.transporter || this.transporterKey !== key) {
      this.transporter = nodemailer.createTransport({
        host: settings.host,
        port: settings.port,
        secure: settings.secure,
        auth: settings.username
          ? {
              user: settings.username,
              pass: settings.password || '',
            }
          : undefined,
      });
      this.transporterKey = key;
      this.smtpSettings = settings;
    }

    return settings;
  }

  private async loadSmtpSettings() {
    const keys = [
      'smtp_server',
      'smtp_port',
      'smtp_username',
      'smtp_password',
      'smtp_from_name',
      'smtp_from_email',
      'smtp_use_tls',
    ];
    const settings = await this.prisma.setting.findMany({
      where: { key: { in: keys } },
    });
    const lookup = new Map(settings.map((setting) => [setting.key, setting.value]));
    const host = lookup.get('smtp_server')?.trim();
    const portValue = lookup.get('smtp_port')?.trim();
    const username = lookup.get('smtp_username')?.trim();
    const password = lookup.get('smtp_password')?.trim();
    const fromName = lookup.get('smtp_from_name')?.trim();
    const fromEmail = lookup.get('smtp_from_email')?.trim() || username;
    const useTlsValue = lookup.get('smtp_use_tls');

    if (!host || !portValue || !fromEmail) {
      return null;
    }

    const port = Number(portValue);
    if (!Number.isFinite(port) || port <= 0) {
      return null;
    }

    const useTls = useTlsValue ? useTlsValue !== 'false' : port === 465;
    return {
      host,
      port,
      username: username || undefined,
      password: password || undefined,
      fromEmail,
      fromName: fromName || undefined,
      secure: useTls,
    };
  }
}
