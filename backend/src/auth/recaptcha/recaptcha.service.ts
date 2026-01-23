import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as https from 'https';

@Injectable()
export class RecaptchaService {
  private readonly secretKey: string;

  constructor(private configService: ConfigService) {
    this.secretKey = this.configService.get<string>('RECAPTCHA_SECRET_KEY') || '';
  }

  async verifyToken(token: string, remoteip?: string): Promise<boolean> {
    if (!this.secretKey) {
      // If no secret key configured, skip verification (for development)
      return true;
    }

    try {
      const url = new URL('https://www.google.com/recaptcha/api/siteverify');
      url.searchParams.append('secret', this.secretKey);
      url.searchParams.append('response', token);
      if (remoteip) {
        url.searchParams.append('remoteip', remoteip);
      }

      const response = await fetch(url.toString(), {
        method: 'POST',
      });

      const data = await response.json();
      return data.success && (data.score === undefined || data.score >= 0.5);
    } catch (error) {
      console.error('reCAPTCHA verification error:', error);
      return false;
    }
  }
}
