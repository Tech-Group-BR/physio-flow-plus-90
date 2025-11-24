import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { usePayments } from '@/hooks/usePayments'
import { 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  CreditCard, 
  QrCode, 
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle
} from 'lucide-react'
import { toast } from 'sonner'

interface Payment {
  id: string
  asaas_payment_id: string
  clinic_id: string
  customer_id: string
  amount: number
  status: string
  billing_type: string
  due_date: string
  created_at: string
  paid_at?: string
  description?: string
  products?: {
    name: string
    price: number
    billing_period: string
  }
}

export function PaymentDashboard() {
  const { getPaymentsByClinic, loading } = usePayments()
  const [payments, setPayments] = useState<Payment[]>([])
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  useEffect(() => {
    loadAllPayments()
  }, [])

  useEffect(() => {
    filterPayments()
  }, [payments, searchTerm, statusFilter, typeFilter])

  const loadAllPayments = async () => {
    try {
      // Como não temos clinic_id específico, vamos buscar todos os pagamentos via API personalizada
      // Para super admin, isso pode requerer uma função específica
      const response = await fetch('/api/admin/payments') // Exemplo de endpoint
      if (response.ok) {
        const data = await response.json()
        setPayments(data)
      }
    } catch (error) {
      console.error('Erro ao carregar pagamentos:', error)
      toast.error('Erro ao carregar pagamentos')
    }
  }

  const filterPayments = () => {
    let filtered = payments

    // Filtro por busca
    if (searchTerm) {
      filtered = filtered.filter(payment => 
        payment.asaas_payment_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.customer_id.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtro por status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(payment => payment.status === statusFilter)
    }

    // Filtro por tipo
    if (typeFilter !== 'all') {
      filtered = filtered.filter(payment => payment.billing_type === typeFilter)
    }

    setFilteredPayments(filtered)
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: any, icon: any, label: string }> = {
      'paid': { variant: 'default', icon: CheckCircle, label: 'Pago' },
      'pending': { variant: 'secondary', icon: Clock, label: 'Pendente' },
      'overdue': { variant: 'destructive', icon: AlertTriangle, label: 'Vencido' },
      'cancelled': { variant: 'outline', icon: XCircle, label: 'Cancelado' },
    }

    const statusInfo = statusMap[status] || { variant: 'outline', icon: Clock, label: status }
    const Icon = statusInfo.icon

    return (
      <Badge variant={statusInfo.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {statusInfo.label}
      </Badge>
    )
  }

  const getPaymentTypeIcon = (type: string) => {
    switch (type) {
      case 'pix':
        return <QrCode className="w-4 h-4 text-green-600" />
      case 'boleto':
        return <FileText className="w-4 h-4 text-blue-600" />
      case 'credit_card':
        return <CreditCard className="w-4 h-4 text-purple-600" />
      default:
        return <CreditCard className="w-4 h-4 text-gray-600" />
    }
  }

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatsData = () => {
    const totalPayments = payments.length
    const paidPayments = payments.filter(p => p.status === 'paid').length
    const pendingPayments = payments.filter(p => p.status === 'pending').length
    const totalRevenue = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0)

    return {
      totalPayments,
      paidPayments,
      pendingPayments,
      totalRevenue
    }
  }

  const stats = getStatsData()

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard de Pagamentos</h1>
          <p className="text-muted-foreground">
            Gerencie todos os pagamentos do sistema
          </p>
        </div>
        <Button onClick={loadAllPayments} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Pagamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPayments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">Pagamentos Confirmados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.paidPayments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-600">Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pendingPayments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-600">Receita Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(stats.totalRevenue)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="ID, descrição, cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md text-sm"
              >
                <option value="all">Todos</option>
                <option value="paid">Pago</option>
                <option value="pending">Pendente</option>
                <option value="overdue">Vencido</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>

            <div>
              <Label htmlFor="type">Tipo</Label>
              <select
                id="type"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md text-sm"
              >
                <option value="all">Todos</option>
                <option value="pix">PIX</option>
                <option value="boleto">Boleto</option>
                <option value="credit_card">Cartão</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Pagamentos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pagamentos ({filteredPayments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p>Carregando pagamentos...</p>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum pagamento encontrado
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPayments.map((payment) => (
                <div key={payment.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        {getPaymentTypeIcon(payment.billing_type)}
                        <span className="font-medium">{payment.asaas_payment_id}</span>
                        {getStatusBadge(payment.status)}
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        <p>{payment.description}</p>
                        {payment.products && (
                          <p>Produto: {payment.products.name}</p>
                        )}
                      </div>
                    </div>

                    <div className="text-right space-y-1">
                      <div className="text-lg font-bold">
                        {formatCurrency(payment.amount)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Criado: {formatDate(payment.created_at)}
                      </div>
                      {payment.paid_at && (
                        <div className="text-xs text-green-600">
                          Pago: {formatDate(payment.paid_at)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}