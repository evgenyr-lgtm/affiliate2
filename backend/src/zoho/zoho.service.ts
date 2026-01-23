import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ZohoService {
  private readonly apiUrl: string;
  private readonly orgId: string;
  private readonly apiKey: string;

  constructor(private configService: ConfigService) {
    this.apiUrl = this.configService.get<string>('ZOHO_DESK_API_URL') || '';
    this.orgId = this.configService.get<string>('ZOHO_DESK_ORG_ID') || '';
    this.apiKey = this.configService.get<string>('ZOHO_DESK_API_KEY') || '';
  }

  async createAffiliateTicket(affiliate: any): Promise<string | null> {
    if (!this.apiUrl || !this.orgId || !this.apiKey) {
      console.warn('Zoho Desk credentials not configured');
      return null;
    }

    try {
      const response = await fetch(`${this.apiUrl}/tickets`, {
        method: 'POST',
        headers: {
          'Authorization': `Zoho-oauthtoken ${this.apiKey}`,
          'orgId': this.orgId,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: `New Affiliate Registration: ${affiliate.firstName} ${affiliate.lastName}`,
          description: `
            New affiliate partner registration:
            - Name: ${affiliate.firstName} ${affiliate.lastName}
            - Email: ${affiliate.user?.email || 'N/A'}
            - Company: ${affiliate.companyName || 'N/A'}
            - Phone: ${affiliate.phone}
            - Account Type: ${affiliate.accountType}
            - Affiliate ID: ${affiliate.id}
            - Slug: ${affiliate.slug}
          `,
          status: 'Open',
          priority: 'Medium',
        }),
      });

      const data = await response.json();
      return data.id || null;
    } catch (error) {
      console.error('Zoho Desk ticket creation error:', error);
      return null;
    }
  }

  async createReferralTicket(referral: any): Promise<string | null> {
    if (!this.apiUrl || !this.orgId || !this.apiKey) {
      console.warn('Zoho Desk credentials not configured');
      return null;
    }

    try {
      const response = await fetch(`${this.apiUrl}/tickets`, {
        method: 'POST',
        headers: {
          'Authorization': `Zoho-oauthtoken ${this.apiKey}`,
          'orgId': this.orgId,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: `New Referral: ${referral.firstName || referral.companyName || 'Unknown'}`,
          description: `
            New referral submission:
            - Account Type: ${referral.accountType}
            - Name: ${referral.firstName} ${referral.lastName || ''}
            - Company: ${referral.companyName || 'N/A'}
            - Email: ${referral.email || referral.contactEmail || 'N/A'}
            - Phone: ${referral.phone || referral.contactPhone || 'N/A'}
            - Referral ID: ${referral.id}
            - Affiliate ID: ${referral.affiliateId}
          `,
          status: 'Open',
          priority: 'Medium',
        }),
      });

      const data = await response.json();
      return data.id || null;
    } catch (error) {
      console.error('Zoho Desk ticket creation error:', error);
      return null;
    }
  }
}
