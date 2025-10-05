import React, { useEffect, useState } from 'react';
import { expensesApi } from '@/lib/supabaseApi';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Calendar } from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
// import { differenceInDays } from 'date-fns';
import { format, differenceInDays } from 'date-fns';
import { Select } from '@radix-ui/react-select';

// const Contas = () => {
//   const [expenses, setExpenses] = useState<Expense[]>([]);
//   const [showDialog, setShowDialog] = useState(false);
//   const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
//   const [newExpense, setNewExpense] = useState<Partial<Expense>>({
//     supplier: '',
//     description: '',
//     category: '',
//     amount: 0,
//     dueDate: new Date(),
//     paid: false,
//     createdAt: new Date(),
//   });

//   const loadExpenses = async () => {
//     const allExpenses = await db.expenses.toArray();
//     setExpenses(allExpenses);
//   };

//   useEffect(() => {
//     loadExpenses();
//   }, []);

//   const saveExpense = async () => {
//     if (!newExpense.supplier || !newExpense.description || !newExpense.amount || !newExpense.dueDate) {
//       toast({ title: 'Erro', description: 'Preencha todos os campos obrigatórios', variant: 'destructive' });
//       return;
//     }

//     const expenseData: Expense = {
//       ...(editingExpense || {}),
//       ...newExpense,
//       createdAt: editingExpense ? editingExpense.createdAt : new Date(),
//       paid: newExpense.paid || false,
//     };

//     try {
//       if (editingExpense) {
//         await db.expenses.update(editingExpense.id!, expenseData);
//         toast({ title: 'Atualizado', description: 'Despesa atualizada com sucesso' });
//       } else {
//         await db.expenses.add(expenseData);
//         toast({ title: 'Adicionado', description: 'Despesa adicionada com sucesso' });
//       }
//       setShowDialog(false);
//       setEditingExpense(null);
//       setNewExpense({ supplier: '', description: '', category: '', amount: 0, dueDate: new Date(), paid: false, createdAt: new Date() });
//       await loadExpenses();
//     } catch (error) {
//       console.error(error);
//       toast({ title: 'Erro', description: 'Não foi possível salvar a despesa', variant: 'destructive' });
//     }
//   };

//   const togglePaid = async (expense: Expense) => {
//     await db.expenses.update(expense.id!, { paid: !expense.paid });
//     await loadExpenses();
//   };

//   const editExpense = (expense: Expense) => {
//     setEditingExpense(expense);
//     setNewExpense(expense);
//     setShowDialog(true);
//   };

//   return (
//     <div className="p-6 max-w-7xl mx-auto">
//       <div className="flex justify-between items-center mb-6">
//         <h1 className="text-3xl font-bold">Contas a Pagar / Receber</h1>
//         <Dialog open={showDialog} onOpenChange={setShowDialog}>
//           <DialogTrigger asChild>
//             <Button>Nova Despesa</Button>
//           </DialogTrigger>
//           <DialogContent className="max-w-md">
//             <DialogHeader>
//               <DialogTitle>{editingExpense ? 'Editar Despesa' : 'Nova Despesa'}</DialogTitle>
//             </DialogHeader>
//             <div className="space-y-4">
//               <div>
//                 <Label>Fornecedor *</Label>
//                 <Input value={newExpense.supplier} onChange={(e) => setNewExpense({ ...newExpense, supplier: e.target.value })} />
//               </div>
//               <div>
//                 <Label>Descrição *</Label>
//                 <Input value={newExpense.description} onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })} />
//               </div>
//               <div>
//                 <Label>Categoria</Label>
//                 <Input value={newExpense.category} onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })} />
//               </div>
//               <div>
//                 <Label>Valor *</Label>
//                 <Input type="number" value={newExpense.amount} onChange={(e) => setNewExpense({ ...newExpense, amount: Number(e.target.value) })} />
//               </div>
//               <div>
//                 <Label>Vencimento *</Label>
//                 <Calendar value={newExpense.dueDate || new Date()} onChange={(date: Date) => setNewExpense({ ...newExpense, dueDate: date })} />
//               </div>
//               <div className="flex items-center space-x-2">
//                 <input type="checkbox" checked={newExpense.paid} onChange={() => setNewExpense({ ...newExpense, paid: !newExpense.paid })} />
//                 <span>Pago</span>
//               </div>
//               <Button onClick={saveExpense} className="w-full">
//                 {editingExpense ? 'Atualizar' : 'Adicionar'} Despesa
//               </Button>
//             </div>
//           </DialogContent>
//         </Dialog>
//       </div>

