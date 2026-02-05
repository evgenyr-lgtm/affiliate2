import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmailTemplateDto } from './dto/create-email-template.dto';
import { UpdateEmailTemplateDto } from './dto/update-email-template.dto';
import { EmailService } from '../email/email.service';
import { SendTestEmailDto } from './dto/send-test-email.dto';

@Injectable()
export class EmailTemplatesService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

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
        group: dto.group,
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

  async delete(id: string) {
    return this.prisma.emailTemplate.delete({
      where: { id },
    });
  }

  async sendTestEmail(id: string, dto: SendTestEmailDto) {
    const template = await this.prisma.emailTemplate.findUnique({
      where: { id },
    });
    if (!template) {
      throw new NotFoundException('Template not found');
    }

    await this.emailService.sendTestTemplateEmail(template, dto.to, {
      subject: dto.subject,
      body: dto.body,
    });

    return { success: true };
  }
}
