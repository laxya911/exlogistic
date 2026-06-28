import { db } from '../lib/db';

export class Repository<T extends { id: string; entityStatus: any }> {
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

export const productRepository = new Repository(db.products);
export const customerRepository = new Repository(db.customers);
export const supplierRepository = new Repository(db.suppliers);
export const forwarderRepository = new Repository(db.forwarders);
export const shippingLineRepository = new Repository(db.shippingLines);
export const portRepository = new Repository(db.ports);
export const currencyRepository = new Repository(db.currencies);
export const quotationRepository = new Repository(db.quotations);
export const salesOrderRepository = new Repository(db.salesOrders);
export const purchaseOrderRepository = new Repository(db.purchaseOrders);
export const shipmentRepository = new Repository(db.shipments);
export const taskRepository = new Repository(db.tasks);
export const calendarEventRepository = new Repository(db.calendarEvents);
export const notificationRepository = new Repository(db.notifications);
export const auditLogRepository = new Repository(db.auditLogs);
export const documentRepository = new Repository(db.documents);
export const costingScenarioRepository = new Repository(db.costingScenarios);
