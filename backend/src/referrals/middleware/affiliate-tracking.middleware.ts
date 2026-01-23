import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AffiliateTrackingMiddleware implements NestMiddleware {
  constructor(private prisma: PrismaService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const affiliateSlug = req.query.afl as string;

    if (affiliateSlug) {
      // Verify affiliate exists and is active
      const affiliate = await this.prisma.affiliate.findUnique({
        where: { slug: affiliateSlug },
      });

      if (affiliate && affiliate.status === 'active') {
        // Set cookie (30 days)
        res.cookie('affiliate_slug', affiliateSlug, {
          maxAge: 30 * 24 * 60 * 60 * 1000,
          httpOnly: false, // Allow JavaScript access for form submission
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
        });
      }
    }

    next();
  }
}
