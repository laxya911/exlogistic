import { prisma } from '../prisma.client';
import { Company } from '@generated/client';
import { auditLogger } from '@/lib/audit';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const companyRepository = {
  get: async () => {
    // Assuming single-tenant ERP for now
    let company = await prisma.company.findFirst();
    if (!company) {
      company = await prisma.company.create({
        data: {
          name: 'ExLogis Default',
          currency: 'USD',
          timezone: 'UTC',
        }
      });
    }
    return company;
  },

  update: async (id: string, data: Partial<Company>) => {
    const oldValues = await prisma.company.findUnique({ where: { id } });
    
    const updated = await prisma.company.update({
      where: { id },
      data: data as any,
    });

    const session = await getServerSession(authOptions);

    await auditLogger.logAction({
      entityType: 'Company',
      entityId: id,
      action: 'UPDATE',
      oldValues,
      newValues: updated,
      userId: session?.user?.email ? (await prisma.user.findUnique({ where: { email: session.user.email } }))?.id : undefined,
    });

    return updated;
  },
};
