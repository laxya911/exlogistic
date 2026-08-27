import { prisma } from '@/repositories/prisma.client';
import { logger } from '@/lib/logger';

export class InventoryService {
  async getDefaultWarehouse() {
    let warehouse = await prisma.warehouse.findFirst();
    if (!warehouse) {
      warehouse = await prisma.warehouse.create({
        data: {
          name: 'Main Distribution Center',
          code: 'MAIN_HUB'
        }
      });
    }
    return warehouse;
  }

  async adjustStock(
    variantId: string, 
    quantity: number, 
    type: string, 
    referenceType?: string, 
    referenceId?: string, 
    remarks?: string,
    userId?: string
  ) {
    if (quantity === 0) return null;

    const warehouse = await this.getDefaultWarehouse();

    // Upsert Inventory record
    let inventory = await prisma.inventory.findUnique({
      where: {
        variantId_warehouseId: {
          variantId,
          warehouseId: warehouse.id
        }
      }
    });

    if (!inventory) {
      inventory = await prisma.inventory.create({
        data: {
          variantId,
          warehouseId: warehouse.id,
          quantityOnHand: 0,
          quantityAllocated: 0,
          quantityOnOrder: 0,
        }
      });
    }

    // Update quantities based on transaction type
    let updateData: any = {};
    
    switch (type) {
      case 'RECEIPT': // e.g. PO Received or manual positive adjustment
        updateData.quantityOnHand = { increment: quantity };
        break;
      case 'SHIPMENT': // e.g. SO Shipped
        updateData.quantityOnHand = { decrement: quantity };
        updateData.quantityAllocated = { decrement: quantity }; // Assuming it was previously allocated
        break;
      case 'ALLOCATE': // e.g. SO Confirmed
        updateData.quantityAllocated = { increment: quantity };
        break;
      case 'UNALLOCATE': // e.g. SO Cancelled or Reverted to Draft
        updateData.quantityAllocated = { decrement: quantity };
        break;
      case 'ORDER': // e.g. PO Confirmed
        updateData.quantityOnOrder = { increment: quantity };
        break;
      case 'ADJUSTMENT': // Manual override
        updateData.quantityOnHand = { increment: quantity };
        break;
      default:
        logger.warn(`Unknown inventory transaction type: ${type}`);
        return null;
    }

    const updatedInventory = await prisma.inventory.update({
      where: { id: inventory.id },
      data: updateData
    });

    // Create transaction log
    const transaction = await prisma.inventoryTransaction.create({
      data: {
        inventoryId: inventory.id,
        variantId,
        warehouseId: warehouse.id,
        type,
        quantity, // Keep original quantity sign as intended by the caller
        referenceId,
        referenceType,
        remarks,
        userId
      }
    });

    logger.info(`[INVENTORY] Processed ${type} for variant ${variantId}: Qty ${quantity}`);
    return { inventory: updatedInventory, transaction };
  }

  async getLedgerForVariant(variantId: string) {
    const inventory = await prisma.inventory.findFirst({
      where: { variantId },
      include: {
        warehouse: true
      }
    });

    const transactions = await prisma.inventoryTransaction.findMany({
      where: { variantId },
      orderBy: { timestamp: 'desc' }
    });

    return { inventory, transactions };
  }
}

export const inventoryService = new InventoryService();
