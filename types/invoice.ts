export interface Invoice {
  id: string;
  customerId: string;
  adminId: string;
  invoiceNumber: string;
  amount: string | number;
  dueDate: string;
  status: 'Pending' | 'Paid' | 'Overdue' | 'Cancelled';
  description?: string;
  lineItems?: string; // JSON string
  notes?: string;
  paymentDate?: string;
  paymentMethod?: string;
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: string;
    name: string;
    email: string;
    role?: string;
  };
  admin?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface InvoiceFormData {
  customerId: string;
  invoiceNumber: string;
  dueDate: string;
  description?: string;
  notes?: string;
  lineItems?: LineItem[];
}