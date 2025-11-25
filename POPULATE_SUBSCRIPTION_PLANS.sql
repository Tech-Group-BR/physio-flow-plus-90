-- ============================================
-- POPULAR TABELA SUBSCRIPTION_PLANS
-- Inserir planos de assinatura para PhysioFlow Plus
-- Seguindo PAYMENT_FLOW_COMPLETE.md como BÍBLIA
-- ============================================

-- ATENÇÃO: Seguindo o PAYMENT_FLOW_COMPLETE.md, a tabela é "subscription_plans"
-- O campo "billing_period" é TEXT: 'QUARTERLY', 'SEMIANNUAL', 'ANNUAL'
-- O campo "price" é o PREÇO BASE MENSAL (R$ 97,00/mês) usado apenas para cálculo

-- VALORES TOTAIS EXIBIDOS (fixos na UI):
-- Base mensal: R$ 97,00/mês (usado para calcular economia)
-- Trimestral: R$ 262,00 total (R$ 87,33/mês) - Economize R$ 29,00 (97×3 - 262)
-- Semestral:  R$ 495,00 total (R$ 82,50/mês) - Economize R$ 87,00 (97×6 - 495)
-- Anual:      R$ 930,00 total (R$ 77,50/mês) - Economize R$ 234,00 (97×12 - 930)

-- Remover apenas o Plano Mensal se existir
DELETE FROM subscription_plans WHERE id = '550e8400-e29b-41d4-a716-446655440001';

-- Limpar todos os planos existentes para reinserir
DELETE FROM subscription_plans WHERE TRUE;

-- Inserir planos de assinatura na tabela SUBSCRIPTION_PLANS
INSERT INTO subscription_plans (id, name, description, price, billing_period, features, max_professionals, max_patients, is_active) VALUES
  (
    '550e8400-e29b-41d4-a716-446655440002',
    'Plano Trimestral',
    'Economize 10% com pagamento trimestral. Melhor custo-benefício para teste.',
    97.00,
    'QUARTERLY',
    '["Agenda inteligente e automação", "Prontuários eletrônicos completos", "Confirmação automática via WhatsApp", "Relatórios e dashboards financeiros", "Gestão completa de pacientes", "Controle de pagamentos e contas", "Suporte técnico prioritário", "Atualizações gratuitas", "Economia de 10% no valor total"]'::jsonb,
    NULL,
    NULL,
    true
  ),
  (
    '550e8400-e29b-41d4-a716-446655440003',
    'Plano Semestral',
    'Economize 15% com pagamento semestral. Ideal para clínicas consolidadas.',
    97.00,
    'SEMIANNUAL',
    '["Agenda inteligente e automação", "Prontuários eletrônicos completos", "Confirmação automática via WhatsApp", "Relatórios e dashboards financeiros", "Gestão completa de pacientes", "Controle de pagamentos e contas", "Suporte técnico VIP", "Atualizações gratuitas", "Economia de 15% no valor total", "Prioridade em novos recursos"]'::jsonb,
    NULL,
    NULL,
    true
  ),
  (
    '550e8400-e29b-41d4-a716-446655440004',
    'Plano Anual',
    'Economize 20% com pagamento anual. Parcelamento em até 12x sem juros!',
    97.00,
    'ANNUAL',
    '["Agenda inteligente e automação", "Prontuários eletrônicos completos", "Confirmação automática via WhatsApp", "Relatórios e dashboards financeiros", "Gestão completa de pacientes", "Controle de pagamentos e contas", "Suporte técnico VIP 24/7", "Atualizações gratuitas", "Economia de 20% no valor total", "Parcelamento em até 12x sem juros", "Prioridade máxima em novos recursos", "Consultoria de implantação incluída"]'::jsonb,
    NULL,
    NULL,
    true
  );

-- Verificar planos inseridos
SELECT 
  id,
  name,
  price,
  billing_period,
  max_professionals,
  max_patients,
  is_active,
  created_at
FROM subscription_plans
ORDER BY 
  CASE billing_period
    WHEN 'MONTHLY' THEN 1
    WHEN 'QUARTERLY' THEN 2
    WHEN 'SEMIANNUAL' THEN 3
    WHEN 'ANNUAL' THEN 4
  END;

-- Mostrar features de cada plano
SELECT 
  name,
  price,
  billing_period,
  jsonb_array_elements_text(features) as feature
FROM subscription_plans
ORDER BY 
  CASE billing_period
    WHEN 'MONTHLY' THEN 1
    WHEN 'QUARTERLY' THEN 2
    WHEN 'SEMIANNUAL' THEN 3
    WHEN 'ANNUAL' THEN 4
  END,
  feature;
