import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { productsApi, salesApi, stockMovementsApi, customersApi, creditorsApi } from '@/lib/supabaseApi';
import { authService } from '@/lib/auth';
import { formatCurrency } from '@/lib/formatters';

interface SaleItem {
  productId: number;
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

interface CartItem extends SaleItem {
  stock: number;
}

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  category: string;
  barcode?: string | null;
}

interface Customer {
  id: number;
  name: string;
  phone?: string | null;
  email?: string | null;
}
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingBag,
  CreditCard,
  Banknote,
  Smartphone,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { setupPWAInstallPrompt } from '@/pwa';
import { supabase } from '@/integrations/supabase/client';

interface CartItem extends SaleItem {
  stock: number;
}

const PDV = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'dinheiro' | 'cartao' | 'pix' | 'crediario'>('dinheiro');
  const [discount, setDiscount] = useState(0);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null);
  const [installments, setInstallments] = useState(1);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isProcessingSale, setIsProcessingSale] = useState(false);

  useEffect(() => {
    loadProducts();
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const allCustomers = await customersApi.readAll();
      setCustomers(allCustomers as any);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    }
  };

  const loadProducts = async () => {
    try {
      const allProducts = await productsApi.readAll();
      setProducts(allProducts as any);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os produtos.",
        variant: "destructive",
      });
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.barcode?.includes(searchTerm) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.productId === product.id);
    
    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        toast({
          title: "Estoque insuficiente",
          description: `Apenas ${product.stock} unidades disponíveis.`,
          variant: "destructive",
        });
        return;
      }
      updateCartQuantity(product.id, existingItem.quantity + 1);
    } else {
      if (product.stock <= 0) {
        toast({
          title: "Produto sem estoque",
          description: "Este produto não possui estoque disponível.",
          variant: "destructive",
        });
        return;
      }
      
      const newItem: CartItem = {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        price: product.price,
        total: product.price,
        stock: product.stock
      };
      setCart([...cart, newItem]);
    }
  };

  const updateCartQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(cart.map(item => {
      if (item.productId === productId) {
        if (newQuantity > item.stock) {
          toast({
            title: "Estoque insuficiente",
            description: `Apenas ${item.stock} unidades disponíveis.`,
            variant: "destructive",
          });
          return item;
        }
        return {
          ...item,
          quantity: newQuantity,
          total: newQuantity * item.price
        };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const getCartTotal = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
    return subtotal - discount;
  };

  const finalizeSale = async () => {
    if (cart.length === 0) {
      toast({
        title: "Carrinho vazio",
        description: "Adicione produtos ao carrinho antes de finalizar a venda.",
        variant: "destructive",
      });
      return;
    }

    if (paymentMethod === 'crediario') {
      if (!selectedCustomer) {
        toast({
          title: "Cliente obrigatório",
          description: "Selecione um cliente para vendas no crediário.",
          variant: "destructive",
        });
        return;
      }
      
      if (!installments || installments < 1) {
        toast({
          title: "Parcelas inválidas",
          description: "O número de parcelas deve ser pelo menos 1.",
          variant: "destructive",
        });
        return;
      }
    }

    setIsProcessingSale(true);
    
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        toast({
          title: "Erro de autenticação",
          description: "Usuário não autenticado.",
          variant: "destructive",
        });
        setIsProcessingSale(false);
        return;
      }

      console.log('Iniciando venda - Usuário:', currentUser);
      console.log('Total da venda:', getCartTotal());
      console.log('Itens do carrinho:', cart);

      // Create sale record
      const sale = {
        items: cart.map(item => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          price: item.price,
          total: item.total
        })),
        total: getCartTotal(),
        payment_method: paymentMethod,
        discount,
        user_id: Number(currentUser.id),
        customer_id: selectedCustomer,
        installments: paymentMethod === 'crediario' ? installments : null,
        installment_value: paymentMethod === 'crediario' ? getCartTotal() / installments : null
      };

      console.log('Criando venda com dados:', sale);
      const createdSale = await salesApi.create(sale as any);
      console.log('Venda criada com sucesso:', createdSale);

      // Update stock and create stock movements
      for (const item of cart) {
        try {
          console.log(`Atualizando estoque do produto ${item.productId}`);
          const product = await productsApi.read(item.productId);
          if (product) {
            const newStock = product.stock - item.quantity;
            await productsApi.update(item.productId, { stock: newStock });
            console.log(`Estoque atualizado: ${product.stock} -> ${newStock}`);

            // Create stock movement
            const stockMovement = {
              product_id: item.productId,
              product_name: item.productName,
              type: 'saida',
              quantity: item.quantity,
              reason: `Venda #${createdSale.id}`
            };
            await stockMovementsApi.create(stockMovement as any);
            console.log('Movimento de estoque registrado');
          }
        } catch (stockError) {
          console.error('Erro ao atualizar estoque:', stockError);
          // Continua mesmo com erro no estoque
        }
      }

      // Se for crediário, criar entrada na agenda de credores
      if (paymentMethod === 'crediario' && selectedCustomer) {
        console.log('Criando registro de credor para venda:', createdSale.id);
        
        try {
          const customer = await customersApi.read(selectedCustomer);
          
          if (!customer) {
            throw new Error('Cliente não encontrado');
          }

          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + 30);

          const creditorData = {
            customer_id: selectedCustomer,
            customer_name: customer.name,
            total_debt: getCartTotal(),
            paid_amount: 0,
            remaining_amount: getCartTotal(),
            due_date: dueDate.toISOString(),
            description: `Venda #${createdSale.id} - ${installments}x ${formatCurrency(getCartTotal() / installments)}`,
            status: 'pendente'
          };

          await creditorsApi.create(creditorData);
          console.log('Credor criado com sucesso');
          
        } catch (creditorError) {
          console.error('Erro ao criar credor:', creditorError);
          toast({
            title: "Aviso",
            description: "Venda registrada, mas houve erro ao criar o registro de crédito. Adicione manualmente na aba Credores.",
            variant: "default",
          });
        }
      }

      // Clear cart and reload products
      setCart([]);
      setDiscount(0);
      setSelectedCustomer(null);
      setInstallments(1);
      setPaymentMethod('dinheiro');
      await loadProducts();

      toast({
        title: "Venda finalizada!",
        description: `Venda #${createdSale.id} registrada com sucesso${paymentMethod === 'crediario' ? ' com crédito lançado' : ''}.`,
      });

    } catch (error) {
      console.error('Erro completo ao finalizar venda:', error);
      
      // Mensagem de erro mais detalhada
      let errorMessage = "Não foi possível finalizar a venda.";
      if (error instanceof Error) {
        errorMessage = error.message;
        if (error.message.includes('violates foreign key constraint')) {
          errorMessage = "Erro de dados: verifique se o usuário e cliente existem no sistema.";
        } else if (error.message.includes('user_id')) {
          errorMessage = "Erro: usuário não encontrado no sistema. Faça logout e login novamente.";
        }
      }
      
      toast({
        title: "Erro ao finalizar venda",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessingSale(false);
    }
  };

  const paymentMethods = [
    { id: 'dinheiro' as const, label: 'Dinheiro', icon: Banknote },
    { id: 'cartao' as const, label: 'Cartão', icon: CreditCard },
    { id: 'pix' as const, label: 'PIX', icon: Smartphone },
    { id: 'crediario' as const, label: 'Crediário', icon: Calendar },
  ];

  return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-foreground">Ponto de Venda</h1>
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="text-sm">
              {products.length} produtos cadastrados
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Products Section */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, código de barras ou categoria..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
              {filteredProducts.map((product) => (
                <Card
                  key={product.id}
                  className={cn(
                    "p-4 cursor-pointer transition-all hover:shadow-md",
                    product.stock <= 0 && "opacity-50"
                  )}
                  onClick={() => addToCart(product)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-sm">{product.name}</h3>
                    <Badge 
                      variant={product.stock <= (product as any).min_stock ? "destructive" : "secondary"}
                      className="text-xs"
                    >
                      {product.stock} un.
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{product.category}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-primary">
                      {formatCurrency(product.price)}
                    </span>
                    {product.stock > 0 && (
                      <Plus className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Cart Section */}
          <div className="space-y-4">
            <Card className="p-4">
              <div className="flex items-center space-x-2 mb-4">
                <ShoppingBag className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold">Carrinho</h2>
                <Badge variant="secondary">{cart.length}</Badge>
              </div>

              <div className="space-y-3 max-h-64 overflow-y-auto">
                {cart.map((item) => (
                  <div key={item.productId} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.productName}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(item.price)} cada
                      </p>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 w-6 p-0"
                        onClick={() => updateCartQuantity(item.productId, item.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-sm min-w-[2rem] text-center">{item.quantity}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 w-6 p-0"
                        onClick={() => updateCartQuantity(item.productId, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 w-6 p-0 ml-2"
                        onClick={() => removeFromCart(item.productId)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {cart.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  Carrinho vazio
                </p>
              )}
            </Card>

            {cart.length > 0 && (
              <Card className="p-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(cart.reduce((sum, item) => sum + item.total, 0))}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <label className="text-sm">Desconto:</label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={discount || ''}
                        onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                        className="h-8 text-sm"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    
                    <Separator />
                    
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span className="text-primary">{formatCurrency(getCartTotal())}</span>
                  </div>
                  </div>

                  {/* Cliente */}
                  {paymentMethod === 'crediario' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="customer">Cliente *</Label>
                        {customers.length === 0 && (
                          <span className="text-xs text-muted-foreground">Nenhum cliente cadastrado</span>
                        )}
                      </div>
                      <Select 
                        value={selectedCustomer?.toString() || ''} 
                        onValueChange={(value) => setSelectedCustomer(Number(value))}
                      >
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder={customers.length > 0 ? "Selecione um cliente" : "Cadastre um cliente primeiro"} />
                        </SelectTrigger>
                        <SelectContent className="z-[100] bg-popover">
                          {customers.length > 0 ? (
                            customers.map((customer) => (
                              <SelectItem 
                                key={customer.id} 
                                value={customer.id!.toString()}
                                className="cursor-pointer hover:bg-accent"
                              >
                                {customer.name} {customer.phone && `- ${customer.phone}`}
                              </SelectItem>
                            ))
                          ) : (
                            <div className="p-2 text-sm text-muted-foreground text-center">
                              Nenhum cliente cadastrado
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Forma de pagamento:</label>
                    <div className="grid grid-cols-2 gap-2">
                      {paymentMethods.map((method) => {
                        const Icon = method.icon;
                        return (
                          <Button
                            key={method.id}
                            variant={paymentMethod === method.id ? "default" : "outline"}
                            size="sm"
                            onClick={() => {
                              setPaymentMethod(method.id);
                              if (method.id !== 'crediario') {
                                setSelectedCustomer(null);
                                setInstallments(1);
                              }
                            }}
                            className="flex flex-col items-center p-2 h-auto"
                          >
                            <Icon className="h-4 w-4 mb-1" />
                            <span className="text-xs">{method.label}</span>
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Parcelamento */}
                  {paymentMethod === 'crediario' && (
                    <div className="space-y-2">
                      <Label htmlFor="installments">Parcelas</Label>
                      <Select value={installments.toString()} onValueChange={(value) => setInstallments(Number(value))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6].map((num) => (
                            <SelectItem key={num} value={num.toString()}>
                              {num}x de {formatCurrency(getCartTotal() / num)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <Button 
                    onClick={finalizeSale}
                    className="w-full"
                    size="lg"
                    disabled={isProcessingSale}
                  >
                    {isProcessingSale ? 'Processando...' : 'Finalizar Venda'}
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

 


  );
};

export default PDV;