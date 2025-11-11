import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

// Type definitions
type SystemUser = Database['public']['Tables']['system_users']['Row'];
type SystemUserInsert = Database['public']['Tables']['system_users']['Insert'];
type SystemUserUpdate = Database['public']['Tables']['system_users']['Update'];

type Customer = Database['public']['Tables']['customers']['Row'];
type CustomerInsert = Database['public']['Tables']['customers']['Insert'];
type CustomerUpdate = Database['public']['Tables']['customers']['Update'];

type Product = Database['public']['Tables']['products']['Row'];
type ProductInsert = Database['public']['Tables']['products']['Insert'];
type ProductUpdate = Database['public']['Tables']['products']['Update'];

type Creditor = Database['public']['Tables']['creditors']['Row'];
type CreditorInsert = Database['public']['Tables']['creditors']['Insert'];
type CreditorUpdate = Database['public']['Tables']['creditors']['Update'];

type CarneInstallment = Database['public']['Tables']['carne_installments']['Row'];
type CarneInstallmentInsert = Database['public']['Tables']['carne_installments']['Insert'];
type CarneInstallmentUpdate = Database['public']['Tables']['carne_installments']['Update'];

type Sale = Database['public']['Tables']['sales']['Row'];
type SaleInsert = Database['public']['Tables']['sales']['Insert'];
type SaleUpdate = Database['public']['Tables']['sales']['Update'];

type StockMovement = Database['public']['Tables']['stock_movements']['Row'];
type StockMovementInsert = Database['public']['Tables']['stock_movements']['Insert'];
type StockMovementUpdate = Database['public']['Tables']['stock_movements']['Update'];

type Expense = Database['public']['Tables']['expenses']['Row'];
type ExpenseInsert = Database['public']['Tables']['expenses']['Insert'];
type ExpenseUpdate = Database['public']['Tables']['expenses']['Update'];

type CreditSale = Database['public']['Tables']['credit_sales']['Row'];
type CreditSaleInsert = Database['public']['Tables']['credit_sales']['Insert'];
type CreditSaleUpdate = Database['public']['Tables']['credit_sales']['Update'];

type Return = Database['public']['Tables']['returns']['Row'];
type ReturnInsert = Database['public']['Tables']['returns']['Insert'];
type ReturnUpdate = Database['public']['Tables']['returns']['Update'];

type Exchange = Database['public']['Tables']['exchanges']['Row'];
type ExchangeInsert = Database['public']['Tables']['exchanges']['Insert'];
type ExchangeUpdate = Database['public']['Tables']['exchanges']['Update'];

export type PaymentHistory = Database['public']['Tables']['payment_history']['Row'];
export type PaymentHistoryInsert = Database['public']['Tables']['payment_history']['Insert'];
export type PaymentHistoryUpdate = Database['public']['Tables']['payment_history']['Update'];

// Generic CRUD functions
async function createItem<T>(table: keyof Database['public']['Tables'], data: any): Promise<T> {
  const { data: result, error } = await supabase
    .from(table as any)
    .insert(data)
    .select()
    .single();
  
  if (error) throw error;
  return result as T;
}

async function readItems<T>(table: keyof Database['public']['Tables'], query?: any): Promise<T[]> {
  let request = supabase.from(table as any).select('*');
  
  if (query) {
    request = request.match(query);
  }
  
  const { data, error } = await request;
  
  if (error) throw error;
  return (data || []) as T[];
}

async function readItem<T>(table: keyof Database['public']['Tables'], id: number): Promise<T | null> {
  const { data, error } = await supabase
    .from(table as any)
    .select('*')
    .eq('id', id)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error;
  return data as T | null;
}

async function updateItem<T>(table: keyof Database['public']['Tables'], id: number, data: any): Promise<T> {
  const { data: result, error } = await supabase
    .from(table as any)
    .update(data)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return result as T;
}

