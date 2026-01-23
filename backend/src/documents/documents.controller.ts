import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, DocumentType } from '@prisma/client';
import { diskStorage } from 'multer';
import { extname } from 'path';

@ApiTags('Documents')
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all documents (public for affiliates)' })
  async findAll(@Query('type') type?: DocumentType) {
    return this.documentsService.findAll(type);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get document by ID' })
  async findOne(@Param('id') id: string) {
    return this.documentsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MARKETING_ADMIN, UserRole.SYSTEM_ADMIN)
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
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create document (admin only)' })
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body('name') name: string,
    @Body('type') type: DocumentType,
  ) {
    if (!file) {
      throw new Error('File is required');
    }
    const fileUrl = `/uploads/documents/${file.filename}`;
    return this.documentsService.create({ name, type, fileUrl });
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MARKETING_ADMIN, UserRole.SYSTEM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete document (admin only)' })
  async delete(@Param('id') id: string) {
    return this.documentsService.delete(id);
  }
}
