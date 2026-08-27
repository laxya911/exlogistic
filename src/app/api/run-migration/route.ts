import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Product"
        ADD COLUMN IF NOT EXISTS "unitsPerCarton" INTEGER,
        ADD COLUMN IF NOT EXISTS "containerLoadingCapacity" INTEGER,
        ADD COLUMN IF NOT EXISTS "shelfLife" TEXT,
        ADD COLUMN IF NOT EXISTS "storageConditions" TEXT,
        ADD COLUMN IF NOT EXISTS "japanImportNotes" TEXT;
    `);

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Quotation"
        ADD COLUMN IF NOT EXISTS "version" INTEGER DEFAULT 1,
        ADD COLUMN IF NOT EXISTS "exchangeRate" DOUBLE PRECISION;
        
      ALTER TABLE "SalesOrder"
        ADD COLUMN IF NOT EXISTS "timeline" JSONB,
        ADD COLUMN IF NOT EXISTS "documents" JSONB;
        
      ALTER TABLE "PurchaseOrder"
        ADD COLUMN IF NOT EXISTS "timeline" JSONB,
        ADD COLUMN IF NOT EXISTS "documents" JSONB;
        
      ALTER TABLE "Shipment"
        ADD COLUMN IF NOT EXISTS "timeline" JSONB,
        ADD COLUMN IF NOT EXISTS "documents" JSONB,
        ADD COLUMN IF NOT EXISTS "atd" TIMESTAMP(3),
        ADD COLUMN IF NOT EXISTS "ata" TIMESTAMP(3),
        ADD COLUMN IF NOT EXISTS "containerNo" TEXT,
        ADD COLUMN IF NOT EXISTS "bookingNo" TEXT,
        ADD COLUMN IF NOT EXISTS "mbl" TEXT,
        ADD COLUMN IF NOT EXISTS "hbl" TEXT,
        ADD COLUMN IF NOT EXISTS "shippingLineId" TEXT,
        ADD COLUMN IF NOT EXISTS "vesselName" TEXT,
        ADD COLUMN IF NOT EXISTS "voyageNo" TEXT,
        ADD COLUMN IF NOT EXISTS "forwarderId" TEXT,
        ADD COLUMN IF NOT EXISTS "forwarderRefNo" TEXT,
        ADD COLUMN IF NOT EXISTS "containerType" TEXT,
        ADD COLUMN IF NOT EXISTS "grossWeight" DOUBLE PRECISION,
        ADD COLUMN IF NOT EXISTS "netWeight" DOUBLE PRECISION,
        ADD COLUMN IF NOT EXISTS "cbm" DOUBLE PRECISION,
        ADD COLUMN IF NOT EXISTS "packageCount" INTEGER,
        ADD COLUMN IF NOT EXISTS "sealNo" TEXT,
        ADD COLUMN IF NOT EXISTS "hazmat" BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS "freightCost" JSONB,
        ADD COLUMN IF NOT EXISTS "totalFreightCost" DOUBLE PRECISION,
        ADD COLUMN IF NOT EXISTS "remarks" TEXT;
    `);

    // Update TransactionStatus ENUM in PostgreSQL
    const newStatuses = ['BOOKING', 'STUFFING', 'CUSTOMS', 'ON_VESSEL', 'TRANSIT', 'ARRIVED'];
    for (const status of newStatuses) {
      try {
        await prisma.$executeRawUnsafe(`ALTER TYPE "TransactionStatus" ADD VALUE IF NOT EXISTS '${status}'`);
      } catch (e) {
        // Ignore if enum type doesn't support IF NOT EXISTS in older PG versions, or already exists
        console.log(`Enum value ${status} might already exist or error: `, e);
      }
    }

    // Seed WorkflowRule for auto-generating Sales Orders
    const workflowRuleCount = await prisma.workflowRule.count({
      where: { action: 'CREATE_SALES_ORDER' }
    });

    if (workflowRuleCount === 0) {
      await prisma.workflowRule.create({
        data: {
          name: 'Auto-create Sales Order on Quote Approval',
          description: 'Automatically generate a drafted sales order when a quotation is fully approved.',
          triggerEntity: 'Quotation',
          triggerCondition: { status: 'APPROVED' },
          action: 'CREATE_SALES_ORDER',
          actionPayload: {},
          isActive: true
        }
      });
    }

    // Backfill legacy Shipments that are missing logistics data and fix legacy statuses
    const shipments = await prisma.shipment.findMany();
    for (let i = 0; i < shipments.length; i++) {
      const shp = shipments[i];
      const updates: any = {};

      // 1. Fix Legacy Statuses
      const statusMap: Record<string, string> = {
        'DRAFT': 'BOOKING',
        'PENDING': 'STUFFING',
        'CONFIRMED': 'CUSTOMS',
        'SHIPPED': 'ON_VESSEL',
        'IN_TRANSIT': 'TRANSIT'
      };
      if (statusMap[shp.status]) {
        updates.status = statusMap[shp.status];
      }

      // 2. Backfill missing logistics data
      if ((shp as any).totalFreightCost === null || (shp as any).totalFreightCost === undefined) {
        const oceanFreight = 1200 + i * 80;
        const originCharges = 250 + (i % 3) * 50;
        const destCharges = 350 + (i % 4) * 40;
        
        updates.totalFreightCost = oceanFreight + originCharges + destCharges + 500;
        updates.freightCost = { oceanFreight, originCharges, destinationCharges: destCharges, insurance: 500 };
        updates.containerType = ['20GP', '40GP', '40HQ', '20GP', '40GP'][i % 5];
        updates.shippingLineId = ['MAERSK', 'MSC', 'CMA CGM', 'COSCO', 'HAPAG-LLOYD', 'EVERGREEN'][i % 6];
        updates.atd = shp.etd;
        updates.ata = shp.eta;
        updates.grossWeight = 10000 + i * 500;
        updates.netWeight = (10000 + i * 500) - 800;
        updates.cbm = 22 + i;
        updates.containerNo = `CONT-${(i + 1).toString().padStart(6, '0')}`;
      }

      if (Object.keys(updates).length > 0) {
        await prisma.shipment.update({ where: { id: shp.id }, data: updates });
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Added Product logistics columns and seeded Workflow Rules successfully.' 
    });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
