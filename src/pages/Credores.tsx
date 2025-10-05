import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { creditorsApi, customersApi, carneInstallmentsApi, salesApi, systemUsersApi } from '@/lib/supabaseApi';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { PDFGenerator } from '@/lib/pdfGenerator';

interface Creditor {
  id: number;
  customer_id: number;
  customer_name: string;
  total_debt: number;
  paid_amount: number;
  remaining_amount: number;
  due_date: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface Customer {
  id: number;
  name: string;
  phone?: string | null;
  email?: string | null;
   cpf: string;        // CPF do cliente
  address: string;   
}

interface CarneInstallment {
  id: number;
  creditor_id: number;
  installment_number: number;
  due_date: string;
  amount: number;
  paid: boolean;
  paid_at?: string | null;
  // address: string
}
import { 
  Users, 
  Plus, 
  Search, 
  DollarSign, 
  Calendar,
  CalendarIcon,
  AlertTriangle,
  CheckCircle,
  Clock,
  Edit,
  Trash2,
  FileText,
  Printer,
  Zap,
  Send,
  CreditCard
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

const Credores = () => {
  const [creditors, setCreditors] = useState<Creditor[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCreditor, setEditingCreditor] = useState<Creditor | null>(null);
  const [carneInstallments, setCarneInstallments] = useState<CarneInstallment[]>([]);
  const [showCarneDialog, setShowCarneDialog] = useState(false);
  const [selectedCreditorForCarne, setSelectedCreditorForCarne] = useState<Creditor | null>(null);
  const [installmentsCount, setInstallmentsCount] = useState('');
  const [showEditDateDialog, setShowEditDateDialog] = useState(false);
  const [selectedInstallmentForEdit, setSelectedInstallmentForEdit] = useState<CarneInstallment | null>(null);
  const [newInstallmentDate, setNewInstallmentDate] = useState<Date | undefined>(undefined);
  const [showZapDialog, setShowZapDialog] = useState(false);
  const [selectedCreditor, setSelectedCreditor] = useState<Creditor | null>(null);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [selectedVia, setSelectedVia] = useState<"cliente" | "credor" | "ambos" | "">("");

  // Form fields
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [totalDebt, setTotalDebt] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');

  function getInstallmentsFromDescription(description: string): number {
  const match = description.match(/(\d+)\s*x/i);
  return match ? parseInt(match[1], 10) : 1; // se não achar, volta 1
}

  useEffect(() => {
    loadCreditors();
    loadCustomers();
    loadCarneInstallments();
  }, []);

  const loadCreditors = async () => {
    try {
      const allCreditors = await creditorsApi.readAll();
      
      // Atualizar status baseado na data
      const updatedCreditors = allCreditors.map(creditor => {
        const today = new Date();
        const due = new Date(creditor.due_date);
        
        if (creditor.status === 'pendente' && due < today) {
          return { ...creditor, status: 'atrasado' };
        }
        return creditor;
      });

      setCreditors(updatedCreditors as any);
    } catch (error) {
      console.error('Erro ao carregar credores:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os credores.",
        variant: "destructive",
      });
    }
  };

  // Função para obter o próximo vencimento de carnê
  const getNextDueDate = (creditorId: number) => {
    const creditorInstallments = carneInstallments.filter(c => c.creditor_id === creditorId && !c.paid);
    if (creditorInstallments.length === 0) return null;
    
    // Ordenar por data de vencimento e pegar o próximo
    const sortedInstallments = creditorInstallments.sort((a, b) => 
      new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
    );
    
    return sortedInstallments[0]?.due_date;
  };

  // Função para obter estatísticas dos carnês de um credor
  const getCreditorStats = (creditorId: number) => {
    const creditorInstallments = carneInstallments.filter(c => c.creditor_id === creditorId);
    const paidInstallments = creditorInstallments.filter(c => c.paid);
    const totalPaid = paidInstallments.reduce((sum, c) => sum + c.amount, 0);
    const totalRemaining = creditorInstallments.filter(c => !c.paid).reduce((sum, c) => sum + c.amount, 0);
    
    return {
      totalInstallments: creditorInstallments.length,
      paidInstallments: paidInstallments.length,
      totalPaid,
      totalRemaining
    };
  };

  const loadCarneInstallments = async () => {
    try {
      const installments = await carneInstallmentsApi.readAll();
      setCarneInstallments(installments);
    } catch (error) {
      console.error('Erro ao carregar carnês:', error);
    }
  };

  // const generateCarne = async (creditor: Creditor, installments: number) => {
  //   try {
  //     const customer = customers.find(c => c.id === creditor.customerId);
  //     if (!customer) {
  //       toast({
  //         title: "Erro",
  //         description: "Cliente não encontrado",
  //         variant: "destructive"
  //       });
  //       return;
  //     }

  //     // Criar parcelas do carnê
  //     const installmentValue = creditor.remainingAmount / installments;
  //     const carneData = {
  //       creditorId: creditor.id!,
  //       creditorName: 'Sistema',
  //       customerName: customer.name,
  //       totalAmount: creditor.remainingAmount,
  //       installments: installments,
  //       installmentValue: installmentValue,
  //       dueDate: new Date(creditor.dueDate)
  //     };

  //     // Salvar parcelas no banco
  //     const installmentPromises = [];
  //     for (let i = 1; i <= installments; i++) {
  //       const installmentDueDate = new Date(creditor.dueDate);
  //       installmentDueDate.setMonth(installmentDueDate.getMonth() + (i - 1));
        
  //       installmentPromises.push(db.carneInstallments.add({
  //         creditorId: creditor.id!,
  //         installmentNumber: i,
  //         dueDate: installmentDueDate,
  //         amount: installmentValue,
  //         paid: false,
  //         createdAt: new Date()
  //       }));
  //     }

  //     await Promise.all(installmentPromises);

  //     // Gerar PDF
  //     const pdfDataUri = PDFGenerator.generateCarne(carneData);
      
  //     // Abrir PDF em nova janela
  //     const newWindow = window.open();
  //     if (newWindow) {
  //       newWindow.document.write(`<iframe width='100%' height='100%' src='${pdfDataUri}'></iframe>`);
  //     }

  //     await loadCarneInstallments();
      
  //     toast({
  //       title: "Carnê gerado!",
  //       description: `Carnê de ${installments} parcelas criado com sucesso`
  //     });

  //     setShowCarneDialog(false);
  //     setInstallmentsCount('');
  //   } catch (error) {
  //     console.error('Erro ao gerar carnê:', error);
  //     toast({
  //       title: "Erro",
  //       description: "Erro ao gerar carnê",
  //       variant: "destructive"
  //     });
  //   }
  // };
const generateCarne = async (
  creditor: Creditor,
  installments: number,
  via: "cliente" | "credor" | "ambos" = "cliente" // padrão para cliente
) => {
  try {
    const customer = customers.find(c => c.id === creditor.customer_id);
    if (!customer) {
      toast({
        title: "Erro",
        description: "Cliente não encontrado",
        variant: "destructive"
      });
      return;
    }

    // Criar parcelas do carnê
    const installmentValue = creditor.remaining_amount / installments;
    const carneData = {
      creditorId: creditor.id,
      creditorName: 'Sistema',
      customerName: customer.name,
      totalAmount: creditor.remaining_amount,
      installments: installments,
      installmentValue: installmentValue,
      dueDate: new Date(creditor.due_date)
    };

    // Salvar parcelas no banco
    const installmentPromises = [];
    for (let i = 1; i <= installments; i++) {
      const installmentDueDate = new Date(creditor.due_date);
      installmentDueDate.setMonth(installmentDueDate.getMonth() + (i - 1));
      
      installmentPromises.push(carneInstallmentsApi.create({
        creditor_id: creditor.id,
        installment_number: i,
        due_date: installmentDueDate.toISOString(),
        amount: installmentValue,
        paid: false
      }));
    }
    await Promise.all(installmentPromises);

    // Gerar PDF conforme a via selecionada
    const pdfDataUri = PDFGenerator.generateCarne(carneData, via);

    // Abrir PDF em nova janela
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(
        `<iframe width='100%' height='100%' src='${pdfDataUri}'></iframe>`
      );
    }

    await loadCarneInstallments();
    
    toast({
      title: "Carnê gerado!",
      description: `Carnê de ${installments} parcelas criado com sucesso`
    });

    setShowCarneDialog(false);
    setInstallmentsCount('');
  } catch (error) {
    console.error('Erro ao gerar carnê:', error);
    toast({
      title: "Erro",
      description: "Erro ao gerar carnê",
      variant: "destructive"
    });
  }
};

