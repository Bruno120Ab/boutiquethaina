import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/formatters';
import { PDFGenerator } from '@/lib/pdfGenerator';
import { Zap, Send, FileText, MessageSquare, Download, Package } from 'lucide-react';

interface ZapDialogProps {
  isOpen: boolean;
  onClose: () => void;
  product: any;
  customers: any[];
}

// const ZapDialog = ({ isOpen, onClose, product, customers }: ZapDialogProps) => {
//   const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null);
//   const [webhookUrl, setWebhookUrl] = useState('');
//   const [customMessage, setCustomMessage] = useState('');
//   const [isLoading, setIsLoading] = useState(false);
//   const [sendCarne, setSendCarne] = useState(false);
//   const [sendPdf, setSendPdf] = useState(true);
//   const [installments, setInstallments] = useState(1);

//   const selectedCustomerData = customers.find(c => c.id === selectedCustomer);

//   const handleSendZap = async () => {
//     if (!webhookUrl) {
//       toast({
//         title: "Erro",
//         description: "Por favor, insira a URL do webhook do Zapier",
//         variant: "destructive",
//       });
//       return;
//     }

//     if (!selectedCustomer || !product) {
//       toast({
//         title: "Erro", 
//         description: "Selecione um cliente e produto",
//         variant: "destructive",
//       });
//       return;
//     }

//     setIsLoading(true);

//     try {
//       let carneData = null;
//       let pdfData = null;

//       // Gerar carnê se solicitado
//       if (sendCarne && selectedCustomerData) {
//         const carneInfo = {
//           creditorId: selectedCustomer,
//           creditorName: "Sua Empresa",
//           customerName: selectedCustomerData.name,
//           totalAmount: product.price,
//           installments: installments,
//           installmentValue: product.price / installments,
//           dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
//           saleId: Date.now(),
//           items: [{
//             productName: product.name,
//             quantity: 1,
//             price: product.price
//           }]
//         };

//         carneData = PDFGenerator.generateCarne(carneInfo);
//       }

//       // Gerar PDF do produto se solicitado
//       if (sendPdf) {
//         const saleData = {
//           saleId: Date.now(),
//           customerName: selectedCustomerData?.name || 'Cliente',
//           items: [{
//             productName: product.name,
//             quantity: 1,
//             price: product.price
//           }],
//           total: product.price,
//           paymentMethod: sendCarne ? 'crediario' : 'dinheiro',
//           installments: sendCarne ? installments : 1,
//           discount: 0,
//           createdAt: new Date(),
//           seller: 'Sistema'
//         };

//         pdfData = PDFGenerator.generateSaleReport(saleData);
//       }

//       // Enviar dados para Zapier
//       const zapierData = {
//         timestamp: new Date().toISOString(),
//         triggered_from: window.location.origin,
//         product: {
//           name: product.name,
//           price: product.price,
//           category: product.category,
//           description: product.description || '',
//           barcode: product.barcode || ''
//         },
//         customer: selectedCustomerData ? {
//           name: selectedCustomerData.name,
//           email: selectedCustomerData.email || '',
//           phone: selectedCustomerData.phone || '',
//           address: selectedCustomerData.address || ''
//         } : null,
//         message: customMessage || `Produto: ${product.name} - ${formatCurrency(product.price)}`,
//         hasCarne: sendCarne,
//         hasPdf: sendPdf,
//         installments: sendCarne ? installments : 1,
//         carneData: carneData,
//         pdfData: pdfData
//       };

//       const response = await fetch(webhookUrl, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         mode: "no-cors",
//         body: JSON.stringify(zapierData),
//       });

//       toast({
//         title: "Enviado com sucesso!",
//         description: "Produto enviado via Zapier. Verifique o histórico do Zap para confirmar.",
//       });

//       onClose();
      
