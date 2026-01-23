import { Injectable, CanActivate, ExecutionContext, BadRequestException } from '@nestjs/common';
import { RecaptchaService } from './recaptcha.service';

@Injectable()
export class RecaptchaGuard implements CanActivate {
  constructor(private recaptchaService: RecaptchaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.body?.recaptchaToken || request.headers['x-recaptcha-token'];

    if (!token) {
      throw new BadRequestException('reCAPTCHA token is required');
    }

    const remoteip = request.ip || request.headers['x-forwarded-for'] || request.connection.remoteAddress;
    const isValid = await this.recaptchaService.verifyToken(token, remoteip);

    if (!isValid) {
      throw new BadRequestException('reCAPTCHA verification failed');
    }

    // Attach token to request for potential use
    request.recaptchaToken = token;
    return true;
  }
}
