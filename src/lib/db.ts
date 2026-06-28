import {
  Product, Customer, Supplier, Forwarder, ShippingLine, Port, Currency, 
  Quotation, SalesOrder, PurchaseOrder, Shipment, Task, CalendarEvent, Notification, AuditLog, ERPDocument,
  CostingScenario
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
  documents: [] as ERPDocument[],
  costingScenarios: [] as CostingScenario[],
};

// Seed Data Helpers
function generateId(prefix: string, index: number) {
  return `${prefix}-${(index + 1).toString().padStart(4, '0')}`;
}

const now = new Date().toISOString();

// Seed Master Data
// Seed Master Data
const commodities = [
  { name: 'Premium Basmati Rice (1121)', category: 'Rice', brand: 'ExLogis Select', sku: 'BMR-1121', hsnCode: '1006.30.20', uom: 'BAG', purchasePrice: 42, sellingPrice: 58, grossWeight: 25.2, netWeight: 25.0, cbm: 0.045 },
  { name: 'Organic Jasmine Rice', category: 'Rice', brand: 'ExLogis Select', sku: 'JMR-ORG', hsnCode: '1006.30.10', uom: 'BAG', purchasePrice: 38, sellingPrice: 52, grossWeight: 20.15, netWeight: 20.0, cbm: 0.038 },
  { name: 'Toor Dal (Split Pigeon Peas)', category: 'Dals', brand: 'Organic India', sku: 'TRD-SPL', hsnCode: '0713.60.00', uom: 'BAG', purchasePrice: 28, sellingPrice: 39, grossWeight: 25.1, netWeight: 25.0, cbm: 0.04 },
  { name: 'Chana Dal (Bengal Gram Split)', category: 'Dals', brand: 'Organic India', sku: 'CND-DESI', hsnCode: '0713.31.00', uom: 'BAG', purchasePrice: 22, sellingPrice: 32, grossWeight: 25.1, netWeight: 25.0, cbm: 0.04 },
  { name: 'Masoor Dal (Split Red Lentils)', category: 'Dals', brand: 'Organic India', sku: 'MSD-RED', hsnCode: '0713.40.00', uom: 'BAG', purchasePrice: 24, sellingPrice: 35, grossWeight: 25.1, netWeight: 25.0, cbm: 0.04 },
  { name: 'Moong Dal (Yellow Split)', category: 'Dals', brand: 'Organic India', sku: 'MGD-YEL', hsnCode: '0713.31.90', uom: 'BAG', purchasePrice: 30, sellingPrice: 42, grossWeight: 25.1, netWeight: 25.0, cbm: 0.04 },
  { name: 'High Protein Soya Chunks', category: 'Snacks', brand: 'Matrix Food', sku: 'SYC-PRO', hsnCode: '2106.90.99', uom: 'CRT', purchasePrice: 15, sellingPrice: 22, grossWeight: 10.5, netWeight: 10.0, cbm: 0.06 },
  { name: 'Flattened Rice (Medium Poha)', category: 'Snacks', brand: 'Matrix Food', sku: 'POH-MED', hsnCode: '1904.10.90', uom: 'BAG', purchasePrice: 18, sellingPrice: 26, grossWeight: 15.2, netWeight: 15.0, cbm: 0.035 },
  { name: 'Premium Semolina (Sooji)', category: 'Snacks', brand: 'Matrix Food', sku: 'SEM-FINE', hsnCode: '1103.11.00', uom: 'BAG', purchasePrice: 16, sellingPrice: 24, grossWeight: 20.15, netWeight: 20.0, cbm: 0.032 },
  { name: 'Finger Millet (Ragi)', category: 'Millets', brand: 'Matrix Food', sku: 'MIL-FNG', hsnCode: '1008.29.30', uom: 'BAG', purchasePrice: 20, sellingPrice: 30, grossWeight: 25.1, netWeight: 25.0, cbm: 0.04 },
  { name: 'Turmeric Powder (High Curcumin)', category: 'Spices', brand: 'Zenith Spices', sku: 'SPC-TUR', hsnCode: '0910.30.00', uom: 'CRT', purchasePrice: 35, sellingPrice: 50, grossWeight: 10.3, netWeight: 10.0, cbm: 0.025 },
  { name: 'Kashmiri Red Chilli Powder', category: 'Spices', brand: 'Zenith Spices', sku: 'SPC-RCH', hsnCode: '0904.22.00', uom: 'CRT', purchasePrice: 45, sellingPrice: 65, grossWeight: 10.3, netWeight: 10.0, cbm: 0.025 },
  { name: 'Green Cardamom (8mm)', category: 'Spices', brand: 'Zenith Spices', sku: 'SPC-CRD', hsnCode: '0908.31.00', uom: 'CRT', purchasePrice: 120, sellingPrice: 165, grossWeight: 5.2, netWeight: 5.0, cbm: 0.015 },
  { name: 'Whole Cumin Seeds', category: 'Spices', brand: 'Zenith Spices', sku: 'SPC-CUM', hsnCode: '0909.31.00', uom: 'BAG', purchasePrice: 55, sellingPrice: 80, grossWeight: 25.1, netWeight: 25.0, cbm: 0.042 },
  { name: 'Black Pepper (550 GL)', category: 'Spices', brand: 'Zenith Spices', sku: 'SPC-BKP', hsnCode: '0904.11.00', uom: 'BAG', purchasePrice: 60, sellingPrice: 85, grossWeight: 25.1, netWeight: 25.0, cbm: 0.042 }
];

db.products = Array.from({ length: 50 }).map((_, i) => {
  const comm = commodities[i % commodities.length];
  const prodId = generateId('PROD', i);
  const supplierId = generateId('SUPP', i % 20);
  const forwarderId = generateId('FWD', i % 15);
  
  return {
    id: prodId,
    sku: `${comm.sku}-${(100 + i).toString()}`,
    name: `${comm.name} - Grade ${String.fromCharCode(65 + (i % 3))}`,
    description: `Premium export quality ${comm.name} sourced under strict phytosanitary guidelines. Ready for containerized logistics.`,
    category: comm.category,
    brand: comm.brand,
    countryOfOrigin: i % 3 === 0 ? 'India' : i % 3 === 1 ? 'Vietnam' : 'Thailand',
    hsnCode: comm.hsnCode.replace(/\./g, ''), // Numeric HSN
    uom: comm.uom,
    
    // Commercial
    purchasePrice: comm.purchasePrice + (i % 5),
    sellingPrice: comm.sellingPrice + (i % 8),
    currency: 'USD',
    moq: 100 + (i % 5) * 50,
    leadTime: 10 + (i % 4) * 5,

    // Packaging
    packageType: comm.uom === 'BAG' ? 'PP Woven Bag' : 'Corrugated Carton',
    unitsPerCarton: comm.uom === 'BAG' ? 1 : 24,
    grossWeight: comm.grossWeight,
    netWeight: comm.netWeight,
    cbm: comm.cbm,
    containerLoadingCapacity: comm.uom === 'BAG' ? 800 : 1200,

    // Compliance
    shelfLife: '24 Months',
    storageConditions: comm.category === 'Rice' || comm.category === 'Dals' ? 'Dry, Cool Ventilated Store' : 'Cool & Dark, Low Humidity',
    certifications: ['FSSAI', 'HACCP', 'Phytosanitary Certificate'],
    japanImportNotes: 'Subject to strict pesticide residue testing at Japanese Customs quarantine stations.',

    // Relationships
    supplierId,
    preferredForwarderId: forwarderId,
    defaultPackagingType: comm.uom === 'BAG' ? '25KG PP Woven Bag' : 'Standard Carton box',
    images: [`https://picsum.photos/seed/${i}/400/400`],
    documents: [
      { id: `DOC-${i}-1`, name: 'Phytosanitary_Report.pdf', type: 'PDF', url: '#', uploadedAt: now },
      { id: `DOC-${i}-2`, name: 'Pesticide_Analysis_Report.pdf', type: 'PDF', url: '#', uploadedAt: now }
    ],

    // History & Tracking
    timeline: [
      { id: `EV-${prodId}-1`, date: now, type: 'CREATED', title: 'Product Registered', description: 'Agricultural commodity registered in master index.', userId: 'USR-001' }
    ],
    purchaseHistory: [
      { date: '2025-01-10', supplierId, quantity: 500, unitPrice: comm.purchasePrice - 2, poNo: `PO-2025-00${i % 10 + 10}` }
    ],
    sellingHistory: [
      { date: '2025-02-15', customerId: generateId('CUST', i % 25), quantity: 200, unitPrice: comm.sellingPrice + 2, soNo: `SO-2025-00${i % 10 + 10}` }
    ],
    inventorySummary: [
      { location: 'Main Warehouse (Mumbai)', quantity: 500 + i * 10, lastUpdated: now },
      { location: 'Transit Port (Nhava Sheva)', quantity: 50 + i, lastUpdated: now }
    ],
    pricingHistory: [
      { date: '2025-01-01', price: comm.sellingPrice - 4, currency: 'USD' },
      { date: now, price: comm.sellingPrice, currency: 'USD' }
    ],
    entityStatus: 'ACTIVE',
    createdAt: now,
    updatedAt: now
  } as any;
});

