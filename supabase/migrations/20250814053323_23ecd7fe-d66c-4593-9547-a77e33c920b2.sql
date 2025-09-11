
-- Adicionar colunas que estão faltando na tabela accounts_receivable
ALTER TABLE public.accounts_receivable 
ADD COLUMN IF NOT EXISTS method text DEFAULT 'dinheiro',
ADD COLUMN IF NOT EXISTS notes text,
ADD COLUMN IF NOT EXISTS received_date timestamp with time zone;

-- Adicionar colunas que estão faltando na tabela accounts_payable
ALTER TABLE public.accounts_payable 
ADD COLUMN IF NOT EXISTS notes text;

-- Atualizar o tipo de status para accounts_receivable para incluir 'recebido'
ALTER TABLE public.accounts_receivable 
DROP CONSTRAINT IF EXISTS accounts_receivable_status_check;

-- Criar novo tipo de status para accounts_receivable
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_receivable_status') THEN
        CREATE TYPE account_receivable_status AS ENUM ('pendente', 'recebido', 'vencido');
    END IF;
END $$;

-- Alterar a coluna status na tabela accounts_receivable
ALTER TABLE public.accounts_receivable 
ALTER COLUMN status TYPE account_receivable_status USING status::text::account_receivable_status;

-- Criar função para atualizar status vencidos automaticamente
CREATE OR REPLACE FUNCTION update_overdue_accounts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Atualizar contas a receber vencidas
  UPDATE accounts_receivable 
  SET status = 'vencido'
  WHERE due_date < CURRENT_DATE 
    AND status = 'pendente';
    
  -- Atualizar contas a pagar vencidas  
  UPDATE accounts_payable
  SET status = 'vencido'
  WHERE due_date < CURRENT_DATE 
    AND status = 'pendente';
END;
$$;

-- Função para marcar conta a receber como paga
CREATE OR REPLACE FUNCTION mark_receivable_as_paid(
  receivable_id uuid,
  payment_method text DEFAULT 'dinheiro'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE accounts_receivable 
  SET 
    status = 'recebido',
    received_date = NOW(),
    method = payment_method,
    updated_at = NOW()
  WHERE id = receivable_id;
END;
$$;

-- Função para marcar conta a pagar como paga
CREATE OR REPLACE FUNCTION mark_payable_as_paid(payable_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE accounts_payable 
  SET 
    status = 'pago',
    paid_date = NOW(),
    updated_at = NOW()
  WHERE id = payable_id;
END;
$$;
