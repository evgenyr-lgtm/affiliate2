import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { DocumentType } from '@prisma/client';
import { UpdateDocumentDto } from './dto/update-document.dto';

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateDocumentDto) {
    return this.prisma.document.create({
      data: {
        name: dto.name,
        type: dto.type ?? DocumentType.other,
        fileUrl: dto.fileUrl,
      },
    });
  }

  async findAll(type?: DocumentType, includeHidden = false) {
    const where: any = {
      deletedAt: null,
    };
    if (type) {
      where.type = type;
    }
    if (!includeHidden) {
      where.isHidden = false;
    }

    return this.prisma.document.findMany({
      where,
      orderBy: { uploadedAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.document.findUnique({
      where: { id },
    });
  }

  async update(id: string, dto: UpdateDocumentDto) {
    const data: any = { ...dto };
    if (dto.uploadedAt) {
      data.uploadedAt = new Date(dto.uploadedAt);
    }
    return this.prisma.document.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return this.prisma.document.delete({
      where: { id },
    });
  }
}