const clientNames = [
  { name: 'Nihon Shokuhin Co.', country: 'Japan', port: 'TYO', manager: 'USR-001' },
  { name: 'Dubai AgriFoods LLC', country: 'UAE', port: 'SIN', manager: 'USR-002' },
  { name: 'Apex Bulk Trading Inc.', country: 'USA', port: 'LAX', manager: 'USR-003' },
  { name: 'EuroGourmet Distributors', country: 'Germany', port: 'SIN', manager: 'USR-001' },
  { name: 'Singapore Grain Importers', country: 'Singapore', port: 'SIN', manager: 'USR-002' },
  { name: 'London Spices & Herbs Ltd', country: 'UK', port: 'SIN', manager: 'USR-003' },
  { name: 'Sydney Harvest Trading', country: 'Australia', port: 'SIN', manager: 'USR-001' },
  { name: 'Tokyo Grains Ltd.', country: 'Japan', port: 'OSA', manager: 'USR-002' },
  { name: 'Gulf Foodworld Trading', country: 'UAE', port: 'SIN', manager: 'USR-003' },
  { name: 'USA AgriFoods Inc.', country: 'USA', port: 'LAX', manager: 'USR-001' },
  { name: 'Apex Distributors Ltd', country: 'Canada', port: 'LAX', manager: 'USR-002' },
  { name: 'Hamburg Trade Center', country: 'Germany', port: 'SIN', manager: 'USR-003' },
  { name: 'Straits Commodities', country: 'Singapore', port: 'SIN', manager: 'USR-001' },
  { name: 'Rotterdam Grain Corp', country: 'Netherlands', port: 'SIN', manager: 'USR-002' },
  { name: 'Auckland Food Logistics', country: 'New Zealand', port: 'SIN', manager: 'USR-003' },
  { name: 'Pacific Rim Logistics', country: 'USA', port: 'LAX', manager: 'USR-001' },
  { name: 'Middle East Foodworld', country: 'Saudi Arabia', port: 'SIN', manager: 'USR-002' },
  { name: 'Oriental Food Distributors', country: 'Taiwan', port: 'SIN', manager: 'USR-003' },
  { name: 'Seoul Agro Trading', country: 'South Korea', port: 'SIN', manager: 'USR-001' },
  { name: 'Manila Harvest Inc.', country: 'Manila', port: 'SIN', manager: 'USR-002' },
  { name: 'Manila Grain Traders', country: 'Philippines', port: 'SIN', manager: 'USR-003' },
  { name: 'Bangkok Spice Importers', country: 'Thailand', port: 'SIN', manager: 'USR-001' },
  { name: 'Vietnam Rice Traders', country: 'Vietnam', port: 'SIN', manager: 'USR-002' },
  { name: 'Cairo Food Distributors', country: 'Egypt', port: 'SIN', manager: 'USR-003' },
  { name: 'Cape Town Grains Ltd', country: 'South Africa', port: 'SIN', manager: 'USR-001' }
];

db.customers = Array.from({ length: 25 }).map((_, i) => {
  const info = clientNames[i % clientNames.length];
  const nameSafe = info.name.toLowerCase().replace(/[^a-z0-9]/g, '');
  const email = `contact@${nameSafe}.com`;
  const website = `https://www.${nameSafe}.com`;
  const segment = (i % 3 === 0 ? 'PREMIUM' : i % 3 === 1 ? 'STANDARD' : 'LOW_VOLUME') as any;
  const custId = generateId('CUST', i);
  
  return {
    id: custId,
    name: info.name,
    email,
    phone: `+${1 + (i % 9) * 3}-${555}-${1000 + i}`,
    address: `${100 + i} Trade Boulevard, Zone ${i + 1}`,
    country: info.country,
    contacts: [
      {
        name: `Agent ${String.fromCharCode(65 + i)} ${i + 1}`,
        role: i % 2 === 0 ? 'Procurement Lead' : 'Supply Manager',
        email: `agent.${String.fromCharCode(97 + i)}@${nameSafe}.com`,
        phone: `+${1 + (i % 9) * 3}-${555}-${2000 + i}`,
        isPrimary: true
      }
    ],
    creditLimit: segment === 'PREMIUM' ? 250000 : segment === 'STANDARD' ? 100000 : 30000,
    paymentTerms: ['30 Days Net', '15 Days Advance', 'Letter of Credit', '60 Days Net'][i % 4],
    notes: `Long-term agricultural commodities buyer in ${info.country}. Prefers discharge port: ${info.port}.`,
    website,
    taxId: `TAX-ID-${88888 + i}`,
    segment,
    accountManagerId: info.manager,
    preferredDischargePortId: info.port,
    documents: [
      { id: `DOC-${custId}-1`, name: 'Business_Certificate.pdf', type: 'PDF', url: '#', uploadedAt: now }
    ],
    timeline: [
      { id: `EV-${custId}-1`, date: now, type: 'CREATED', title: 'Customer Profile Onboarded', description: `Client node registered under ${segment} segment.`, userId: info.manager }
    ],
    entityStatus: 'ACTIVE',
    createdAt: now,
    updatedAt: now
  } as any;
});

const supplierNames = [
  { name: 'Karnataka Agri-Cooperative', country: 'India', prefix: 'kac' },
  { name: 'Punjab Grain Merchants Association', country: 'India', prefix: 'pgma' },
  { name: 'Mekong Delta Rice Growers', country: 'Vietnam', prefix: 'mdrg' },
  { name: 'Saigon Spice Exporters', country: 'Vietnam', prefix: 'sse' },
  { name: 'Siam Organic Agriculture Co.', country: 'Thailand', prefix: 'soac' },
  { name: 'Bangkok Spice Export Hub', country: 'Thailand', prefix: 'bseh' },
  { name: 'Gujarat Spices Federation', country: 'India', prefix: 'gsf' },
  { name: 'Andhra Agri Farms Co.', country: 'India', prefix: 'aafc' },
  { name: 'Thanh Hoa Cinnamon Producers', country: 'Vietnam', prefix: 'thcp' },
  { name: 'Chiang Mai Rice Millers', country: 'Thailand', prefix: 'cmrm' },
  { name: 'Maharashtra Lentil Supply', country: 'India', prefix: 'mls' },
  { name: 'Danang Herb and Pepper Corp', country: 'Vietnam', prefix: 'dhpc' },
  { name: 'Phuket Organic Plantation', country: 'Thailand', prefix: 'pop' },
  { name: 'Rajasthan Cumin Breeders Ltd', country: 'India', prefix: 'rcbl' },
  { name: 'Dong Nai Cashew and Grain Co.', country: 'Vietnam', prefix: 'dncg' },
  { name: 'Uttarakhand Millets Growers', country: 'India', prefix: 'umg' },
  { name: 'Hanoi Anise and Cassia Exporters', country: 'Vietnam', prefix: 'hace' },
  { name: 'Pattaya Fruit and Grain Traders', country: 'Thailand', prefix: 'pfgt' },
  { name: 'Kerala Cardamom and Pepper Association', country: 'India', prefix: 'kcpa' },
  { name: 'Nha Trang Seafood and Salt Mills', country: 'Vietnam', prefix: 'ntss' }
];

