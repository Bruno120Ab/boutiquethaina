import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { customersApi } from '@/lib/supabaseApi';
import { formatPhone, formatCPF } from '@/lib/formatters';

type Customer = {
  id: number;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  cpf?: string | null;
  created_at: string;
};
import { 
  Users, 
  Plus, 
  Search, 
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';

const Clientes = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  
  // Form fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [cpf, setCpf] = useState('');

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const allCustomers = await customersApi.readAll();
      setCustomers(allCustomers.sort((a, b) => a.name.localeCompare(b.name)) as any);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os clientes.",
        variant: "destructive",
      });
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.includes(searchTerm) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.cpf?.includes(searchTerm)
  );

  const resetForm = () => {
    setName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setCpf('');
    setEditingCustomer(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "O nome do cliente é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    try {
      const customerData = {
        name: name.trim(),
        phone: phone.trim() || null,
        email: email.trim() || null,
        address: address.trim() || null,
        cpf: cpf.trim() || null
      };

      if (editingCustomer) {
        await customersApi.update(editingCustomer.id, customerData);
        toast({
          title: "Cliente atualizado!",
          description: "As informações foram atualizadas com sucesso.",
        });
      } else {
        await customersApi.create(customerData);
        toast({
          title: "Cliente adicionado!",
          description: `${name} foi adicionado com sucesso.`,
        });
      }

      setIsDialogOpen(false);
      resetForm();
      loadCustomers();
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o cliente.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setName(customer.name);
    setPhone(customer.phone || '');
    setEmail(customer.email || '');
    setAddress(customer.address || '');
    setCpf(customer.cpf || '');
    setIsDialogOpen(true);
  };

  const handleDelete = async (customerId: number) => {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return;
    
    try {
      await customersApi.delete(customerId);
      toast({
        title: "Cliente removido!",
        description: "O cliente foi removido com sucesso.",
      });
      loadCustomers();
    } catch (error) {
      console.error('Erro ao excluir cliente:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o cliente.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Clientes</h1>
          <p className="text-muted-foreground">Gerencie seus clientes</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCustomer ? 'Editar Cliente' : 'Adicionar Cliente'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  placeholder="Nome completo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    placeholder="(11) 99999-9999"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="cliente@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  placeholder="Rua, número, bairro, cidade"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingCustomer ? 'Atualizar' : 'Adicionar'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Total de Clientes</p>
              <p className="text-2xl font-bold text-primary">{customers.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Busca */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, telefone, e-mail ou CPF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Lista de clientes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((customer) => (
          <Card key={customer.id} className="p-4">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-semibold text-lg">{customer.name}</h3>
              <div className="flex space-x-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(customer)}
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(customer.id)}
                  className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-2 text-sm">
              {customer.phone && (
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  <span>{formatPhone(customer.phone)}</span>
                </div>
              )}
              
              {customer.email && (
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <Mail className="h-3 w-3" />
                  <span className="truncate">{customer.email}</span>
                </div>
              )}
              
              {customer.address && (
                <div className="flex items-start space-x-2 text-muted-foreground">
                  <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <span className="text-xs">{customer.address}</span>
                </div>
              )}
              
              {customer.cpf && (
                <div className="text-muted-foreground">
                  <span className="text-xs">CPF: {formatCPF(customer.cpf)}</span>
                </div>
              )}
            </div>
          </Card>
        ))}

        {filteredCustomers.length === 0 && (
          <div className="col-span-full">
            <Card className="p-8 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum cliente encontrado</h3>
              <p className="text-muted-foreground">
                {searchTerm 
                  ? 'Tente ajustar os filtros de busca.'
                  : 'Adicione clientes para começar a gerenciar sua base de dados.'
                }
              </p>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Clientes;