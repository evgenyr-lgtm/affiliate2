import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { affiliate: true },
    });

    if (!user || user.deletedAt) {
      throw new UnauthorizedException('User not found');
    }

    if (user.isBlocked) {
      throw new UnauthorizedException('Your account has been blocked');
    }

    if (!user.emailVerified) {
      throw new UnauthorizedException('Please verify your email before logging in');
    }

    if (user.role === 'AFFILIATE' && user.affiliate) {
      if (user.affiliate.status === 'rejected') {
        throw new UnauthorizedException('Your application has been rejected');
      }
      if (user.affiliate.status === 'pending') {
        throw new UnauthorizedException('Registration is pending review.');
      }
      if (user.affiliate.status === 'disabled') {
        throw new UnauthorizedException('Your account has been disabled');
      }
    }

    return {
      userId: user.id,
      email: user.email,
      role: user.role,
      affiliate: user.affiliate,
    };
  }
}