//     } catch (error) {
//       console.error("Erro ao enviar via Zapier:", error);
//       toast({
//         title: "Erro",
//         description: "Falha ao enviar via Zapier. Verifique a URL e tente novamente.",
//         variant: "destructive",
//       });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   if (!isOpen || !product) return null;

//   return (
//     <Dialog open={isOpen} onOpenChange={onClose}>
//       <DialogContent className="max-w-lg">
//         <DialogHeader>
//           <DialogTitle className="flex items-center space-x-2">
//             <Zap className="h-5 w-5 text-yellow-600" />
//             <span>Enviar via Zapier</span>
//           </DialogTitle>
//         </DialogHeader>

//         <div className="space-y-4">
//           {/* Produto selecionado */}
//           <Card className="p-3">
//             <div className="flex justify-between items-start">
//               <div>
//                 <h3 className="font-semibold">{product.name}</h3>
//                 <p className="text-sm text-muted-foreground">{product.category}</p>
//                 <p className="text-lg font-bold text-primary">{formatCurrency(product.price)}</p>
//               </div>
//               <Badge variant="outline">{product.stock} em estoque</Badge>
//             </div>
//           </Card>

//           {/* Seleção de cliente */}
//           <div className="space-y-2">
//             <Label htmlFor="customer">Cliente *</Label>
//             <Select value={selectedCustomer?.toString() || ''} onValueChange={(value) => setSelectedCustomer(Number(value))}>
//               <SelectTrigger>
//                 <SelectValue placeholder="Selecione um cliente" />
//               </SelectTrigger>
//               <SelectContent>
//                 {customers.map((customer) => (
//                   <SelectItem key={customer.id} value={customer.id!.toString()}>
//                     {customer.name}
//                   </SelectItem>
//                 ))}
//               </SelectContent>
//             </Select>
//           </div>

//           {/* URL do Webhook */}
//           <div className="space-y-2">
//             <Label htmlFor="webhook">URL do Webhook Zapier *</Label>
//             <Input
//               id="webhook"
//               type="url"
//               placeholder="https://hooks.zapier.com/hooks/catch/..."
//               value={webhookUrl}
//               onChange={(e) => setWebhookUrl(e.target.value)}
//             />
//           </div>

//           {/* Opções de envio */}
//           <div className="space-y-3">
//             <Label>Opções de envio:</Label>
            
//             <div className="flex items-center space-x-2">
//               <input
//                 type="checkbox"
//                 id="sendPdf"
//                 checked={sendPdf}
//                 onChange={(e) => setSendPdf(e.target.checked)}
//                 className="rounded"
//               />
//               <Label htmlFor="sendPdf" className="flex items-center space-x-2">
//                 <FileText className="h-4 w-4" />
//                 <span>Enviar PDF do produto</span>
//               </Label>
//             </div>

//             <div className="flex items-center space-x-2">
//               <input
//                 type="checkbox"
//                 id="sendCarne"
//                 checked={sendCarne}
//                 onChange={(e) => setSendCarne(e.target.checked)}
//                 className="rounded"
//               />
//               <Label htmlFor="sendCarne" className="flex items-center space-x-2">
//                 <Download className="h-4 w-4" />
//                 <span>Gerar e enviar carnê</span>
//               </Label>
//             </div>

//             {/* Parcelamento para carnê */}
//             {sendCarne && (
//               <div className="ml-6 space-y-2">
//                 <Label htmlFor="installments">Número de parcelas</Label>
//                 <Select value={installments.toString()} onValueChange={(value) => setInstallments(Number(value))}>
//                   <SelectTrigger className="w-32">
//                     <SelectValue />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {[1, 2, 3, 4, 5, 6, 10, 12].map((num) => (
//                       <SelectItem key={num} value={num.toString()}>
//                         {num}x de {formatCurrency(product.price / num)}
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//               </div>
//             )}
//           </div>

