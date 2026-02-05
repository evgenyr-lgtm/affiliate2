import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EmailTemplatesService } from './email-templates.service';
import { CreateEmailTemplateDto } from './dto/create-email-template.dto';
import { UpdateEmailTemplateDto } from './dto/update-email-template.dto';
import { SendTestEmailDto } from './dto/send-test-email.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Email Templates')
@Controller('email-templates')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.MARKETING_ADMIN, UserRole.SALES_ADMIN, UserRole.SYSTEM_ADMIN)
@ApiBearerAuth()
export class EmailTemplatesController {
  constructor(private readonly emailTemplatesService: EmailTemplatesService) {}

  @Get()
  @ApiOperation({ summary: 'Get email templates' })
  async findAll() {
    return this.emailTemplatesService.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Create email template' })
  async create(@Body() dto: CreateEmailTemplateDto) {
    return this.emailTemplatesService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update email template' })
  async update(@Param('id') id: string, @Body() dto: UpdateEmailTemplateDto) {
    return this.emailTemplatesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete email template' })
  async delete(@Param('id') id: string) {
    return this.emailTemplatesService.delete(id);
  }

  @Post(':id/send-test')
  @ApiOperation({ summary: 'Send test email for a template' })
  async sendTest(@Param('id') id: string, @Body() dto: SendTestEmailDto) {
    return this.emailTemplatesService.sendTestEmail(id, dto);
  }
}
