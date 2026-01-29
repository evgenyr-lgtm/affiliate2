import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReferralsService } from './referrals.service';
import { CreateManualReferralDto } from './dto/create-manual-referral.dto';
import { UpdateReferralDto } from './dto/update-referral.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, ReferralStatus, PaymentStatus } from '@prisma/client';

@ApiTags('Referrals')
@Controller('referrals')
export class ReferralsController {
  constructor(private readonly referralsService: ReferralsService) {}

  @Post('manual')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create manual referral entry (authenticated affiliate)' })
  async createManualReferral(@Request() req, @Body() dto: CreateManualReferralDto) {
    const affiliateSlug = req.user.affiliate?.slug;
    if (!affiliateSlug) {
      throw new Error('User is not an affiliate');
    }
    return this.referralsService.createManualReferral(dto, affiliateSlug);
  }

  @Post('from-link')
  @ApiOperation({ summary: 'Create referral from affiliate link (public)' })
  async createReferralFromLink(
    @Body() dto: CreateManualReferralDto,
    @Query('afl') affiliateSlug: string,
    @Req() req,
  ) {
    const cookieSlug = req.cookies?.affiliate_slug;
    return this.referralsService.createReferralFromLink(dto, affiliateSlug, cookieSlug);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.AFFILIATE,
    UserRole.MARKETING_ADMIN,
    UserRole.SALES_ADMIN,
    UserRole.SYSTEM_ADMIN,
  )
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get referrals (filtered by role)' })
  async getReferrals(
    @Request() req,
    @Query('status') status?: ReferralStatus,
    @Query('paymentStatus') paymentStatus?: PaymentStatus,
  ) {
    const affiliateId = req.user.role === UserRole.AFFILIATE ? req.user.affiliate?.id : undefined;
    return this.referralsService.getReferrals(affiliateId, { status, paymentStatus });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get referral by ID' })
  async getReferralById(@Param('id') id: string) {
    return this.referralsService.getReferralById(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MARKETING_ADMIN, UserRole.SALES_ADMIN, UserRole.SYSTEM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update referral (admin only)' })
  async updateReferral(
    @Param('id') id: string,
    @Body() dto: UpdateReferralDto,
    @Request() req,
  ) {
    return this.referralsService.updateReferral(id, dto, req.user.userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MARKETING_ADMIN, UserRole.SALES_ADMIN, UserRole.SYSTEM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete referral (soft delete)' })
  async deleteReferral(@Param('id') id: string) {
    return this.referralsService.deleteReferral(id);
  }
}