//           {/* Mensagem personalizada */}
//           <div className="space-y-2">
//             <Label htmlFor="message" className="flex items-center space-x-2">
//               <MessageSquare className="h-4 w-4" />
//               <span>Mensagem personalizada</span>
//             </Label>
//             <Textarea
//               id="message"
//               placeholder="Digite uma mensagem personalizada (opcional)"
//               value={customMessage}
//               onChange={(e) => setCustomMessage(e.target.value)}
//               rows={3}
//             />
//           </div>

//           {/* Botões */}
//           <div className="flex space-x-2">
//             <Button variant="outline" onClick={onClose} className="flex-1">
//               Cancelar
//             </Button>
//             <Button onClick={handleSendZap} disabled={isLoading} className="flex-1">
//               {isLoading ? (
//                 "Enviando..."
//               ) : (
//                 <>
//                   <Send className="h-4 w-4 mr-2" />
//                   Enviar via Zap
//                 </>
//               )}
//             </Button>
//           </div>
//         </div>
//       </DialogContent>
//     </Dialog>
//   );
// };
// const ZapDialog = ({ isOpen, onClose, product, customers }: ZapDialogProps) => {
//   const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null);
//   const [customMessage, setCustomMessage] = useState('');
//   const [isLoading, setIsLoading] = useState(false);
//   const [sendCarne, setSendCarne] = useState(false);
//   const [sendPdf, setSendPdf] = useState(true);
//   const [installments, setInstallments] = useState(1);

//   const selectedCustomerData = customers.find(c => c.id === selectedCustomer);

//   const handleSendZap = async () => {
//     if (!selectedCustomer || !product) {
//       toast({
//         title: "Erro", 
//         description: "Selecione um cliente e produto",
//         variant: "destructive",
//       });
//       return;
//     }

//     setIsLoading(true);

//     try {
//       let message = customMessage || `Produto: ${product.name} - ${formatCurrency(product.price)}`;

//       if (sendCarne) {
//         message += `\n\n💳 Pagamento em ${installments}x de ${formatCurrency(product.price / installments)}.`;
//       }

//       if (sendPdf) {
//         message += `\n📎 O comprovante será enviado em anexo.`;
//       }

//       const phone = selectedCustomerData?.phone?.replace(/\D/g, ""); // só números
//       if (!phone) {
//         toast({
//           title: "Erro",
//           description: "O cliente não possui telefone válido.",
//           variant: "destructive",
//         });
//         return;
//       }

//       // Abrir link do WhatsApp Web / Mobile
//       const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
//       window.open(whatsappUrl, "_blank");

//       toast({
//         title: "Mensagem pronta!",
//         description: "O WhatsApp foi aberto para enviar a mensagem.",
//       });

//       onClose();
//     } catch (error) {
//       console.error("Erro ao enviar no WhatsApp:", error);
//       toast({
//         title: "Erro",
//         description: "Falha ao abrir o WhatsApp.",
//         variant: "destructive",
//       });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   if (!isOpen || !product) return null;

//   return (
//     <Dialog open={isOpen} onOpenChange={onClose}>
//       <DialogContent className="max-w-lg">
//         <DialogHeader>
//           <DialogTitle className="flex items-center space-x-2">
//             <Zap className="h-5 w-5 text-green-600" />
//             <span>Enviar via WhatsApp</span>
//           </DialogTitle>
//         </DialogHeader>

//         <div className="space-y-4">
//           {/* Produto selecionado */}
//           <Card className="p-3">
//             <div className="flex justify-between items-start">
//               <div>
//                 <h3 className="font-semibold">{product.name}</h3>
//                 <p className="text-sm text-muted-foreground">{product.category}</p>
//                 <p className="text-lg font-bold text-primary">{formatCurrency(product.price)}</p>
//               </div>
//               <Badge variant="outline">{product.stock} em estoque</Badge>
//             </div>
//           </Card>