db.suppliers = Array.from({ length: 20 }).map((_, i) => {
  const info = supplierNames[i % supplierNames.length];
  const email = `sales@${info.prefix}.com`;
  const website = `https://www.${info.prefix}.com`;
  const suppId = generateId('SUPP', i);
  const rating = 4.0 + (i % 10) * 0.1;
  const leadTime = 10 + (i % 4) * 5;
  const certs = [['FSSAI', 'HACCP'], ['ISO 9001', 'FSSAI', 'Organic Certified'], ['HACCP', 'ISO 22000', 'CE']][i % 3];

  return {
    id: suppId,
    name: info.name,
    email,
    phone: `+${91 + (i % 3) * 5}-999-${2000 + i}`,
    address: `${20 + i} Industrial Area, Phase ${i % 3 + 1}, ${info.country}`,
    country: info.country,
    contacts: [
      {
        name: `Vendor Manager ${String.fromCharCode(65 + i)}`,
        role: 'Commercial Lead',
        email: `manager@${info.prefix}.com`,
        phone: `+${91 + (i % 3) * 5}-999-${3000 + i}`,
        isPrimary: true
      }
    ],
    performanceRating: rating,
    averageLeadTime: leadTime,
    certifications: certs,
    productsSuppliedIds: [],
    paymentTerms: ['15 Days Advance', '30 Days Net', 'LC at Sight'][i % 3],
    notes: `Certified agricultural supplier in ${info.country}. Specialized in bulk commodities.`,
    website,
    taxId: `TAX-VEND-${77777 + i}`,
    documents: [
      { id: `DOC-${suppId}-1`, name: 'Quality_Certificate.pdf', type: 'PDF', url: '#', uploadedAt: now }
    ],
    timeline: [
      { id: `EV-${suppId}-1`, date: now, type: 'CREATED', title: 'Supplier Hub Registered', description: `Registered cooperative supplier with rating ${rating}.`, userId: 'USR-001' }
    ],
    entityStatus: 'ACTIVE',
    createdAt: now,
    updatedAt: now
  } as any;
});

// Update products supplied references dynamically
db.suppliers.forEach(s => {
  s.productsSuppliedIds = db.products.filter(p => p.supplierId === s.id).map(p => p.id);
});

const forwarderNames = [
  { name: 'Nippon Express Cargo', country: 'Japan', prefix: 'necx' },
  { name: 'Kuehne+Nagel Logistics', country: 'Singapore', prefix: 'knl' },
  { name: 'DHL Global Forwarding', country: 'Germany', prefix: 'dgf' },
  { name: 'DSV Air & Sea Inc.', country: 'USA', prefix: 'dsv' },
  { name: 'Expeditors International', country: 'UAE', prefix: 'exp' },
  { name: 'Yusen Logistics', country: 'Vietnam', prefix: 'ylv' },
  { name: 'DB Schenker Cargo', country: 'Thailand', prefix: 'dbs' },
  { name: 'Bollore Logistics', country: 'Singapore', prefix: 'bol' },
  { name: 'Toll Global Forwarding', country: 'Australia', prefix: 'tgf' },
  { name: 'Sinotrans Cargo Ltd', country: 'China', prefix: 'scl' },
  { name: 'Hellmann Worldwide Logistics', country: 'Germany', prefix: 'hwl' },
  { name: 'Geodis Freight Services', country: 'USA', prefix: 'gfs' },
  { name: 'C.H. Robinson International', country: 'Canada', prefix: 'chr' },
  { name: 'CEVA Logistics Middle East', country: 'UAE', prefix: 'ceva' },
  { name: 'Agility Logistics Cargo', country: 'Kuwait', prefix: 'alc' }
];

db.forwarders = Array.from({ length: 15 }).map((_, i) => {
  const info = forwarderNames[i % forwarderNames.length];
  const email = `booking@${info.prefix}.com`;
  const website = `https://www.${info.prefix}.com`;
  const fwdId = generateId('FWD', i);
  const rating = 4.1 + (i % 8) * 0.1;
  const portsList = [['TYO', 'OSA'], ['SIN', 'LAX'], ['TYO', 'SIN'], ['LAX', 'OSA']][i % 4];

  return {
    id: fwdId,
    name: info.name,
    email,
    phone: `+${81 + (i % 4) * 10}-3-1234-${1000 + i}`,
    address: `${50 + i} Logistics Way, Terminal ${i % 3 + 1}, ${info.country}`,
    country: info.country,
    contacts: [
      {
        name: `Logistics Agent ${String.fromCharCode(65 + i)}`,
        role: 'Booking Officer',
        email: `agent@${info.prefix}.com`,
        phone: `+${81 + (i % 4) * 10}-3-5555-${2000 + i}`,
        isPrimary: true
      }
    ],
    rating,
    preferredPorts: portsList,
    notes: `Global freight forwarder specialized in bulk grain container shipping out of ${info.country}.`,
    website,
    taxId: `TX-FWD-${66666 + i}`,
    documents: [
      { id: `DOC-${fwdId}-1`, name: 'Carrier_Agreement.pdf', type: 'PDF', url: '#', uploadedAt: now }
    ],
    timeline: [
      { id: `EV-${fwdId}-1`, date: now, type: 'CREATED', title: 'Forwarder Agency Onboarded', description: `Registered freight agency with coverage in ports: ${portsList.join(', ')}.`, userId: 'USR-001' }
    ],
    entityStatus: 'ACTIVE',
    createdAt: now,
    updatedAt: now
  } as any;
});

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
  const qId = generateId('QT', i);
  const status = ['DRAFT', 'SENT', 'APPROVED', 'REJECTED'][i % 4] as any;
  const qNo = `QT-2025-${(i + 1).toString().padStart(4, '0')}`;

  return {
    id: qId,
    quotationNo: qNo,
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
    status,
    version: 1,
    timeline: [
      {
        id: `EV-${qId}-1`,
        date: new Date(Date.now() - i * 86400000).toISOString(),
        type: 'CREATED',
        title: 'Commercial Proposal Formed',
        description: `Created initial commercial proposal v1.0 referencing customer ${customer.name}.`,
        userId: 'USR-001'
      }
    ],
    documents: [
      { id: `DOC-${qId}-1`, name: `Quotation_${qNo}.pdf`, type: 'PDF', url: '#', uploadedAt: now }
    ],
    entityStatus: 'ACTIVE',
    createdAt: now,
    updatedAt: now,
  } as any;
});

