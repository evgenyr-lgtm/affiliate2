import { Controller, Get, Put, Post, Body, Param, Query, UseGuards, Request, Delete, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { CreateAffiliateDto } from './dto/create-affiliate.dto';
import { UpdateCommissionDto } from './dto/update-commission.dto';
import { UpdateAffiliateAdminDto } from './dto/update-affiliate-admin.dto';
import { UpdateAdminProfileDto } from './dto/update-admin-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, AffiliateStatus } from '@prisma/client';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Storage } from '@google-cloud/storage';

const getBucketName = () => {
  if (process.env.GCS_BUCKET) return process.env.GCS_BUCKET;
  if (process.env.FIREBASE_STORAGE_BUCKET) return process.env.FIREBASE_STORAGE_BUCKET;
  if (process.env.GOOGLE_CLOUD_PROJECT) return `${process.env.GOOGLE_CLOUD_PROJECT}.appspot.com`;
  return undefined;
};

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

  @Post('affiliates/:id/resend-verification')
  @ApiOperation({ summary: 'Resend affiliate verification email' })
  async resendAffiliateVerification(@Param('id') id: string) {
    return this.adminService.resendAffiliateVerification(id);
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

  @Post('affiliates')
  @ApiOperation({ summary: 'Create affiliate (admin)' })
  async createAffiliate(@Body() dto: CreateAffiliateDto) {
    return this.adminService.createAffiliateManually(dto);
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

  @Get('profile')
  @ApiOperation({ summary: 'Get admin profile' })
  async getProfile(@Request() req) {
    return this.adminService.getAdminProfile(req.user.userId);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update admin profile' })
  async updateProfile(@Request() req, @Body() dto: UpdateAdminProfileDto) {
    return this.adminService.updateAdminProfile(req.user.userId, dto);
  }

  @Put('avatar')
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: diskStorage({
        destination: './uploads/avatars',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  @ApiOperation({ summary: 'Update admin avatar' })
  async updateAvatar(@Request() req, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new Error('File is required');
    }
    const bucket = getBucketName();
    if (bucket) {
      try {
        const storage = new Storage();
        const objectName = `avatars/${file.filename}`;
        await storage.bucket(bucket).upload(file.path, { destination: objectName });
      } catch {
        // Fall back to local storage if GCS upload fails.
      }
    }
    const fileUrl = `/api/avatars/${file.filename}`;
    return this.adminService.updateAdminAvatar(req.user.userId, fileUrl);
  }
}
