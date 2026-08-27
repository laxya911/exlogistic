import { db } from '../lib/db';
import { PrismaRepository } from './prisma';
import { PrismaQuotationRepository } from './prisma/quotation.repository';

export class MockRepository<T extends { id: string; entityStatus: any }> {
  private collection: T[];

  constructor(collection: T[]) {
    this.collection = collection;
  }

  async getAll(): Promise<T[]> {
    return this.collection;
  }

  async getById(id: string): Promise<T | null> {
    return this.collection.find(item => item.id === id) || null;
  }

  async create(data: Partial<T>): Promise<T> {
    const newItem = {
      ...data,
      id: `${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      entityStatus: 'ACTIVE',
    } as any as T;
    this.collection.push(newItem);
    return newItem;
  }

  async update(id: string, data: Partial<T>): Promise<T | null> {
    const index = this.collection.findIndex(item => item.id === id);
    if (index === -1) return null;
    const updatedItem = {
      ...this.collection[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    this.collection[index] = updatedItem;
    return updatedItem;
  }

  async delete(id: string): Promise<boolean> {
    const index = this.collection.findIndex(item => item.id === id);
    if (index === -1) return false;
    this.collection.splice(index, 1);
    return true;
  }

  async find(predicate: (item: T) => boolean): Promise<T[]> {
    return this.collection.filter(predicate);
  }
}

const useMock = false;

// If useMock is true, use MockRepository. Otherwise use PrismaRepository to hit Postgres.
export const productRepository = useMock ? new MockRepository(db.products) : new PrismaRepository('product');
export const customerRepository = useMock ? new MockRepository(db.customers) : new PrismaRepository('customer');
export const supplierRepository = useMock ? new MockRepository(db.suppliers) : new PrismaRepository('supplier');
export const quotationRepository = useMock ? new MockRepository(db.quotations) : new PrismaQuotationRepository();
export const salesOrderRepository = useMock ? new MockRepository(db.salesOrders) : new PrismaRepository('salesOrder', { items: { include: { variant: { include: { product: true } } } } });
export const purchaseOrderRepository = useMock ? new MockRepository(db.purchaseOrders) : new PrismaRepository('purchaseOrder', { items: { include: { variant: { include: { product: true } } } } });
export const shipmentRepository = useMock ? new MockRepository(db.shipments) : new PrismaRepository('shipment', { items: { include: { variant: { include: { product: true } } } } });
export const auditLogRepository = useMock ? new MockRepository(db.auditLogs) : new PrismaRepository('auditLog', { user: true });
export const userRepository = new PrismaRepository('user', { department: true, roles: true });
export const roleRepository = new PrismaRepository('role', { permissions: true });
export const departmentRepository = new PrismaRepository('department');

// Models not currently in Prisma schema
export const taskRepository = new MockRepository(db.tasks);
export const calendarEventRepository = new MockRepository(db.calendarEvents);
export const documentRepository = useMock ? new MockRepository(db.documents) : new PrismaRepository('document');
export const costingScenarioRepository = new MockRepository(db.costingScenarios);
export const notificationRepository = new MockRepository(db.notifications || []);
export const forwarderRepository = new MockRepository(db.forwarders);
export const shippingLineRepository = new MockRepository(db.shippingLines);
export const portRepository = new MockRepository(db.ports);
export const currencyRepository = new MockRepository(db.currencies);
