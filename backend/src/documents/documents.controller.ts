import { Controller, Get, Post, Delete, Put, Body, Param, Query, UseGuards, UseInterceptors, UploadedFile, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, DocumentType } from '@prisma/client';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Storage } from '@google-cloud/storage';
import { Response } from 'express';
import { createReadStream, existsSync } from 'fs';
import { join } from 'path';

const getBucketName = () => {
  if (process.env.GCS_BUCKET) return process.env.GCS_BUCKET;
  if (process.env.FIREBASE_STORAGE_BUCKET) return process.env.FIREBASE_STORAGE_BUCKET;
  if (process.env.GOOGLE_CLOUD_PROJECT) return `${process.env.GOOGLE_CLOUD_PROJECT}.appspot.com`;
  return undefined;
};

const buildPublicUrl = (bucket: string, objectName: string) =>
  `https://storage.googleapis.com/${bucket}/${objectName}`;

const parseGcsUrl = (url: string) => {
  if (!url.startsWith('gcs://')) return null;
  const trimmed = url.replace('gcs://', '');
  const [bucket, ...rest] = trimmed.split('/');
  const objectName = rest.join('/');
  if (!bucket || !objectName) return null;
  return { bucket, objectName };
};

@ApiTags('Documents')
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all documents (public for affiliates)' })
  async findAll(@Query('type') type?: DocumentType) {
    return this.documentsService.findAll(type);
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MARKETING_ADMIN, UserRole.SALES_ADMIN, UserRole.SYSTEM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all documents (admin)' })
  async findAllAdmin(@Query('type') type?: DocumentType) {
    return this.documentsService.findAll(type, true);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get document by ID' })
  async findOne(@Param('id') id: string) {
    return this.documentsService.findOne(id);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download document by ID' })
  async download(@Param('id') id: string, @Res() res: Response) {
    const doc = await this.documentsService.findOne(id);
    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }

    if (doc.fileUrl.startsWith('http://') || doc.fileUrl.startsWith('https://')) {
      return res.redirect(doc.fileUrl);
    }

    const gcsInfo = parseGcsUrl(doc.fileUrl);
    if (gcsInfo) {
      const storage = new Storage();
      const file = storage.bucket(gcsInfo.bucket).file(gcsInfo.objectName);
      const stream = file.createReadStream();
      stream.on('error', () => {
        res.status(404).json({ message: 'File not found' });
      });
      stream.pipe(res);
      return;
    }

    const relativePath = doc.fileUrl.replace('/uploads/', '');
    const filePath = join(process.cwd(), 'uploads', relativePath);
    if (!existsSync(filePath)) {
      const bucket = getBucketName();
      if (bucket) {
        const storage = new Storage();
        const objectName = relativePath.startsWith('documents/') ? relativePath : `documents/${relativePath}`;
        const file = storage.bucket(bucket).file(objectName);
        const [exists] = await file.exists();
        if (exists) {
          const stream = file.createReadStream();
          stream.on('error', () => {
            res.status(404).json({ message: 'File not found' });
          });
          stream.pipe(res);
          return;
        }
      }
      return res.status(404).json({ message: 'File not found' });
    }
    return createReadStream(filePath).pipe(res);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MARKETING_ADMIN, UserRole.SALES_ADMIN, UserRole.SYSTEM_ADMIN)
  @ApiBearerAuth()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/documents',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      limits: {
        fileSize: 20 * 1024 * 1024, // 20MB
      },
      fileFilter: (req, file, cb) => {
        const allowed = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'image/png',
          'image/jpeg',
        ];
        if (allowed.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Unsupported file type'), false);
        }
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create document (admin only)' })
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body('name') name: string,
    @Body('type') type?: DocumentType,
  ) {
    if (!file) {
      throw new Error('File is required');
    }
    const localUrl = `/uploads/documents/${file.filename}`;
    const bucket = getBucketName();
    if (bucket) {
      try {
        const storage = new Storage();
        const [exists] = await storage.bucket(bucket).exists();
        if (!exists) {
          if (process.env.NODE_ENV === 'production') {
            throw new Error('Storage bucket not found');
          }
        } else {
          const objectName = `documents/${file.filename}`;
          await storage.bucket(bucket).upload(file.path, { destination: objectName });
          return this.documentsService.create({
            name: name || file.originalname,
            type: type || DocumentType.other,
            fileUrl: `gcs://${bucket}/${objectName}`,
          });
        }
      } catch {
        if (process.env.NODE_ENV === 'production') {
          throw new Error('Failed to upload document');
        }
      }
    }

    if (process.env.NODE_ENV === 'production') {
      throw new Error('Storage bucket is required in production');
    }

    return this.documentsService.create({
      name: name || file.originalname,
      type: type || DocumentType.other,
      fileUrl: localUrl,
    });
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MARKETING_ADMIN, UserRole.SALES_ADMIN, UserRole.SYSTEM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update document (admin only)' })
  async update(@Param('id') id: string, @Body() dto: UpdateDocumentDto) {
    return this.documentsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MARKETING_ADMIN, UserRole.SALES_ADMIN, UserRole.SYSTEM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete document (admin only)' })
  async delete(@Param('id') id: string) {
    const doc = await this.documentsService.findOne(id);
    if (doc?.fileUrl?.startsWith('gcs://')) {
      const gcsInfo = parseGcsUrl(doc.fileUrl);
      if (gcsInfo) {
        const storage = new Storage();
        await storage.bucket(gcsInfo.bucket).file(gcsInfo.objectName).delete().catch(() => undefined);
      }
    }
    return this.documentsService.delete(id);
  }
}
