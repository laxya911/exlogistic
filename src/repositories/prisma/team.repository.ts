import { prisma } from '../prisma.client';
import { Team } from '@prisma/client';

export const teamRepository = {
  findAll: async () => {
    return prisma.team.findMany({
      include: {
        department: true,
        users: true,
      },
      orderBy: { name: 'asc' },
    });
  },

  findById: async (id: string) => {
    return prisma.team.findUnique({
      where: { id },
      include: {
        department: true,
        users: true,
      },
    });
  },

  create: async (data: Partial<Team>) => {
    return prisma.team.create({
      data: data as any,
    });
  },

  update: async (id: string, data: Partial<Team>) => {
    return prisma.team.update({
      where: { id },
      data: data as any,
    });
  },

  delete: async (id: string) => {
    return prisma.team.delete({
      where: { id },
    });
  },
};
