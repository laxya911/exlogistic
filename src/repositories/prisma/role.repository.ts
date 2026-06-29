import { prisma } from '../prisma.client';
import { Role } from '@prisma/client';

export const roleRepository = {
  findAll: async () => {
    return prisma.role.findMany({
      include: {
        permissions: true,
        users: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  },

  findById: async (id: string) => {
    return prisma.role.findUnique({
      where: { id },
      include: {
        permissions: true,
        users: true,
      },
    });
  },

  create: async (data: any) => {
    return prisma.role.create({
      data: data,
    });
  },

  update: async (id: string, data: any) => {
    return prisma.role.update({
      where: { id },
      data: data,
    });
  },

  delete: async (id: string) => {
    return prisma.role.delete({
      where: { id },
    });
  },
};
