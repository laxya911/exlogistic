export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
  entityStatus: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
}

// Master Data
export interface Product extends BaseEntity {
  sku: string;
  name: string;
  description?: string;
  category: string;
  uom: string;
  hsnCode?: string;
  weight: number; // kg
  volume: number; // cbm
  brand: string;
  supplierId: string;
  shelfLife?: string;
  images: string[];
  purchaseHistory: PurchaseHistoryEntry[];
  sellingHistory: SellingHistoryEntry[];
  inventorySummary: InventoryLocation[];
  pricingHistory: PricingHistoryEntry[];
  documents: DocumentRef[];
  notes?: string;
}

export interface PurchaseHistoryEntry {
  date: string;
  supplierId: string;
  quantity: number;
  unitPrice: number;
  poNo: string;
}

export interface SellingHistoryEntry {
  date: string;
  customerId: string;
  quantity: number;
  unitPrice: number;
  soNo: string;
}

export interface InventoryLocation {
  location: string;
  quantity: number;
  lastUpdated: string;
}

export interface PricingHistoryEntry {
  date: string;
  price: number;
  currency: string;
}

export interface DocumentRef {
  id: string;
  name: string;
  type: string;
  url: string;
  uploadedAt: string;
}

export interface Contact {
  name: string;
  role: string;
  email: string;
  phone: string;
  isPrimary: boolean;
}

export interface TimelineEvent {
  id: string;
  date: string;
  type: 'CALL' | 'EMAIL' | 'MEETING' | 'NOTE';
  title: string;
  description: string;
  userId: string;
}

export interface Customer extends BaseEntity {
  name: string;
  email: string;
  phone: string;
  address: string;
  country: string;
  contacts: Contact[];
  creditLimit: number;
  paymentTerms: string;
  communicationTimeline: TimelineEvent[];
  notes?: string;
  website?: string;
  taxId?: string;
}

export interface Supplier extends BaseEntity {
  name: string;
  email: string;
  phone: string;
  address: string;
  country: string;
  contacts: Contact[];
  performanceRating: number; // 1-5
  averageLeadTime: number; // days
  certifications: string[];
  productsSuppliedIds: string[];
  paymentTerms: string;
  documents: DocumentRef[];
}

export interface Forwarder extends BaseEntity {
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  rating: number;
  preferredPorts: string[];
}

export interface ShippingLine extends BaseEntity {
  name: string;
  code: string;
  logo?: string;
}

export interface Port extends BaseEntity {
  name: string;
  code: string;
  country: string;
  type: 'SEA' | 'AIR' | 'LAND';
}

export interface Currency extends BaseEntity {
  code: string;
  name: string;
  symbol: string;
  exchangeRate: number; // Relative to USD
}

// Sprint 6: Costing
export interface PurchaseCost extends BaseEntity {
  supplierId: string;
  productId: string;
  unitPrice: number;
  currency: string;
  moq: number;
}

// Sprint 7: Quotations & Orders
export type QuotationStatus = 'DRAFT' | 'SENT' | 'REVISED' | 'APPROVED' | 'REJECTED' | 'EXPIRED';

export interface Quotation extends BaseEntity {
  quotationNo: string;
  customerId: string;
  date: string;
  validityDate: string;
  currency: string;
  exchangeRate: number;
  incoterm: 'FOB' | 'CFR' | 'CIF' | 'DDP' | 'EXW';
  paymentTerms: string;
  originPortId: string;
  destinationPortId: string;
  containerType: '20GP' | '40GP' | '40HQ';
  items: QuotationItem[];
  totalValue: number;
  marginPercentage: number;
  status: QuotationStatus;
  version: number;
  remarks?: string;
}

export interface QuotationItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export type SalesOrderStatus = 'PENDING' | 'CONFIRMED' | 'PRODUCTION' | 'READY' | 'SHIPPED' | 'CANCELLED';

export interface SalesOrder extends BaseEntity {
  orderNo: string;
  quotationId?: string;
  customerId: string;
  date: string;
  expectedShipmentDate: string;
  items: QuotationItem[];
  totalValue: number;
  status: SalesOrderStatus;
}

export type PurchaseOrderStatus = 'DRAFT' | 'ISSUED' | 'RECEIVED' | 'CANCELLED';

export interface PurchaseOrder extends BaseEntity {
  poNo: string;
  supplierId: string;
  date: string;
  expectedDeliveryDate: string;
  items: QuotationItem[];
  totalValue: number;
  status: PurchaseOrderStatus;
}

// Sprint 7: Shipments & Logistics
export type ShipmentStatus = 
  | 'BOOKING' 
  | 'STUFFING' 
  | 'CUSTOMS' 
  | 'ON_VESSEL' 
  | 'TRANSIT' 
  | 'ARRIVED' 
  | 'DELIVERED' 
  | 'COMPLETED';

export interface Shipment extends BaseEntity {
  shipmentNo: string;
  orderId: string;
  containerNo?: string;
  bookingNo?: string;
  shippingLineId: string;
  forwarderId: string;
  originPortId: string;
  destinationPortId: string;
  etd: string;
  eta: string;
  containerType: string;
  grossWeight: number;
  netWeight: number;
  cbm: number;
  sealNo?: string;
  status: ShipmentStatus;
  timeline: ShipmentTimelineEvent[];
}

export interface ShipmentTimelineEvent {
  status: ShipmentStatus;
  date: string;
  comment?: string;
}

// Sprint 7: Tasks
export interface Task extends BaseEntity {
  title: string;
  description: string;
  dueDate: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  category: 'QUOTATION' | 'SHIPMENT' | 'PAYMENT' | 'DOCUMENT' | 'FOLLOW_UP';
  relatedId?: string; // ID of the related Quotation, Shipment, etc.
  isCompleted: boolean;
}

// Sprint 7: Calendar
export interface CalendarEvent extends BaseEntity {
  title: string;
  start: string;
  end: string;
  type: 'ETD' | 'ETA' | 'QUOTATION_EXPIRY' | 'PO_DELIVERY' | 'MEETING' | 'PAYMENT_DUE';
  relatedId: string;
}

// Sprint 8: Notifications & Audit
export interface Notification extends BaseEntity {
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  isRead: boolean;
  relatedId?: string;
  relatedType?: string;
  actionUrl?: string;
}

export interface AuditLog extends BaseEntity {
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  ipAddress?: string;
}

// Sprint 8: Dashboard & Reports
export interface DashboardStats {
  revenue: number;
  profit: number;
  margin: number;
  shipments: number;
  containers: number;
  pendingQuotes: number;
  pendingOrders: number;
  revenueTrend: { month: string; value: number }[];
  profitTrend: { month: string; value: number }[];
  shipmentPipeline: { status: string; count: number }[];
  countryDistribution: { country: string; value: number }[];
}
