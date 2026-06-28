import { 
  Product, Customer, Supplier, Forwarder, ShippingLine, Port, Currency, 
  Quotation, SalesOrder, PurchaseOrder, Shipment, Task, CalendarEvent 
} from '../types';

export const db = {
  products: [] as Product[],
  customers: [] as Customer[],
  suppliers: [] as Supplier[],
  forwarders: [] as Forwarder[],
  shippingLines: [] as ShippingLine[],
  ports: [] as Port[],
  currencies: [] as Currency[],
  quotations: [] as Quotation[],
  salesOrders: [] as SalesOrder[],
  purchaseOrders: [] as PurchaseOrder[],
  shipments: [] as Shipment[],
  tasks: [] as Task[],
  calendarEvents: [] as CalendarEvent[],
  notifications: [] as Notification[],
  auditLogs: [] as AuditLog[],
};

// Seed Data Helpers
function generateId(prefix: string, index: number) {
  return `${prefix}-${(index + 1).toString().padStart(4, '0')}`;
}

const now = new Date().toISOString();

// Seed Master Data
db.products = Array.from({ length: 50 }).map((_, i) => ({
  id: generateId('PROD', i),
  sku: `SKU-${1000 + i}`,
  name: `Industrial ${['Component', 'Valve', 'Sensor', 'Motor', 'Pump'][i % 5]} ${i + 1}`,
  category: i % 2 === 0 ? 'Mechanical' : 'Electrical',
  uom: 'PCS',
  hsnCode: `8481.${(i + 10).toString().padStart(4, '0')}`,
  weight: 5 + (i % 20),
  volume: 0.1 + (i % 10) / 10,
  brand: ['ExLogis', 'Matrix', 'PowerFlow', 'Zenith'][i % 4],
  supplierId: generateId('SUPP', i % 20),
  shelfLife: '24 Months',
  images: [`https://picsum.photos/seed/${i}/400/400`],
  purchaseHistory: [],
  sellingHistory: [],
  inventorySummary: [
    { location: 'Main Warehouse', quantity: 500 + i * 10, lastUpdated: now },
    { location: 'Transit Hub', quantity: 50 + i, lastUpdated: now },
  ],
  pricingHistory: [
    { date: '2025-01-01', price: 45 + (i % 10), currency: 'USD' },
    { date: now, price: 50 + (i % 10), currency: 'USD' },
  ],
  documents: [
    { id: `DOC-${i}`, name: 'Product Manual.pdf', type: 'PDF', url: '#', uploadedAt: now },
  ],
  entityStatus: 'ACTIVE',
  createdAt: now,
  updatedAt: now,
}));

db.customers = Array.from({ length: 25 }).map((_, i) => ({
  id: generateId('CUST', i),
  name: `Global Trade ${String.fromCharCode(65 + i)}`,
  email: `info@trade${i}.com`,
  phone: `+1-555-${1000 + i}`,
  address: `${i + 10} Industrial Way`,
  country: ['USA', 'Germany', 'UAE', 'Singapore'][i % 4],
  contacts: [
    { name: `John Doe ${i}`, role: 'Procurement Manager', email: `john@trade${i}.com`, phone: `+1-555-${2000 + i}`, isPrimary: true },
  ],
  creditLimit: 50000 + (i * 10000),
  paymentTerms: '30 Days Net',
  communicationTimeline: [
    { id: `EV-${i}`, date: now, type: 'EMAIL', title: 'Introduction', description: 'Sent introduction email', userId: 'USR-001' },
  ],
  entityStatus: 'ACTIVE',
  createdAt: now,
  updatedAt: now,
}));

db.suppliers = Array.from({ length: 20 }).map((_, i) => ({
  id: generateId('SUPP', i),
  name: `Supply Corp ${i + 1}`,
  email: `sales@supply${i}.com`,
  phone: `+91-999-${2000 + i}`,
  address: `Plot ${i + 5}, SEZ Phase 1`,
  country: 'India',
  contacts: [
    { name: `Jane Smith ${i}`, role: 'Sales Lead', email: `jane@supply${i}.com`, phone: `+91-999-${3000 + i}`, isPrimary: true },
  ],
  performanceRating: 4 + (i % 2 === 0 ? 0.5 : -0.5),
  averageLeadTime: 15 + (i % 5),
  certifications: ['ISO 9001', 'CE'],
  productsSuppliedIds: [],
  paymentTerms: '15 Days Advance',
  documents: [],
  entityStatus: 'ACTIVE',
  createdAt: now,
  updatedAt: now,
}));