db.salesOrders = (() => {
  const statuses: Array<'CONFIRMED' | 'PRODUCTION' | 'READY' | 'SHIPPED' | 'CANCELLED'> = [
    'CONFIRMED', 'PRODUCTION', 'READY', 'SHIPPED', 'SHIPPED', 'CONFIRMED', 'PRODUCTION', 'CANCELLED', 'READY', 'SHIPPED'
  ];
  const incoterms = ['FOB', 'CIF', 'CFR', 'DDP', 'FOB', 'CIF', 'FOB', 'CFR', 'DDP', 'FOB'];
  const paymentTermsList = ['30 Days Net', 'LC at Sight', '15 Days Advance', '30 Days Net', 'TT in Advance', '60 Days Net', '30 Days Net', 'LC at Sight', '30 Days Net', '30 Days Net'];
  const containerTypes = ['20GP', '40GP', '40HQ', '20GP', '40GP', '20GP', '40HQ', '40GP', '20GP', '40GP'];
  const remarks = [
    'Phytosanitary certificate required prior to loading.',
    'Quality inspection by buyer-appointed surveyor at origin port.',
    'Pre-shipment sample to be dispatched 7 days before ETD.',
    'Fumigation certificate mandatory for all wooden packaging.',
    'L/C terms to be finalized by buyer within 5 business days.',
  ];

  return Array.from({ length: 30 }).map((_, i) => {
    const quote = db.quotations.filter(q => q.status === 'APPROVED')[i % 15] || db.quotations[i % db.quotations.length];
    const status = statuses[i % statuses.length];
    const soId = generateId('SO', i);
    const soNo = `SO-2025-${(i + 1).toString().padStart(4, '0')}`;
    const orderDate = new Date(Date.now() - (30 - i) * 86400000).toISOString();
    const shipDate = new Date(Date.now() + (i + 10) * 86400000).toISOString();

    const timelineEvents: import('../types').SalesOrderTimelineEvent[] = [
      {
        id: `EV-${soId}-1`,
        date: orderDate,
        type: 'CREATED',
        title: 'Sales Order Created',
        description: `Confirmed export contract ${soNo} generated from approved quotation ${quote.quotationNo}.`,
        userId: 'USR-001'
      }
    ];

    if (status === 'PRODUCTION' || status === 'READY' || status === 'SHIPPED') {
      timelineEvents.push({
        id: `EV-${soId}-2`,
        date: new Date(new Date(orderDate).getTime() + 2 * 86400000).toISOString(),
        type: 'PRODUCTION_STARTED' as const,
        title: 'Production / Procurement Initiated',
        description: 'Supplier notified. Production schedule confirmed. Factory booking placed.',
        userId: 'USR-001'
      });
    }
    if (status === 'READY' || status === 'SHIPPED') {
      timelineEvents.push({
        id: `EV-${soId}-3`,
        date: new Date(new Date(orderDate).getTime() + 14 * 86400000).toISOString(),
        type: 'READY_FOR_SHIPMENT' as const,
        title: 'Cargo Ready at Origin Warehouse',
        description: 'Goods inspected and passed quality check. Pre-shipment sample dispatched to buyer.',
        userId: 'USR-001'
      });
    }
    if (status === 'SHIPPED') {
      timelineEvents.push({
        id: `EV-${soId}-4`,
        date: new Date(new Date(orderDate).getTime() + 20 * 86400000).toISOString(),
        type: 'SHIPPED' as const,
        title: 'Cargo Loaded — Bill of Lading Issued',
        description: `Vessel departed. B/L issued. Container sealed and on-board confirmed.`,
        userId: 'USR-001'
      });
    }
    if (status === 'CANCELLED') {
      timelineEvents.push({
        id: `EV-${soId}-2`,
        date: new Date(new Date(orderDate).getTime() + 3 * 86400000).toISOString(),
        type: 'CANCELLED' as const,
        title: 'Order Cancelled by Buyer',
        description: 'Order cancelled due to buyer financing constraints. Cancellation confirmed.',
        userId: 'USR-001'
      });
    }

    return {
      id: soId,
      orderNo: soNo,
      quotationId: quote.id,
      customerId: quote.customerId,
      date: orderDate,
      expectedShipmentDate: shipDate,
      items: quote.items,
      totalValue: quote.totalValue,
      marginPercentage: quote.marginPercentage || 25,
      currency: quote.currency || 'USD',
      exchangeRate: quote.exchangeRate || 1,
      incoterm: incoterms[i % incoterms.length],
      paymentTerms: paymentTermsList[i % paymentTermsList.length],
      originPortId: quote.originPortId || 'TYO',
      destinationPortId: quote.destinationPortId || 'LAX',
      containerType: containerTypes[i % containerTypes.length],
      status,
      remarks: remarks[i % remarks.length],
      timeline: timelineEvents,
      documents: [
        { id: `DOC-${soId}-1`, name: `ProformaInvoice_${soNo}.pdf`, type: 'PDF', url: '#', uploadedAt: orderDate },
        ...(status === 'SHIPPED' ? [
          { id: `DOC-${soId}-2`, name: `BillOfLading_${soNo}.pdf`, type: 'PDF', url: '#', uploadedAt: shipDate },
          { id: `DOC-${soId}-3`, name: `PackingList_${soNo}.pdf`, type: 'PDF', url: '#', uploadedAt: shipDate },
        ] : [])
      ],
      entityStatus: status === 'CANCELLED' ? 'INACTIVE' : 'ACTIVE',
      createdAt: orderDate,
      updatedAt: now,
    } as any;
  });
})();

db.purchaseOrders = (() => {
  const poStatuses: Array<'DRAFT' | 'ISSUED' | 'ACKNOWLEDGED' | 'IN_PRODUCTION' | 'DISPATCHED' | 'RECEIVED' | 'CANCELLED'> = [
    'ISSUED', 'ACKNOWLEDGED', 'IN_PRODUCTION', 'DISPATCHED', 'RECEIVED',
    'ISSUED', 'IN_PRODUCTION', 'RECEIVED', 'CANCELLED', 'ACKNOWLEDGED',
    'DISPATCHED', 'RECEIVED', 'ISSUED', 'IN_PRODUCTION', 'DISPATCHED'
  ];
  const paymentTermsOptions = [
    '100% Advance', '50% Advance 50% on Dispatch', '30 Days from Invoice',
    'LC 90 Days', 'TT Against Shipping Documents', '100% Advance',
    '30 Days Net', '50% Advance 50% on Dispatch'
  ];
  const deliveryTermsOptions = ['Ex-Factory', 'FOR Destination', 'CIF Destination Port', 'Ex-Factory', 'FOR Origin Warehouse', 'Ex-Factory'];
  const qualitySpecs = [
    'Food-grade, moisture content < 13%. Pre-shipment quality certification required.',
    'Organic certified. Grade A, no pesticide residue. SGS inspection at factory.',
    'Export grade, sortex cleaned. Aflatoxin test report required.',
    'Premium grade, double polished. Certificate of Origin mandatory.',
    'FSSAI & APEDA certified. Fumigation certificate pre-loading.'
  ];
  const packagingSpecs = [
    'New 25kg PP woven bags with inner PE liner. 600 bags per 20GP.',
    'Export standard 10kg carton boxes with printed labels. 4-ply corrugated.',
    '50kg HDPE bags. Bulk packing. Buyer label printing at factory.',
    '25kg vacuum sealed bags. Master carton 4 bags each. Bar-coded.',
    '1kg retail pouch in 10kg master carton. 1000 pouches per carton.'
  ];

  const suppliers = db.suppliers.slice(0, 10);
  const products = db.products.slice(0, 8);

  return Array.from({ length: 25 }).map((_, i) => {
    const supplier = suppliers[i % suppliers.length];
    const product = products[i % products.length];
    const status = poStatuses[i % poStatuses.length];
    const so = db.salesOrders[i % db.salesOrders.length];

    const poId = generateId('PO', i);
    const poNo = `PO-2025-${(i + 1).toString().padStart(4, '0')}`;
    const qty = 100 + (i * 25);
    const unitCost = product.purchasePrice || 42;
    const totalValue = Math.round(qty * unitCost * 100) / 100;
    const orderDate = new Date(Date.now() - (40 - i) * 86400000).toISOString();
    const deliveryDate = new Date(Date.now() + (i + 5) * 86400000).toISOString();

    const timeline: import('../types').PurchaseOrderTimelineEvent[] = [
      {
        id: `EV-${poId}-1`,
        date: orderDate,
        type: 'CREATED',
        title: 'Purchase Order Drafted',
        description: `Procurement order ${poNo} initiated for ${product.name} from ${supplier.name}.`,
        userId: 'USR-001'
      }
    ];

    if (status !== 'DRAFT' && status !== 'CANCELLED') {
      timeline.push({
        id: `EV-${poId}-2`,
        date: new Date(new Date(orderDate).getTime() + 1 * 86400000).toISOString(),
        type: 'ISSUED',
        title: 'PO Issued to Supplier',
        description: `Purchase order formally issued. Supplier notified via registered email.`,
        userId: 'USR-001'
      });
    }
    if (['ACKNOWLEDGED', 'IN_PRODUCTION', 'DISPATCHED', 'RECEIVED'].includes(status)) {
      timeline.push({
        id: `EV-${poId}-3`,
        date: new Date(new Date(orderDate).getTime() + 3 * 86400000).toISOString(),
        type: 'ACKNOWLEDGED',
        title: 'Supplier Acknowledged Order',
        description: `${supplier.name} confirmed acceptance of PO terms and delivery timeline.`,
        userId: 'USR-001'
      });
    }
    if (['IN_PRODUCTION', 'DISPATCHED', 'RECEIVED'].includes(status)) {
      timeline.push({
        id: `EV-${poId}-4`,
        date: new Date(new Date(orderDate).getTime() + 7 * 86400000).toISOString(),
        type: 'IN_PRODUCTION',
        title: 'Production Commenced',
        description: `Factory production initiated. Pre-production sample dispatched for approval.`,
        userId: 'USR-001'
      });
    }
    if (['DISPATCHED', 'RECEIVED'].includes(status)) {
      timeline.push({
        id: `EV-${poId}-5`,
        date: new Date(new Date(orderDate).getTime() + 18 * 86400000).toISOString(),
        type: 'DISPATCHED',
        title: 'Cargo Dispatched from Factory',
        description: `Goods loaded and dispatched. Lorry Receipt / Dispatch Note shared.`,
        userId: 'USR-001'
      });
    }
    if (status === 'RECEIVED') {
      timeline.push({
        id: `EV-${poId}-6`,
        date: new Date(new Date(orderDate).getTime() + 25 * 86400000).toISOString(),
        type: 'RECEIVED',
        title: 'Goods Received & Quality Cleared',
        description: `Cargo received at warehouse. Quality inspection passed. GRN issued.`,
        userId: 'USR-001'
      });
    }
    if (status === 'CANCELLED') {
      timeline.push({
        id: `EV-${poId}-2`,
        date: new Date(new Date(orderDate).getTime() + 2 * 86400000).toISOString(),
        type: 'CANCELLED',
        title: 'Purchase Order Cancelled',
        description: `PO cancelled due to supplier unavailability or pricing revision.`,
        userId: 'USR-001'
      });
    }

    return {
      id: poId,
      poNo,
      salesOrderId: so.id,
      supplierId: supplier.id,
      date: orderDate,
      expectedDeliveryDate: deliveryDate,
      actualDeliveryDate: status === 'RECEIVED' ? new Date(new Date(orderDate).getTime() + 26 * 86400000).toISOString() : undefined,
      items: [
        {
          productId: product.id,
          quantity: qty,
          unitPrice: unitCost,
          totalPrice: totalValue
        }
      ],
      totalValue,
      currency: 'INR',
      exchangeRate: 83.5,
      paymentTerms: paymentTermsOptions[i % paymentTermsOptions.length],
      deliveryTerms: deliveryTermsOptions[i % deliveryTermsOptions.length],
      qualitySpec: qualitySpecs[i % qualitySpecs.length],
      packagingSpec: packagingSpecs[i % packagingSpecs.length],
      status,
      remarks: i % 4 === 0 ? 'Ensure all bags are labeled with our brand name before dispatch.' : undefined,
      timeline,
      documents: [
        { id: `DOC-${poId}-1`, name: `PO_${poNo}.pdf`, type: 'PDF', url: '#', uploadedAt: orderDate },
        ...(status === 'RECEIVED' ? [
          { id: `DOC-${poId}-2`, name: `GRN_${poNo}.pdf`, type: 'PDF', url: '#', uploadedAt: deliveryDate },
          { id: `DOC-${poId}-3`, name: `QualityReport_${poNo}.pdf`, type: 'PDF', url: '#', uploadedAt: deliveryDate },
        ] : []),
        ...(status === 'DISPATCHED' ? [
          { id: `DOC-${poId}-2`, name: `LorryReceipt_${poNo}.pdf`, type: 'PDF', url: '#', uploadedAt: deliveryDate }
        ] : [])
      ],
      entityStatus: status === 'CANCELLED' ? 'INACTIVE' : 'ACTIVE',
      createdAt: orderDate,
      updatedAt: now,
    } as any;
  });
})();