//           {/* Seleção de cliente */}
//           <div className="space-y-2">
//             <Label htmlFor="customer">Cliente *</Label>
//             <Select value={selectedCustomer?.toString() || ''} onValueChange={(value) => setSelectedCustomer(Number(value))}>
//               <SelectTrigger>
//                 <SelectValue placeholder="Selecione um cliente" />
//               </SelectTrigger>
//               <SelectContent>
//                 {customers.map((customer) => (
//                   <SelectItem key={customer.id} value={customer.id!.toString()}>
//                     {customer.name}
//                   </SelectItem>
//                 ))}
//               </SelectContent>
//             </Select>
//           </div>

//           {/* Opções de envio */}
//           <div className="space-y-3">
//             <Label>Opções de envio:</Label>
            
//             <div className="flex items-center space-x-2">
//               <input
//                 type="checkbox"
//                 id="sendPdf"
//                 checked={sendPdf}
//                 onChange={(e) => setSendPdf(e.target.checked)}
//                 className="rounded"
//               />
//               <Label htmlFor="sendPdf" className="flex items-center space-x-2">
//                 <FileText className="h-4 w-4" />
//                 <span>Enviar PDF do produto</span>
//               </Label>
//             </div>

//             <div className="flex items-center space-x-2">
//               <input
//                 type="checkbox"
//                 id="sendCarne"
//                 checked={sendCarne}
//                 onChange={(e) => setSendCarne(e.target.checked)}
//                 className="rounded"
//               />
//               <Label htmlFor="sendCarne" className="flex items-center space-x-2">
//                 <Download className="h-4 w-4" />
//                 <span>Gerar e enviar carnê</span>
//               </Label>
//             </div>

//             {/* Parcelamento */}
//             {sendCarne && (
//               <div className="ml-6 space-y-2">
//                 <Label htmlFor="installments">Número de parcelas</Label>
//                 <Select value={installments.toString()} onValueChange={(value) => setInstallments(Number(value))}>
//                   <SelectTrigger className="w-32">
//                     <SelectValue />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {[1, 2, 3, 4, 5, 6, 10, 12].map((num) => (
//                       <SelectItem key={num} value={num.toString()}>
//                         {num}x de {formatCurrency(product.price / num)}
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//               </div>
//             )}
//           </div>

//           {/* Mensagem personalizada */}
//           <div className="space-y-2">
//             <Label htmlFor="message" className="flex items-center space-x-2">
//               <MessageSquare className="h-4 w-4" />
//               <span>Mensagem personalizada</span>
//             </Label>
//             <Textarea
//               id="message"
//               placeholder="Digite uma mensagem personalizada (opcional)"
//               value={customMessage}
//               onChange={(e) => setCustomMessage(e.target.value)}
//               rows={3}
//             />
//           </div>

//           {/* Botões */}
//           <div className="flex space-x-2">
//             <Button variant="outline" onClick={onClose} className="flex-1">
//               Cancelar
//             </Button>
//             <Button onClick={handleSendZap} disabled={isLoading} className="flex-1">
//               {isLoading ? "Abrindo..." : (
//                 <>
//                   <Send className="h-4 w-4 mr-2" />
//                   Enviar via WhatsApp
//                 </>
//               )}
//             </Button>
//           </div>
//         </div>
//       </DialogContent>
//     </Dialog>
//   );
// };
// const ZapDialog = ({ isOpen, onClose, product, customers }: ZapDialogProps) => {
//   const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null);
//   const [customMessage, setCustomMessage] = useState('');
//   const [isLoading, setIsLoading] = useState(false);
//   const [sendPdf, setSendPdf] = useState(true);
//   const [sendCarne, setSendCarne] = useState(false);
//   const [installments, setInstallments] = useState(1);
//   const [messageType, setMessageType] = useState<'carne' | 'promocao'>('promocao');

//   const selectedCustomerData = customers.find(c => c.id === selectedCustomer);

