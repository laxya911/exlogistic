'use server';

import { prisma } from '@/repositories/prisma.client';
import { revalidatePath } from 'next/cache';

export async function seedStandardWorkflow() {
  await prisma.workflowRule.create({
    data: {
      name: 'Auto-Create Sales Order on Quotation Approval',
      description: 'Automatically generates a Sales Order when a Quotation status changes to APPROVED.',
      triggerEntity: 'Quotation',
      triggerCondition: { status: 'APPROVED' },
      action: 'CREATE_SALES_ORDER',
      isActive: true
    }
  });

  revalidatePath('/settings/workflows');
}
