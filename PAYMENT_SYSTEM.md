# Sistema de Pagamentos PhysioFlow Plus

## Visão Geral

O sistema de pagamentos foi implementado com integração completa ao Asaas, oferecendo:

- **PIX**: Pagamento instantâneo com QR Code e cópia e cola
- **Boleto**: Geração automática de boletos bancários  
- **Cartão de Crédito**: Processamento seguro de cartões

## Componentes Principais

### 1. PaymentSystem
Componente principal que gerencia todo o fluxo de pagamento.

```tsx
<PaymentSystem
  productId="produto-123"
  clinicId="clinica-456"
  value={99.90}
  description="PhysioFlow Plus - Plano Starter"
  onPaymentSuccess={(data) => console.log('Sucesso:', data)}
  onPaymentError={(error) => console.log('Erro:', error)}
/>
```

### 2. PixPayment
Interface específica para pagamentos PIX com QR Code e verificação automática.

### 3. BoletoPayment  
Interface para boletos com download e acompanhamento de vencimento.

### 4. CreditCardPayment
Formulário completo e seguro para cartão de crédito com validação.

## Edge Functions

### create-asaas-customer
Cria ou busca clientes no Asaas de forma segura.

**Endpoint**: `/functions/v1/create-asaas-customer`

**Body**:
```json
{
  "name": "Nome do Cliente",
  "email": "email@exemplo.com",
  "cpfCnpj": "12345678901",
  "phone": "11999999999"
}
```

### create-asaas-payment
Processa pagamentos via Asaas com todos os métodos suportados.

**Endpoint**: `/functions/v1/create-asaas-payment`

**Body**:
```json
{
  "customerId": "cus_000000000000",
  "billingType": "PIX",
  "value": 99.90,
  "dueDate": "2024-02-15",
  "description": "Pagamento teste",
  "clinicId": "clinic-123",
  "productId": "product-456"
}
```

### asaas-webhook
Processa webhooks do Asaas para atualizações automáticas de status.

**URL do Webhook**: `${SUPABASE_URL}/functions/v1/asaas-webhook`

## Configuração

### 1. Variáveis de Ambiente

```env
# Asaas API Configuration (Sandbox)
VITE_ASAAS_API_KEY="sua_api_key_sandbox"
VITE_ASAAS_BASE_URL="https://sandbox.asaas.com/api/v3"

# Para produção, altere para:
# VITE_ASAAS_BASE_URL="https://api.asaas.com/v3"
```

### 2. Webhook no Asaas

Configure o webhook no painel do Asaas:

1. Acesse **Integrações > Webhooks**
2. Adicione a URL: `https://seu-projeto.supabase.co/functions/v1/asaas-webhook`
3. Selecione os eventos:
   - `PAYMENT_RECEIVED`
   - `PAYMENT_OVERDUE`
   - `PAYMENT_CONFIRMED`
   - `PAYMENT_REFUNDED`

## Fluxo de Pagamento

### 1. PIX
1. Cliente preenche dados pessoais
2. Sistema cria cobrança no Asaas
3. QR Code é gerado automaticamente
4. Cliente pode escanear ou usar cópia e cola
5. Status é verificado automaticamente a cada 5 segundos
6. Webhook confirma pagamento instantaneamente

### 2. Boleto
1. Cliente preenche dados pessoais
2. Sistema cria cobrança no Asaas
3. Boleto é gerado com vencimento em 7 dias
4. Cliente pode baixar o boleto
5. Status é atualizado via webhook após compensação

### 3. Cartão de Crédito
1. Cliente preenche dados pessoais e do cartão
2. Dados são processados de forma segura
3. Cobrança é criada no Asaas
4. Aprovação é imediata (sandbox) ou conforme processadora
5. Status é atualizado via webhook

## Segurança

### Edge Functions
- Credenciais da API ficam no servidor Supabase
- Cliente nunca acessa diretamente a API do Asaas
- Validação de dados no servidor

### Dados Sensíveis
- Dados do cartão são enviados diretamente para o Asaas
- Não armazenamos informações sensíveis localmente
- Conformidade com PCI DSS através do Asaas

### Webhooks
- Logs completos de todas as transações
- Verificação de integridade dos dados
- Tratamento de tentativas múltiplas

## Dashboard Administrativo

O `PaymentDashboard` oferece:

- **Estatísticas**: Total de pagamentos, receita, status
- **Filtros**: Por status, tipo de pagamento, busca
- **Monitoramento**: Pagamentos em tempo real
- **Relatórios**: Dados financeiros consolidados

Acesse via `/admin` com credenciais de super administrador.

## Testes

### Sandbox do Asaas
- Ambiente de testes seguro
- Dados de teste predefinidos
- Simulação de todos os fluxos

### PIX de Teste
- QR Codes funcionais no sandbox
- Simulação de confirmação automática
- Logs detalhados de transações

### Boletos de Teste  
- PDFs válidos para visualização
- Simulação de compensação
- Controle de vencimentos

### Cartões de Teste
Use os cartões do sandbox Asaas:
- **4111 1111 1111 1111** (aprovado)
- **4000 0000 0000 0002** (recusado)

## Migração para Produção

### 1. Atualizar Environment
```env
VITE_ASAAS_BASE_URL="https://api.asaas.com/v3"
VITE_ASAAS_API_KEY="sua_api_key_producao"
```

### 2. Configurar Webhook de Produção
Aponte para o ambiente de produção do Supabase.

### 3. Validar Certificações
- Confirmar compliance PCI DSS
- Testar todos os fluxos em produção
- Monitorar logs e métricas

## Suporte e Monitoramento

### Logs
- Webhook logs na tabela `webhook_logs`
- Edge function logs no Supabase
- Status de pagamentos na tabela `payments`

### Alertas
- Pagamentos falhados
- Webhooks não processados
- Inconsistências de status

### Métricas Importantes
- Taxa de conversão por método
- Tempo médio de confirmação PIX
- Volume de transações por período
- Taxa de inadimplência de boletos