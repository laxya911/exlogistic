import { prisma } from '../prisma.client';
import { AuditLog } from '@prisma/client';

export const auditRepository = {
  findAll: async () => {
    return prisma.auditLog.findMany({
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
      orderBy: { timestamp: 'desc' },
    });
  },

  create: async (data: any) => {
    return prisma.auditLog.create({
      data,
    });
  },
};
