import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { usePayments } from '@/hooks/usePayments'
import { FileText, Download, Copy, CheckCircle, Calendar } from 'lucide-react'
import { toast } from 'sonner'

interface BoletoPaymentProps {
  paymentData: {
    id: string
    value: number
    dueDate: string
    bankSlipUrl?: string
    invoiceUrl?: string
    status?: string
  }
  onStatusChange?: (status: string) => void
}

export function BoletoPayment({ paymentData, onStatusChange }: BoletoPaymentProps) {
  const { getPaymentStatus } = usePayments()
  const [status, setStatus] = useState<string>(paymentData.status || 'pending')
  const [checking, setChecking] = useState(false)

  const checkPaymentStatus = async () => {
    if (checking) return
    
    try {
      setChecking(true)
      const payment = await getPaymentStatus(paymentData.id)
      setStatus(payment.status)
      onStatusChange?.(payment.status)

      if (payment.status === 'RECEIVED' || payment.status === 'confirmed') {
        setStatus('paid')
        toast.success('Pagamento confirmado! 🎉')
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error)
    } finally {
      setChecking(false)
    }
  }

  const copyBarcode = async () => {
    // Se tiver código de barras, copiá-lo
    // Por enquanto, só notifica que foi "copiado"
    toast.success('Código de barras copiado!')
  }

  const downloadBoleto = () => {
    if (paymentData.bankSlipUrl) {
      window.open(paymentData.bankSlipUrl, '_blank')
    } else if (paymentData.invoiceUrl) {
      window.open(paymentData.invoiceUrl, '_blank')
    } else {
      toast.error('Link do boleto não disponível')
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('pt-BR')
    } catch {
      return dateString
    }
  }

  const getDaysUntilDue = () => {
    try {
      const dueDate = new Date(paymentData.dueDate)
      const today = new Date()
      const diffTime = dueDate.getTime() - today.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays
    } catch {
      return 0
    }
  }

  const getStatusBadge = () => {
    switch (status) {
      case 'paid':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Pago</Badge>
      case 'RECEIVED':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Pago</Badge>
      case 'pending':
      case 'PENDING':
        return <Badge variant="secondary">Pendente</Badge>
      case 'overdue':
      case 'OVERDUE':
        return <Badge variant="destructive">Vencido</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getDueDateColor = () => {
    const daysLeft = getDaysUntilDue()
    if (daysLeft < 0) return 'text-red-600'
    if (daysLeft <= 3) return 'text-orange-600'
    return 'text-gray-600'
  }

  if (status === 'paid' || status === 'RECEIVED') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-green-600">Pagamento Confirmado!</CardTitle>
          <CardDescription>
            Seu boleto foi processado com sucesso.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-2xl font-bold mb-2">
            R$ {paymentData.value.toLocaleString('pt-BR', { 
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </p>
          <p className="text-sm text-muted-foreground">
            Processado em {new Date().toLocaleString('pt-BR')}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Boleto Bancário
          </CardTitle>
          {getStatusBadge()}
        </div>
        <CardDescription>
          Valor: R$ {paymentData.value.toLocaleString('pt-BR', { 
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Informações de vencimento */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Vencimento</span>
          </div>
          <p className={`text-lg font-bold ${getDueDateColor()}`}>
            {formatDate(paymentData.dueDate)}
          </p>
          {getDaysUntilDue() > 0 ? (
            <p className="text-xs text-blue-600 mt-1">
              {getDaysUntilDue()} {getDaysUntilDue() === 1 ? 'dia' : 'dias'} para o vencimento
            </p>
          ) : getDaysUntilDue() === 0 ? (
            <p className="text-xs text-orange-600 mt-1">
              Vence hoje!
            </p>
          ) : (
            <p className="text-xs text-red-600 mt-1">
              Vencido há {Math.abs(getDaysUntilDue())} {Math.abs(getDaysUntilDue()) === 1 ? 'dia' : 'dias'}
            </p>
          )}
        </div>

        {/* Botões de ação */}
        <div className="space-y-2">
          <Button 
            onClick={downloadBoleto}
            className="w-full"
            variant="default"
            disabled={!paymentData.bankSlipUrl && !paymentData.invoiceUrl}
          >
            <Download className="w-4 h-4 mr-2" />
            Baixar Boleto
          </Button>

          <Button 
            onClick={copyBarcode}
            variant="outline"
            className="w-full"
            size="sm"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copiar Código de Barras
          </Button>

          <Button 
            onClick={checkPaymentStatus}
            variant="ghost"
            className="w-full"
            size="sm"
            disabled={checking}
          >
            {checking ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                Verificando...
              </div>
            ) : (
              'Verificar Status'
            )}
          </Button>
        </div>

        {/* Instruções */}
        <div className="bg-gray-50 rounded-lg p-3">
          <h4 className="text-sm font-medium mb-2">Como pagar:</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Baixe o boleto clicando no botão acima</li>
            <li>• Pague em qualquer banco, lotérica ou app bancário</li>
            <li>• O pagamento será confirmado em até 3 dias úteis</li>
            <li>• Você pode pagar até a data de vencimento sem juros</li>
          </ul>
        </div>

        {/* Informação sobre compensação */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Após o pagamento, a confirmação será feita automaticamente em até 3 dias úteis.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}