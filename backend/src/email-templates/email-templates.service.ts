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
    const normalizedVariables = this.normalizeVariables(dto.variables);
    return this.prisma.emailTemplate.create({
      data: {
        name: dto.name,
        description: dto.description,
        group: dto.group,
        subject: dto.subject,
        body: dto.body,
        enabled: dto.enabled ?? true,
        variables: normalizedVariables ?? [],
      },
    });
  }

  async update(id: string, dto: UpdateEmailTemplateDto) {
    const normalizedVariables = this.normalizeVariables(dto.variables);
    return this.prisma.emailTemplate.update({
      where: { id },
      data: {
        ...dto,
        ...(normalizedVariables ? { variables: normalizedVariables } : {}),
      },
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

  private normalizeVariables(variables?: unknown): string[] | undefined {
    if (!variables) return undefined;
    if (!Array.isArray(variables)) return undefined;
    return variables
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object' && 'token' in item) {
          const token = (item as { token?: string }).token;
          return typeof token === 'string' ? token : undefined;
        }
        return undefined;
      })
      .filter((value): value is string => Boolean(value));
  }
}
