import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { db } from '@/lib/database';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface MigrationStatus {
  table: string;
  status: 'pending' | 'migrating' | 'success' | 'error';
  count: number;
  error?: string;
}

export const DataMigration = () => {
  const { toast } = useToast();
  const [isMigrating, setIsMigrating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [migrationStatus, setMigrationStatus] = useState<MigrationStatus[]>([]);

  const updateStatus = (table: string, updates: Partial<MigrationStatus>) => {
    setMigrationStatus(prev => {
      const existing = prev.find(s => s.table === table);
      if (existing) {
        return prev.map(s => s.table === table ? { ...s, ...updates } : s);
      }
      return [...prev, { table, count: 0, status: 'pending', ...updates }];
    });
  };

  const migrateData = async () => {
    setIsMigrating(true);
    setProgress(0);
    setMigrationStatus([]);

    const tables = [
      'system_users',
      'customers',
      'products',
      'creditors',
      'carne_installments',
      'sales',
      'stock_movements',
      'expenses',
      'credit_sales',
      'returns',
      'exchanges'
    ];

    let completed = 0;

    try {
      // 1. Migrate system users
      updateStatus('system_users', { status: 'migrating' });
      const users = await db.users.toArray();
      if (users.length > 0) {
        const { error: usersError } = await supabase
          .from('system_users')
          .insert(users.map(u => ({
            id: u.id,
            username: u.username,
            password: u.password,
            role: u.role,
            created_at: u.createdAt.toISOString()
          })));
        
        if (usersError) throw new Error(`Erro ao migrar usuários: ${usersError.message}`);
        updateStatus('system_users', { status: 'success', count: users.length });
      } else {
        updateStatus('system_users', { status: 'success', count: 0 });
      }
      completed++;
      setProgress((completed / tables.length) * 100);

      // 2. Migrate customers
      updateStatus('customers', { status: 'migrating' });
      const customers = await db.customers.toArray();
      if (customers.length > 0) {
        const { error: customersError } = await supabase
          .from('customers')
          .insert(customers.map(c => ({
            id: c.id,
            name: c.name,
            phone: c.phone,
            email: c.email,
            address: c.address,
            cpf: c.cpf,
            created_at: c.createdAt.toISOString()
          })));
        
        if (customersError) throw new Error(`Erro ao migrar clientes: ${customersError.message}`);
        updateStatus('customers', { status: 'success', count: customers.length });
      } else {
        updateStatus('customers', { status: 'success', count: 0 });
      }
      completed++;
      setProgress((completed / tables.length) * 100);

      // 3. Migrate products
      updateStatus('products', { status: 'migrating' });
      const products = await db.products.toArray();
      if (products.length > 0) {
        const { error: productsError } = await supabase
          .from('products')
          .insert(products.map(p => ({
            id: p.id,
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
          })));
        
        if (productsError) throw new Error(`Erro ao migrar produtos: ${productsError.message}`);
        updateStatus('products', { status: 'success', count: products.length });
      } else {
        updateStatus('products', { status: 'success', count: 0 });
      }
      completed++;
      setProgress((completed / tables.length) * 100);

      // 4. Migrate creditors
      updateStatus('creditors', { status: 'migrating' });
      const creditors = await db.creditors.toArray();
      if (creditors.length > 0) {
        const { error: creditorsError } = await supabase
          .from('creditors')
          .insert(creditors.map(c => ({
            id: c.id,
            customer_id: c.customerId,
            customer_name: c.customerName,
            total_debt: c.totalDebt,
            paid_amount: c.paidAmount,
            remaining_amount: c.remainingAmount,
            due_date: c.dueDate.toISOString(),
            description: c.description,
            status: c.status,
            created_at: c.createdAt.toISOString(),
            updated_at: c.updatedAt.toISOString()
          })));
        
        if (creditorsError) throw new Error(`Erro ao migrar credores: ${creditorsError.message}`);
        updateStatus('creditors', { status: 'success', count: creditors.length });
      } else {
        updateStatus('creditors', { status: 'success', count: 0 });
      }
      completed++;
      setProgress((completed / tables.length) * 100);

      // 5. Migrate carne installments
      updateStatus('carne_installments', { status: 'migrating' });
      const carneInstallments = await db.carneInstallments.toArray();
      if (carneInstallments.length > 0) {
        const { error: carneError } = await supabase
          .from('carne_installments')
          .insert(carneInstallments.map(c => ({
            id: c.id,
            creditor_id: c.creditorId,
            installment_number: c.installmentNumber,
            due_date: c.dueDate.toISOString(),
            amount: c.amount,
            paid: c.paid,
            paid_at: c.paidAt?.toISOString(),
            created_at: c.createdAt.toISOString()
          })));
        
        if (carneError) throw new Error(`Erro ao migrar carnês: ${carneError.message}`);
        updateStatus('carne_installments', { status: 'success', count: carneInstallments.length });
      } else {
        updateStatus('carne_installments', { status: 'success', count: 0 });
      }
      completed++;
      setProgress((completed / tables.length) * 100);

      // 6. Migrate sales
      updateStatus('sales', { status: 'migrating' });
      const sales = await db.sales.toArray();
      if (sales.length > 0) {
        const { error: salesError } = await supabase
          .from('sales')
          .insert(sales.map(s => ({
            id: s.id,
            items: s.items as any,
            total: s.total,
            payment_method: s.paymentMethod,
            discount: s.discount,
            created_at: s.createdAt.toISOString(),
            customer_id: s.customerId,
            installments: s.installments,
            installment_value: s.installmentValue,
            user_id: s.userId
          })));
        
        if (salesError) throw new Error(`Erro ao migrar vendas: ${salesError.message}`);
        updateStatus('sales', { status: 'success', count: sales.length });
      } else {
        updateStatus('sales', { status: 'success', count: 0 });
      }
      completed++;
      setProgress((completed / tables.length) * 100);

      // 7. Migrate stock movements
      updateStatus('stock_movements', { status: 'migrating' });
      const stockMovements = await db.stockMovements.toArray();
      if (stockMovements.length > 0) {
        const { error: stockError } = await supabase
          .from('stock_movements')
          .insert(stockMovements.map(sm => ({
            id: sm.id,
            product_id: sm.productId,
            product_name: sm.productName,
            type: sm.type,
            quantity: sm.quantity,
            reason: sm.reason,
            created_at: sm.createdAt.toISOString()
          })));
        
        if (stockError) throw new Error(`Erro ao migrar movimentações: ${stockError.message}`);
        updateStatus('stock_movements', { status: 'success', count: stockMovements.length });
      } else {
        updateStatus('stock_movements', { status: 'success', count: 0 });
      }
      completed++;
      setProgress((completed / tables.length) * 100);

      // 8. Migrate expenses
      updateStatus('expenses', { status: 'migrating' });
      const expenses = await db.expenses.toArray();
      if (expenses.length > 0) {
        const { error: expensesError } = await supabase
          .from('expenses')
          .insert(expenses.map(e => ({
            id: e.id,
            supplier: e.supplier,
            description: e.description,
            category: e.category,
            amount: e.amount,
            due_date: e.dueDate.toISOString(),
            paid: e.paid,
            created_at: e.createdAt.toISOString()
          })));
        
        if (expensesError) throw new Error(`Erro ao migrar despesas: ${expensesError.message}`);
        updateStatus('expenses', { status: 'success', count: expenses.length });
      } else {
        updateStatus('expenses', { status: 'success', count: 0 });
      }
      completed++;
      setProgress((completed / tables.length) * 100);

      // 9. Migrate credit sales
      updateStatus('credit_sales', { status: 'migrating' });
      const creditSales = await db.creditSales.toArray();
      if (creditSales.length > 0) {
        const { error: creditSalesError } = await supabase
          .from('credit_sales')
          .insert(creditSales.map(cs => ({
            id: cs.id,
            sale_id: cs.saleId,
            creditor_id: cs.creditorId,
            installment_number: cs.installmentNumber,
            installment_value: cs.installmentValue,
            due_date: cs.dueDate.toISOString(),
            paid_date: cs.paidDate?.toISOString(),
            status: cs.status,
            created_at: cs.createdAt.toISOString()
          })));
        
        if (creditSalesError) throw new Error(`Erro ao migrar vendas a crédito: ${creditSalesError.message}`);
        updateStatus('credit_sales', { status: 'success', count: creditSales.length });
      } else {
        updateStatus('credit_sales', { status: 'success', count: 0 });
      }
      completed++;
      setProgress((completed / tables.length) * 100);

      // 10. Migrate returns
      updateStatus('returns', { status: 'migrating' });
      const returns = await db.returns.toArray();
      if (returns.length > 0) {
        const { error: returnsError } = await supabase
          .from('returns')
          .insert(returns.map(r => ({
            id: r.id,
            sale_id: r.saleId,
            items: r.items as any,
            type: r.type,
            reason: r.reason,
            total_refund: r.totalRefund,
            status: r.status,
            created_at: r.createdAt.toISOString(),
            processed_at: r.processedAt?.toISOString(),
            user_id: r.userId,
            customer_id: r.customerId
          })));
        
        if (returnsError) throw new Error(`Erro ao migrar devoluções: ${returnsError.message}`);
        updateStatus('returns', { status: 'success', count: returns.length });
      } else {
        updateStatus('returns', { status: 'success', count: 0 });
      }
      completed++;
      setProgress((completed / tables.length) * 100);

      // 11. Migrate exchanges
      updateStatus('exchanges', { status: 'migrating' });
      const exchanges = await db.exchanges.toArray();
      if (exchanges.length > 0) {
        const { error: exchangesError } = await supabase
          .from('exchanges')
          .insert(exchanges.map(e => ({
            id: e.id,
            original_sale_id: e.originalSaleId,
            new_sale_id: e.newSaleId,
            returned_items: e.returnedItems as any,
            new_items: e.newItems as any,
            reason: e.reason,
            status: e.status,
            created_at: e.createdAt.toISOString(),
            processed_at: e.processedAt?.toISOString(),
            user_id: e.userId,
            customer_id: e.customerId
          })));
        
        if (exchangesError) throw new Error(`Erro ao migrar trocas: ${exchangesError.message}`);
        updateStatus('exchanges', { status: 'success', count: exchanges.length });
      } else {
        updateStatus('exchanges', { status: 'success', count: 0 });
      }
      completed++;
      setProgress((completed / tables.length) * 100);

      toast({
        title: 'Migração concluída!',
        description: 'Todos os dados foram migrados com sucesso para o Lovable Cloud.',
      });
    } catch (error: any) {
      console.error('Erro na migração:', error);
      toast({
        title: 'Erro na migração',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsMigrating(false);
    }
  };

  const getStatusIcon = (status: MigrationStatus['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'migrating':
        return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Migração para Lovable Cloud
        </CardTitle>
        <CardDescription>
          Transfira todos os dados do armazenamento local (IndexedDB) para o Lovable Cloud
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={migrateData} 
          disabled={isMigrating}
          className="w-full"
        >
          {isMigrating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Migrando dados...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Iniciar Migração
            </>
          )}
        </Button>

        {isMigrating && (
          <div className="space-y-2">
            <Progress value={progress} />
            <p className="text-sm text-muted-foreground text-center">
              {Math.round(progress)}% concluído
            </p>
          </div>
        )}

        {migrationStatus.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Status da Migração:</h4>
            <div className="space-y-1">
              {migrationStatus.map((status) => (
                <div 
                  key={status.table}
                  className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                >
                  <span className="text-sm capitalize">{status.table.replace(/_/g, ' ')}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {status.count} registros
                    </span>
                    {getStatusIcon(status.status)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
