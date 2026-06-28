import { db } from '../lib/db';

class NumberingService {
  private static instance: NumberingService;

  private constructor() {}

  public static getInstance(): NumberingService {
    if (!NumberingService.instance) {
      NumberingService.instance = new NumberingService();
    }
    return NumberingService.instance;
  }

  generateNumber(prefix: string, collection: any[]): string {
    const year = new Date().getFullYear();
    const count = collection.length + 1;
    return `${prefix}-${year}-${count.toString().padStart(4, '0')}`;
  }

  getQuotationNumber(): string {
    return this.generateNumber('QT', db.quotations);
  }

  getSalesOrderNumber(): string {
    return this.generateNumber('SO', db.salesOrders);
  }

  getPurchaseOrderNumber(): string {
    return this.generateNumber('PO', db.purchaseOrders);
  }

  getInvoiceNumber(): string {
    return this.generateNumber('INV', []); // Just an example
  }

  getPackingListNumber(): string {
    return this.generateNumber('PL', []);
  }

  getShipmentNumber(): string {
    return this.generateNumber('SHP', db.shipments);
  }
}

export const numberingService = NumberingService.getInstance();