//   const handleSendWhatsApp = async () => {
//     if (!selectedCustomer || !product) {
//       toast({
//         title: "Erro", 
//         description: "Selecione um cliente e produto",
//         variant: "destructive",
//       });
//       return;
//     }

//     setIsLoading(true);

//     try {
//       let message = '';

//       if (messageType === 'carne') {
//         message = `💳 Carnê de cobrança - ${installments}x de ${formatCurrency(product.price / installments)}`;

//         // PDF ou link do carnê
//         if (sendPdf) {
//           // Aqui você poderia gerar o PDF e hospedar em algum lugar
//           const carnePdf = PDFGenerator.generateCarne({
//             creditorId: selectedCustomer,
//             creditorName: "Minha Empresa",
//             customerName: selectedCustomerData?.name || 'Cliente',
//             totalAmount: product.price,
//             installments,
//             installmentValue: product.price / installments,
//             dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
//             items: [{
//               productName: product.name,
//               quantity: 1,
//               price: product.price
//             }]
//           });
//           const linkPdf = 'https://seuservidor.com/carne.pdf'; // Substitua pelo link real
//           message += `\n📎 Baixe seu carnê: ${linkPdf}`;
//         }

//         // Chave PIX
//         message += `\n💰 PIX: 00020126360014BR.GOV.BCB.PIX01123456789...`;
//       } else if (messageType === 'promocao') {
//         message = `🛍 Produto: ${product.name}
// Preço: ${formatCurrency(product.price)}
// ${product.stock <= 5 ? '⚠️ Últimas unidades!' : ''}
// 📦 Aproveite a promoção e garanta já!`;

//         if (sendPdf) {
//           message += `\n📎 Mais informações em anexo.`;
//         }
//       }

//       // Mensagem personalizada
//       if (customMessage) message += `\n\n${customMessage}`;

//       const phone = selectedCustomerData?.phone?.replace(/\D/g, ""); // só números
//       if (!phone) {
//         toast({
//           title: "Erro",
//           description: "O cliente não possui telefone válido.",
//           variant: "destructive",
//         });
//         return;
//       }

//       // Abrir WhatsApp Web / Mobile
//       const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
//       window.open(whatsappUrl, "_blank");

//       toast({
//         title: "Mensagem pronta!",
//         description: "O WhatsApp foi aberto para enviar a mensagem.",
//       });

//       onClose();
//     } catch (error) {
//       console.error("Erro ao enviar no WhatsApp:", error);
//       toast({
//         title: "Erro",
//         description: "Falha ao abrir o WhatsApp.",
//         variant: "destructive",
//       });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   if (!isOpen || !product) return null;

//   return (
//     <Dialog open={isOpen} onOpenChange={onClose}>
//       <DialogContent className="max-w-lg">
//         <DialogHeader>
//           <DialogTitle className="flex items-center space-x-2">
//             <Zap className="h-5 w-5 text-green-600" />
//             <span>Enviar via WhatsApp</span>
//           </DialogTitle>
//         </DialogHeader>

//         <div className="space-y-4">
//           {/* Produto selecionado */}
//           <Card className="p-3">
//             <div className="flex justify-between items-start">
//               <div>
//                 <h3 className="font-semibold">{product.name}</h3>
//                 <p className="text-sm text-muted-foreground">{product.category}</p>
//                 <p className="text-lg font-bold text-primary">{formatCurrency(product.price)}</p>
//               </div>
//               <Badge variant="outline">{product.stock} em estoque</Badge>
//             </div>
//           </Card>

//           {/* Seleção de cliente */}
//           <div className="space-y-2">
//             <Label htmlFor="customer">Cliente *</Label>
//             <Select value={selectedCustomer?.toString() || ''} onValueChange={(value) => setSelectedCustomer(Number(value))}>
//               <SelectTrigger>
//                 <SelectValue placeholder="Selecione um cliente" />
//               </SelectTrigger>
//               <SelectContent>
//                 {customers.map((customer) => (
//                   <SelectItem key={customer.id} value={customer.id!.toString()}>
//                     {customer.name}
//                   </SelectItem>
//                 ))}
//               </SelectContent>
//             </Select>
//           </div>

