import { NextResponse } from 'next/server';
import { 
  productRepository, 
  customerRepository, 
  supplierRepository, 
  shipmentRepository, 
  documentRepository, 
  quotationRepository, 
  salesOrderRepository, 
  purchaseOrderRepository, 
  taskRepository 
} from '@/repositories/repository';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const query = url.searchParams.get('q')?.toLowerCase() || '';

    if (!query) {
      return NextResponse.json({
        products: [],
        customers: [],
        suppliers: [],
        shipments: [],
        documents: [],
        quotations: [],
        salesOrders: [],
        purchaseOrders: [],
        tasks: []
      });
    }

    const [
      products,
      customers,
      suppliers,
      shipments,
      documents,
      quotations,
      salesOrders,
      purchaseOrders,
      tasks
    ] = await Promise.all([
      productRepository.getAll(),
      customerRepository.getAll(),
      supplierRepository.getAll(),
      shipmentRepository.getAll(),
      documentRepository.getAll(),
      quotationRepository.getAll(),
      salesOrderRepository.getAll(),
      purchaseOrderRepository.getAll(),
      taskRepository.getAll()
    ]);

    const results = {
      products: products.filter(p => p.name.toLowerCase().includes(query) || p.sku.toLowerCase().includes(query)).slice(0, 5),
      customers: customers.filter(c => c.name.toLowerCase().includes(query) || c.country.toLowerCase().includes(query)).slice(0, 5),
      suppliers: suppliers.filter(s => s.name.toLowerCase().includes(query) || s.country.toLowerCase().includes(query)).slice(0, 5),
      shipments: shipments.filter(s => s.shipmentNo.toLowerCase().includes(query) || s.status.toLowerCase().includes(query)).slice(0, 5),
      documents: documents.filter(d => d.name.toLowerCase().includes(query) || d.type.toLowerCase().includes(query)).slice(0, 5),
      quotations: quotations.filter(q => q.quotationNo.toLowerCase().includes(query) || q.customerId.toLowerCase().includes(query)).slice(0, 5),
      salesOrders: salesOrders.filter(so => so.orderNo.toLowerCase().includes(query) || so.customerId.toLowerCase().includes(query)).slice(0, 5),
      purchaseOrders: purchaseOrders.filter(po => po.poNo.toLowerCase().includes(query) || po.supplierId.toLowerCase().includes(query)).slice(0, 5),
      tasks: tasks.filter(t => t.title.toLowerCase().includes(query) || t.category.toLowerCase().includes(query)).slice(0, 5),
    };

    return NextResponse.json(results);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
