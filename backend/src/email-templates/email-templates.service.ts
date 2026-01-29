import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmailTemplateDto } from './dto/create-email-template.dto';
import { UpdateEmailTemplateDto } from './dto/update-email-template.dto';

@Injectable()
export class EmailTemplatesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.emailTemplate.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async create(dto: CreateEmailTemplateDto) {
    return this.prisma.emailTemplate.create({
      data: {
        name: dto.name,
        description: dto.description,
        subject: dto.subject,
        body: dto.body,
        enabled: dto.enabled ?? true,
        variables: dto.variables ?? [],
      },
    });
  }

  async update(id: string, dto: UpdateEmailTemplateDto) {
    return this.prisma.emailTemplate.update({
      where: { id },
      data: dto,
    });
  }
}
