import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/formatters';
import { ShoppingBag, CreditCard, RotateCcw, TrendingUp } from 'lucide-react';

type Customer = {
  id: number;
  name: string;
  phone?: string | null;
  email?: string | null;
  cpf?: string | null;
};

type Sale = {
  id: number;
  total: number;
  discount: number;
  payment_method: string;
  created_at: string;
  items: any;
  installments?: number | null;
};

type Creditor = {
  id: number;
  total_debt: number;
  paid_amount: number;
  remaining_amount: number;
  due_date: string;
  status: string;
  description: string;
  created_at: string;
};

type Return = {
  id: number;
  total_refund: number;
  reason: string;
  status: string;
  type: string;
  created_at: string;
};

interface CustomerHistoryProps {
  customer: Customer | null;
  open: boolean;
  onClose: () => void;
}

const paymentLabels: Record<string, string> = {
  dinheiro: 'Dinheiro',
  cartao: 'Cartão',
  pix: 'PIX',
  crediario: 'Crediário',
};

const statusColors: Record<string, string> = {
  pendente: 'bg-yellow-500/20 text-yellow-700',
  pago: 'bg-green-500/20 text-green-700',
  parcial: 'bg-blue-500/20 text-blue-700',
  vencido: 'bg-destructive/20 text-destructive',
  processado: 'bg-green-500/20 text-green-700',
  aprovado: 'bg-green-500/20 text-green-700',
};

const CustomerHistory = ({ customer, open, onClose }: CustomerHistoryProps) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [creditors, setCreditors] = useState<Creditor[]>([]);
  const [returns, setReturns] = useState<Return[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (customer && open) {
      loadHistory();
    }
  }, [customer, open]);

  const loadHistory = async () => {
    if (!customer) return;
    setLoading(true);
    try {
      const [salesRes, creditorsRes, returnsRes] = await Promise.all([
        supabase.from('sales').select('*').eq('customer_id', customer.id).order('created_at', { ascending: false }),
        supabase.from('creditors').select('*').eq('customer_id', customer.id).order('created_at', { ascending: false }),
        supabase.from('returns').select('*').eq('customer_id', customer.id).order('created_at', { ascending: false }),
      ]);
      setSales((salesRes.data || []) as Sale[]);
      setCreditors((creditorsRes.data || []) as Creditor[]);
      setReturns((returnsRes.data || []) as Return[]);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalGasto = sales.reduce((acc, s) => acc + s.total, 0);
  const totalDevido = creditors.reduce((acc, c) => acc + c.remaining_amount, 0);

  if (!customer) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Histórico de {customer.name}</DialogTitle>
        </DialogHeader>

        {/* Resumo */}
        <div className="grid grid-cols-3 gap-3 mb-2">
          <Card className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Total Compras</p>
            <p className="font-bold text-primary">{sales.length}</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Total Gasto</p>
            <p className="font-bold text-green-700">{formatCurrency(totalGasto)}</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Saldo Devedor</p>
            <p className="font-bold text-destructive">{formatCurrency(totalDevido)}</p>
          </Card>
        </div>

        <Tabs defaultValue="vendas">
          <TabsList className="w-full">
            <TabsTrigger value="vendas" className="flex-1">
              <ShoppingBag className="h-4 w-4 mr-1" />
              Vendas ({sales.length})
            </TabsTrigger>
            <TabsTrigger value="creditos" className="flex-1">
              <CreditCard className="h-4 w-4 mr-1" />
              Créditos ({creditors.length})
            </TabsTrigger>
            <TabsTrigger value="devolucoes" className="flex-1">
              <RotateCcw className="h-4 w-4 mr-1" />
              Devoluções ({returns.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="vendas" className="space-y-2 mt-3">
            {loading && <p className="text-center text-muted-foreground py-4">Carregando...</p>}
            {!loading && sales.length === 0 && (
              <p className="text-center text-muted-foreground py-8">Nenhuma venda encontrada.</p>
            )}
            {sales.map(sale => {
              const items = Array.isArray(sale.items) ? sale.items : [];
              return (
                <Card key={sale.id} className="p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">Venda #{sale.id}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(sale.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {items.length} item(s) · {paymentLabels[sale.payment_method] || sale.payment_method}
                        {sale.installments && sale.installments > 1 ? ` · ${sale.installments}x` : ''}
                        {items.length > 0 && (
  <div className="mt-3 border-t pt-2 space-y-1">
    {items.map((item: any, index: number) => (
      <div key={index} className="flex justify-between text-xs">
        <span>
          {item.quantity}x {item.productName}
        </span>
        <span>{formatCurrency(item.total)}</span>
      </div>
    ))}
  </div>
)}
                      </p>
                    </div>
                    <div className="text-right">
                    <p className="font-bold text-primary">{formatCurrency(sale.total)}</p>
                      {sale.discount > 0 && (
                        <p className="text-xs text-muted-foreground">Desc: {formatCurrency(sale.discount)}</p>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </TabsContent>

          <TabsContent value="creditos" className="space-y-2 mt-3">
            {loading && <p className="text-center text-muted-foreground py-4">Carregando...</p>}
            {!loading && creditors.length === 0 && (
              <p className="text-center text-muted-foreground py-8">Nenhum crédito encontrado.</p>
            )}
            {creditors.map(c => (
              <Card key={c.id} className="p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{c.description}</p>
                    <p className="text-xs text-muted-foreground">
                      Venc: {new Date(c.due_date).toLocaleDateString('pt-BR')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Pago: {formatCurrency(c.paid_amount)} · Restante: {formatCurrency(c.remaining_amount)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(c.total_debt)}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[c.status] || 'bg-muted'}`}>
                      {c.status}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="devolucoes" className="space-y-2 mt-3">
            {loading && <p className="text-center text-muted-foreground py-4">Carregando...</p>}
            {!loading && returns.length === 0 && (
              <p className="text-center text-muted-foreground py-8">Nenhuma devolução encontrada.</p>
            )}
            {returns.map(r => (
              <Card key={r.id} className="p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">Devolução #{r.id}</p>
                    <p className="text-xs text-muted-foreground">{r.reason}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString('pt-BR')} · {r.type}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-destructive">{formatCurrency(r.total_refund)}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[r.status] || 'bg-muted'}`}>
                      {r.status}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerHistory;
