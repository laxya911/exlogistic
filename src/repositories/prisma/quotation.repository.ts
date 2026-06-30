import { prisma } from '../prisma.client';
import { TransactionStatus } from '@prisma/client';

export class PrismaQuotationRepository {
  private mapToFrontend(q: any): any {
    if (!q) return q;
    
    // map items
    const mappedItems = q.items?.map((i: any) => ({
      ...i,
      productId: i.variant?.productId || i.productId || '',
      totalPrice: i.quantity * (i.unitPrice || 0)
    })) || [];
    
    let documents = q.documents;
    if (typeof documents === 'string') {
      try {
        documents = JSON.parse(documents);
      } catch (e) {
        documents = [];
      }
    }
    
    let timeline = q.timeline;
    if (typeof timeline === 'string') {
      try {
        timeline = JSON.parse(timeline);
      } catch (e) {
        timeline = [];
      }
    }
    
    return {
      ...q,
      status: q.status === 'CONFIRMED' ? 'APPROVED' : (q.status === 'CANCELLED' ? 'REJECTED' : (q.status === 'PENDING' ? 'SENT' : q.status)),
      items: mappedItems,
      documents: Array.isArray(documents) ? documents : [],
      timeline: Array.isArray(timeline) ? timeline : [],
      containerType: q.container || q.containerType,
      entityStatus: q.status === 'CANCELLED' ? 'ARCHIVED' : 'ACTIVE',
      creditLimit: 250000,
      segment: 'Enterprise',
      rating: 4.5,
      version: 1,
    };
  }

  private mapStatus(statusStr: string): TransactionStatus {
    const s = statusStr?.toUpperCase();
    if (s === 'APPROVED') return TransactionStatus.CONFIRMED;
    if (s === 'REJECTED') return TransactionStatus.CANCELLED;
    if (s === 'SENT') return TransactionStatus.PENDING;
    if (['DRAFT', 'PENDING', 'CONFIRMED', 'SHIPPED', 'CANCELLED', 'COMPLETED'].includes(s || '')) {
      return s as TransactionStatus;
    }
    // "REVISED" maps to DRAFT? Actually, revision creates a new draft or keeps it DRAFT
    return TransactionStatus.DRAFT; 
  }

  async getAll() {
    const data = await prisma.quotation.findMany({ 
      include: { items: { include: { variant: { include: { product: true } } } } },
      orderBy: { createdAt: 'desc' }
    });
    return data.map((q) => this.mapToFrontend(q));
  }

  async getById(id: string) {
    const data = await prisma.quotation.findUnique({ 
      where: { id }, 
      include: { items: { include: { variant: { include: { product: true } } } } } 
    });
    return data ? this.mapToFrontend(data) : null;
  }

  async create(data: any) {
    const { id, items, timeline, documents, entityStatus, creditLimit, segment, rating, version, createdAt, updatedAt, action, customerId, originPortId, destinationPortId, ...rest } = data;
    
    const created = await prisma.quotation.create({
      data: {
        ...rest,
        id: id || undefined,
        status: this.mapStatus(data.status),
        date: new Date(data.date),
        validityDate: new Date(data.validityDate),
        expectedShipment: data.expectedShipment ? new Date(data.expectedShipment) : null,
        timeline: timeline || [],
        documents: documents || [],
        customer: customerId ? { connect: { id: customerId } } : undefined,
        originPortId: originPortId || null,
        destinationPortId: destinationPortId || null,
        items: {
          create: items?.map((i: any) => ({
            variantId: i.variantId || i.productId, // UI might still pass productId instead of variantId
            quantity: i.quantity,
            unitPrice: i.unitPrice,
          })) || []
        }
      },
      include: { items: { include: { variant: { include: { product: true } } } } }
    });
    return this.mapToFrontend(created);
  }

  async update(id: string, data: any) {
    const { id: _id, items, timeline, documents, entityStatus, creditLimit, segment, rating, version, createdAt, updatedAt, action, customerId, originPortId, destinationPortId, ...rest } = data;
    
    const updated = await prisma.quotation.update({
      where: { id },
      data: {
        ...rest,
        status: this.mapStatus(data.status),
        date: data.date ? new Date(data.date) : undefined,
        validityDate: data.validityDate ? new Date(data.validityDate) : undefined,
        expectedShipment: data.expectedShipment ? new Date(data.expectedShipment) : null,
        timeline: timeline !== undefined ? timeline : undefined,
        documents: documents !== undefined ? documents : undefined,
        customer: customerId ? { connect: { id: customerId } } : undefined,
        originPortId: originPortId || null,
        destinationPortId: destinationPortId || null,
        items: items ? {
          deleteMany: {},
          create: items.map((i: any) => ({
            variantId: i.variantId || i.productId,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
          }))
        } : undefined
      },
      include: { items: { include: { variant: { include: { product: true } } } } }
    });
    return this.mapToFrontend(updated);
  }

  async delete(id: string) {
    try {
      await prisma.quotation.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  async find(query: any) {
    if (typeof query === 'function') {
      const all = await this.getAll();
      return all.filter(query);
    }
    const data = await prisma.quotation.findMany({ 
      where: query, 
      include: { items: { include: { variant: true } } } 
    });
    return data.map((q) => this.mapToFrontend(q));
  }
}
