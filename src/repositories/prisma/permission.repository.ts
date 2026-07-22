import { prisma } from '../prisma.client';
import { Permission } from '@generated/client';

export const permissionRepository = {
  findAll: async () => {
    return prisma.permission.findMany({
      orderBy: { action: 'asc' },
    });
  },

  findById: async (id: string) => {
    return prisma.permission.findUnique({
      where: { id },
    });
  },

  create: async (data: Partial<Permission>) => {
    return prisma.permission.create({
      data: data as any,
    });
  },

  delete: async (id: string) => {
    return prisma.permission.delete({
      where: { id },
    });
  },
};
