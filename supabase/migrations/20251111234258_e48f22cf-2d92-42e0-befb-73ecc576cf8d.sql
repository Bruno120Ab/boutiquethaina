-- Criar tabela para histórico de pagamentos parciais
CREATE TABLE public.payment_history (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  creditor_id BIGINT NOT NULL,
  amount NUMERIC NOT NULL,
  payment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir todas as operações
CREATE POLICY "Allow all operations on payment_history" 
ON public.payment_history 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Criar índice para melhorar performance de consultas
CREATE INDEX idx_payment_history_creditor_id ON public.payment_history(creditor_id);
CREATE INDEX idx_payment_history_payment_date ON public.payment_history(payment_date);