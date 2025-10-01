import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { db } from '@/lib/database';
import { supabase } from '@/integrations/supabase/client';
import { Upload, CheckCircle2, AlertCircle } from 'lucide-react';

interface MigrationStatus {
  table: string;
  status: 'pending' | 'migrating' | 'success' | 'error';
  count?: number;
  error?: string;
}

export function DataMigration() {
  const [isMigrating, setIsMigrating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statuses, setStatuses] = useState<MigrationStatus[]>([
    { table: 'system_users', status: 'pending' },
    { table: 'customers', status: 'pending' },
    { table: 'products', status: 'pending' },
    { table: 'sales', status: 'pending' },
    { table: 'creditors', status: 'pending' },
    { table: 'carne_installments', status: 'pending' },
    { table: 'credit_sales', status: 'pending' },
    { table: 'stock_movements', status: 'pending' },
    { table: 'expenses', status: 'pending' },
    { table: 'returns', status: 'pending' },
    { table: 'exchanges', status: 'pending' },
  ]);

  const updateStatus = (table: string, update: Partial<MigrationStatus>) => {
    setStatuses(prev => prev.map(s => 
      s.table === table ? { ...s, ...update } : s
    ));
  };

  const migrateUsers = async () => {
    updateStatus('system_users', { status: 'migrating' });
    try {
      const users = await db.users.toArray();
      if (users.length === 0) {
        updateStatus('system_users', { status: 'success', count: 0 });
        return;
      }

      const { error } = await supabase
        .from('system_users')
        .insert(users.map(u => ({
          username: u.username,
          password: u.password,
          role: u.role,
          created_at: u.createdAt.toISOString()
        })));

      if (error) throw error;
      updateStatus('system_users', { status: 'success', count: users.length });
    } catch (error: any) {
      updateStatus('system_users', { status: 'error', error: error.message });
      throw error;
    }
  };

  const migrateCustomers = async () => {
    updateStatus('customers', { status: 'migrating' });
    try {
      const customers = await db.customers.toArray();
      if (customers.length === 0) {
        updateStatus('customers', { status: 'success', count: 0 });
        return { mapping: {} };
      }

      const { data, error } = await supabase
        .from('customers')
        .insert(customers.map(c => ({
          name: c.name,
          phone: c.phone,
          email: c.email,
          address: c.address,
          cpf: c.cpf,
          created_at: c.createdAt.toISOString()
        })))
        .select();

      if (error) throw error;

      // Create mapping of old IDs to new IDs
      const mapping: Record<number, number> = {};
      customers.forEach((oldCustomer, index) => {
        if (oldCustomer.id && data[index]) {
          mapping[oldCustomer.id] = data[index].id;
        }
      });

      updateStatus('customers', { status: 'success', count: customers.length });
      return { mapping };
    } catch (error: any) {
      updateStatus('customers', { status: 'error', error: error.message });
      throw error;
    }
  };

  const migrateProducts = async () => {
    updateStatus('products', { status: 'migrating' });
    try {
      const products = await db.products.toArray();
      if (products.length === 0) {
        updateStatus('products', { status: 'success', count: 0 });
        return { mapping: {} };
      }

      const { data, error } = await supabase
        .from('products')
        .insert(products.map(p => ({
          name: p.name,
          price: p.price,
          stock: p.stock,
          category: p.category,
          barcode: p.barcode,
          description: p.description,
          supplier: p.supplier,
          min_stock: p.minStock,
          created_at: p.createdAt.toISOString(),
          updated_at: p.updatedAt.toISOString()
        })))
        .select();

      if (error) throw error;

      const mapping: Record<number, number> = {};
      products.forEach((oldProduct, index) => {
        if (oldProduct.id && data[index]) {
          mapping[oldProduct.id] = data[index].id;
        }
      });

      updateStatus('products', { status: 'success', count: products.length });
      return { mapping };
    } catch (error: any) {
      updateStatus('products', { status: 'error', error: error.message });
      throw error;
    }
  };

  const migrateSales = async (customerMapping: Record<number, number>) => {
    updateStatus('sales', { status: 'migrating' });
    try {
      const sales = await db.sales.toArray();
      if (sales.length === 0) {
        updateStatus('sales', { status: 'success', count: 0 });
        return { mapping: {} };
      }

      const { data, error } = await supabase
        .from('sales')
        .insert(sales.map(s => ({
          items: JSON.parse(JSON.stringify(s.items)),
          total: s.total,
          payment_method: s.paymentMethod,
          discount: s.discount,
          created_at: s.createdAt.toISOString(),
          customer_id: s.customerId ? customerMapping[s.customerId] : null,
          installments: s.installments,
          installment_value: s.installmentValue,
          user_id: 1 // Default to first user
        })))
        .select();

      if (error) throw error;

      const mapping: Record<number, number> = {};
      sales.forEach((oldSale, index) => {
        if (oldSale.id && data[index]) {
          mapping[oldSale.id] = data[index].id;
        }
      });

      updateStatus('sales', { status: 'success', count: sales.length });
      return { mapping };
    } catch (error: any) {
      updateStatus('sales', { status: 'error', error: error.message });
      throw error;
    }
  };

  const migrateCreditors = async (customerMapping: Record<number, number>) => {
    updateStatus('creditors', { status: 'migrating' });
    try {
      const creditors = await db.creditors.toArray();
      if (creditors.length === 0) {
        updateStatus('creditors', { status: 'success', count: 0 });
        return { mapping: {} };
      }

      const { data, error } = await supabase
        .from('creditors')
        .insert(creditors.map(c => ({
          customer_id: customerMapping[c.customerId],
          customer_name: c.customerName,
          total_debt: c.totalDebt,
          paid_amount: c.paidAmount,
          remaining_amount: c.remainingAmount,
          due_date: c.dueDate.toISOString(),
          description: c.description,
          status: c.status,
          created_at: c.createdAt.toISOString(),
          updated_at: c.updatedAt.toISOString()
        })))
        .select();

      if (error) throw error;

      const mapping: Record<number, number> = {};
      creditors.forEach((oldCreditor, index) => {
        if (oldCreditor.id && data[index]) {
          mapping[oldCreditor.id] = data[index].id;
        }
      });

      updateStatus('creditors', { status: 'success', count: creditors.length });
      return { mapping };
    } catch (error: any) {
      updateStatus('creditors', { status: 'error', error: error.message });
      throw error;
    }
  };

  const migrateCarneInstallments = async (creditorMapping: Record<number, number>) => {
    updateStatus('carne_installments', { status: 'migrating' });
    try {
      const installments = await db.carneInstallments.toArray();
      if (installments.length === 0) {
        updateStatus('carne_installments', { status: 'success', count: 0 });
        return;
      }

      const { error } = await supabase
        .from('carne_installments')
        .insert(installments.map(i => ({
          creditor_id: creditorMapping[i.creditorId],
          installment_number: i.installmentNumber,
          due_date: i.dueDate.toISOString(),
          amount: i.amount,
          paid: i.paid,
          paid_at: i.paidAt?.toISOString(),
          created_at: i.createdAt.toISOString()
        })));

      if (error) throw error;
      updateStatus('carne_installments', { status: 'success', count: installments.length });
    } catch (error: any) {
      updateStatus('carne_installments', { status: 'error', error: error.message });
      throw error;
    }
  };

  const migrateCreditSales = async (saleMapping: Record<number, number>, creditorMapping: Record<number, number>) => {
    updateStatus('credit_sales', { status: 'migrating' });
    try {
      const creditSales = await db.creditSales.toArray();
      if (creditSales.length === 0) {
        updateStatus('credit_sales', { status: 'success', count: 0 });
        return;
      }

      const { error } = await supabase
        .from('credit_sales')
        .insert(creditSales.map(cs => ({
          sale_id: saleMapping[cs.saleId],
          creditor_id: creditorMapping[cs.creditorId],
          installment_number: cs.installmentNumber,
          installment_value: cs.installmentValue,
          due_date: cs.dueDate.toISOString(),
          paid_date: cs.paidDate?.toISOString(),
          status: cs.status,
          created_at: cs.createdAt.toISOString()
        })));

      if (error) throw error;
      updateStatus('credit_sales', { status: 'success', count: creditSales.length });
    } catch (error: any) {
      updateStatus('credit_sales', { status: 'error', error: error.message });
      throw error;
    }
  };

  const migrateStockMovements = async (productMapping: Record<number, number>) => {
    updateStatus('stock_movements', { status: 'migrating' });
    try {
      const movements = await db.stockMovements.toArray();
      if (movements.length === 0) {
        updateStatus('stock_movements', { status: 'success', count: 0 });
        return;
      }

      const { error } = await supabase
        .from('stock_movements')
        .insert(movements.map(m => ({
          product_id: productMapping[m.productId],
          product_name: m.productName,
          type: m.type,
          quantity: m.quantity,
          reason: m.reason,
          created_at: m.createdAt.toISOString()
        })));

      if (error) throw error;
      updateStatus('stock_movements', { status: 'success', count: movements.length });
    } catch (error: any) {
      updateStatus('stock_movements', { status: 'error', error: error.message });
      throw error;
    }
  };

  const migrateExpenses = async () => {
    updateStatus('expenses', { status: 'migrating' });
    try {
      const expenses = await db.expenses.toArray();
      if (expenses.length === 0) {
        updateStatus('expenses', { status: 'success', count: 0 });
        return;
      }

      const { error } = await supabase
        .from('expenses')
        .insert(expenses.map(e => ({
          supplier: e.supplier,
          description: e.description,
          category: e.category,
          amount: e.amount,
          due_date: e.dueDate.toISOString(),
          paid: e.paid,
          created_at: e.createdAt.toISOString()
        })));

      if (error) throw error;
      updateStatus('expenses', { status: 'success', count: expenses.length });
    } catch (error: any) {
      updateStatus('expenses', { status: 'error', error: error.message });
      throw error;
    }
  };

  const migrateReturns = async (saleMapping: Record<number, number>, customerMapping: Record<number, number>) => {
    updateStatus('returns', { status: 'migrating' });
    try {
      const returns = await db.returns.toArray();
      if (returns.length === 0) {
        updateStatus('returns', { status: 'success', count: 0 });
        return;
      }

      const { error } = await supabase
        .from('returns')
        .insert(returns.map(r => ({
          sale_id: saleMapping[r.saleId],
          items: JSON.parse(JSON.stringify(r.items)),
          type: r.type,
          reason: r.reason,
          total_refund: r.totalRefund,
          status: r.status,
          created_at: r.createdAt.toISOString(),
          processed_at: r.processedAt?.toISOString(),
          user_id: 1,
          customer_id: r.customerId ? customerMapping[r.customerId] : null
        })));

      if (error) throw error;
      updateStatus('returns', { status: 'success', count: returns.length });
    } catch (error: any) {
      updateStatus('returns', { status: 'error', error: error.message });
      throw error;
    }
  };

  const migrateExchanges = async (saleMapping: Record<number, number>, customerMapping: Record<number, number>) => {
    updateStatus('exchanges', { status: 'migrating' });
    try {
      const exchanges = await db.exchanges.toArray();
      if (exchanges.length === 0) {
        updateStatus('exchanges', { status: 'success', count: 0 });
        return;
      }

      const { error } = await supabase
        .from('exchanges')
        .insert(exchanges.map(e => ({
          original_sale_id: saleMapping[e.originalSaleId],
          new_sale_id: e.newSaleId ? saleMapping[e.newSaleId] : null,
          returned_items: JSON.parse(JSON.stringify(e.returnedItems)),
          new_items: JSON.parse(JSON.stringify(e.newItems)),
          reason: e.reason,
          status: e.status,
          created_at: e.createdAt.toISOString(),
          processed_at: e.processedAt?.toISOString(),
          user_id: 1,
          customer_id: e.customerId ? customerMapping[e.customerId] : null
        })));

      if (error) throw error;
      updateStatus('exchanges', { status: 'success', count: exchanges.length });
    } catch (error: any) {
      updateStatus('exchanges', { status: 'error', error: error.message });
      throw error;
    }
  };

  const startMigration = async () => {
    setIsMigrating(true);
    setProgress(0);
    
    try {
      // Step 1: Users (9%)
      await migrateUsers();
      setProgress(9);

      // Step 2: Customers (18%)
      const { mapping: customerMapping } = await migrateCustomers();
      setProgress(18);

      // Step 3: Products (27%)
      const { mapping: productMapping } = await migrateProducts();
      setProgress(27);

      // Step 4: Sales (36%)
      const { mapping: saleMapping } = await migrateSales(customerMapping);
      setProgress(36);

      // Step 5: Creditors (45%)
      const { mapping: creditorMapping } = await migrateCreditors(customerMapping);
      setProgress(45);

      // Step 6: Carne Installments (54%)
      await migrateCarneInstallments(creditorMapping);
      setProgress(54);

      // Step 7: Credit Sales (63%)
      await migrateCreditSales(saleMapping, creditorMapping);
      setProgress(63);

      // Step 8: Stock Movements (72%)
      await migrateStockMovements(productMapping);
      setProgress(72);

      // Step 9: Expenses (81%)
      await migrateExpenses();
      setProgress(81);

      // Step 10: Returns (90%)
      await migrateReturns(saleMapping, customerMapping);
      setProgress(90);

      // Step 11: Exchanges (100%)
      await migrateExchanges(saleMapping, customerMapping);
      setProgress(100);

      toast.success('Migração concluída com sucesso!');
    } catch (error: any) {
      toast.error('Erro durante a migração: ' + error.message);
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Migração de Dados</h2>
        <p className="text-muted-foreground">
          Migre todos os dados do IndexedDB local para o Lovable Cloud
        </p>
      </div>

      {isMigrating && (
        <div className="space-y-2">
          <Progress value={progress} />
          <p className="text-sm text-center text-muted-foreground">
            {progress.toFixed(0)}% concluído
          </p>
        </div>
      )}

      <div className="space-y-2">
        {statuses.map((status) => (
          <div key={status.table} className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <span className="font-medium capitalize">{status.table.replace('_', ' ')}</span>
            <div className="flex items-center gap-2">
              {status.count !== undefined && (
                <span className="text-sm text-muted-foreground">
                  {status.count} registros
                </span>
              )}
              {status.status === 'pending' && (
                <div className="w-5 h-5 rounded-full border-2 border-muted" />
              )}
              {status.status === 'migrating' && (
                <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              )}
              {status.status === 'success' && (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              )}
              {status.status === 'error' && (
                <AlertCircle className="w-5 h-5 text-destructive" />
              )}
            </div>
          </div>
        ))}
      </div>

      <Button 
        onClick={startMigration} 
        disabled={isMigrating}
        className="w-full"
        size="lg"
      >
        <Upload className="w-4 h-4 mr-2" />
        {isMigrating ? 'Migrando...' : 'Iniciar Migração'}
      </Button>
    </Card>
  );
}