  const markInstallmentAsPaid = async (installmentId: number) => {
    try {
      await carneInstallmentsApi.update(installmentId, {
        paid: true,
        paid_at: new Date().toISOString()
      });

      await loadCarneInstallments();
      
      toast({
        title: "Parcela paga!",
        description: "Parcela marcada como paga"
      });
    } catch (error) {
      console.error('Erro ao marcar parcela como paga:', error);
      toast({
        title: "Erro",
        description: "Erro ao marcar parcela como paga",
        variant: "destructive"
      });
    }
  };

  const printSaleInfo = async (creditor: Creditor) => {
    try {
      // Buscar dados da venda relacionada - note: precisará ajustar a busca
      const allSales = await salesApi.readAll();
      const sale = allSales.filter(s => s.customer_id === creditor.customer_id).pop();
      const customer = customers.find(c => c.id === creditor.customer_id);
      const allUsers = await systemUsersApi.readAll();
      const user = allUsers.find(u => u.id === (sale?.user_id || 1));
      
      if (!sale || !customer) {
        toast({
          title: "Erro",
          description: "Dados da venda não encontrados",
          variant: "destructive"
        });
        return;
      }

      // Contar carnês gerados
      const carneCount = carneInstallments.filter(c => c.creditor_id === creditor.id).length;

     const saleItems = Array.isArray(sale.items)
  ? sale.items.map((item: any) => ({
      productName: item.productName || item.name, // adapte conforme seu campo
      quantity: item.quantity,
      price: item.price
    }))
  : []; // fallback caso não seja array

// 2. Converter datas para Date
const saleData = {
  saleId: sale.id!,
  customerName: customer.name,
  customerCPF: customer.cpf,
  customerAddress: customer.address,
  customerPhone: customer.phone,
  items: saleItems,                 // array no formato correto
  total: sale.total,
  discount: sale.discount,
  paymentMethod: sale.payment_method,
  installments: sale.installments,
  createdAt: new Date(sale.created_at),      // converter para Date
  deliveryDate: new Date(sale.created_at),   // ou outro campo de entrega
  seller: user?.username || 'Desconhecido'
};

const pdfDataUri = PDFGenerator.generateSaleReport(saleData);
      
      // Abrir PDF em nova janela
      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(`
          <div style="padding: 20px;">
            <h2>Informações da Compra</h2>
            <p><strong>Carnês gerados:</strong> ${carneCount} parcelas</p>
            <iframe width='100%' height='500px' src='${pdfDataUri}'></iframe>
          </div>
        `);
      }

    } catch (error) {
      console.error('Erro ao imprimir informações da venda:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar relatório da venda",
        variant: "destructive"
      });
    }
  };

  const editInstallmentDate = async (installment: CarneInstallment, newDate: Date) => {
    try {
      await carneInstallmentsApi.update(installment.id, {
        due_date: newDate.toISOString()
      });

      await loadCarneInstallments();
      
      toast({
        title: "Data alterada!",
        description: `Data da ${installment.installment_number}ª parcela alterada para ${formatDate(newDate)}`
      });

      setShowEditDateDialog(false);
      setSelectedInstallmentForEdit(null);
      setNewInstallmentDate(undefined);
    } catch (error) {
      console.error('Erro ao alterar data da parcela:', error);
      toast({
        title: "Erro",
        description: "Erro ao alterar data da parcela",
        variant: "destructive"
      });
    }
  };

  const loadCustomers = async () => {
    try {
      const allCustomers = await customersApi.readAll();
      setCustomers(allCustomers as any);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    }
  };

  const filteredCreditors = creditors.filter(creditor => {
    const matchesSearch = creditor.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         creditor.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || creditor.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pago':
        return <CheckCircle className="h-4 w-4" />;
      case 'atrasado':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'pago':
        return 'default';
      case 'atrasado':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const resetForm = () => {
    setSelectedCustomer('');
    setTotalDebt('');
    setDescription('');
    setDueDate('');
    setEditingCreditor(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCustomer || !totalDebt || !dueDate) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    try {
      const customer = customers.find(c => c.id === Number(selectedCustomer));
      if (!customer) return;

      const debtValue = parseFloat(totalDebt);
      
      const creditorData = {
        customerId: customer.id!,
        customerName: customer.name,
        totalDebt: debtValue,
        paidAmount: 0,
        remainingAmount: debtValue,
        dueDate: new Date(dueDate),
        description: description || 'Crediário',
        status: 'pendente' as const,
        updatedAt: new Date()
      };

      // if (editingCreditor) {
      //   await db.creditors.update(editingCreditor.id!, {
      //     ...creditorData,
      //     paidAmount: editingCreditor.paid_amount,
      //     remainingAmount: debtValue - editingCreditor.paid_amount
      //   });
        
      //   toast({
      //     title: "Credor atualizado!",
      //     description: "As informações foram atualizadas com sucesso.",
      //   });
      // } else {
      //   await db.creditors.add({
      //     ...creditorData,
      //     createdAt: new Date()
      //   });
        
      //   toast({
      //     title: "Credor adicionado!",
      //     description: `${customer.name} foi adicionado à agenda de credores.`,
      //   });
      // }
if (editingCreditor) {
  const { error } = await supabase
    .from('creditors')
    .update({
      ...creditorData,
      paid_amount: editingCreditor.paid_amount,              // note que o nome do campo muda
      remaining_amount: debtValue - editingCreditor.paid_amount
    })
    .eq('id', editingCreditor.id);

  if (error) {
    toast({
      title: "Erro",
      description: "Não foi possível atualizar o credor.",
      variant: "destructive",
    });
    return;
  }

  toast({
    title: "Credor atualizado!",
    description: "As informações foram atualizadas com sucesso.",
  });
} else {
  const { error } = await supabase
    .from('creditors')
    .insert([{
    customer_id: creditorData.customerId,
    customer_name: creditorData.customerName,
    total_debt: creditorData.totalDebt,
    paid_amount: creditorData.paidAmount,
    remaining_amount: creditorData.remainingAmount,
    due_date: new Date(creditorData.dueDate).toISOString(), // transforma em string
    description: creditorData.description,
    status: creditorData.status,
    created_at: new Date().toISOString(),  // transforma em string
    updated_at: new Date().toISOString()
  }]);;

  if (error) {
    toast({
      title: "Erro",
      description: "Não foi possível adicionar o credor.",
      variant: "destructive",
    });
    return;
  }

  toast({
    title: "Credor adicionado!",
    description: `${customer.name} foi adicionado à agenda de credores.`,
  });
}

      setIsDialogOpen(false);
      resetForm();
      loadCreditors();
    } catch (error) {
      console.error('Erro ao salvar credor:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o credor.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (creditor: Creditor) => {
    setEditingCreditor(creditor);
    setSelectedCustomer(creditor.customer_id.toString());
    setTotalDebt(creditor.total_debt.toString());
    setDescription(creditor.description);
    setDueDate(new Date(creditor.due_date).toISOString().split('T')[0]);
    setIsDialogOpen(true);
  };

  const handleDelete = async (creditorId: number) => {
    if (!confirm('Tem certeza que deseja excluir este credor?')) return;
    
    try {
      await creditorsApi.delete(creditorId);
      toast({
        title: "Credor removido!",
        description: "O credor foi removido da agenda.",
      });
      loadCreditors();
    } catch (error) {
      console.error('Erro ao excluir credor:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o credor.",
        variant: "destructive",
      });
    }
  };

  const markAsPaid = async (creditor: Creditor) => {
    try {
      await creditorsApi.update(creditor.id, {
        status: 'pago',
        paid_amount: creditor.total_debt,
        remaining_amount: 0
      });
      
      toast({
        title: "Pagamento registrado!",
        description: `${creditor.customer_name} quitou a dívida.`,
      });
      
      loadCreditors();
    } catch (error) {
      console.error('Erro ao marcar como pago:', error);
      toast({
        title: "Erro",
        description: "Não foi possível registrar o pagamento.",
        variant: "destructive",
      });
    }
  };

  const handleSendCarneZap = async (creditor: Creditor) => {
    if (!webhookUrl) {
      toast({
        title: "Erro",
        description: "Por favor, insira a URL do webhook do Zapier",
        variant: "destructive",
      });
      return;
    }

    try {
      const creditorInstallments = carneInstallments.filter(c => c.creditor_id === creditor.id);
      
      // Gerar carnê em PDF
      const carneInfo = {
        creditorId: creditor.id!,
        creditorName: "Sua Empresa",
        customerName: creditor.customer_name,
        totalAmount: creditor.total_debt,
        installments: creditorInstallments.length || 1,
        installmentValue: creditor.total_debt / (creditorInstallments.length || 1),
        dueDate: new Date(creditor.due_date),
        saleId: creditor.id
      };

      const carneData = PDFGenerator.generateCarne(carneInfo);

      // Dados para enviar ao Zapier
      // const zapierData = {
      //   timestamp: new Date().toISOString(),
      //   triggered_from: window.location.origin,
      //   type: 'carne',
      //   creditor: {
      //     id: creditor.id,
      //     customerName: creditor.customerName,
      //     totalDebt: creditor.totalDebt,
      //     remainingAmount: creditor.remainingAmount,
      //     dueDate: creditor.dueDate,
      //     description: creditor.description,
      //     status: creditor.status
      //   },
      //   installments: creditorInstallments.map(inst => ({
      //     number: inst.installmentNumber,
      //     amount: inst.amount,
      //     dueDate: inst.dueDate,
      //     paid: inst.paid
      //   })),
      //   carneData: carneData,
      //   message: customMessage || `Carnê para ${creditor.customerName} - ${formatCurrency(creditor.remainingAmount)} em aberto`
      // };

      // const response = await fetch(webhookUrl, {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      //   mode: "no-cors",
      //   body: JSON.stringify(zapierData),
      // });

      toast({
        title: "Carnê enviado!",
        description: "Carnê enviado via Zapier com sucesso.",
      });

      setShowZapDialog(false);
      
    } catch (error) {
      console.error("Erro ao enviar carnê:", error);
      toast({
        title: "Erro",
        description: "Falha ao enviar carnê via Zapier.",
        variant: "destructive",
      });
    }
  };

  // Calcular total em aberto considerando carnês pagos
  const totalPendingDebt = creditors
    .filter(c => c.status !== 'pago')
    .reduce((sum, c) => {
      const stats = getCreditorStats(c.id!);
      return sum + stats.totalRemaining;
    }, 0);

  const overdueCount = creditors.filter(c => c.status === 'atrasado').length;
  
  // Total de carnês pagos no sistema
  const totalPaidInstallments = carneInstallments.filter(c => c.paid).length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Agenda de Credores</h1>
          <p className="text-muted-foreground">Gerencie clientes com pagamentos pendentes</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Credor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCreditor ? 'Editar Credor' : 'Adicionar Credor'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customer">Cliente *</Label>
                <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id!.toString()}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="totalDebt">Valor Total *</Label>
                <Input
                  id="totalDebt"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={totalDebt}
                  onChange={(e) => setTotalDebt(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Data de Vencimento *</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Input
                  id="description"
                  placeholder="Descrição do crediário"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingCreditor ? 'Atualizar' : 'Adicionar'}
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

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-warning" />
            <div>
              <p className="text-sm text-muted-foreground">Total em Aberto</p>
              <p className="text-2xl font-bold text-warning">
                {formatCurrency(totalPendingDebt)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <div>
              <p className="text-sm text-muted-foreground">Em Atraso</p>
              <p className="text-2xl font-bold text-destructive">{overdueCount}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-success" />
            <div>
              <p className="text-sm text-muted-foreground">Carnês Pagos</p>
              <p className="text-2xl font-bold text-success">{totalPaidInstallments}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Total de Credores</p>
              <p className="text-2xl font-bold text-primary">{creditors.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="atrasado">Em atraso</SelectItem>
            <SelectItem value="pago">Pago</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista de credores */}
      <div className="space-y-4">
        {filteredCreditors.map((creditor) => (
          <Card key={creditor.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="font-semibold text-lg">{creditor.customer_name}</h3>
                  <Badge 
                    variant={getStatusVariant(creditor.status)}
                    className="flex items-center space-x-1"
                  >
                    {getStatusIcon(creditor.status)}
                    <span className="capitalize">{creditor.status}</span>
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Valor Total</p>
                    <p className="font-medium">{formatCurrency(creditor.remaining_amount)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Valor Restante</p>
                    <p className="font-medium text-warning">
                      {formatCurrency(getCreditorStats(creditor.id!).totalRemaining || creditor.remaining_amount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Próximo Vencimento</p>
                    <p className={cn(
                      "font-medium",
                      creditor.status === 'atrasado' && "text-destructive"
                    )}>
                      {(() => {
                        const nextDue = getNextDueDate(creditor.id!);
                        return nextDue ? formatDate(new Date(nextDue)) : formatDate(new Date(creditor.due_date));
                      })()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Carnês Pagos</p>
                    <p className="font-medium text-success">
                      {getCreditorStats(creditor.id!).paidInstallments} / {getCreditorStats(creditor.id!).totalInstallments || 0}
                    </p>
                  </div>
                </div>
                
                {creditor.description && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {creditor.description}
                  </p>
                )}
              </div>

              <div className="flex flex-col space-y-2">
                {creditor.status !== 'pago' && (
                  <>
                    <Button 
                      onClick={() => {
                        setSelectedCreditorForCarne(creditor);

                        // extrai parcelas antes do "x" no description
                        const parcelas = getInstallmentsFromDescription(creditor.description || "");
                        setInstallmentsCount(parcelas.toString());

                        setShowCarneDialog(true);
                      }}
                      size="sm"
                      variant="outline"
                      className="flex items-center space-x-1"
                    >
                      <FileText className="h-4 w-4" />
                      <span>Gerar Carnê</span>
                    </Button>
                    
                    <Button 
                      onClick={() => markAsPaid(creditor)}
                      size="sm"
                      className="flex items-center space-x-1 hover:bg-success hover:text-success-foreground"
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>Marcar como Pago</span>
                    </Button>
                  </>
                )}
                
                <Button 
                  onClick={() => printSaleInfo(creditor)}
                  size="sm"
                  variant="secondary"
                  className="flex items-center space-x-1"
                >
                  <Printer className="h-4 w-4" />
                  <span>Imprimir Info</span>
                </Button>
                
                <div className="flex space-x-1">
                  <Button 
                    onClick={() => handleEdit(creditor)}
                    size="sm"
                    variant="outline"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    onClick={() => handleDelete(creditor.id!)}
                    size="sm"
                    variant="outline"
                    className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Mostrar carnês existentes */}
            {carneInstallments.filter(c => c.creditor_id === creditor.id).length > 0 && (
              <div className="mt-4 p-3 bg-muted rounded-md">
                <h4 className="text-sm font-medium mb-2 flex items-center">
                  <CreditCard className="h-4 w-4 mr-1" />
                  Carnês Gerados ({carneInstallments.filter(c => c.creditor_id === creditor.id).length} parcelas)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {carneInstallments
                    .filter(c => c.creditor_id === creditor.id)
                    .map((installment) => (
                      <div key={installment.id} className="flex items-center justify-between text-xs p-2 bg-background rounded">
                        <span>
                          {installment.installment_number}ª - {formatCurrency(installment.amount)} 
                          <br />
                          <span className="text-muted-foreground">{formatDate(installment.due_date)}</span>
                        </span>
                        <div className="flex space-x-1">
                          {installment.paid ? (
                            <Badge variant="secondary" className="text-xs">
                              Pago {installment.paid_at && `em ${formatDate(installment.paid_at)}`}
                            </Badge>
                          ) : (
                            <Button 
                              onClick={() => markInstallmentAsPaid(installment.id!)}
                              size="sm"
                              variant="outline"
                              className="h-6 text-xs"
                            >
                              Pagar
                            </Button>
                          )}
                          
                          {/* <Button 
                            onClick={() => {
                              setSelectedInstallmentForEdit(installment);
                              setNewInstallmentDate(installment.dueDate);
                              setShowEditDateDialog(true);
                            }}
                            size="sm"
                            variant="outline"
                            className="h-6 text-xs"
                          >
                            <CalendarIcon className="h-3 w-3" />
                          </Button> */}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </Card>
        ))}

        {filteredCreditors.length === 0 && (
          <Card className="p-8 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum credor encontrado</h3>
            <p className="text-muted-foreground">
              {searchTerm || selectedStatus !== 'all' 
                ? 'Tente ajustar os filtros de busca.'
                : 'Adicione credores para começar a gerenciar pagamentos pendentes.'
              }
            </p>
          </Card>
        )}
      </div>
      
      {/* Dialog para gerar carnê */}
      {/* <Dialog open={showCarneDialog} onOpenChange={setShowCarneDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerar Carnê de Pagamento</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Cliente: {selectedCreditorForCarne?.customerName}</p>
              <p className="text-sm text-muted-foreground">
                Valor Restante: {selectedCreditorForCarne && formatCurrency(selectedCreditorForCarne.remainingAmount)}
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="installmentsCount">Número de Parcelas</Label>
              <Input
                id="installmentsCount"
                type="number"
                min="1"
                max="36"
                placeholder="Ex: 12"
                value={installmentsCount}
                onChange={(e) => setInstallmentsCount(e.target.value)}
              />
            </div>
            
            {installmentsCount && selectedCreditorForCarne && (
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm">
                  <strong>Valor por parcela:</strong> {' '}
                  {formatCurrency(selectedCreditorForCarne.remainingAmount / parseInt(installmentsCount))}
                </p>
              </div>
            )}
            
            <div className="flex space-x-2">
              <Button 
                onClick={() => setShowCarneDialog(false)} 
                variant="outline" 
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button 
                onClick={() => {
                  if (selectedCreditorForCarne && installmentsCount) {
                    generateCarne(selectedCreditorForCarne, parseInt(installmentsCount));
                  }
                }}
                disabled={!installmentsCount || parseInt(installmentsCount) < 1}
                className="flex-1"
              >
                Gerar Carnê
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog> */}
      <Dialog open={showCarneDialog} onOpenChange={setShowCarneDialog}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Gerar Carnê de Pagamento</DialogTitle>
    </DialogHeader>
    
    <div className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground">
          Cliente: {selectedCreditorForCarne?.customer_name}
        </p>
        <p className="text-sm text-muted-foreground">
          Valor Restante:{" "}
          {selectedCreditorForCarne &&
            formatCurrency(selectedCreditorForCarne.remaining_amount)}
        </p>
      </div>
      
      <div className="p-3 bg-muted rounded-md space-y-2">
        <p className="text-sm">
          <strong>Número de parcelas:</strong> {installmentsCount}
        </p>
        {selectedCreditorForCarne && (
          <p className="text-sm">
            <strong>Valor por parcela:</strong>{" "}
            {formatCurrency(
              selectedCreditorForCarne.remaining_amount /
                parseInt(installmentsCount || "1", 10)
            )}
          </p>
        )}
      </div>

      <div className="flex flex-col space-y-2">
  {/* Seleção da via */}
  <div className="space-y-1">
    <Label>Via do Carnê</Label>
    <Select 
      value={selectedVia} 
      onValueChange={(value) => setSelectedVia(value as "cliente" | "credor" | "ambos" | "")}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Selecione a via" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="cliente">Via Cliente</SelectItem>
        <SelectItem value="credor">Via Credor</SelectItem>
        <SelectItem value="ambos">Ambas Vias</SelectItem>
      </SelectContent>
    </Select>
  </div>

  {/* Botões de ação */}
  <div className="flex space-x-2">
    <Button 
      onClick={() => setShowCarneDialog(false)} 
      variant="outline" 
      className="flex-1"
    >
      Cancelar
    </Button>
    <Button 
      onClick={() => {
        if (selectedCreditorForCarne && installmentsCount && selectedVia) {
          generateCarne(
            selectedCreditorForCarne, 
            parseInt(installmentsCount, 10),
            selectedVia as "cliente" | "credor" | "ambos"
          );
        }
      }}
      disabled={!installmentsCount || parseInt(installmentsCount, 10) < 1 || !selectedVia}
      className="flex-1"
    >
      Confirmar
    </Button>
  </div>
</div>

      
      {/* <div className="flex space-x-2">
        <Button 
          onClick={() => setShowCarneDialog(false)} 
          variant="outline" 
          className="flex-1"
        >
          Cancelar
        </Button>
        <Button 
          onClick={() => {
            if (selectedCreditorForCarne && installmentsCount) {
              generateCarne(
                selectedCreditorForCarne, 
                parseInt(installmentsCount, 10)
              );
            }
          }}
          disabled={!installmentsCount || parseInt(installmentsCount, 10) < 1}
          className="flex-1"
        >
          Confirmar
        </Button>
      </div> */}
    </div>
  </DialogContent>
</Dialog>
      {/* Dialog para editar data da parcela */}
      <Dialog open={showEditDateDialog} onOpenChange={setShowEditDateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Data da Parcela</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedInstallmentForEdit && (
              <div>
                <p className="text-sm text-muted-foreground">
                  Parcela {selectedInstallmentForEdit.installment_number}ª - {formatCurrency(selectedInstallmentForEdit.amount)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Data atual: {formatDate(selectedInstallmentForEdit.due_date)}
                </p>
              </div>
            )}
            
            <div className="space-y-2">
              <Label>Nova Data de Vencimento</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !newInstallmentDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newInstallmentDate ? (
                      format(newInstallmentDate, "dd/MM/yyyy")
                    ) : (
                      <span>Selecione uma data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={newInstallmentDate}
                    onSelect={setNewInstallmentDate}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="flex space-x-2">
              <Button 
                onClick={() => {
                  setShowEditDateDialog(false);
                  setSelectedInstallmentForEdit(null);
                  setNewInstallmentDate(undefined);
                }} 
                variant="outline" 
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button 
                onClick={() => {
                  if (selectedInstallmentForEdit && newInstallmentDate) {
                    editInstallmentDate(selectedInstallmentForEdit, newInstallmentDate);
                  }
                }}
                disabled={!newInstallmentDate}
                className="flex-1"
              >
                Salvar Nova Data
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Credores;