//           {/* Tipo de mensagem */}
//           <div className="space-y-2">
//             <Label>Tipo de mensagem</Label>
//             <Select value={messageType} onValueChange={(value) => setMessageType(value as 'carne' | 'promocao')}>
//               <SelectTrigger>
//                 <SelectValue placeholder="Escolha" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="carne">Carnê de cobrança</SelectItem>
//                 <SelectItem value="promocao">Promoção / Produto em estoque</SelectItem>
//               </SelectContent>
//             </Select>
//           </div>

//           {/* Opções de envio */}
//           <div className="space-y-3">
//             <div className="flex items-center space-x-2">
//               <input
//                 type="checkbox"
//                 id="sendPdf"
//                 checked={sendPdf}
//                 onChange={(e) => setSendPdf(e.target.checked)}
//                 className="rounded"
//               />
//               <Label htmlFor="sendPdf" className="flex items-center space-x-2">
//                 <FileText className="h-4 w-4" />
//                 <span>Incluir PDF / PDF do carnê</span>
//               </Label>
//             </div>

//             {messageType === 'carne' && (
//               <div className="ml-6 space-y-2">
//                 <div className="flex items-center space-x-2">
//                   <input
//                     type="checkbox"
//                     id="sendCarne"
//                     checked={sendCarne}
//                     onChange={(e) => setSendCarne(e.target.checked)}
//                     className="rounded"
//                   />
//                   <Label htmlFor="sendCarne">Gerar e enviar carnê</Label>
//                 </div>

//                 {sendCarne && (
//                   <>
//                     <Label htmlFor="installments">Número de parcelas</Label>
//                     <Select value={installments.toString()} onValueChange={(value) => setInstallments(Number(value))}>
//                       <SelectTrigger className="w-32">
//                         <SelectValue />
//                       </SelectTrigger>
//                       <SelectContent>
//                         {[1, 2, 3, 4, 5, 6, 10, 12].map((num) => (
//                           <SelectItem key={num} value={num.toString()}>
//                             {num}x de {formatCurrency(product.price / num)}
//                           </SelectItem>
//                         ))}
//                       </SelectContent>
//                     </Select>
//                   </>
//                 )}
//               </div>
//             )}
//           </div>

//           {/* Mensagem personalizada */}
//           <div className="space-y-2">
//             <Label htmlFor="message" className="flex items-center space-x-2">
//               <MessageSquare className="h-4 w-4" />
//               <span>Mensagem personalizada</span>
//             </Label>
//             <Textarea
//               id="message"
//               placeholder="Digite uma mensagem personalizada (opcional)"
//               value={customMessage}
//               onChange={(e) => setCustomMessage(e.target.value)}
//               rows={3}
//             />
//           </div>

