import { prisma } from '../prisma.client';
import { SystemPreference } from '@generated/client';

export const preferenceRepository = {
  get: async () => {
    // Assuming single-tenant ERP for now
    return prisma.systemPreference.findFirst();
  },

  update: async (id: string, data: Partial<SystemPreference>) => {
    return prisma.systemPreference.update({
      where: { id },
      data: data as any,
    });
  },
};
