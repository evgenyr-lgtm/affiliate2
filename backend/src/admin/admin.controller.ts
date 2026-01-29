import { Controller, Get, Put, Post, Body, Param, Query, UseGuards, Request, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { UpdateCommissionDto } from './dto/update-commission.dto';
import { UpdateAffiliateAdminDto } from './dto/update-affiliate-admin.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, AffiliateStatus } from '@prisma/client';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.MARKETING_ADMIN, UserRole.SALES_ADMIN, UserRole.SYSTEM_ADMIN)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('affiliates')
  @ApiOperation({ summary: 'Get all affiliates with filters' })
  async getAllAffiliates(
    @Query('status') status?: AffiliateStatus,
    @Query('search') search?: string,
  ) {
    return this.adminService.getAllAffiliates({ status, search });
  }

  @Put('affiliates/:id/status')
  @ApiOperation({ summary: 'Update affiliate status' })
  async updateAffiliateStatus(
    @Param('id') id: string,
    @Body('status') status: AffiliateStatus,
    @Request() req,
  ) {
    return this.adminService.updateAffiliateStatus(id, status, req.user.email);
  }

  @Put('affiliates/:id/commission')
  @ApiOperation({ summary: 'Update affiliate commission' })
  async updateCommission(
    @Param('id') id: string,
    @Body() dto: UpdateCommissionDto,
  ) {
    return this.adminService.updateCommission(id, dto);
  }

  @Put('affiliates/:id')
  @ApiOperation({ summary: 'Update affiliate details' })
  async updateAffiliate(
    @Param('id') id: string,
    @Body() dto: UpdateAffiliateAdminDto,
  ) {
    return this.adminService.updateAffiliate(id, dto);
  }

  @Post('affiliates/:id/reset-password')
  @ApiOperation({ summary: 'Send password reset for affiliate user' })
  async resetAffiliatePassword(@Param('id') id: string, @Body('newPassword') newPassword: string) {
    return this.adminService.resetAffiliatePassword(id, newPassword);
  }

  @Post('affiliates/:id/block')
  @ApiOperation({ summary: 'Block or unblock affiliate user' })
  async blockAffiliate(@Param('id') id: string, @Body('blocked') blocked: boolean) {
    return this.adminService.setAffiliateBlocked(id, blocked);
  }

  @Delete('affiliates/:id')
  @ApiOperation({ summary: 'Delete affiliate user' })
  async deleteAffiliate(@Param('id') id: string) {
    return this.adminService.deleteAffiliate(id);
  }
}