db.shipments = (() => {
  const shpStatuses: Array<'BOOKING' | 'STUFFING' | 'CUSTOMS' | 'ON_VESSEL' | 'TRANSIT' | 'ARRIVED' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED'> = [
    'TRANSIT', 'ON_VESSEL', 'ARRIVED', 'COMPLETED', 'STUFFING',
    'BOOKING', 'CUSTOMS', 'DELIVERED', 'TRANSIT', 'COMPLETED',
    'ON_VESSEL', 'TRANSIT', 'ARRIVED', 'BOOKING', 'DELIVERED',
    'STUFFING', 'COMPLETED', 'TRANSIT', 'CUSTOMS', 'CANCELLED'
  ];
  const shippingLines = ['MAERSK', 'MSC', 'CMA CGM', 'COSCO', 'HAPAG-LLOYD', 'EVERGREEN'];
  const vessels = [
    { name: 'MV ATLANTIC MARINER', voyage: '2406N' },
    { name: 'MSC DIANA', voyage: 'AX24001' },
    { name: 'CMA CGM THALASSA', voyage: 'FE24B' },
    { name: 'COSCO SHIPPING STAR', voyage: 'CS2401' },
    { name: 'HAPAG EXPRESS', voyage: 'HX240N' },
    { name: 'EVER GIVEN II', voyage: 'EG24W' },
  ];
  const portPairs = [
    { origin: 'INMUN', destination: 'USNYC', originName: 'Mundra, India', destName: 'New York, USA' },
    { origin: 'INNHV', destination: 'NLRTM', originName: 'Nhava Sheva, India', destName: 'Rotterdam, Netherlands' },
    { origin: 'CNSHA', destination: 'USLAX', originName: 'Shanghai, China', destName: 'Los Angeles, USA' },
    { origin: 'INPAV', destination: 'GBFXT', originName: 'Pipavav, India', destName: 'Felixstowe, UK' },
    { origin: 'INMUN', destination: 'DEHAM', originName: 'Mundra, India', destName: 'Hamburg, Germany' },
  ];
  const containerTypes = ['20GP', '40GP', '40HQ', '20GP', '40GP'];
  const forwarders = db.forwarders.slice(0, 5);

  return Array.from({ length: 20 }).map((_, i) => {
    const so = db.salesOrders[i % db.salesOrders.length];
    const status = shpStatuses[i % shpStatuses.length];
    const line = shippingLines[i % shippingLines.length];
    const vessel = vessels[i % vessels.length];
    const ports = portPairs[i % portPairs.length];
    const fwd = forwarders[i % forwarders.length];
    const cType = containerTypes[i % containerTypes.length];

    const shpId = generateId('SHP', i);
    const shpNo = `SHP-2025-${(i + 1).toString().padStart(4, '0')}`;
    const etdDate = new Date(Date.now() - (20 - i) * 86400000).toISOString();
    const etaDate = new Date(new Date(etdDate).getTime() + 18 * 86400000).toISOString();
    const grossWt = 10000 + i * 500;
    const netWt = grossWt - 800;
    const cbmVal = 22 + i;
    const oceanFreight = 1200 + i * 80;
    const originCharges = 250 + (i % 3) * 50;
    const destCharges = 350 + (i % 4) * 40;
    const insurance = Math.round(so.totalValue * 0.005);
    const totalFreight = oceanFreight + originCharges + destCharges + insurance;

    const timeline: import('../types').ShipmentTimelineEvent[] = [
      {
        id: `EV-${shpId}-1`,
        date: new Date(new Date(etdDate).getTime() - 5 * 86400000).toISOString(),
        type: 'BOOKING',
        title: 'Shipment Booking Confirmed',
        description: `Space confirmed on ${line}. Booking ref ${shpNo}-BKG issued.`,
        userId: 'USR-001'
      }
    ];

    if (!['BOOKING', 'CANCELLED'].includes(status)) {
      timeline.push({
        id: `EV-${shpId}-2`,
        date: new Date(new Date(etdDate).getTime() - 2 * 86400000).toISOString(),
        type: 'STUFFING',
        title: 'Container Stuffing Completed',
        description: `Container ${shpNo}-CTR stuffed at CFS. VGM declared. Seal applied.`,
        userId: 'USR-001'
      });
    }
    if (['CUSTOMS', 'ON_VESSEL', 'TRANSIT', 'ARRIVED', 'DELIVERED', 'COMPLETED'].includes(status)) {
      timeline.push({
        id: `EV-${shpId}-3`,
        date: new Date(new Date(etdDate).getTime() - 1 * 86400000).toISOString(),
        type: 'CUSTOMS',
        title: 'Export Customs Cleared',
        description: `Shipping Bill approved. Let Export Order (LEO) granted. Container gated in.`,
        userId: 'USR-001'
      });
    }
    if (['ON_VESSEL', 'TRANSIT', 'ARRIVED', 'DELIVERED', 'COMPLETED'].includes(status)) {
      timeline.push({
        id: `EV-${shpId}-4`,
        date: etdDate,
        type: 'ON_VESSEL',
        title: 'Cargo On Board — B/L Issued',
        description: `${vessel.name} (Voyage ${vessel.voyage}) departed. MBL and HBL issued.`,
        userId: 'USR-001'
      });
    }
    if (['TRANSIT', 'ARRIVED', 'DELIVERED', 'COMPLETED'].includes(status)) {
      timeline.push({
        id: `EV-${shpId}-5`,
        date: new Date(new Date(etdDate).getTime() + 5 * 86400000).toISOString(),
        type: 'TRANSIT',
        title: 'In Ocean Transit',
        description: `Vessel in transit. AIS tracking active. No delays reported.`,
        userId: 'USR-001'
      });
    }
    if (['ARRIVED', 'DELIVERED', 'COMPLETED'].includes(status)) {
      timeline.push({
        id: `EV-${shpId}-6`,
        date: etaDate,
        type: 'ARRIVED',
        title: 'Vessel Arrived at Destination Port',
        description: `${vessel.name} berthed at ${ports.destName}. Import customs clearance initiated.`,
        userId: 'USR-001'
      });
    }
    if (['DELIVERED', 'COMPLETED'].includes(status)) {
      timeline.push({
        id: `EV-${shpId}-7`,
        date: new Date(new Date(etaDate).getTime() + 3 * 86400000).toISOString(),
        type: 'DELIVERED',
        title: 'Cargo Delivered to Consignee',
        description: `Goods delivered and Delivery Order surrendered. DO acknowledged by consignee.`,
        userId: 'USR-001'
      });
    }
    if (status === 'COMPLETED') {
      timeline.push({
        id: `EV-${shpId}-8`,
        date: new Date(new Date(etaDate).getTime() + 5 * 86400000).toISOString(),
        type: 'COMPLETED',
        title: 'Shipment Completed & Closed',
        description: `All documents surrendered. Freight invoices settled. File closed.`,
        userId: 'USR-001'
      });
    }
    if (status === 'CANCELLED') {
      timeline.push({
        id: `EV-${shpId}-2`,
        date: new Date(new Date(etdDate).getTime() - 3 * 86400000).toISOString(),
        type: 'CANCELLED',
        title: 'Shipment Cancelled',
        description: `Booking cancelled. Space released. Cancellation charges waived.`,
        userId: 'USR-001'
      });
    }

    const mblNo = `${line.replace(' ', '').substring(0, 4).toUpperCase()}${(700000000 + i * 11111).toString()}`;
    const hblNo = `EXL-2025-${(7000 + i).toString()}`;

    return {
      id: shpId,
      shipmentNo: shpNo,
      orderId: so.id,
      containerNo: `${cType.substring(0, 4)}U${(1000000 + i * 77777).toString().substring(0, 7)}`,
      bookingNo: `${shpNo}-BKG`,
      mbl: mblNo,
      hbl: hblNo,
      shippingLineId: line,
      vesselName: vessel.name,
      voyageNo: vessel.voyage,
      forwarderId: fwd?.id || 'FWD-0001',
      forwarderRefNo: `${shpNo}-FWD`,
      originPortId: ports.origin,
      destinationPortId: ports.destination,
      etd: etdDate,
      eta: etaDate,
      atd: ['ON_VESSEL', 'TRANSIT', 'ARRIVED', 'DELIVERED', 'COMPLETED'].includes(status) ? etdDate : undefined,
      ata: ['ARRIVED', 'DELIVERED', 'COMPLETED'].includes(status) ? etaDate : undefined,
      containerType: cType,
      grossWeight: grossWt,
      netWeight: netWt,
      cbm: cbmVal,
      packageCount: 200 + i * 10,
      sealNo: `SL${(100000 + i * 9999).toString()}`,
      hazmat: false,
      freightCost: { oceanFreight, originCharges, destinationCharges: destCharges, insurance },
      totalFreightCost: totalFreight,
      status,
      remarks: i % 5 === 0 ? 'Buyer has requested urgent delivery. Expedite port clearance.' : undefined,
      timeline: timeline.reverse(),
      documents: [
        { id: `DOC-${shpId}-1`, name: `BL_${shpNo}.pdf`, type: 'PDF', url: '#', uploadedAt: etdDate },
        { id: `DOC-${shpId}-2`, name: `PackingList_${shpNo}.pdf`, type: 'PDF', url: '#', uploadedAt: etdDate },
        ...((['TRANSIT', 'ARRIVED', 'DELIVERED', 'COMPLETED'].includes(status)) ? [
          { id: `DOC-${shpId}-3`, name: `CommercialInvoice_${shpNo}.pdf`, type: 'PDF', url: '#', uploadedAt: etdDate }
        ] : [])
      ],
      entityStatus: status === 'CANCELLED' ? 'INACTIVE' : 'ACTIVE',
      createdAt: new Date(new Date(etdDate).getTime() - 7 * 86400000).toISOString(),
      updatedAt: now,
    } as any;
  });
})();

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

