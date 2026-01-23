import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { DocumentType } from '@prisma/client';

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateDocumentDto) {
    return this.prisma.document.create({
      data: dto,
    });
  }

  async findAll(type?: DocumentType) {
    const where: any = {};
    if (type) {
      where.type = type;
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

  async delete(id: string) {
    return this.prisma.document.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
