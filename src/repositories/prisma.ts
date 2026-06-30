import { prisma } from '../lib/prisma';

export class PrismaRepository<T = any> {
  private delegate: any;
  private defaultIncludes: any;
  private modelName: string;

  constructor(modelName: string, defaultIncludes?: any) {
    this.delegate = (prisma as any)[modelName];
    this.defaultIncludes = defaultIncludes;
    this.modelName = modelName;
  }

  private mapToMock = (item: any): any => {
    if (!item) return item;

    let mappedItems = item.items;
    if (Array.isArray(item.items)) {
      mappedItems = item.items.map((i: any) => ({
        ...i,
        productId: i.variant?.productId || i.productId || '',
        totalPrice: i.quantity * (i.unitPrice || 0)
      }));
    }

    let uiStatus = item.status;
    if (this.modelName === 'salesOrder') {
      if (item.status === 'PENDING') {
        uiStatus = 'CONFIRMED';
      } else if (item.status === 'CONFIRMED') {
        const timeline = Array.isArray(item.timeline) ? item.timeline : (typeof item.timeline === 'string' ? JSON.parse(item.timeline) : []);
        if (timeline.some((ev: any) => ev.type === 'READY_FOR_SHIPMENT')) {
          uiStatus = 'READY';
        } else if (timeline.some((ev: any) => ev.type === 'PRODUCTION_STARTED')) {
          uiStatus = 'PRODUCTION';
        } else {
          uiStatus = 'CONFIRMED';
        }
      } else if (item.status === 'SHIPPED') {
        uiStatus = 'SHIPPED';
      } else if (item.status === 'CANCELLED') {
        uiStatus = 'CANCELLED';
      }
    } else if (this.modelName === 'purchaseOrder') {
      if (item.status === 'PENDING') {
        uiStatus = 'ISSUED';
      } else if (item.status === 'CONFIRMED') {
        const timeline = Array.isArray(item.timeline) ? item.timeline : (typeof item.timeline === 'string' ? JSON.parse(item.timeline) : []);
        if (timeline.some((ev: any) => ev.type === 'IN_PRODUCTION')) {
          uiStatus = 'IN_PRODUCTION';
        } else {
          uiStatus = 'ACKNOWLEDGED';
        }
      } else if (item.status === 'SHIPPED') {
        uiStatus = 'DISPATCHED';
      } else if (item.status === 'COMPLETED') {
        uiStatus = 'RECEIVED';
      }
    }

    return {
      ...item,
      items: mappedItems,
      status: uiStatus,
      // Bridge Prisma fields to UI Mock expectations
      entityStatus: (item.status && ['ACTIVE', 'INACTIVE', 'ARCHIVED', 'DELETED'].includes(item.status)) ? item.status : 'ACTIVE',
      expectedShipmentDate: item.expectedShipment || item.expectedShipmentDate,
      containerType: item.container || item.containerType,
      creditLimit: item.creditLimit ?? 250000,
      segment: item.segment || 'Enterprise',
      rating: item.rating ?? item.performanceRating ?? 4.5,
    };
  };

  private cleanAndMapPayload = (data: any): any => {
    if (!data) return data;
    const mapped = { ...data };
    
    // Map expectedShipmentDate -> expectedShipment
    if (mapped.expectedShipmentDate !== undefined) {
      mapped.expectedShipment = mapped.expectedShipmentDate ? new Date(mapped.expectedShipmentDate) : null;
      delete mapped.expectedShipmentDate;
    }
    
    // Map containerType -> container
    if (mapped.containerType !== undefined) {
      mapped.container = mapped.containerType;
      delete mapped.containerType;
    }

    if (this.modelName === 'salesOrder') {
      if (mapped.status !== undefined) {
        const soStatusMap: Record<string, string> = {
          'CONFIRMED': 'PENDING',
          'PRODUCTION': 'CONFIRMED',
          'READY': 'CONFIRMED',
          'SHIPPED': 'SHIPPED',
          'CANCELLED': 'CANCELLED'
        };
        mapped.status = soStatusMap[mapped.status] || mapped.status;
      }
    }
    
    if (this.modelName === 'purchaseOrder') {
      if (mapped.status !== undefined) {
        const poStatusMap: Record<string, string> = {
          'DRAFT': 'DRAFT',
          'ISSUED': 'PENDING',
          'ACKNOWLEDGED': 'CONFIRMED',
          'IN_PRODUCTION': 'CONFIRMED',
          'DISPATCHED': 'SHIPPED',
          'RECEIVED': 'COMPLETED',
          'CANCELLED': 'CANCELLED'
        };
        mapped.status = poStatusMap[mapped.status] || mapped.status;
      }
    }

    // Clean up relation objects not present as scalar columns in prisma schema
    delete mapped.supplier;
    delete mapped.customer;
    delete mapped.originPort;
    delete mapped.destinationPort;
    delete mapped.forwarder;
    delete mapped.salesOrder;
    delete mapped.purchaseOrder;

    // Clean up UI mock fields not present in prisma schema
    delete mapped.entityStatus;
    delete mapped.creditLimit;
    delete mapped.segment;
    delete mapped.rating;
    
    return mapped;
  };

  async getAll(): Promise<T[]> {
    const data = await this.delegate.findMany({ include: this.defaultIncludes });
    return data.map(this.mapToMock);
  }

  async getById(id: string): Promise<T | null> {
    const data = await this.delegate.findUnique({ where: { id }, include: this.defaultIncludes });
    return data ? this.mapToMock(data) : null;
  }

  async create(data: Partial<T>): Promise<T> {
    const cleanData = this.cleanAndMapPayload(data);
    
    // Handle items relation for create
    if (Array.isArray((data as any).items)) {
      cleanData.items = {
        create: (data as any).items.map((i: any) => {
          const itemPayload: any = {
            variantId: i.variantId || i.productId,
            quantity: Number(i.quantity),
          };
          if (this.modelName !== 'shipment') {
            itemPayload.unitPrice = Number(i.unitPrice);
          }
          return itemPayload;
        })
      };
    }
    
    const created = await this.delegate.create({ data: cleanData, include: this.defaultIncludes });
    return this.mapToMock(created);
  }

  async update(id: string, data: Partial<T>): Promise<T | null> {
    try {
      const cleanData = this.cleanAndMapPayload(data);
      
      // Handle items relation for update
      if (Array.isArray((data as any).items)) {
        cleanData.items = {
          deleteMany: {},
          create: (data as any).items.map((i: any) => {
            const itemPayload: any = {
              variantId: i.variantId || i.productId,
              quantity: Number(i.quantity),
            };
            if (this.modelName !== 'shipment') {
              itemPayload.unitPrice = Number(i.unitPrice);
            }
            return itemPayload;
          })
        };
      } else {
        delete cleanData.items;
      }
      
      const updated = await this.delegate.update({ where: { id }, data: cleanData, include: this.defaultIncludes });
      return this.mapToMock(updated);
    } catch (e) {
      console.error("Prisma update error in PrismaRepository:", e);
      return null;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.delegate.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  async find(query: any): Promise<T[]> {
    if (typeof query === 'function') {
      const all = await this.getAll();
      return all.filter(query);
    }
    return this.delegate.findMany({ where: query, include: this.defaultIncludes });
  }
}