db.forwarders = Array.from({ length: 15 }).map((_, i) => ({
  id: generateId('FWD', i),
  name: `LogisFast ${i + 1}`,
  contactPerson: `Agent ${i + 1}`,
  email: `booking@logisfast${i}.com`,
  phone: `+81-3-1234-${1000 + i}`,
  rating: 4.5,
  preferredPorts: ['TYO', 'OSA'],
  entityStatus: 'ACTIVE',
  createdAt: now,
  updatedAt: now,
}));

db.shippingLines = [
  { id: 'ONE', name: 'Ocean Network Express', code: 'ONE', entityStatus: 'ACTIVE', createdAt: now, updatedAt: now },
  { id: 'MAERSK', name: 'Maersk Line', code: 'MAEU', entityStatus: 'ACTIVE', createdAt: now, updatedAt: now },
  { id: 'MSC', name: 'Mediterranean Shipping Company', code: 'MSCU', entityStatus: 'ACTIVE', createdAt: now, updatedAt: now },
  { id: 'CMA', name: 'CMA CGM', code: 'CMAC', entityStatus: 'ACTIVE', createdAt: now, updatedAt: now },
];

db.ports = [
  { id: 'TYO', name: 'Tokyo', code: 'JP TYO', country: 'Japan', type: 'SEA', entityStatus: 'ACTIVE', createdAt: now, updatedAt: now },
  { id: 'OSA', name: 'Osaka', code: 'JP OSA', country: 'Japan', type: 'SEA', entityStatus: 'ACTIVE', createdAt: now, updatedAt: now },
  { id: 'LAX', name: 'Los Angeles', code: 'US LAX', country: 'USA', type: 'SEA', entityStatus: 'ACTIVE', createdAt: now, updatedAt: now },
  { id: 'SIN', name: 'Singapore', code: 'SG SIN', country: 'Singapore', type: 'SEA', entityStatus: 'ACTIVE', createdAt: now, updatedAt: now },
];

db.currencies = [
  { id: 'USD', code: 'USD', name: 'US Dollar', symbol: '$', exchangeRate: 1, entityStatus: 'ACTIVE', createdAt: now, updatedAt: now },
  { id: 'JPY', code: 'JPY', name: 'Japanese Yen', symbol: '¥', exchangeRate: 158.5, entityStatus: 'ACTIVE', createdAt: now, updatedAt: now },
  { id: 'INR', code: 'INR', name: 'Indian Rupee', symbol: '₹', exchangeRate: 83.5, entityStatus: 'ACTIVE', createdAt: now, updatedAt: now },
];

// Seed Sprint 7 Data
db.quotations = Array.from({ length: 150 }).map((_, i) => {
  const customer = db.customers[i % db.customers.length];
  const items = Array.from({ length: 2 }).map((_, j) => {
    const product = db.products[(i + j) % db.products.length];
    return {
      productId: product.id,
      quantity: 100 + (j * 50),
      unitPrice: 50 + (i % 100),
      totalPrice: (100 + (j * 50)) * (50 + (i % 100)),
    };
  });
  const totalValue = items.reduce((acc, item) => acc + item.totalPrice, 0);
  return {
    id: generateId('QT', i),
    quotationNo: `QT-2025-${(i + 1).toString().padStart(4, '0')}`,
    customerId: customer.id,
    date: new Date(Date.now() - i * 86400000).toISOString(),
    validityDate: new Date(Date.now() + 30 * 86400000).toISOString(),
    currency: 'USD',
    exchangeRate: 1,
    incoterm: ['FOB', 'CIF', 'CFR'][i % 3] as any,
    paymentTerms: '30 Days Net',
    originPortId: 'TYO',
    destinationPortId: 'LAX',
    containerType: '20GP',
    items,
    totalValue,
    marginPercentage: 25,
    status: ['DRAFT', 'SENT', 'APPROVED', 'REJECTED'][i % 4] as any,
    version: 1,
    entityStatus: 'ACTIVE',
    createdAt: now,
    updatedAt: now,
  } as any; // Cast to bypass strict BaseEntity for now
});

