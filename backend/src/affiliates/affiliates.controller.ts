import { Controller, Get, Put, Body, UseGuards, Request, UseInterceptors, UploadedFile, Delete } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { AffiliatesService } from './affiliates.service';
import { UpdateAffiliateDto } from './dto/update-affiliate.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Storage } from '@google-cloud/storage';

const getBucketName = () => {
  if (process.env.GCS_BUCKET) return process.env.GCS_BUCKET;
  if (process.env.FIREBASE_STORAGE_BUCKET) return process.env.FIREBASE_STORAGE_BUCKET;
  if (process.env.GOOGLE_CLOUD_PROJECT) return `${process.env.GOOGLE_CLOUD_PROJECT}.appspot.com`;
  return undefined;
};

@ApiTags('Affiliates')
@Controller('affiliate')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AffiliatesController {
  constructor(private readonly affiliatesService: AffiliatesService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get affiliate dashboard data' })
  async getDashboard(@Request() req) {
    return this.affiliatesService.getDashboard(req.user.userId);
  }

  @Get('link')
  @ApiOperation({ summary: 'Get affiliate referral link' })
  async getAffiliateLink(@Request() req) {
    return this.affiliatesService.getAffiliateLink(req.user.userId);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update affiliate profile' })
  async updateProfile(@Request() req, @Body() updateDto: UpdateAffiliateDto) {
    return this.affiliatesService.updateProfile(req.user.userId, updateDto);
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
        fileSize: 5 * 1024 * 1024, // 5MB
      },
      fileFilter: (req, file, cb) => {
        if (file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          cb(null, true);
        } else {
          cb(new Error('Only image files are allowed'), false);
        }
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload affiliate avatar' })
  async uploadAvatar(@Request() req, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new Error('Avatar file is required');
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
    const avatarUrl = `/api/avatars/${file.filename}`;
    return this.affiliatesService.updateProfile(req.user.userId, { avatar: avatarUrl });
  }

  @Delete('account')
  @ApiOperation({ summary: 'Delete affiliate account' })
  async deleteAccount(@Request() req) {
    return this.affiliatesService.deleteAccount(req.user.userId);
  }
}
