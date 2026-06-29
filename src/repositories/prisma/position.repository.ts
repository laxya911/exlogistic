import { prisma } from '../prisma.client';
import { Position } from '@prisma/client';

export const positionRepository = {
  findAll: async () => {
    return prisma.position.findMany({
      include: {
        users: true,
      },
      orderBy: { title: 'asc' },
    });
  },

  findById: async (id: string) => {
    return prisma.position.findUnique({
      where: { id },
      include: {
        users: true,
      },
    });
  },

  create: async (data: Partial<Position>) => {
    return prisma.position.create({
      data: data as any,
    });
  },

  update: async (id: string, data: Partial<Position>) => {
    return prisma.position.update({
      where: { id },
      data: data as any,
    });
  },

  delete: async (id: string) => {
    return prisma.position.delete({
      where: { id },
    });
  },
};