//       <Card className="p-4">
//         <div className="overflow-x-auto">
//           <table className="w-full">
//             <thead className="border-b">
//               <tr className="text-left">
//                 <th className="p-2">Fornecedor</th>
//                 <th className="p-2">Descrição</th>
//                 <th className="p-2">Categoria</th>
//                 <th className="p-2">Valor</th>
//                 <th className="p-2">Vencimento</th>
//                 <th className="p-2">Status</th>
//                 <th className="p-2">Ações</th>
//               </tr>
//             </thead>
//             <tbody>
//               {expenses.map((expense) => (
//                 <tr key={expense.id} className="border-b hover:bg-muted/50">
//                   <td className="p-2">{expense.supplier}</td>
//                   <td className="p-2">{expense.description}</td>
//                   <td className="p-2">{expense.category}</td>
//                   <td className="p-2">R$ {expense.amount.toFixed(2)}</td>
//                   <td className="p-2">{expense.dueDate.toLocaleDateString()}</td>
//                   <td className="p-2">
//                     <Badge variant={expense.paid ? 'success' : 'warning'}>
//                       {expense.paid ? 'Pago' : 'Pendente'}
//                     </Badge>
//                   </td>
//                   <td className="p-2 flex space-x-2">
//                     <Button size="sm" onClick={() => editExpense(expense)}>Editar</Button>
//                     <Button size="sm" onClick={() => togglePaid(expense)}>
//                       {expense.paid ? 'Marcar Pendente' : 'Marcar Pago'}
//                     </Button>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </Card>
//     </div>
//   );
// };

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// const ContasPagar = () => {
//   const [expenses, setExpenses] = useState<Expense[]>([]);
//   const [newExpense, setNewExpense] = useState<Partial<Expense>>({
//     supplier: '',
//     description: '',
//     category: '',
//     amount: 0,
//     dueDate: new Date(),
//     paid: false,
//     createdAt: new Date(),
//   });

//   const [filterCategory, setFilterCategory] = useState<string>('');
//   const [filterStatus, setFilterStatus] = useState<'todos' | 'pago' | 'pendente' | 'vencido'>('todos');

//   useEffect(() => {
//     loadExpenses();
//   }, []);

//   const loadExpenses = async () => {
//     const allExpenses = await db.expenses.toArray();
//     setExpenses(allExpenses);
//   };

//   const saveExpense = async () => {
//     if (!newExpense.supplier || !newExpense.amount || !newExpense.dueDate) return;

//     await db.expenses.add({
//       ...newExpense,
//       createdAt: new Date(),
//       paid: newExpense.paid || false,
//     } as Expense);

//     setNewExpense({
//       supplier: '',
//       description: '',
//       category: '',
//       amount: 0,
//       dueDate: new Date(),
//       paid: false,
//       createdAt: new Date(),
//     });

//     await loadExpenses();
//   };

//   const togglePaid = async (expense: Expense) => {
//     await db.expenses.update(expense.id!, { paid: !expense.paid });
//     await loadExpenses();
//   };

//   const getDueBadgeVariant = (expense: Expense) => {
//     if (expense.paid) return 'success';
//     const daysLeft = differenceInDays(new Date(expense.dueDate), new Date());
//     if (daysLeft < 0) return 'destructive';
//     if (daysLeft <= 3) return 'warning';
//     return 'default';
//   };