async function deleteItem(table: keyof Database['public']['Tables'], id: number): Promise<void> {
  const { error } = await supabase
    .from(table as any)
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// System Users
export const systemUsersApi = {
  create: (data: SystemUserInsert) => createItem<SystemUser>('system_users', data),
  readAll: () => readItems<SystemUser>('system_users'),
  read: (id: number) => readItem<SystemUser>('system_users', id),
  update: (id: number, data: SystemUserUpdate) => updateItem<SystemUser>('system_users', id, data),
  delete: (id: number) => deleteItem('system_users', id),
  findByUsername: async (username: string): Promise<SystemUser | null> => {
    const { data, error } = await supabase
      .from('system_users')
      .select('*')
      .eq('username', username)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }
};

// Customers
export const customersApi = {
  create: (data: CustomerInsert) => createItem<Customer>('customers', data),
  readAll: () => readItems<Customer>('customers'),
  read: (id: number) => readItem<Customer>('customers', id),
  update: (id: number, data: CustomerUpdate) => updateItem<Customer>('customers', id, data),
  delete: (id: number) => deleteItem('customers', id)
};

// Products
export const productsApi = {
  create: (data: ProductInsert) => createItem<Product>('products', data),
  readAll: () => readItems<Product>('products'),
  read: (id: number) => readItem<Product>('products', id),
  update: (id: number, data: ProductUpdate) => updateItem<Product>('products', id, data),
  delete: (id: number) => deleteItem('products', id)
};

// Creditors
export const creditorsApi = {
  create: (data: CreditorInsert) => createItem<Creditor>('creditors', data),
  readAll: () => readItems<Creditor>('creditors'),
  read: (id: number) => readItem<Creditor>('creditors', id),
  update: (id: number, data: CreditorUpdate) => updateItem<Creditor>('creditors', id, data),
  delete: (id: number) => deleteItem('creditors', id)
};

// Carne Installments
export const carneInstallmentsApi = {
  create: (data: CarneInstallmentInsert) => createItem<CarneInstallment>('carne_installments', data),
  readAll: () => readItems<CarneInstallment>('carne_installments'),
  read: (id: number) => readItem<CarneInstallment>('carne_installments', id),
  update: (id: number, data: CarneInstallmentUpdate) => updateItem<CarneInstallment>('carne_installments', id, data),
  delete: (id: number) => deleteItem('carne_installments', id),
  readByCreditor: (creditorId: number) => readItems<CarneInstallment>('carne_installments', { creditor_id: creditorId })
};

// Sales
export const salesApi = {
  create: (data: SaleInsert) => createItem<Sale>('sales', data),
  readAll: () => readItems<Sale>('sales'),
  read: (id: number) => readItem<Sale>('sales', id),
  update: (id: number, data: SaleUpdate) => updateItem<Sale>('sales', id, data),
  delete: (id: number) => deleteItem('sales', id)
};

// Stock Movements
export const stockMovementsApi = {
  create: (data: StockMovementInsert) => createItem<StockMovement>('stock_movements', data),
  readAll: () => readItems<StockMovement>('stock_movements'),
  read: (id: number) => readItem<StockMovement>('stock_movements', id),
  update: (id: number, data: StockMovementUpdate) => updateItem<StockMovement>('stock_movements', id, data),
  delete: (id: number) => deleteItem('stock_movements', id)
};

// Expenses
export const expensesApi = {
  create: (data: ExpenseInsert) => createItem<Expense>('expenses', data),
  readAll: () => readItems<Expense>('expenses'),
  read: (id: number) => readItem<Expense>('expenses', id),
  update: (id: number, data: ExpenseUpdate) => updateItem<Expense>('expenses', id, data),
  delete: (id: number) => deleteItem('expenses', id)
};

// Credit Sales
export const creditSalesApi = {
  create: (data: CreditSaleInsert) => createItem<CreditSale>('credit_sales', data),
  readAll: () => readItems<CreditSale>('credit_sales'),
  read: (id: number) => readItem<CreditSale>('credit_sales', id),
  update: (id: number, data: CreditSaleUpdate) => updateItem<CreditSale>('credit_sales', id, data),
  delete: (id: number) => deleteItem('credit_sales', id)
};

// Returns
export const returnsApi = {
  create: (data: ReturnInsert) => createItem<Return>('returns', data),
  readAll: () => readItems<Return>('returns'),
  read: (id: number) => readItem<Return>('returns', id),
  update: (id: number, data: ReturnUpdate) => updateItem<Return>('returns', id, data),
  delete: (id: number) => deleteItem('returns', id)
};

// Exchanges
export const exchangesApi = {
  create: (data: ExchangeInsert) => createItem<Exchange>('exchanges', data),
  readAll: () => readItems<Exchange>('exchanges'),
  read: (id: number) => readItem<Exchange>('exchanges', id),
  update: (id: number, data: ExchangeUpdate) => updateItem<Exchange>('exchanges', id, data),
  delete: (id: number) => deleteItem('exchanges', id)
};

export const paymentHistoryApi = {
  create: (data: PaymentHistoryInsert) => createItem<PaymentHistory>('payment_history', data),
  readAll: () => readItems<PaymentHistory>('payment_history'),
  read: (id: number) => readItem<PaymentHistory>('payment_history', id),
  update: (id: number, data: PaymentHistoryUpdate) => updateItem<PaymentHistory>('payment_history', id, data),
  delete: (id: number) => deleteItem('payment_history', id),
  readByCreditor: async (creditorId: number): Promise<PaymentHistory[]> => {
    const { data, error } = await supabase
      .from('payment_history')
      .select('*')
      .eq('creditor_id', creditorId)
      .order('payment_date', { ascending: false });
    
    if (error) throw error;
    return data as PaymentHistory[];
  }
};
