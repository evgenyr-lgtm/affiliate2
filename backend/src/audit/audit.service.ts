import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(
    userId: string,
    action: string,
    resource: string,
    resourceId?: string,
    details?: any,
    ipAddress?: string,
    userAgent?: string,
  ) {
    return this.prisma.auditLog.create({
      data: {
        userId,
        action,
        resource,
        resourceId,
        details,
        ipAddress,
        userAgent,
      },
    });
  }

  async getLogs(filters?: {
    userId?: string;
    action?: string;
    resource?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: any = {};

    if (filters?.userId) {
      where.userId = filters.userId;
    }

    if (filters?.action) {
      where.action = filters.action;
    }

    if (filters?.resource) {
      where.resource = filters.resource;
    }

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    return this.prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });
  }
}
