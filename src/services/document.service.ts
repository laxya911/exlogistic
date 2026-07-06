import { quotationRepository, salesOrderRepository, customerRepository } from '@/repositories/repository';
import { DocumentData } from '@/types/document';

export class DocumentService {
  private getIssuerCompany() {
    return {
      name: 'ExLogis ERP',
      address: '123 Global Trade Blvd, Dubai, UAE',
      email: 'sales@exlogiserp.local',
      phone: '+971 4 123 4567',
      taxId: 'TRN-100293910'
    };
  }

  async getQuotationDocument(id: string): Promise<DocumentData | null> {
    const quote = await quotationRepository.getById(id);
    if (!quote) return null;
    
    const customer = await customerRepository.getById(quote.customerId);
    
    return {
      title: 'QUOTATION / PROFORMA',
      documentNo: quote.quotationNo,
      date: quote.date,
      validityDate: quote.validityDate,
      issuer: this.getIssuerCompany(),
      client: {
        name: customer?.name || 'Unknown Client',
        address: customer?.address || '',
        email: customer?.email,
        phone: customer?.phone
      },
      items: quote.items?.map((item: any, idx: number) => ({
        id: `item-${idx}`,
        description: item.variant?.product?.name 
          ? `${item.variant.product.name} (${item.variant.sku})` 
          : (item.variant?.title || `Product: ${item.productId || item.variantId}`),
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.quantity * item.unitPrice
      })),
      subtotal: quote.totalValue,
      taxTotal: 0,
      grandTotal: quote.totalValue,
      currency: 'USD', // Hardcoded mock
      terms: 'Standard Terms & Conditions apply. Valid for 30 days.'
    };
  }

  async getSalesOrderDocument(id: string): Promise<DocumentData | null> {
    const order = await salesOrderRepository.getById(id);
    if (!order) return null;
    
    const customer = await customerRepository.getById(order.customerId);
    
    return {
      title: 'SALES ORDER',
      documentNo: order.orderNo,
      date: order.date,
      issuer: this.getIssuerCompany(),
      client: {
        name: customer?.name || 'Unknown Client',
        address: customer?.address || '',
        email: customer?.email,
        phone: customer?.phone
      },
      items: order.items?.map((item: any, idx: number) => ({
        id: `item-${idx}`,
        description: item.variant?.product?.name 
          ? `${item.variant.product.name} (${item.variant.sku})` 
          : (item.variant?.title || `Product: ${item.productId || item.variantId}`),
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.quantity * item.unitPrice
      })),
      subtotal: order.totalValue,
      taxTotal: 0,
      grandTotal: order.totalValue,
      currency: 'USD',
      terms: 'Order confirmed. Production will commence upon receipt of downpayment.'
    };
  }
}

export const documentService = new DocumentService();
