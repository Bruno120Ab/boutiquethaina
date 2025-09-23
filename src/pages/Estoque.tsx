import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { db, Product, StockMovement, Customer } from '@/lib/database';
import { 
  Package, 
  Plus, 
  Edit, 
  AlertTriangle,
  Search,
  TrendingUp,
  TrendingDown,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import ZapDialog from '@/components/ZapDialog';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const Estoque = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showZapDialog, setShowZapDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    price: 0,
    stock: 0,
    category: '',
    barcode: '',
    description: '',
    supplier: '',
    minStock: 5
  });

  const [cost, setCost] = useState<number>(0);
  const [margin, setMargin] = useState<number>(0);
  const [tax, setTax] = useState<number>(0);
  const [isManualPrice, setIsManualPrice] = useState(false);

  // Calcula o preço sugerido
  const calculatePrice = () => {
    return ((cost || 0) * (1 + (margin || 0) / 100)) * (1 + (tax || 0) / 100);
  };

  // Atualiza o preço quando custo/margem/imposto mudam
  useEffect(() => {
    if (!isManualPrice) {
      setNewProduct(prev => ({ ...prev, price: calculatePrice() }));
    }
  }, [cost, margin, tax]);

  useEffect(() => {
    loadProducts();
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const allCustomers = await db.customers.toArray();
      setCustomers(allCustomers);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    }
  };

  const loadProducts = async () => {
    try {
      const allProducts = await db.products.toArray();
      setProducts(allProducts);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      toast({ title: "Erro", description: "Não foi possível carregar os produtos.", variant: "destructive" });
    }
  };

  const categories = [...new Set(products.map(p => p.category))];

  const filteredProducts = products.filter(product => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.barcode?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const lowStockProducts = products.filter(p => p.stock <= p.minStock);

  const saveProduct = async () => {
    try {
      if (!newProduct.name || !newProduct.category || newProduct.price === undefined) {
        toast({ title: "Erro", description: "Preencha todos os campos obrigatórios.", variant: "destructive" });
        return;
      }

      const productData: Product = {
        ...(newProduct as Product),
        updatedAt: new Date(),
        createdAt: editingProduct ? editingProduct.createdAt : new Date()
      };

      if (editingProduct) {
        await db.products.update(editingProduct.id!, productData);
        toast({ title: "Produto atualizado", description: "Produto atualizado com sucesso." });
      } else {
        await db.products.add(productData);
        toast({ title: "Produto adicionado", description: "Produto adicionado com sucesso." });
      }

      setShowAddDialog(false);
      setEditingProduct(null);
      resetNewProduct();
      await loadProducts();
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      toast({ title: "Erro", description: "Não foi possível salvar o produto.", variant: "destructive" });
    }
  };

  const resetNewProduct = () => {
    setNewProduct({
      name: '',
      price: undefined,
      stock: undefined,
      category: '',
      barcode: '',
      description: '',
      supplier: '',
      minStock: undefined
    });
    setCost(undefined);
    setMargin(undefined);
    setTax(undefined);
    setIsManualPrice(false);
  };

  const editProduct = (product: Product) => {
    setEditingProduct(product);
    setNewProduct(product);
    setCost(product.price); // você pode calcular backward se quiser
    setMargin(0);
    setTax(0);
    setIsManualPrice(true);
    setShowAddDialog(true);
  };

  const adjustStock = async (productId: number, adjustment: number, reason: string) => {
    try {
      const product = await db.products.get(productId);
      if (!product) return;
      const newStock = Math.max(0, product.stock + adjustment);
      await db.products.update(productId, { stock: newStock, updatedAt: new Date() });
      const stockMovement: Omit<StockMovement, 'id'> = {
        productId,
        productName: product.name,
        type: adjustment > 0 ? 'entrada' : adjustment < 0 ? 'saida' : 'ajuste',
        quantity: Math.abs(adjustment),
        reason,
        createdAt: new Date()
      };
      await db.stockMovements.add(stockMovement);
      await loadProducts();
      toast({ title: "Estoque ajustado", description: `Estoque de ${product.name} ajustado.` });
    } catch (error) {
      console.error('Erro ao ajustar estoque:', error);
      toast({ title: "Erro", description: "Não foi possível ajustar o estoque.", variant: "destructive" });
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Cabeçalho e botão Novo Produto */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-foreground">Controle de Estoque</h1>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingProduct(null);
                resetNewProduct();
                setShowAddDialog(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingProduct ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <InputField label="Nome *"  placeholder={'Nome do produto'}value={newProduct.name} onChange={(v) => setNewProduct({ ...newProduct, name: v })} />
              
              <div className="grid grid-cols-2 gap-2">
                <InputField label="Custo do Produto" type="number" placeholder={'R$0,00'} value={cost} onChange={(v) => { setCost(Number(v)); setIsManualPrice(false); }} />
                <InputField label="Margem (%)" type="number" placeholder={'R$0,00'}  value={margin} onChange={(v) => { setMargin(Number(v)); setIsManualPrice(false); }} />
                <InputField label="Impostos (%)" type="number" placeholder={'R$0,00'}  value={tax} onChange={(v) => { setTax(Number(v)); setIsManualPrice(false); }} />
                <InputField
                  label="Preço Final *"
                  type="text" // usamos "text" para permitir a formatação com R$
                  value={newProduct.price !== undefined ? `R$ ${newProduct.price.toFixed(2)}` : ''}
                  onChange={(v) => {
                    // Remove tudo que não é número ou ponto
                    const numericValue = Number(v.replace(/[^0-9.]/g, ''));
                    setNewProduct({ ...newProduct, price: numericValue });
                    setIsManualPrice(true);
                  }}
                  placeholder={`R$ ${ formatCurrency(calculatePrice())}`}
                />
                <InputField label="Estoque"  placeholder={'Quantidade de itens'} type="number" value={newProduct.stock} onChange={(v) => setNewProduct({ ...newProduct, stock: Number(v) })} />
              </div>

              <InputField label="Categoria *" placeholder={'Exemplo: Camisas, Calças e etc'} value={newProduct.category} onChange={(v) => setNewProduct({ ...newProduct, category: v })} />
              <InputField label="Código de Barras" value={newProduct.barcode} onChange={(v) => setNewProduct({ ...newProduct, barcode: v })} />
              <InputField label="Fornecedor" value={newProduct.supplier} onChange={(v) => setNewProduct({ ...newProduct, supplier: v })} />
              <InputField label="Estoque Mínimo"  placeholder={'Para controle de estoque baixo'} type="number" value={newProduct.minStock} onChange={(v) => setNewProduct({ ...newProduct, minStock: Number(v) })} />

              <Button onClick={saveProduct} className="w-full">{editingProduct ? 'Atualizar' : 'Adicionar'} Produto</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard icon={<Package className="h-6 w-6 text-primary" />} title="Total de Produtos" value={products.length} />
        <StatCard icon={<AlertTriangle className="h-6 w-6 text-warning" />} title="Estoque Baixo" value={lowStockProducts.length} />
        <StatCard icon={<TrendingUp className="h-6 w-6 text-success" />} title="Valor Total Estoque" value={`R$ ${ formatCurrency(products.reduce((sum, p) => sum + (p.price * p.stock), 0))}`} />
      </div>

      {/* Filtros */}
      <Card className="p-4 mb-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <SearchInput placeholder="Buscar produtos..." value={searchTerm} onChange={setSearchTerm} />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Filtrar por categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {categories.map(category => <SelectItem key={category} value={category}>{category}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Tabela de produtos */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b">
              <tr className="text-left">
                <th className="p-4 font-medium">Produto</th>
                <th className="p-4 font-medium">Categoria</th>
                <th className="p-4 font-medium">Preço</th>
                <th className="p-4 font-medium">Estoque</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id} className="border-b hover:bg-muted/50">
                  <td className="p-4">
                    <p className="font-medium">{product.name}</p>
                    {product.barcode && <p className="text-xs text-muted-foreground">{product.barcode}</p>}
                  </td>
                  <td className="p-4"><Badge variant="outline">{product.category}</Badge></td>
                  <td className="p-4 font-medium">R$ { formatCurrency(product.price)}</td>
                  <td className="p-4"><span className="font-medium">{product.stock}</span> <span className="text-xs text-muted-foreground">un.</span></td>
                  <td className="p-4">
                    <Badge variant={product.stock <= 0 ? "destructive" : product.stock <= product.minStock ? "warning" : "success"}>
                      {product.stock <= 0 ? "Sem estoque" : product.stock <= product.minStock ? "Estoque baixo" : "Normal"}
                    </Badge>
                  </td>
                  <td className="p-4 flex items-center space-x-1">
                    <Button size="sm" variant="outline" onClick={() => editProduct(product)}><Edit className="h-3 w-3" /></Button>
                    <Button size="sm" variant="outline" onClick={() => adjustStock(product.id!, 10, "Entrada manual")}><TrendingUp className="h-3 w-3" /></Button>
                    <Button size="sm" variant="outline" onClick={() => adjustStock(product.id!, -1, "Saída manual")}><TrendingDown className="h-3 w-3" /></Button>
                    {/* <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => {
                        setSelectedProduct(product);
                        setShowZapDialog(true);
                      }}
                      className="text-yellow-600 hover:text-yellow-700"
                    >
                      <Zap className="h-3 w-3" />
                    </Button> */}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal do Zapier */}
      <ZapDialog 
        isOpen={showZapDialog}
        onClose={() => setShowZapDialog(false)}
        product={selectedProduct}
        customers={customers}
      />
    </div>
  );
};

// Componentes auxiliares
const InputField = ({ label, value, onChange, type = "text", placeholder }: any) => (
  <div>
    <Label>{label}</Label>
    <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
  </div>
);

const StatCard = ({ icon, title, value }: any) => (
  <Card className="p-4">
    <div className="flex items-center space-x-3">
      <div className="p-2 bg-primary/10 rounded-lg">{icon}</div>
      <div>
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  </Card>
);

const SearchInput = ({ placeholder, value, onChange }: any) => (
  <Input placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} className="pl-10" />
);


export default Estoque;