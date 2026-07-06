export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
  entityStatus: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED' | 'DELETED';
}

export interface ProductTimelineEvent {
  id: string;
  date: string;
  type: 'CREATED' | 'UPDATED' | 'ARCHIVED' | 'RESTORED' | 'PRICE_CHANGED' | 'SUPPLIER_CHANGED' | 'DOCUMENT_ADDED' | 'IMAGE_UPDATED';
  title: string;
  description: string;
  userId: string;
}

export interface Category extends BaseEntity {
  name: string;
  slug: string;
  parentId?: string;
  path?: string;
  level: number;
}

export interface Brand extends BaseEntity {
  name: string;
  slug: string;
  logo?: string;
  website?: string;
}

export interface ProductVariant extends BaseEntity {
  productId: string;
  sku: string;
  barcode?: string;
  internalCode?: string;
  title: string; // e.g., "Black / 256GB"
  slug?: string;
  isDefault: boolean;
  inventory?: number;
  
  // Dimensions & Weight
  weight?: number;
  netWeight?: number;
  grossWeight?: number;
  volumeCBM?: number;
  packagingType?: string;
  
  // Commercial
  purchasePrice: number;
  sellingPrice: number;
  currency: string;
  
  images: any[];
  attributes: any[];
}

export interface Product extends BaseEntity {
  slug: string;
  name: string;
  shortDescription?: string;
  longDescription?: string;
  seoTitle?: string;
  seoDescription?: string;
  defaultImage?: string;
  isPublished: boolean;
  isFeatured: boolean;

  brandId?: string;
  brandEntity?: Brand;

  categories?: any[];
  variants: ProductVariant[];
  suppliers?: any[];
  documents: DocumentRef[];
  certifications: string[];

  // Note: These fields are kept for backward compatibility with some UI components temporarily, 
  // but they will be mapped from the default variant.
  category: string;
  brand: string;
  sku: string;
  description: string;
  hsnCode: string;
  countryOfOrigin: string;
  purchasePrice: number;
  sellingPrice: number;
  currency: string;
  uom: string;
  moq: number;
  leadTime: number;
  packageType: string;
  unitsPerCarton: number;
  grossWeight: number;
  netWeight: number;
  cbm: number;
  containerLoadingCapacity: number;
  shelfLife: string;
  storageConditions: string;
  japanImportNotes?: string;
  supplierId: string;
  preferredForwarderId?: string;
  defaultPackagingType?: string;
  images: string[];
  
  // History & Tracking
  timeline: ProductTimelineEvent[];
  purchaseHistory: PurchaseHistoryEntry[];
  sellingHistory: SellingHistoryEntry[];
  inventorySummary: InventoryLocation[];
  pricingHistory: PricingHistoryEntry[];
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

export interface CustomerTimelineEvent {
  id: string;
  date: string;
  type: 'CREATED' | 'UPDATED' | 'CREDIT_LIMIT_CHANGED' | 'STATUS_CHANGED' | 'COMMUNICATION_LOGGED' | 'DOCUMENT_ADDED' | 'ARCHIVED' | 'RESTORED';
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
  notes?: string;
  website?: string;
  taxId?: string;
  
  // Custom Additions for CRM & Compliance
  segment: 'PREMIUM' | 'STANDARD' | 'LOW_VOLUME';
  accountManagerId: string; // e.g. operator ID
  preferredDischargePortId: string; // Port ID from ports index
  documents: DocumentRef[];
  timeline: CustomerTimelineEvent[];
}

export interface SupplierTimelineEvent {
  id: string;
  date: string;
  type: 'CREATED' | 'UPDATED' | 'LEAD_TIME_CHANGED' | 'RATING_CHANGED' | 'STATUS_CHANGED' | 'COMMUNICATION_LOGGED' | 'DOCUMENT_ADDED' | 'ARCHIVED' | 'RESTORED';
  title: string;
  description: string;
  userId: string;
}

export interface Supplier extends BaseEntity {
  name: string;
  email: string;
  phone: string;
  address: string;
  country: string;
  contacts: Contact[];
  notes?: string;
  website?: string;
  taxId?: string;

  // Performance & Compliance
  performanceRating: number; // 1.0 to 5.0
  averageLeadTime: number; // days
  certifications: string[];
  