//   const filteredExpenses = expenses.filter((expense) => {
//     const categoryMatch = filterCategory ? expense.category === filterCategory : true;
//     let statusMatch = true;
//     if (filterStatus === 'pago') statusMatch = expense.paid;
//     if (filterStatus === 'pendente')
//       statusMatch = !expense.paid && differenceInDays(new Date(expense.dueDate), new Date()) >= 0;
//     if (filterStatus === 'vencido')
//       statusMatch = !expense.paid && differenceInDays(new Date(expense.dueDate), new Date()) < 0;
//     return categoryMatch && statusMatch;
//   });

//   const upcomingExpenses = expenses.filter(
//     (e) => !e.paid && differenceInDays(new Date(e.dueDate), new Date()) <= 3
//   );
//   const pendingExpenses = expenses.filter((e) => !e.paid);

//   const categories = Array.from(new Set(expenses.map((e) => e.category).filter(Boolean)));

//   // Dados para o gráfico de pizza
//   const chartData = [
//     { name: 'Pago', value: expenses.filter((e) => e.paid).length },
//     { name: 'Pendente', value: expenses.filter((e) => !e.paid).length },
//   ];
//   const COLORS = ['#34D399', '#FBBF24']; // Verde para pago, amarelo para pendente

//   return (
//     <div className="p-6 max-w-7xl mx-auto space-y-6">
//       <h1 className="text-3xl font-bold">Contas a Pagar e Receber</h1>

//       {/* Dashboard com gráfico */}
//       <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//         <Card className="p-4 bg-blue-100">
//           <p className="text-sm text-blue-700">Total de Despesas</p>
//           <p className="text-2xl font-bold text-blue-900">
//             R$ {expenses.reduce((sum, e) => sum + e.amount, 0).toFixed(2)}
//           </p>
//         </Card>
//         <Card className="p-4 bg-yellow-100">
//           <p className="text-sm text-yellow-700">Despesas Pendentes</p>
//           <p className="text-2xl font-bold text-yellow-900">
//             R$ {pendingExpenses.reduce((sum, e) => sum + e.amount, 0).toFixed(2)}
//           </p>
//         </Card>
//         <Card className="p-4 bg-red-100">
//           <p className="text-sm text-red-700">Próximas a Vencer</p>
//           <p className="text-2xl font-bold text-red-900">
//             R$ {upcomingExpenses.reduce((sum, e) => sum + e.amount, 0).toFixed(2)}
//           </p>
//         </Card>
//         <Card className="p-4">
//           <p className="text-sm text-muted-foreground mb-2">Proporção de Pagamentos</p>
//           <ResponsiveContainer width="100%" height={100}>
//             <PieChart>
//               <Pie
//                 data={chartData}
//                 dataKey="value"
//                 nameKey="name"
//                 cx="50%"
//                 cy="50%"
//                 innerRadius={25}
//                 outerRadius={40}
//                 paddingAngle={3}
//                 label
//               >
//                 {chartData.map((entry, index) => (
//                   <Cell key={index} fill={COLORS[index % COLORS.length]} />
//                 ))}
//               </Pie>
//               <Tooltip />
//             </PieChart>
//           </ResponsiveContainer>
//         </Card>
//       </div>

//       {/* Formulário */}
//       <Card className="p-4">
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           <div>
//             <Label>Fornecedor</Label>
//             <Input
//               value={newExpense.supplier}
//               onChange={(e) => setNewExpense({ ...newExpense, supplier: e.target.value })}
//             />
//           </div>
//           <div>
//             <Label>Descrição</Label>
//             <Input
//               value={newExpense.description}
//               onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
//             />
//           </div>
//           <div>
//             <Label>Categoria</Label>
//             <Input
//               value={newExpense.category}
//               onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
//             />
//           </div>
//           <div>
//             <Label>Valor</Label>
//             <Input
//               type="number"
//               value={newExpense.amount}
//               onChange={(e) => setNewExpense({ ...newExpense, amount: Number(e.target.value) })}
//             />
//           </div>
//           <div>
//             <Label>Data de Vencimento</Label>
//             <Input
//               type="date"
//               value={format(newExpense.dueDate ?? new Date(), 'yyyy-MM-dd')}
//               onChange={(e) => setNewExpense({ ...newExpense, dueDate: new Date(e.target.value) })}
//             />
//           </div>
//         </div>
//         <div className="mt-4">
//           <Button onClick={saveExpense}>Adicionar Despesa</Button>
//         </div>
//       </Card>