db.documents = (() => {
  const docTemplates = [
    { prefix: 'INV', typeLabel: 'Commercial Invoice', relType: 'SALES_ORDER', status: 'SIGNED', consigneeIdx: 0, totalValue: 25200, currency: 'USD', incoterm: 'FOB', paymentTerms: 'LC at Sight', containerType: '20GP', size: '248 KB', shipper: 'ExLogis Agro Exports Pvt Ltd' },
    { prefix: 'INV', typeLabel: 'Commercial Invoice', relType: 'SALES_ORDER', status: 'SIGNED', consigneeIdx: 1, totalValue: 42000, currency: 'USD', incoterm: 'CIF', paymentTerms: 'TT 30 Days', containerType: '40GP', size: '261 KB', shipper: 'ExLogis Agro Exports Pvt Ltd' },
    { prefix: 'INV', typeLabel: 'Commercial Invoice', relType: 'SALES_ORDER', status: 'DRAFT', consigneeIdx: 2, totalValue: 18480, currency: 'USD', incoterm: 'FOB', paymentTerms: 'LC 60 Days', containerType: '20GP', size: '234 KB', shipper: 'ExLogis Agro Exports Pvt Ltd' },
    { prefix: 'INV', typeLabel: 'Commercial Invoice', relType: 'SALES_ORDER', status: 'SIGNED', consigneeIdx: 3, totalValue: 56000, currency: 'EUR', incoterm: 'CIF', paymentTerms: 'LC at Sight', containerType: '40HQ', size: '279 KB', shipper: 'ExLogis Agro Exports Pvt Ltd' },
    { prefix: 'INV', typeLabel: 'Commercial Invoice', relType: 'SALES_ORDER', status: 'SIGNED', consigneeIdx: 4, totalValue: 33600, currency: 'USD', incoterm: 'FOB', paymentTerms: 'TT Advance', containerType: '40GP', size: '255 KB', shipper: 'ExLogis Agro Exports Pvt Ltd' },
    { prefix: 'PL', typeLabel: 'Packing List', relType: 'SALES_ORDER', status: 'SIGNED', consigneeIdx: 0, totalValue: 0, currency: 'USD', incoterm: 'FOB', paymentTerms: '', containerType: '20GP', size: '182 KB', shipper: 'ExLogis Agro Exports Pvt Ltd' },
    { prefix: 'PL', typeLabel: 'Packing List', relType: 'SALES_ORDER', status: 'SIGNED', consigneeIdx: 1, totalValue: 0, currency: 'USD', incoterm: 'CIF', paymentTerms: '', containerType: '40GP', size: '196 KB', shipper: 'ExLogis Agro Exports Pvt Ltd' },
    { prefix: 'PL', typeLabel: 'Packing List', relType: 'SALES_ORDER', status: 'DRAFT', consigneeIdx: 2, totalValue: 0, currency: 'USD', incoterm: 'FOB', paymentTerms: '', containerType: '20GP', size: '175 KB', shipper: 'ExLogis Agro Exports Pvt Ltd' },
    { prefix: 'PL', typeLabel: 'Packing List', relType: 'SALES_ORDER', status: 'SIGNED', consigneeIdx: 3, totalValue: 0, currency: 'EUR', incoterm: 'CIF', paymentTerms: '', containerType: '40HQ', size: '201 KB', shipper: 'ExLogis Agro Exports Pvt Ltd' },
    { prefix: 'BL', typeLabel: 'Bill of Lading', relType: 'SHIPMENT', status: 'SIGNED', consigneeIdx: 0, totalValue: 25200, currency: 'USD', incoterm: 'FOB', paymentTerms: 'Freight Prepaid', containerType: '20GP', size: '310 KB', shipper: 'ExLogis Agro Exports Pvt Ltd' },
    { prefix: 'BL', typeLabel: 'Bill of Lading', relType: 'SHIPMENT', status: 'SIGNED', consigneeIdx: 1, totalValue: 42000, currency: 'USD', incoterm: 'CIF', paymentTerms: 'Freight Collect', containerType: '40GP', size: '328 KB', shipper: 'ExLogis Agro Exports Pvt Ltd' },
    { prefix: 'BL', typeLabel: 'Bill of Lading', relType: 'SHIPMENT', status: 'SIGNED', consigneeIdx: 4, totalValue: 33600, currency: 'USD', incoterm: 'FOB', paymentTerms: 'Freight Prepaid', containerType: '40GP', size: '298 KB', shipper: 'ExLogis Agro Exports Pvt Ltd' },
    { prefix: 'PI', typeLabel: 'Proforma Invoice', relType: 'QUOTATION', status: 'SIGNED', consigneeIdx: 2, totalValue: 19200, currency: 'USD', incoterm: 'CIF', paymentTerms: 'TT 30 Days', containerType: '20GP', size: '221 KB', shipper: 'ExLogis Agro Exports Pvt Ltd' },
    { prefix: 'PI', typeLabel: 'Proforma Invoice', relType: 'QUOTATION', status: 'DRAFT', consigneeIdx: 3, totalValue: 47040, currency: 'EUR', incoterm: 'FOB', paymentTerms: 'LC at Sight', containerType: '40HQ', size: '218 KB', shipper: 'ExLogis Agro Exports Pvt Ltd' },
    { prefix: 'PI', typeLabel: 'Proforma Invoice', relType: 'QUOTATION', status: 'SIGNED', consigneeIdx: 1, totalValue: 28800, currency: 'USD', incoterm: 'CIF', paymentTerms: 'TT Advance', containerType: '40GP', size: '230 KB', shipper: 'ExLogis Agro Exports Pvt Ltd' },
    { prefix: 'CO', typeLabel: 'Certificate of Origin', relType: 'SHIPMENT', status: 'SIGNED', consigneeIdx: 0, totalValue: 25200, currency: 'USD', incoterm: 'FOB', paymentTerms: '', containerType: '20GP', size: '145 KB', shipper: 'ExLogis Agro Exports Pvt Ltd' },
    { prefix: 'CO', typeLabel: 'Certificate of Origin', relType: 'SHIPMENT', status: 'SIGNED', consigneeIdx: 1, totalValue: 42000, currency: 'USD', incoterm: 'CIF', paymentTerms: '', containerType: '40GP', size: '152 KB', shipper: 'ExLogis Agro Exports Pvt Ltd' },
    { prefix: 'CO', typeLabel: 'Certificate of Origin', relType: 'SHIPMENT', status: 'DRAFT', consigneeIdx: 2, totalValue: 18480, currency: 'USD', incoterm: 'FOB', paymentTerms: '', containerType: '20GP', size: '140 KB', shipper: 'ExLogis Agro Exports Pvt Ltd' },
    { prefix: 'PHY', typeLabel: 'Phytosanitary Certificate', relType: 'SHIPMENT', status: 'SIGNED', consigneeIdx: 0, totalValue: 0, currency: 'USD', incoterm: 'FOB', paymentTerms: '', containerType: '20GP', size: '98 KB', shipper: 'ExLogis Agro Exports Pvt Ltd' },
    { prefix: 'PHY', typeLabel: 'Phytosanitary Certificate', relType: 'SHIPMENT', status: 'SIGNED', consigneeIdx: 3, totalValue: 0, currency: 'USD', incoterm: 'CIF', paymentTerms: '', containerType: '40HQ', size: '103 KB', shipper: 'ExLogis Agro Exports Pvt Ltd' },
    { prefix: 'PHY', typeLabel: 'Phytosanitary Certificate', relType: 'SHIPMENT', status: 'DRAFT', consigneeIdx: 4, totalValue: 0, currency: 'USD', incoterm: 'FOB', paymentTerms: '', containerType: '40GP', size: '95 KB', shipper: 'ExLogis Agro Exports Pvt Ltd' },
    { prefix: 'QC', typeLabel: 'Quality Certificate', relType: 'PURCHASE_ORDER', status: 'SIGNED', consigneeIdx: 0, totalValue: 0, currency: 'USD', incoterm: 'Ex-Works', paymentTerms: '', containerType: '20GP', size: '187 KB', shipper: 'SGS India Pvt Ltd' },
    { prefix: 'QC', typeLabel: 'Quality Certificate', relType: 'PURCHASE_ORDER', status: 'SIGNED', consigneeIdx: 2, totalValue: 0, currency: 'USD', incoterm: 'Ex-Works', paymentTerms: '', containerType: '40GP', size: '194 KB', shipper: 'Bureau Veritas India' },
    { prefix: 'QC', typeLabel: 'Quality Certificate', relType: 'PURCHASE_ORDER', status: 'DRAFT', consigneeIdx: 4, totalValue: 0, currency: 'USD', incoterm: 'Ex-Works', paymentTerms: '', containerType: '40HQ', size: '178 KB', shipper: 'Intertek India' },
    { prefix: 'INS', typeLabel: 'Insurance Certificate', relType: 'SHIPMENT', status: 'SIGNED', consigneeIdx: 1, totalValue: 46200, currency: 'USD', incoterm: 'CIF', paymentTerms: '', containerType: '40GP', size: '132 KB', shipper: 'HDFC Ergo GIC Ltd' },
    { prefix: 'INS', typeLabel: 'Insurance Certificate', relType: 'SHIPMENT', status: 'SIGNED', consigneeIdx: 3, totalValue: 61600, currency: 'EUR', incoterm: 'CIF', paymentTerms: '', containerType: '40HQ', size: '128 KB', shipper: 'New India Assurance Co.' },
    { prefix: 'SI', typeLabel: 'Shipping Instruction', relType: 'SHIPMENT', status: 'SIGNED', consigneeIdx: 0, totalValue: 0, currency: 'USD', incoterm: 'FOB', paymentTerms: 'Freight Prepaid', containerType: '20GP', size: '156 KB', shipper: 'ExLogis Agro Exports Pvt Ltd' },
    { prefix: 'SI', typeLabel: 'Shipping Instruction', relType: 'SHIPMENT', status: 'SIGNED', consigneeIdx: 1, totalValue: 0, currency: 'USD', incoterm: 'CIF', paymentTerms: 'Freight Collect', containerType: '40GP', size: '162 KB', shipper: 'ExLogis Agro Exports Pvt Ltd' },
    { prefix: 'SI', typeLabel: 'Shipping Instruction', relType: 'SHIPMENT', status: 'DRAFT', consigneeIdx: 2, totalValue: 0, currency: 'USD', incoterm: 'FOB', paymentTerms: 'Freight Prepaid', containerType: '20GP', size: '149 KB', shipper: 'ExLogis Agro Exports Pvt Ltd' },
    { prefix: 'POD', typeLabel: 'Purchase Order', relType: 'PURCHASE_ORDER', status: 'SIGNED', consigneeIdx: 0, totalValue: 22400, currency: 'USD', incoterm: 'Ex-Factory', paymentTerms: 'TT 30 Days', containerType: '20GP', size: '215 KB', shipper: 'ExLogis Agro Exports Pvt Ltd' },
  ];
  const consignees = [
    { name: 'Apex Bulk Trading Inc.', address: '1200 Harbor Blvd, Los Angeles, CA 90210, USA' },
    { name: 'Euro Grain Partners BV', address: 'Waalhaven 120, 3087 BN Rotterdam, Netherlands' },
    { name: 'Nippon Foods Wholesale KK', address: '3-7-1 Kasumigaseki, Chiyoda-ku, Tokyo 100-0013, Japan' },
    { name: 'Britsol Trading Ltd', address: '45 Dock Road, Felixstowe, Suffolk IP11 3QR, UK' },
    { name: 'Hamburg Commodities GmbH', address: 'Überseebrücke 1, 20459 Hamburg, Germany' },
  ];
  const productItems = [
    [{ description: 'Premium Basmati Rice 1121 (25 kg PP Bags)', hsn: '1006.30.20', origin: 'India', qty: 600, unit: 'BAG', unitPrice: 42.00 }],
    [{ description: 'Toor Dal Split (25 kg PP Bags)', hsn: '0713.60.00', origin: 'India', qty: 800, unit: 'BAG', unitPrice: 28.00 }, { description: 'Chana Dal (25 kg PP Bags)', hsn: '0713.31.00', origin: 'India', qty: 400, unit: 'BAG', unitPrice: 22.00 }],
    [{ description: 'Organic Jasmine Rice (20 kg Bags)', hsn: '1006.30.10', origin: 'India', qty: 560, unit: 'BAG', unitPrice: 33.00 }],
  ];
  return docTemplates.map((tpl, i) => {
    const id = generateId('DOC', i);
    const consignee = consignees[tpl.consigneeIdx];
    const seq = (i + 1).toString().padStart(4, '0');
    const items = productItems[i % productItems.length];
    const relId = tpl.relType === 'SALES_ORDER' ? db.salesOrders[i % db.salesOrders.length]?.id :
                  tpl.relType === 'PURCHASE_ORDER' ? db.purchaseOrders[i % db.purchaseOrders.length]?.id :
                  db.shipments[i % db.shipments.length]?.id;
    return {
      id, name: `${tpl.prefix}-2025-${seq}`, type: tpl.typeLabel, url: '#', size: tpl.size,
      status: tpl.status as 'DRAFT' | 'SIGNED' | 'ARCHIVED',
      relatedId: relId, relatedType: tpl.relType,
      shipper: tpl.shipper, consignee: consignee.name,
      items: items.map(it => ({ ...it, totalPrice: Math.round(it.qty * it.unitPrice * 100) / 100 })),
      totalValue: tpl.totalValue || items.reduce((s: number, it) => s + it.qty * it.unitPrice, 0),
      currency: tpl.currency, incoterm: tpl.incoterm, paymentTerms: tpl.paymentTerms,
      containerType: tpl.containerType,
      entityStatus: 'ACTIVE',
      createdAt: new Date(Date.now() - (30 - i) * 2 * 86400000).toISOString(),
      updatedAt: now,
    } as any;
  });
})();

