import { prisma } from '../prisma.client';
import { SystemPreference } from '@generated/client';

export const preferenceRepository = {
  get: async () => {
    // Assuming single-tenant ERP for now
    let prefs = await prisma.systemPreference.findFirst();
    if (!prefs) {
      prefs = await prisma.systemPreference.create({
        data: {
          theme: 'dark',
          quotePrefix: '2025-',
          soPrefix: 'SO-',
          poPrefix: 'PO-',
          shpPrefix: 'SHP-'
        }
      });
    }
    return prefs;
  },

  update: async (id: string, data: Partial<SystemPreference>) => {
    return prisma.systemPreference.update({
      where: { id },
      data: data as any,
    });
  },
};
