import { 
  productRepository, 
  customerRepository, 
  shipmentRepository, 
  quotationRepository, 
  salesOrderRepository, 
  purchaseOrderRepository, 
  taskRepository,
  documentRepository
} from '@/repositories/repository';

export interface SearchResult {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  url: string;
  relevance: number; // Higher is better
}

export class SearchService {
  async globalSearch(query: string): Promise<SearchResult[]> {
    if (!query || query.trim().length < 2) return [];

    const q = query.toLowerCase().trim();
    const results: SearchResult[] = [];

    const [
      products, customers, shipments, quotations, 
      salesOrders, purchaseOrders, tasks, documents
    ] = await Promise.all([
      productRepository.getAll(),
      customerRepository.getAll(),
      shipmentRepository.getAll(),
      quotationRepository.getAll(),
      salesOrderRepository.getAll(),
      purchaseOrderRepository.getAll(),
      taskRepository.getAll(),
      documentRepository.getAll()
    ]);

    // Helper to calculate basic relevance
    const addMatch = (entityId: string, type: string, title: string, subtitle: string, url: string, matchText: string) => {
      const lowerMatch = matchText.toLowerCase();
      if (lowerMatch.includes(q)) {
        let relevance = 0;
        if (lowerMatch === q) relevance = 100;
        else if (lowerMatch.startsWith(q)) relevance = 50;
        else relevance = 10;
        
        results.push({ id: entityId, type, title, subtitle, url, relevance });
      }
    };

    // 1. Products
    products.forEach(p => {
      addMatch(p.id, 'Product', p.name, p.sku, `/products?id=${p.id}`, `${p.name} ${p.sku}`);
    });

    // 2. Customers
    customers.forEach(c => {
      addMatch(c.id, 'Customer', c.name, c.country, `/customers?id=${c.id}`, `${c.name} ${c.country}`);
    });

    // 3. Shipments
    shipments.forEach(s => {
      addMatch(s.id, 'Shipment', s.shipmentNo, `${s.originPortId} to ${s.destinationPortId}`, `/shipments/${s.id}`, `${s.shipmentNo}`);
    });

    // 4. Quotations
    quotations.forEach(quot => {
      addMatch(quot.id, 'Quotation', quot.quotationNo, quot.status, `/quotations/${quot.id}`, quot.quotationNo);
    });

    // 5. Sales Orders
    salesOrders.forEach(so => {
      addMatch(so.id, 'Sales Order', so.orderNo, so.status, `/sales-orders/${so.id}`, so.orderNo);
    });

    // 6. Purchase Orders
    purchaseOrders.forEach(po => {
      addMatch(po.id, 'Purchase Order', po.poNo, po.status, `/purchase-orders/${po.id}`, po.poNo);
    });

    // 7. Tasks
    tasks.forEach(t => {
      addMatch(t.id, 'Task', t.title, t.priority, `/tasks`, t.title);
    });

    // 8. Documents
    documents.forEach(d => {
      addMatch(d.id, 'Document', d.name, d.type, `/documents`, `${d.name} ${d.type}`);
    });

    // Sort by relevance descending, then by title
    return results
      .sort((a, b) => b.relevance - a.relevance || a.title.localeCompare(b.title))
      .slice(0, 15); // Limit to top 15 results
  }
}

export const searchService = new SearchService();