//           {/* Botões */}
//           <div className="flex space-x-2">
//             <Button variant="outline" onClick={onClose} className="flex-1">
//               Cancelar
//             </Button>
//             <Button onClick={handleSendWhatsApp} disabled={isLoading} className="flex-1">
//               {isLoading ? "Abrindo..." : (
//                 <>
//                   <Send className="h-4 w-4 mr-2" />
//                   Enviar via WhatsApp
//                 </>
//               )}
//             </Button>
//           </div>
//         </div>
//       </DialogContent>
//     </Dialog>
//   );
// };
const ZapDialog = ({ isOpen, onClose, product, customers }: ZapDialogProps) => {
  const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null);
  const [customMessage, setCustomMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sendCarne, setSendCarne] = useState(false);
  const [sendProductInfo, setSendProductInfo] = useState(true);
  const [installments, setInstallments] = useState(1);

  const selectedCustomerData = customers.find(c => c.id === selectedCustomer);

  const handleSendWhatsApp = async () => {
    if (!selectedCustomer || !product) {
      toast({
        title: "Erro", 
        description: "Selecione um cliente e produto",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      let message = "";

      if (sendCarne) {
        message += `
Oi, ${selectedCustomerData?.name || "Cliente"}! 💛

Seu carnê de cobrança está disponível:

💳 Pagamento em ${installments}x de ${formatCurrency(product.price / installments)}
📎 Baixe seu carnê: https://seuservidor.com/carne.pdf
💰 PIX: 00020126360014BR.GOV.BCB.PIX01123456789

Caso tenha perdido seu carnê, passe em nossa loja para retirar um novo.
`;
      }

      if (sendProductInfo) {
        message += `
📦 Produto: ${product.name}
💲 Preço: ${formatCurrency(product.price)}
${product.stock ? `🛒 Estoque restante: ${product.stock}` : ''}
${customMessage ? `\n📝 ${customMessage}` : ''}
`;
      }

      // Número do cliente (apenas dígitos)
      const phone = selectedCustomerData?.phone?.replace(/\D/g, "");
      if (!phone) {
        toast({
          title: "Erro",
          description: "O cliente não possui telefone válido.",
          variant: "destructive",
        });
        return;
      }

      const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, "_blank");

      toast({
        title: "Mensagem pronta!",
        description: "O WhatsApp foi aberto para enviar a mensagem.",
      });

      onClose();
    } catch (error) {
      console.error("Erro ao enviar no WhatsApp:", error);
      toast({
        title: "Erro",
        description: "Falha ao abrir o WhatsApp.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-green-600" />
            <span>Enviar via WhatsApp</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Produto selecionado */}
          <Card className="p-3">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{product.name}</h3>
                <p className="text-sm text-muted-foreground">{product.category}</p>
                <p className="text-lg font-bold text-primary">{formatCurrency(product.price)}</p>
              </div>
              <Badge variant="outline">{product.stock} em estoque</Badge>
            </div>
          </Card>

          {/* Seleção de cliente */}
          <div className="space-y-2">
            <Label htmlFor="customer">Cliente *</Label>
            <Select value={selectedCustomer?.toString() || ''} onValueChange={(value) => setSelectedCustomer(Number(value))}>
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

          {/* Opções de envio */}
          <div className="space-y-3">
            <Label>Opções de envio:</Label>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="sendProductInfo"
                checked={sendProductInfo}
                onChange={(e) => setSendProductInfo(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="sendProductInfo" className="flex items-center space-x-2">
                <Package className="h-4 w-4" />
                <span>Informações do produto</span>
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="sendCarne"
                checked={sendCarne}
                onChange={(e) => setSendCarne(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="sendCarne" className="flex items-center space-x-2">
                <Download className="h-4 w-4" />
                <span>Enviar carnê de cobrança</span>
              </Label>
            </div>

            {/* Parcelamento */}
            {sendCarne && (
              <div className="ml-6 space-y-2">
                <Label htmlFor="installments">Número de parcelas</Label>
                <Select value={installments.toString()} onValueChange={(value) => setInstallments(Number(value))}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 10, 12].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num}x de {formatCurrency(product.price / num)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Mensagem personalizada */}
          <div className="space-y-2">
            <Label htmlFor="message" className="flex items-center space-x-2">
              <MessageSquare className="h-4 w-4" />
              <span>Mensagem personalizada</span>
            </Label>
            <Textarea
              id="message"
              placeholder="Digite uma mensagem personalizada (opcional)"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={3}
            />
          </div>

          {/* Botões */}
          <div className="flex space-x-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleSendWhatsApp} disabled={isLoading} className="flex-1">
              {isLoading ? "Abrindo..." : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar via WhatsApp
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ZapDialog;