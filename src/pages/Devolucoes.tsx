import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { db, Sale, Return, ReturnItem, Exchange, StockMovement } from '@/lib/database';
import { authService } from '@/lib/auth';
import { formatCurrency } from '@/lib/formatters';
import { 
  ArrowLeft, 
  Search, 
  Package, 
  RefreshCw,
  CheckCircle,
  XCircle,
  Plus
} from 'lucide-react';

const Devolucoes = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [returns, setReturns] = useState<Return[]>([]);
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [returnType, setReturnType] = useState<'devolucao' | 'troca'>('devolucao');
  const [returnReason, setReturnReason] = useState('');
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [salesData, returnsData, exchangesData] = await Promise.all([
        db.sales.orderBy('createdAt').reverse().toArray(),
        db.returns.orderBy('createdAt').reverse().toArray(),
        db.exchanges.orderBy('createdAt').reverse().toArray()
      ]);
      
      setSales(salesData);
      setReturns(returnsData);
      setExchanges(exchangesData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredSales = sales.filter(sale => 
    sale.id?.toString().includes(searchTerm) ||
    sale.items.some(item => 
      item.productName.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const initializeReturnItems = (sale: Sale) => {
    setReturnItems(sale.items.map(item => ({
      productId: item.productId,
      productName: item.productName,
      quantity: 0,
      price: item.price,
      condition: 'nova' as const
    })));
  };

  const updateReturnItemQuantity = (productId: number, quantity: number) => {
    setReturnItems(items => 
      items.map(item => 
        item.productId === productId 
          ? { ...item, quantity: Math.max(0, Math.min(quantity, getMaxReturnQuantity(productId))) }
          : item
      )
    );
  };

  const getMaxReturnQuantity = (productId: number) => {
    const saleItem = selectedSale?.items.find(item => item.productId === productId);
    return saleItem?.quantity || 0;
  };

  const processReturn = async () => {
    if (!selectedSale || !returnReason.trim()) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    const itemsToReturn = returnItems.filter(item => item.quantity > 0);
    if (itemsToReturn.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos um item para devolução/troca.",
        variant: "destructive",
      });
      return;
    }

    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) return;

      const totalRefund = itemsToReturn.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      const returnData: Omit<Return, 'id'> = {
        saleId: selectedSale.id!,
        items: itemsToReturn,
        type: returnType,
        reason: returnReason,
        totalRefund,
        status: 'pendente',
        createdAt: new Date(),
        userId: currentUser.id!,
        customerId: selectedSale.customerId
      };

      await db.returns.add(returnData);

      // Atualizar estoque para devoluções
      if (returnType === 'devolucao') {
        for (const item of itemsToReturn) {
          const product = await db.products.get(item.productId);
          if (product && item.condition !== 'danificada') {
            await db.products.update(item.productId, { 
              stock: product.stock + item.quantity,
              updatedAt: new Date()
            });

            // Registrar movimentação de estoque
            const stockMovement: Omit<StockMovement, 'id'> = {
              productId: item.productId,
              productName: item.productName,
              type: 'entrada',
              quantity: item.quantity,
              reason: `Devolução - ${returnReason}`,
              createdAt: new Date()
            };
            await db.stockMovements.add(stockMovement);
          }
        }
      }

      toast({
        title: "Sucesso",
        description: `${returnType === 'devolucao' ? 'Devolução' : 'Troca'} registrada com sucesso!`,
      });

      // Reset form
      setSelectedSale(null);
      setReturnReason('');
      setReturnItems([]);
      loadData();
    } catch (error) {
      console.error('Erro ao processar devolução:', error);
      toast({
        title: "Erro",
        description: "Não foi possível processar a devolução/troca.",
        variant: "destructive",
      });
    }
  };

  const updateReturnStatus = async (returnId: number, status: 'processada' | 'cancelada') => {
    try {
      await db.returns.update(returnId, { 
        status, 
        processedAt: new Date() 
      });
      
      toast({
        title: "Sucesso",
        description: `Devolução ${status} com sucesso!`,
      });
      
      loadData();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando devoluções...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    // <div className="p-6 max-w-7xl mx-auto">
    //   <div className="flex justify-between items-center mb-6">
    //     <h1 className="text-3xl font-bold text-foreground">Devoluções e Trocas</h1>
    //     <Dialog>
    //       <DialogTrigger asChild>
    //         <Button>
    //           <Plus className="h-4 w-4 mr-2" />
    //           Nova Devolução/Troca
    //         </Button>
    //       </DialogTrigger>
    //       <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
    //         <DialogHeader>
    //           <DialogTitle>Nova Devolução/Troca</DialogTitle>
    //         </DialogHeader>
            
    //         {!selectedSale ? (
    //           <div className="space-y-4">
    //             <div>
    //               <Label>Buscar Venda</Label>
    //               <div className="relative">
    //                 <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
    //                 <Input
    //                   placeholder="Digite o ID da venda ou nome do produto..."
    //                   value={searchTerm}
    //                   onChange={(e) => setSearchTerm(e.target.value)}
    //                   className="pl-10"
    //                 />
    //               </div>
    //             </div>

    //             <div className="space-y-2 max-h-60 overflow-y-auto">
    //               {filteredSales.map((sale) => (
    //                 <Card 
    //                   key={sale.id} 
    //                   className="p-4 cursor-pointer hover:bg-muted transition-colors"
    //                   onClick={() => {
    //                     setSelectedSale(sale);
    //                     initializeReturnItems(sale);
    //                   }}
    //                 >
    //                   <div className="flex justify-between items-center">
    //                     <div>
    //                       <p className="font-medium">Venda #{sale.id}</p>
    //                       <p className="text-sm text-muted-foreground">
    //                         {new Date(sale.createdAt).toLocaleString()}
    //                       </p>
    //                       <p className="text-sm text-muted-foreground">
    //                         {sale.items.length} {sale.items.length === 1 ? 'item' : 'itens'}
    //                       </p>
    //                     </div>
    //                     <div className="text-right">
    //                       <p className="font-medium">{formatCurrency(sale.total)}</p>
    //                       <Badge variant="outline">
    //                         {sale.paymentMethod}
    //                       </Badge>
    //                     </div>
    //                   </div>
    //                 </Card>
    //               ))}
    //             </div>
    //           </div>
    //         ) : (
    //           <div className="space-y-4">
    //             <div className="flex items-center space-x-2 mb-4">
    //               <Button 
    //                 variant="ghost" 
    //                 size="sm"
    //                 onClick={() => setSelectedSale(null)}
    //               >
    //                 <ArrowLeft className="h-4 w-4 mr-2" />
    //                 Voltar
    //               </Button>
    //               <div>
    //                 <p className="font-medium">Venda #{selectedSale.id}</p>
    //                 <p className="text-sm text-muted-foreground">
    //                   {new Date(selectedSale.createdAt).toLocaleString()}
    //                 </p>
    //               </div>
    //             </div>

    //             <div className="grid grid-cols-2 gap-4">
    //               <div>
    //                 <Label>Tipo</Label>
    //                 <Select value={returnType} onValueChange={(value: 'devolucao' | 'troca') => setReturnType(value)}>
    //                   <SelectTrigger>
    //                     <SelectValue />
    //                   </SelectTrigger>
    //                   <SelectContent>
    //                     <SelectItem value="devolucao">Devolução</SelectItem>
    //                     <SelectItem value="troca">Troca</SelectItem>
    //                   </SelectContent>
    //                 </Select>
    //               </div>
    //             </div>

    //             <div>
    //               <Label>Motivo</Label>
    //               <Textarea
    //                 placeholder="Descreva o motivo da devolução/troca..."
    //                 value={returnReason}
    //                 onChange={(e) => setReturnReason(e.target.value)}
    //               />
    //             </div>

    //             <div>
    //               <Label>Itens da Venda</Label>
    //               <div className="space-y-2 max-h-60 overflow-y-auto">
    //                 {returnItems.map((item) => (
    //                   <Card key={item.productId} className="p-3">
    //                     <div className="flex items-center justify-between">
    //                       <div className="flex-1">
    //                         <p className="font-medium">{item.productName}</p>
    //                         <p className="text-sm text-muted-foreground">
    //                           {formatCurrency(item.price)} cada
    //                         </p>
    //                       </div>
    //                       <div className="flex items-center space-x-2">
    //                         <div>
    //                           <Label className="text-xs">Quantidade</Label>
    //                           <Input
    //                             type="number"
    //                             min="0"
    //                             max={getMaxReturnQuantity(item.productId)}
    //                             value={item.quantity}
    //                             onChange={(e) => updateReturnItemQuantity(item.productId, parseInt(e.target.value) || 0)}
    //                             className="w-20"
    //                           />
    //                         </div>
    //                         <div>
    //                           <Label className="text-xs">Condição</Label>
    //                           <Select 
    //                             value={item.condition} 
    //                             onValueChange={(value: 'nova' | 'usada' | 'danificada') => {
    //                               setReturnItems(items => 
    //                                 items.map(i => 
    //                                   i.productId === item.productId 
    //                                     ? { ...i, condition: value }
    //                                     : i
    //                                 )
    //                               );
    //                             }}
    //                           >
    //                             <SelectTrigger className="w-32">
    //                               <SelectValue />
    //                             </SelectTrigger>
    //                             <SelectContent>
    //                               <SelectItem value="nova">Nova</SelectItem>
    //                               <SelectItem value="usada">Usada</SelectItem>
    //                               <SelectItem value="danificada">Danificada</SelectItem>
    //                             </SelectContent>
    //                           </Select>
    //                         </div>
    //                       </div>
    //                     </div>
    //                   </Card>
    //                 ))}
    //               </div>
    //             </div>

    //             <div className="flex justify-end space-x-2">
    //               <Button variant="outline" onClick={() => setSelectedSale(null)}>
    //                 Cancelar
    //               </Button>
    //               <Button onClick={processReturn}>
    //                 Processar {returnType === 'devolucao' ? 'Devolução' : 'Troca'}
    //               </Button>
    //             </div>
    //           </div>
    //         )}
    //       </DialogContent>
    //     </Dialog>
    //   </div>

    //   {/* Lista de Devoluções */}
    //   <div className="grid gap-6">
    //     <Card className="p-6">
    //       <h3 className="text-lg font-semibold mb-4">Devoluções Recentes</h3>
    //       <div className="space-y-4">
    //         {returns.map((return_) => (
    //           <div key={return_.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
    //             <div className="flex items-center space-x-4">
    //               <div className="p-2 bg-background rounded-lg">
    //                 {return_.type === 'devolucao' ? 
    //                   <ArrowLeft className="h-5 w-5" /> : 
    //                   <RefreshCw className="h-5 w-5" />
    //                 }
    //               </div>
    //               <div>
    //                 <p className="font-medium">
    //                   {return_.type === 'devolucao' ? 'Devolução' : 'Troca'} #{return_.id}
    //                 </p>
    //                 <p className="text-sm text-muted-foreground">
    //                   Venda #{return_.saleId} • {new Date(return_.createdAt).toLocaleString()}
    //                 </p>
    //                 <p className="text-sm text-muted-foreground">
    //                   {return_.items.length} {return_.items.length === 1 ? 'item' : 'itens'}
    //                 </p>
    //               </div>
    //             </div>
                
    //             <div className="flex items-center space-x-4">
    //               <div className="text-right">
    //                 <p className="font-medium">{formatCurrency(return_.totalRefund)}</p>
    //                 <Badge 
    //                   variant={
    //                     return_.status === 'processada' ? 'default' :
    //                     return_.status === 'cancelada' ? 'destructive' : 'secondary'
    //                   }
    //                 >
    //                   {return_.status}
    //                 </Badge>
    //               </div>
                  
    //               {return_.status === 'pendente' && (
    //                 <div className="flex space-x-2">
    //                   <Button
    //                     size="sm"
    //                     onClick={() => updateReturnStatus(return_.id!, 'processada')}
    //                   >
    //                     <CheckCircle className="h-4 w-4 mr-1" />
    //                     Processar
    //                   </Button>
    //                   <Button
    //                     size="sm"
    //                     variant="destructive"
    //                     onClick={() => updateReturnStatus(return_.id!, 'cancelada')}
    //                   >
    //                     <XCircle className="h-4 w-4 mr-1" />
    //                     Cancelar
    //                   </Button>
    //                 </div>
    //               )}
    //             </div>
    //           </div>
    //         ))}
            
    //         {returns.length === 0 && (
    //           <p className="text-center text-muted-foreground py-8">
    //             Nenhuma devolução registrada
    //           </p>
    //         )}
    //       </div>
    //     </Card>
    //   </div>
    // </div>
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 sm:gap-0">
    <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Devoluções e Trocas</h1>
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto flex justify-center sm:justify-start">
          <Plus className="h-4 w-4 mr-2" />
          Nova Devolução/Troca
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-full sm:max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Devolução/Troca</DialogTitle>
        </DialogHeader>
        
        {!selectedSale ? (
          <div className="space-y-4">
            <div>
              <Label>Buscar Venda</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Digite o ID da venda ou nome do produto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {filteredSales.map((sale) => (
                <Card 
                  key={sale.id} 
                  className="p-4 cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => {
                    setSelectedSale(sale);
                    initializeReturnItems(sale);
                  }}
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                    <div>
                      <p className="font-medium">Venda #{sale.id}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(sale.createdAt).toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {sale.items.length} {sale.items.length === 1 ? 'item' : 'itens'}
                      </p>
                    </div>
                    <div className="text-right mt-2 sm:mt-0">
                      <p className="font-medium">{formatCurrency(sale.total)}</p>
                      <Badge variant="outline">{sale.paymentMethod}</Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 mb-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setSelectedSale(null)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <div>
                <p className="font-medium">Venda #{selectedSale.id}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(selectedSale.createdAt).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Tipo</Label>
                <Select value={returnType} onValueChange={(value: 'devolucao' | 'troca') => setReturnType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="devolucao">Devolução</SelectItem>
                    <SelectItem value="troca">Troca</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Motivo</Label>
              <Textarea
                placeholder="Descreva o motivo da devolução/troca..."
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
              />
            </div>

            <div>
              <Label>Itens da Venda</Label>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {returnItems.map((item) => (
                  <Card key={item.productId} className="p-3">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <p className="font-medium">{item.productName}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(item.price)} cada
                        </p>
                      </div>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <div>
                          <Label className="text-xs">Quantidade</Label>
                          <Input
                            type="number"
                            min="0"
                            max={getMaxReturnQuantity(item.productId)}
                            value={item.quantity}
                            onChange={(e) => updateReturnItemQuantity(item.productId, parseInt(e.target.value) || 0)}
                            className="w-full sm:w-20"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Condição</Label>
                          <Select 
                            value={item.condition} 
                            onValueChange={(value: 'nova' | 'usada' | 'danificada') => {
                              setReturnItems(items => 
                                items.map(i => 
                                  i.productId === item.productId 
                                    ? { ...i, condition: value }
                                    : i
                                )
                              );
                            }}
                          >
                            <SelectTrigger className="w-full sm:w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="nova">Nova</SelectItem>
                              <SelectItem value="usada">Usada</SelectItem>
                              <SelectItem value="danificada">Danificada</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
              <Button variant="outline" onClick={() => setSelectedSale(null)}>
                Cancelar
              </Button>
              <Button onClick={processReturn}>
                Processar {returnType === 'devolucao' ? 'Devolução' : 'Troca'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  </div>

  {/* Lista de Devoluções */}
  <div className="grid gap-6">
    <Card className="p-4 sm:p-6">
      <h3 className="text-lg sm:text-xl font-semibold mb-4">Devoluções Recentes</h3>
      <div className="space-y-4">
        {returns.map((return_) => (
          <div key={return_.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-muted rounded-lg gap-4 sm:gap-0">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-background rounded-lg">
                {return_.type === 'devolucao' ? 
                  <ArrowLeft className="h-5 w-5" /> : 
                  <RefreshCw className="h-5 w-5" />
                }
              </div>
              <div>
                <p className="font-medium">
                  {return_.type === 'devolucao' ? 'Devolução' : 'Troca'} #{return_.id}
                </p>
                <p className="text-sm text-muted-foreground">
                  Venda #{return_.saleId} • {new Date(return_.createdAt).toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  {return_.items.length} {return_.items.length === 1 ? 'item' : 'itens'}
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="text-right">
                <p className="font-medium">{formatCurrency(return_.totalRefund)}</p>
                <Badge 
                  variant={
                    return_.status === 'processada' ? 'default' :
                    return_.status === 'cancelada' ? 'destructive' : 'secondary'
                  }
                >
                  {return_.status}
                </Badge>
              </div>
              
              {return_.status === 'pendente' && (
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                  <Button
                    size="sm"
                    onClick={() => updateReturnStatus(return_.id!, 'processada')}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Processar
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => updateReturnStatus(return_.id!, 'cancelada')}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Cancelar
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {returns.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            Nenhuma devolução registrada
          </p>
        )}
      </div>
    </Card>
  </div>
</div>

  );
};

export default Devolucoes;