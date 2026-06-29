import { prisma } from '../prisma.client';
import { Department } from '@prisma/client';

export const departmentRepository = {
  findAll: async () => {
    return prisma.department.findMany({
      include: {
        teams: true,
        users: true,
      },
      orderBy: { name: 'asc' },
    });
  },

  findById: async (id: string) => {
    return prisma.department.findUnique({
      where: { id },
      include: {
        teams: true,
        users: true,
      },
    });
  },

  create: async (data: Partial<Department>) => {
    return prisma.department.create({
      data: data as any,
    });
  },

  update: async (id: string, data: Partial<Department>) => {
    return prisma.department.update({
      where: { id },
      data: data as any,
    });
  },

  delete: async (id: string) => {
    return prisma.department.delete({
      where: { id },
    });
  },
};
