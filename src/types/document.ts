export interface DocumentParty {
  name: string;
  address: string;
  email?: string;
  phone?: string;
  taxId?: string;
}

export interface DocumentItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface DocumentData {
  title: string;
  documentNo: string;
  date: string;
  dueDate?: string;
  validityDate?: string;
  
  issuer: DocumentParty;
  client: DocumentParty;
  
  items: DocumentItem[];
  subtotal: number;
  taxTotal: number;
  grandTotal: number;
  currency: string;
  
  terms?: string;
  notes?: string;
}