// Seed Costing Scenarios
db.costingScenarios = (() => {
  const scenarioTemplates = [
    { name: 'Basmati Rice 1121 — Japan Q3 2025', desc: 'FCL 20GP landed cost for premium basmati rice export to Japan via Nhava Sheva.', origin: 'INNHV', dest: 'JPTYO', cType: '20GP', cCount: 1, oceanFrt: 2800, insuranceRate: 0.5, customsRate: 5.0, targetMargin: 22, bankingRate: 0.25, qty: 600, unitPrice: 42, originH: 280, destH: 420, inspection: 180, misc: 120 },
    { name: 'Toor Dal — Rotterdam Q3 2025', desc: 'FCL 40GP landed cost for split pigeon peas to Netherlands.', origin: 'INMUN', dest: 'NLRTM', cType: '40GP', cCount: 1, oceanFrt: 3400, insuranceRate: 0.5, customsRate: 0, targetMargin: 20, bankingRate: 0.25, qty: 800, unitPrice: 28, originH: 300, destH: 380, inspection: 160, misc: 100 },
    { name: 'Chana Dal — New York FCL 20GP', desc: 'Standard 20GP scenario for Bengal gram export to US East Coast.', origin: 'INNHV', dest: 'USNYC', cType: '20GP', cCount: 1, oceanFrt: 3100, insuranceRate: 0.5, customsRate: 2.5, targetMargin: 24, bankingRate: 0.25, qty: 600, unitPrice: 22, originH: 260, destH: 450, inspection: 200, misc: 90 },
    { name: 'Masoor Dal — UK Felixstowe 40HQ', desc: '40HQ scenario for split red lentils to UK. Post-Brexit customs duty applies.', origin: 'INPAV', dest: 'GBFXT', cType: '40HQ', cCount: 1, oceanFrt: 3200, insuranceRate: 0.5, customsRate: 4.0, targetMargin: 21, bankingRate: 0.25, qty: 900, unitPrice: 24, originH: 280, destH: 390, inspection: 170, misc: 110 },
    { name: 'Organic Jasmine Rice — Hamburg 2x20GP', desc: 'Dual 20GP scenario for organic jasmine rice to Germany.', origin: 'INMUN', dest: 'DEHAM', cType: '20GP', cCount: 2, oceanFrt: 2900, insuranceRate: 0.6, customsRate: 0, targetMargin: 26, bankingRate: 0.3, qty: 1200, unitPrice: 38, originH: 560, destH: 800, inspection: 320, misc: 200 },
    { name: 'Moong Dal — LA 20GP Scenario', desc: 'Yellow split moong to LA. Low margin scenario.', origin: 'INNHV', dest: 'USLAX', cType: '20GP', cCount: 1, oceanFrt: 3500, insuranceRate: 0.5, customsRate: 1.5, targetMargin: 18, bankingRate: 0.25, qty: 500, unitPrice: 30, originH: 270, destH: 430, inspection: 150, misc: 80 },
    { name: 'Moong Whole — Rotterdam Organic Premium', desc: 'High-value organic moong. ECOCERT certified. Targeted 28% margin.', origin: 'INNHV', dest: 'NLRTM', cType: '40HQ', cCount: 1, oceanFrt: 3300, insuranceRate: 0.7, customsRate: 0, targetMargin: 28, bankingRate: 0.3, qty: 1000, unitPrice: 48, originH: 310, destH: 370, inspection: 190, misc: 130 },
    { name: 'Basmati Rice — Dubai Bulk Scenario', desc: 'Multi-container bulk rice to UAE. Zero duty under India-UAE CEPA.', origin: 'INMUN', dest: 'AEDXB', cType: '40GP', cCount: 3, oceanFrt: 1400, insuranceRate: 0.4, customsRate: 0, targetMargin: 20, bankingRate: 0.2, qty: 2400, unitPrice: 42, originH: 900, destH: 600, inspection: 400, misc: 280 },
  ];

  return scenarioTemplates.map((tpl, i) => {
    const id = generateId('CST', i);
    const productCost = tpl.qty * tpl.unitPrice;
    const totalFreight = tpl.oceanFrt * tpl.cCount + tpl.originH + tpl.destH;
    const cifValue = productCost + totalFreight;
    const insurance = productCost * (tpl.insuranceRate / 100);
    const customs = cifValue * (tpl.customsRate / 100);
    const banking = productCost * (tpl.bankingRate / 100);
    const totalLanded = productCost + totalFreight + insurance + customs + tpl.inspection + banking + tpl.misc;
    const costPerUnit = totalLanded / tpl.qty;
    const sellingPricePerUnit = costPerUnit / (1 - tpl.targetMargin / 100);
    const profitPerUnit = sellingPricePerUnit - costPerUnit;
    const totalRevenue = sellingPricePerUnit * tpl.qty;
    const totalProfit = profitPerUnit * tpl.qty;

    return {
      id,
      scenarioName: tpl.name,
      description: tpl.desc,
      supplierId: db.suppliers[i % db.suppliers.length]?.id,
      items: [{ productId: db.products[i % db.products.length]?.id || 'PRD-0001', quantity: tpl.qty, unitPurchasePrice: tpl.unitPrice, totalProductCost: productCost }],
      freight: { originPort: tpl.origin, destinationPort: tpl.dest, containerType: tpl.cType, containerCount: tpl.cCount, oceanFreightPerContainer: tpl.oceanFrt, originHandling: tpl.originH, destinationHandling: tpl.destH, totalFreight },
      costs: { productCost, freightCost: totalFreight, insuranceAmount: Math.round(insurance * 100) / 100, customsDuty: Math.round(customs * 100) / 100, inspection: tpl.inspection, bankingCharges: Math.round(banking * 100) / 100, miscCharges: tpl.misc, totalLandedCost: Math.round(totalLanded * 100) / 100 },
      rates: { insuranceRate: tpl.insuranceRate, customsRate: tpl.customsRate, targetMargin: tpl.targetMargin, bankingRate: tpl.bankingRate },
      result: { costPerUnit: Math.round(costPerUnit * 100) / 100, targetSellingPricePerUnit: Math.round(sellingPricePerUnit * 100) / 100, grossProfitPerUnit: Math.round(profitPerUnit * 100) / 100, totalRevenue: Math.round(totalRevenue * 100) / 100, totalGrossProfit: Math.round(totalProfit * 100) / 100, grossMarginPct: tpl.targetMargin, breakEvenQty: Math.ceil(totalLanded / sellingPricePerUnit) },
      currency: 'USD',
      exchangeRate: 83.5,
      tags: [tpl.cType, tpl.dest.substring(0, 2)],
      isFavourite: i < 2,
      entityStatus: 'ACTIVE',
      createdAt: new Date(Date.now() - (8 - i) * 7 * 86400000).toISOString(),
      updatedAt: now
    } as CostingScenario;
  });
})();