  // Relationships
  productsSuppliedIds: string[];
  paymentTerms: string;
  documents: DocumentRef[];
  timeline: SupplierTimelineEvent[];
}

export interface ForwarderTimelineEvent {
  id: string;
  date: string;
  type: 'CREATED' | 'UPDATED' | 'RATING_CHANGED' | 'PORT_ADDED' | 'STATUS_CHANGED' | 'COMMUNICATION_LOGGED' | 'DOCUMENT_ADDED' | 'ARCHIVED' | 'RESTORED';
  title: string;
  description: string;
  userId: string;
}

export interface Forwarder extends BaseEntity {
  name: string;
  email: string;
  phone: string;
  address: string;
  country: string;
  contacts: Contact[];
  notes?: string;
  website?: string;
  taxId?: string;

  // Shipping details
  rating: number; // 1.0 to 5.0
  preferredPorts: string[]; // Port IDs from ports index
  
  // Relationships
  documents: DocumentRef[];
  timeline: ForwarderTimelineEvent[];
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

export interface QuotationTimelineEvent {
  id: string;
  date: string;
  type: 'CREATED' | 'UPDATED' | 'SENT' | 'REVISED' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'STATUS_CHANGED' | 'COMMUNICATION_LOGGED' | 'DOCUMENT_ADDED' | 'ARCHIVED' | 'RESTORED';
  title: string;
  description: string;
  userId: string;
}

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
  timeline: QuotationTimelineEvent[];
  documents: DocumentRef[];
}

export interface QuotationItem {
  id?: string;
  productId: string;
  variantId?: string;
  variant?: any;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export type SalesOrderStatus = 'DRAFT' | 'PENDING' | 'CONFIRMED' | 'PRODUCTION' | 'READY' | 'SHIPPED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';

export interface SalesOrderTimelineEvent {
  id: string;
  date: string;
  type: 'CREATED' | 'CONFIRMED' | 'PRODUCTION_STARTED' | 'READY_FOR_SHIPMENT' | 'SHIPPED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED' | 'UPDATED' | 'DOCUMENT_ADDED' | 'NOTE_ADDED' | 'ARCHIVED' | 'RESTORED';
  title: string;
  description: string;
  userId: string;
}

export interface SalesOrder extends BaseEntity {
  orderNo: string;
  quotationId?: string;
  customerId: string;
  date: string;
  expectedShipmentDate: string;
  items: QuotationItem[];
  totalValue: number;
  marginPercentage?: number;
  currency?: string;
  exchangeRate?: number;
  incoterm?: string;
  paymentTerms?: string;
  originPortId?: string;
  destinationPortId?: string;
  containerType?: string;
  status: SalesOrderStatus;
  remarks?: string;
  timeline: SalesOrderTimelineEvent[];
  documents: DocumentRef[];
}

export type PurchaseOrderStatus = 'DRAFT' | 'ISSUED' | 'ACKNOWLEDGED' | 'IN_PRODUCTION' | 'DISPATCHED' | 'RECEIVED' | 'CANCELLED';

export interface PurchaseOrderTimelineEvent {
  id: string;
  date: string;
  type: 'CREATED' | 'ISSUED' | 'ACKNOWLEDGED' | 'IN_PRODUCTION' | 'DISPATCHED' | 'RECEIVED' | 'CANCELLED' | 'UPDATED' | 'NOTE_ADDED' | 'DOCUMENT_ADDED' | 'ARCHIVED' | 'RESTORED';
  title: string;
  description: string;
  userId: string;
}

export interface PurchaseOrder extends BaseEntity {
  poNo: string;
  salesOrderId?: string;      // link back to the triggering SO if any
  supplierId: string;
  date: string;
  expectedDeliveryDate: string;
  actualDeliveryDate?: string;
  items: QuotationItem[];
  totalValue: number;
  currency?: string;
  exchangeRate?: number;
  paymentTerms?: string;
  incoterm?: string;     // e.g. Ex-Factory, FOR, CIF
  qualitySpec?: string;       // brief quality / grade notes
  packagingSpec?: string;     // packaging instructions
  status: PurchaseOrderStatus;
  remarks?: string;
  timeline: PurchaseOrderTimelineEvent[];
  documents: DocumentRef[];
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
  | 'COMPLETED'
  | 'CANCELLED';

export interface ShipmentTimelineEvent {
  id: string;
  date: string;
  type: 'BOOKING' | 'STUFFING' | 'CUSTOMS' | 'ON_VESSEL' | 'TRANSIT' | 'ARRIVED' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED' | 'NOTE_ADDED' | 'DOCUMENT_ADDED' | 'UPDATED';
  title: string;
  description: string;
  userId: string;
}

export interface ShipmentFreightCost {
  oceanFreight: number;
  originCharges: number;       // CFS, handling, stuffing
  destinationCharges: number;  // THC, port fees
  insurance: number;
  customsBrokerage?: number;
  miscCharges?: number;
}

export interface Shipment extends BaseEntity {
  shipmentNo: string;
  orderId: string;              // linked Sales Order
  containerNo?: string;
  bookingNo?: string;           // forwarder booking ref
  mbl?: string;                 // Master Bill of Lading
  hbl?: string;                 // House Bill of Lading
  shippingLineId: string;
  vesselName?: string;
  voyageNo?: string;
  forwarderId: string;
  forwarderRefNo?: string;
  originPortId: string;
  destinationPortId: string;
  etd: string;
  eta: string;
  atd?: string;                 // Actual time of departure
  ata?: string;                 // Actual time of arrival
  containerType: string;
  grossWeight: number;
  netWeight: number;
  cbm: number;
  packageCount?: number;
  sealNo?: string;
  hazmat?: boolean;
  freightCost?: ShipmentFreightCost;
  totalFreightCost?: number;
  status: ShipmentStatus;
  remarks?: string;
  timeline: ShipmentTimelineEvent[];
  documents: DocumentRef[];
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
export type NotificationType = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'QUOTATION_EXPIRING' | 'SHIPMENT_DELAYED' | 'APPROVAL_REQUIRED' | 'PO_OVERDUE' | 'TASK_ASSIGNED';

export interface Notification extends BaseEntity {
  title: string;
  message: string;
  type: NotificationType;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  isRead: boolean;
  relatedId?: string;
  relatedType?: string;
  actionUrl?: string;
  userId?: string;
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

export interface ERPDocument extends BaseEntity {
  name: string;
  type: string;
  url: string;
  size: string;
  status: 'DRAFT' | 'SIGNED' | 'ARCHIVED';
  relatedId?: string;
  relatedType?: string;
  shipper?: string;
  consignee?: string;
  consigneeAddress?: string;
  items?: any[];
  totalValue?: number;
  currency?: string;
  incoterm?: string;
  paymentTerms?: string;
  containerType?: string;
  remarks?: string;
}

// Costing Engine
export interface CostingScenarioItem {
  productId: string;
  quantity: number;
  unitPurchasePrice: number;
  totalProductCost: number;
}

export interface CostingScenarioFreight {
  originPort: string;
  destinationPort: string;
  containerType: string;    // 20GP, 40GP, 40HQ
  containerCount: number;
  oceanFreightPerContainer: number;  // USD per container
  originHandling: number;
  destinationHandling: number;
  totalFreight: number;
}

export interface CostingScenarioCosts {
  productCost: number;
  freightCost: number;
  insuranceAmount: number;  // % of productCost
  customsDuty: number;      // % of productCost + freight (CIF value)
  inspection: number;
  bankingCharges: number;
  miscCharges: number;
  totalLandedCost: number;
}

export interface CostingScenarioResult {
  costPerUnit: number;
  targetSellingPricePerUnit: number;
  grossProfitPerUnit: number;
  totalRevenue: number;
  totalGrossProfit: number;
  grossMarginPct: number;
  breakEvenQty: number;
}

export interface CostingScenario extends BaseEntity {
  scenarioName: string;
  description?: string;
  supplierId?: string;
  items: CostingScenarioItem[];
  freight: CostingScenarioFreight;
  costs: CostingScenarioCosts;
  rates: {
    insuranceRate: number;   // %
    customsRate: number;     // %
    targetMargin: number;    // %
    bankingRate: number;     // %
  };
  result: CostingScenarioResult;
  currency: string;
  exchangeRate: number;
  tags?: string[];
  isFavourite?: boolean;
}