//       {/* Filtros */}
//       <Card className="p-4 flex flex-col md:flex-row md:items-end gap-4">
//         <div>
//           <Label>Filtrar por Categoria</Label>
//           <select
//             value={filterCategory}
//             onChange={(e) => setFilterCategory(e.target.value)}
//             className="border rounded px-2 py-1"
//           >
//             <option value="">Todas</option>
//             {categories.map((cat) => (
//               <option key={cat} value={cat}>
//                 {cat}
//               </option>
//             ))}
//           </select>
//         </div>
//         <div>
//           <Label>Filtrar por Status</Label>
//           <select
//             value={filterStatus}
//             onChange={(e) =>
//               setFilterStatus(e.target.value as 'todos' | 'pago' | 'pendente' | 'vencido')
//             }
//             className="border rounded px-2 py-1"
//           >
//             <option value="todos">Todos</option>
//             <option value="pago">Pago</option>
//             <option value="pendente">Pendente</option>
//             <option value="vencido">Vencido</option>
//           </select>
//         </div>
//       </Card>

//       {/* Lista de despesas */}
//       <Card className="p-4 space-y-2 max-h-[400px] overflow-y-auto">
//         {filteredExpenses.length === 0 && <p>Nenhuma despesa cadastrada</p>}
//         {filteredExpenses.map((expense) => {
//           const daysLeft = differenceInDays(new Date(expense.dueDate), new Date());
//           const isUpcoming = !expense.paid && daysLeft <= 3 && daysLeft >= 0;
//           const isOverdue = !expense.paid && daysLeft < 0;

//           return (
//             <div
//               key={expense.id}
//               className={`flex justify-between items-center p-3 border-b rounded-lg ${
//                 expense.paid ? 'opacity-60 line-through' : ''
//               }`}
//             >
//               <div>
//                 <p className="font-medium">{expense.supplier}</p>
//                 <p className="text-sm">{expense.description}</p>
//                 <p
//                   className={`text-xs font-semibold ${
//                     isOverdue ? 'text-red-600' : isUpcoming ? 'text-yellow-700' : 'text-gray-500'
//                   }`}
//                 >
//                   Vence em: {format(new Date(expense.dueDate), 'dd/MM/yyyy')}
//                 </p>
//               </div>
//               <div className="flex items-center space-x-4">
//                 <span className="font-bold">R$ {expense.amount.toFixed(2)}</span>
//                 <Badge
//                   variant={expense.paid ? 'success' : isOverdue ? 'destructive' : isUpcoming ? 'warning' : 'default'}
//                 >
//                   {expense.paid ? 'Pago' : isOverdue ? 'Vencido' : isUpcoming ? 'Próximo' : 'Pendente'}
//                 </Badge>
//                 <Button size="sm" onClick={() => togglePaid(expense)}>
//                   {expense.paid ? 'Marcar Pendente' : 'Marcar Pago'}
//                 </Button>
//               </div>
//             </div>
//           );
//         })}
//       </Card>
//     </div>
//   );
// };

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

type Expense = {
  id: number;
  supplier: string;
  description: string;
  category?: string | null;
  amount: number;
  due_date: string;
  paid: boolean;
  created_at: string;
};

