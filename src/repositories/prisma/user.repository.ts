import { prisma } from '../prisma.client';
import { User, Prisma } from '@generated/client';
import bcrypt from 'bcryptjs';

export const userRepository = {
  findAll: async () => {
    return prisma.user.findMany({
      include: {
        department: true,
        team: true,
        position: true,
      },
      orderBy: { name: 'asc' },
    });
  },

  findById: async (id: string) => {
    return prisma.user.findUnique({
      where: { id },
      include: {
        department: true,
        team: true,
        position: true,
      },
    });
  },

  create: async (data: any) => {
    let password = data.password;
    if (password) {
      password = await bcrypt.hash(password, 10);
    }
    
    return prisma.user.create({
      data: {
        ...data,
        password,
      },
    });
  },

  update: async (id: string, data: any) => {
    let password = data.password;
    if (password) {
      password = await bcrypt.hash(password, 10);
      data.password = password;
    } else {
      delete data.password; // Don't override with null if not provided
    }
    
    return prisma.user.update({
      where: { id },
      data,
    });
  },

  delete: async (id: string) => {
    return prisma.user.delete({
      where: { id },
    });
  },
};
