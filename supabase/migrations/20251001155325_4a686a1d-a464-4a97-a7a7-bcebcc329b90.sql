-- Create products table
CREATE TABLE IF NOT EXISTS public.products (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  category TEXT NOT NULL,
  barcode TEXT,
  description TEXT,
  supplier TEXT,
  min_stock INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create customers table
CREATE TABLE IF NOT EXISTS public.customers (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  cpf TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create users table (for system users/employees)
CREATE TABLE IF NOT EXISTS public.system_users (
  id BIGSERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'vendedor', 'estoquista', 'estagiario')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create sales table
CREATE TABLE IF NOT EXISTS public.sales (
  id BIGSERIAL PRIMARY KEY,
  items JSONB NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('dinheiro', 'cartao', 'pix', 'crediario')),
  discount DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  customer_id BIGINT REFERENCES public.customers(id),
  installments INTEGER,
  installment_value DECIMAL(10,2),
  user_id BIGINT NOT NULL REFERENCES public.system_users(id)
);

-- Create creditors table
CREATE TABLE IF NOT EXISTS public.creditors (
  id BIGSERIAL PRIMARY KEY,
  customer_id BIGINT NOT NULL REFERENCES public.customers(id),
  customer_name TEXT NOT NULL,
  total_debt DECIMAL(10,2) NOT NULL,
  paid_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  remaining_amount DECIMAL(10,2) NOT NULL,
  due_date TIMESTAMPTZ NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pendente', 'pago', 'atrasado')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create carne_installments table
CREATE TABLE IF NOT EXISTS public.carne_installments (
  id BIGSERIAL PRIMARY KEY,
  creditor_id BIGINT NOT NULL REFERENCES public.creditors(id) ON DELETE CASCADE,
  installment_number INTEGER NOT NULL,
  due_date TIMESTAMPTZ NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  paid BOOLEAN NOT NULL DEFAULT FALSE,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create credit_sales table
CREATE TABLE IF NOT EXISTS public.credit_sales (
  id BIGSERIAL PRIMARY KEY,
  sale_id BIGINT NOT NULL REFERENCES public.sales(id),
  creditor_id BIGINT NOT NULL REFERENCES public.creditors(id),
  installment_number INTEGER NOT NULL,
  installment_value DECIMAL(10,2) NOT NULL,
  due_date TIMESTAMPTZ NOT NULL,
  paid_date TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('pendente', 'pago', 'atrasado')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create stock_movements table
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES public.products(id),
  product_name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('entrada', 'saida', 'ajuste')),
  quantity INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create returns table
CREATE TABLE IF NOT EXISTS public.returns (
  id BIGSERIAL PRIMARY KEY,
  sale_id BIGINT NOT NULL REFERENCES public.sales(id),
  items JSONB NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('devolucao', 'troca')),
  reason TEXT NOT NULL,
  total_refund DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pendente', 'processada', 'cancelada')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  user_id BIGINT NOT NULL REFERENCES public.system_users(id),
  customer_id BIGINT REFERENCES public.customers(id)
);

-- Create exchanges table
CREATE TABLE IF NOT EXISTS public.exchanges (
  id BIGSERIAL PRIMARY KEY,
  original_sale_id BIGINT NOT NULL REFERENCES public.sales(id),
  new_sale_id BIGINT REFERENCES public.sales(id),
  returned_items JSONB NOT NULL,
  new_items JSONB NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pendente', 'processada', 'cancelada')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  user_id BIGINT NOT NULL REFERENCES public.system_users(id),
  customer_id BIGINT REFERENCES public.customers(id)
);

-- Create expenses table
CREATE TABLE IF NOT EXISTS public.expenses (
  id BIGSERIAL PRIMARY KEY,
  supplier TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT,
  amount DECIMAL(10,2) NOT NULL,
  due_date TIMESTAMPTZ NOT NULL,
  paid BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creditors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carne_installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchanges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allowing all operations for now, can be restricted later)
CREATE POLICY "Allow all operations on products" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on customers" ON public.customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on system_users" ON public.system_users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on sales" ON public.sales FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on creditors" ON public.creditors FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on carne_installments" ON public.carne_installments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on credit_sales" ON public.credit_sales FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on stock_movements" ON public.stock_movements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on returns" ON public.returns FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on exchanges" ON public.exchanges FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on expenses" ON public.expenses FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products(barcode);
CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON public.sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON public.sales(created_at);
CREATE INDEX IF NOT EXISTS idx_creditors_customer_id ON public.creditors(customer_id);
CREATE INDEX IF NOT EXISTS idx_creditors_status ON public.creditors(status);
CREATE INDEX IF NOT EXISTS idx_carne_installments_creditor_id ON public.carne_installments(creditor_id);
CREATE INDEX IF NOT EXISTS idx_carne_installments_paid ON public.carne_installments(paid);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON public.stock_movements(product_id);

-- Create trigger function to update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_creditors_updated_at
  BEFORE UPDATE ON public.creditors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();