db.salesOrders = Array.from({ length: 80 }).map((_, i) => {
  const quote = db.quotations.filter(q => q.status === 'APPROVED')[i % 20] || db.quotations[i];
  return {
    id: generateId('SO', i),
    orderNo: `SO-2025-${(i + 1).toString().padStart(4, '0')}`,
    quotationId: quote.id,
    customerId: quote.customerId,
    date: quote.date,
    expectedShipmentDate: new Date(Date.now() + 45 * 86400000).toISOString(),
    items: quote.items,
    totalValue: quote.totalValue,
    status: 'CONFIRMED',
    entityStatus: 'ACTIVE',
    createdAt: now,
    updatedAt: now,
  } as any;
});

db.shipments = Array.from({ length: 120 }).map((_, i) => {
  const order = db.salesOrders[i % db.salesOrders.length];
  return {
    id: generateId('SHP', i),
    shipmentNo: `SHP-2025-${(i + 1).toString().padStart(4, '0')}`,
    orderId: order.id,
    shippingLineId: 'MAERSK',
    forwarderId: 'FWD-0001',
    originPortId: 'TYO',
    destinationPortId: 'LAX',
    etd: new Date(Date.now() + i * 86400000).toISOString(),
    eta: new Date(Date.now() + (i + 15) * 86400000).toISOString(),
    containerType: '20GP',
    grossWeight: 12000,
    netWeight: 11000,
    cbm: 28,
    status: ['TRANSIT', 'STUFFING', 'ON_VESSEL'][i % 3] as any,
    timeline: [],
    entityStatus: 'ACTIVE',
    createdAt: now,
    updatedAt: now,
  } as any;
});

db.tasks = Array.from({ length: 100 }).map((_, i) => ({
  id: generateId('TASK', i),
  title: `Task ${i + 1}: ${['Follow up', 'Check Documents', 'Confirm Booking'][i % 3]}`,
  description: `Detail description for task ${i + 1}`,
  dueDate: new Date(Date.now() + (i % 10) * 86400000).toISOString(),
  priority: ['LOW', 'MEDIUM', 'HIGH'][i % 3] as any,
  category: ['QUOTATION', 'SHIPMENT', 'DOCUMENT'][i % 3] as any,
  isCompleted: i % 5 === 0,
  entityStatus: 'ACTIVE',
  createdAt: now,
  updatedAt: now,
}));

db.calendarEvents = Array.from({ length: 365 }).map((_, i) => ({
  id: generateId('EVT', i),
  title: `Shipment ETD ${i + 1}`,
  start: new Date(Date.now() + i * 86400000).toISOString(),
  end: new Date(Date.now() + i * 86400000 + 3600000).toISOString(),
  type: 'ETD',
  relatedId: `SHP-${(i % 120 + 1).toString().padStart(4, '0')}`,
  entityStatus: 'ACTIVE',
  createdAt: now,
  updatedAt: now,
}));

db.notifications = Array.from({ length: 20 }).map((_, i) => ({
  id: generateId('NOTIF', i),
  title: ['Shipment Delayed', 'Quotation Approved', 'Payment Overdue', 'New Task Assigned'][i % 4],
  message: `This is a detailed notification message for event ${i + 1}.`,
  type: ['WARNING', 'SUCCESS', 'ERROR', 'INFO'][i % 4] as any,
  priority: ['HIGH', 'MEDIUM', 'LOW'][i % 3] as any,
  isRead: i > 5,
  relatedId: generateId('SHP', i % 10),
  relatedType: 'SHIPMENT',
  entityStatus: 'ACTIVE',
  createdAt: now,
  updatedAt: now,
}));

db.auditLogs = Array.from({ length: 50 }).map((_, i) => ({
  id: generateId('AUDIT', i),
  userId: 'USR-001',
  userName: 'Admin User',
  action: ['CREATE', 'UPDATE', 'DELETE', 'APPROVE'][i % 4],
  entityType: ['QUOTATION', 'SHIPMENT', 'PRODUCT', 'CUSTOMER'][i % 4],
  entityId: generateId('QT', i % 20),
  details: `User performed ${i % 4} action on entity`,
  entityStatus: 'ACTIVE',
  createdAt: new Date(Date.now() - i * 3600000).toISOString(),
  updatedAt: new Date(Date.now() - i * 3600000).toISOString(),
}));