const ContasPagar = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [newExpense, setNewExpense] = useState<{
    supplier: string;
    description: string;
    category: string;
    amount: number;
    dueDate: Date;
    paid: boolean;
  }>({
    supplier: '',
    description: '',
    category: '',
    amount: 0,
    dueDate: new Date(),
    paid: false,
  });

  // Filtros
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'todos' | 'pago' | 'pendente' | 'vencido'>('todos');
  const [filterStartDate, setFilterStartDate] = useState<Date | null>(null);
  const [filterEndDate, setFilterEndDate] = useState<Date | null>(null);

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    const allExpenses = await expensesApi.readAll();
    setExpenses(allExpenses);
  };

  const saveExpense = async () => {
    if (!newExpense.supplier || !newExpense.amount || !newExpense.dueDate) return;

    await expensesApi.create({
      supplier: newExpense.supplier,
      description: newExpense.description,
      category: newExpense.category || null,
      amount: newExpense.amount,
      due_date: newExpense.dueDate.toISOString(),
      paid: newExpense.paid || false,
    });

    setNewExpense({
      supplier: '',
      description: '',
      category: '',
      amount: 0,
      dueDate: new Date(),
      paid: false,
    });

    await loadExpenses();
  };

  const togglePaid = async (expense: Expense) => {
    await expensesApi.update(expense.id, { paid: !expense.paid });
    await loadExpenses();
  };

  const getDueBadgeVariant = (expense: Expense) => {
    if (expense.paid) return 'success';
    const daysLeft = differenceInDays(new Date(expense.due_date), new Date());
    if (daysLeft < 0) return 'destructive';
    if (daysLeft <= 3) return 'warning';
    return 'default';
  };

  // Lista única de categorias
  const categories = Array.from(new Set(expenses.map((e) => e.category).filter(Boolean)));

  // Filtrando despesas pelo período, categoria e status
  const filteredExpenses = expenses.filter((expense) => {
    const categoryMatch = filterCategory ? expense.category === filterCategory : true;

    let statusMatch = true;
    if (filterStatus === 'pago') statusMatch = expense.paid;
    if (filterStatus === 'pendente')
      statusMatch = !expense.paid && differenceInDays(new Date(expense.due_date), new Date()) >= 0;
    if (filterStatus === 'vencido')
      statusMatch = !expense.paid && differenceInDays(new Date(expense.due_date), new Date()) < 0;

    const dateMatch =
      (!filterStartDate || new Date(expense.due_date) >= filterStartDate) &&
      (!filterEndDate || new Date(expense.due_date) <= filterEndDate);

    return categoryMatch && statusMatch && dateMatch;
  });

  // Dashboard filtrado
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const pendingExpenses = filteredExpenses.filter((e) => !e.paid);
  const upcomingExpenses = filteredExpenses.filter(
    (e) => !e.paid && differenceInDays(new Date(e.due_date), new Date()) <= 3
  );

  // Gráfico
  const chartData = [
    { name: 'Pago', value: filteredExpenses.filter((e) => e.paid).length },
    { name: 'Pendente', value: filteredExpenses.filter((e) => !e.paid).length },
  ];
  const COLORS = ['#34D399', '#FBBF24']; // verde pago, amarelo pendente

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Contas a Pagar e Receber</h1>

      {/* Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-blue-100">
          <p className="text-sm text-blue-700">Total de Despesas</p>
          <p className="text-2xl font-bold text-blue-900">R$ {formatCurrency(totalExpenses)}</p>
        </Card>
        <Card className="p-4 bg-yellow-100">
          <p className="text-sm text-yellow-700">Despesas Pendentes</p>
          <p className="text-2xl font-bold text-yellow-900">
            R$ { formatCurrency(pendingExpenses.reduce((sum, e) => sum + e.amount, 0))}
          </p>
        </Card>
        <Card className="p-4 bg-red-100">
          <p className="text-sm text-red-700">Próximas a Vencer</p>
          <p className="text-2xl font-bold text-red-900">
            R$ {formatCurrency(upcomingExpenses.reduce((sum, e) => sum + e.amount, 0))}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-2">Proporção de Pagamentos</p>
          <ResponsiveContainer width="100%" height={100}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={25}
                outerRadius={40}
                paddingAngle={3}
                label
              >
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Formulário */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Fornecedor</Label>
            <Input
              value={newExpense.supplier}
              onChange={(e) => setNewExpense({ ...newExpense, supplier: e.target.value })}
            />
          </div>
          <div>
            <Label>Descrição</Label>
            <Input
              value={newExpense.description}
              onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
            />
          </div>
          <div>
            <Label>Categoria</Label>
            <Input
              value={newExpense.category}
              onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
            />
          </div>
          <div>
            <Label>Valor</Label>
            <Input
              type="number"
              value={newExpense.amount}
              onChange={(e) => setNewExpense({ ...newExpense, amount: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label>Data de Vencimento</Label>
            <Input
              type="date"
              value={format(newExpense.dueDate ?? new Date(), 'yyyy-MM-dd')}
              onChange={(e) => setNewExpense({ ...newExpense, dueDate: new Date(e.target.value) })}
            />
          </div>
        </div>
        <div className="mt-4">
          <Button onClick={saveExpense}>Adicionar Despesa</Button>
        </div>
      </Card>

      {/* Filtros */}
      <Card className="p-4 flex flex-col md:flex-row md:items-end gap-4">
        <div>
          <Label>Filtrar por Categoria</Label>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="border rounded px-2 py-1"
          >
            <option value="">Todas</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>Filtrar por Status</Label>
          <select
            value={filterStatus}
            onChange={(e) =>
              setFilterStatus(e.target.value as 'todos' | 'pago' | 'pendente' | 'vencido')
            }
            className="border rounded px-2 py-1"
          >
            <option value="todos">Todos</option>
            <option value="pago">Pago</option>
            <option value="pendente">Pendente</option>
            <option value="vencido">Vencido</option>
          </select>
        </div>
        <div>
          <Label>De</Label>
          <Input
            type="date"
            value={filterStartDate ? format(filterStartDate, 'yyyy-MM-dd') : ''}
            onChange={(e) => setFilterStartDate(e.target.value ? new Date(e.target.value) : null)}
          />
        </div>
        <div>
          <Label>Até</Label>
          <Input
            type="date"
            value={filterEndDate ? format(filterEndDate, 'yyyy-MM-dd') : ''}
            onChange={(e) => setFilterEndDate(e.target.value ? new Date(e.target.value) : null)}
          />
        </div>
      </Card>

      {/* Lista de despesas */}
      <Card className="p-4 space-y-2 max-h-[400px] overflow-y-auto">
        {filteredExpenses.length === 0 && <p>Nenhuma despesa cadastrada</p>}
        {filteredExpenses.map((expense) => {
          const daysLeft = differenceInDays(new Date(expense.due_date), new Date());
          const isUpcoming = !expense.paid && daysLeft <= 3 && daysLeft >= 0;
          const isOverdue = !expense.paid && daysLeft < 0;

          return (
            <div
              key={expense.id}
              className={`flex justify-between items-center p-3 border-b rounded-lg ${
                expense.paid ? 'opacity-60 line-through' : ''
              }`}
            >
              <div>
                <p className="font-medium">{expense.supplier}</p>
                <p className="text-sm">{expense.description}</p>
                <p
                  className={`text-xs font-semibold ${
                    isOverdue ? 'text-red-600' : isUpcoming ? 'text-yellow-700' : 'text-gray-500'
                  }`}
                >
                  Vence em: {format(new Date(expense.due_date), 'dd/MM/yyyy')}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <span className="font-bold">R$ {expense.amount.toFixed(2)}</span>
                <Badge
                  variant={expense.paid ? 'success' : isOverdue ? 'destructive' : isUpcoming ? 'warning' : 'default'}
                >
                  {expense.paid ? 'Pago' : isOverdue ? 'Vencido' : isUpcoming ? 'Próximo' : 'Pendente'}
                </Badge>
                <Button size="sm" onClick={() => togglePaid(expense)}>
                  {expense.paid ? 'Marcar Pendente' : 'Marcar Pago'}
                </Button>
              </div>
            </div>
          );
        })}
      </Card>
    </div>
  );
};

export default ContasPagar;


