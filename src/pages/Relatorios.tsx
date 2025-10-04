import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { salesApi, stockMovementsApi, systemUsersApi } from '@/lib/supabaseApi';
import { formatCurrency } from '@/lib/formatters';

interface Sale {
  id: number;
  items: any;
  total: number;
  payment_method: string;
  user_id: number;
  created_at: string;
}

interface StockMovement {
  id: number;
  product_name: string;
  type: string;
  quantity: number;
  created_at: string;
}

interface User {
  id: number;
  username: string;
  role: string;
}
import { 
  BarChart3, 
  TrendingUp, 
  ShoppingCart, 
  DollarSign,
  Calendar,
  Download,
  User as UserIcon
} from 'lucide-react';

const Relatorios = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [period, setPeriod] = useState('today');
  const [selectedUserId, setSelectedUserId] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [period, selectedUserId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [allSales, allMovements, allUsers] = await Promise.all([
        salesApi.readAll(),
        stockMovementsApi.readAll(),
        systemUsersApi.readAll()
      ]);
      
      let filteredSales = filterByPeriod(allSales);
      const filteredMovements = filterByPeriod(allMovements);
      
      // Filtrar por vendedor
      if (selectedUserId !== 'all') {
        filteredSales = filteredSales.filter(sale => sale.user_id === parseInt(selectedUserId));
      }
      
      setSales(filteredSales);
      setStockMovements(filteredMovements);
      setUsers(allUsers);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os relatórios.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterByPeriod = (data: any[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    return data.filter(item => {
      const itemDate = new Date(item.created_at);
      switch (period) {
        case 'today':
          return itemDate >= today;
        case 'yesterday':
          return itemDate >= yesterday && itemDate < today;
        case 'week':
          return itemDate >= weekAgo;
        case 'month':
          return itemDate >= monthAgo;
        default:
          return true;
      }
    });
  };

  const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
  const totalSales = sales.length;
  const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;

  const salesByPayment = sales.reduce((acc, sale) => {
    acc[sale.payment_method] = (acc[sale.payment_method] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topProducts = sales
    .flatMap(sale => sale.items)
    .reduce((acc, item) => {
      const existing = acc.find(p => p.productName === item.productName);
      if (existing) {
        existing.quantity += item.quantity;
        existing.revenue += item.total;
      } else {
        acc.push({
          productName: item.productName,
          quantity: item.quantity,
          revenue: item.total
        });
      }
      return acc;
    }, [] as Array<{productName: string, quantity: number, revenue: number}>)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);

  // Análise por vendedor
  const salesByUser = sales.reduce((acc, sale) => {
    const user = users.find(u => u.id === sale.user_id);
    const userName = user?.username || 'Desconhecido';
    
    if (!acc[userName]) {
      acc[userName] = {
        totalSales: 0,
        totalRevenue: 0,
        salesCount: 0
      };
    }
    
    acc[userName].totalSales += 1;
    acc[userName].totalRevenue += sale.total;
    acc[userName].salesCount += sale.items.reduce((sum, item) => sum + item.quantity, 0);
    
    return acc;
  }, {} as Record<string, {totalSales: number, totalRevenue: number, salesCount: number}>);

  // Produtos únicos para filtro
  const uniqueProducts = Array.from(
    new Set(sales.flatMap(sale => sale.items.map(item => item.productName)))
  ).sort();

  const stockMovementsByType = stockMovements.reduce((acc, movement) => {
    acc[movement.type] = (acc[movement.type] || 0) + movement.quantity;
    return acc;
  }, {} as Record<string, number>);

  const exportData = () => {
    const data = {
      period,
      summary: {
        totalRevenue,
        totalSales,
        averageTicket
      },
      sales,
      stockMovements,
      topProducts
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-${period}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando relatórios...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-foreground">Relatórios</h1>
        <div className="flex items-center space-x-4">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="yesterday">Ontem</SelectItem>
              <SelectItem value="week">Última semana</SelectItem>
              <SelectItem value="month">Último mês</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Todos os vendedores" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os vendedores</SelectItem>
              {users.map(user => (
                <SelectItem key={user.id} value={user.id!.toString()}>
                  {user.username}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-success/10 rounded-lg">
              <DollarSign className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Receita Total</p>
              <p className="text-2xl font-bold text-success">
                {formatCurrency(totalRevenue)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <ShoppingCart className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total de Vendas</p>
              <p className="text-2xl font-bold">{totalSales}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-info/10 rounded-lg">
              <TrendingUp className="h-6 w-6 text-info" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ticket Médio</p>
              <p className="text-2xl font-bold">
                {formatCurrency(averageTicket)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-accent/10 rounded-lg">
              <BarChart3 className="h-6 w-6 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Produtos Vendidos</p>
              <p className="text-2xl font-bold">
                {sales.flatMap(s => s.items).reduce((sum, item) => sum + item.quantity, 0)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">Produtos Mais Vendidos</h3>
          <div className="space-y-3">
            {topProducts.map((product, index) => (
              <div key={product.productName} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center space-x-3">
                  <Badge variant="outline">{index + 1}º</Badge>
                  <div>
                    <p className="font-medium">{product.productName}</p>
                    <p className="text-sm text-muted-foreground">
                      {product.quantity} unidades
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatCurrency(product.revenue)}</p>
                </div>
              </div>
            ))}
            {topProducts.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma venda no período selecionado
              </p>
            )}
          </div>
        </Card>

        {/* Payment Methods */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">Formas de Pagamento</h3>
          <div className="space-y-3">
            {Object.entries(salesByPayment).map(([method, count]) => {
              const percentage = totalSales > 0 ? (count / totalSales * 100).toFixed(1) : '0';
              const methodLabels = {
                'dinheiro': 'Dinheiro',
                'cartao': 'Cartão',
                'pix': 'PIX'
              };
              
              return (
                <div key={method} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Badge variant="secondary">
                      {methodLabels[method as keyof typeof methodLabels] || method}
                    </Badge>
                    <span className="font-medium">{count} vendas</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{percentage}%</span>
                </div>
              );
            })}
            {Object.keys(salesByPayment).length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma venda no período selecionado
              </p>
            )}
          </div>
        </Card>

        {/* Stock Movements */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">Movimentação de Estoque</h3>
          <div className="space-y-3 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent relative">
            {stockMovements.length > 0 ? (
              stockMovements.map((movement) => (
                <div
                  key={movement.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{movement.product_name}</span>
                    <span className="text-sm text-muted-foreground"></span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge
                      variant={
                        movement.type === 'entrada'
                          ? 'default'
                          : movement.type === 'saida'
                          ? 'destructive'
                          : 'secondary'
                      }
                    >
                      {movement.type === 'entrada'
                        ? 'Entrada'
                        : movement.type === 'saida'
                        ? 'Saída'
                        : 'Ajuste'}
                    </Badge>
                    <span className="font-medium">{movement.quantity} unidades</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma movimentação no período selecionado
              </p>
            )}

            {/* Sombra sutil no final da lista */}
            {stockMovements.length > 4 && (
              <div className="absolute bottom-0 left-0 w-full h-6 bg-gradient-to-t from-card to-transparent pointer-events-none"></div>
            )}
          </div>
        </Card>


        {/* Análise por Vendedor */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">Análise por Vendedor</h3>
          <div className="space-y-3">
            {Object.entries(salesByUser).map(([userName, data]) => (
              <div key={userName} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <UserIcon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{userName}</p>
                    <p className="text-sm text-muted-foreground">
                      {data.totalSales} vendas • {data.salesCount} produtos
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatCurrency(data.totalRevenue)}</p>
                  <p className="text-sm text-muted-foreground">
                    Média: {formatCurrency(data.totalRevenue / data.totalSales)}
                  </p>
                </div>
              </div>
            ))}
            {Object.keys(salesByUser).length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma venda no período selecionado
              </p>
            )}
          </div>
        </Card>

        {/* Recent Sales */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">Vendas Recentes</h3>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {sales.slice(0, 10).map((sale) => {
              const user = users.find(u => u.id === sale.user_id);
              return (
                <div key={sale.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">Venda #{sale.id}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(sale.created_at).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {sale.items.length} {sale.items.length === 1 ? 'item' : 'itens'} • 
                      Vendedor: {user?.username || 'Desconhecido'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(sale.total)}</p>
                    <Badge variant="outline" className="text-xs">
                      {sale.payment_method}
                    </Badge>
                  </div>
                </div>
              );
            })}
            {sales.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma venda no período selecionado
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Relatorios;