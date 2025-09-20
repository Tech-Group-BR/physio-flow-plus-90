import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, 
  CheckCircle, 
  Activity,
  Clock
} from "lucide-react";

interface WhatsAppStatsProps {
  todayMessages: number;
  confirmations: number;
  pendingConfirmations: number;
  responseRate: string | number;
}

export function WhatsAppStats({ 
  todayMessages, 
  confirmations, 
  pendingConfirmations, 
  responseRate 
}: WhatsAppStatsProps) {
  return (
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Messages Today Card */}
      <Card>
        <CardContent className="p-4 flex items-center space-x-3">
          <MessageSquare className="h-8 w-8 text-blue-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-gray-600">Mensagens Hoje</p>
            <p className="text-2xl font-bold text-gray-900">
              {todayMessages}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Confirmed Card */}
      <Card>
        <CardContent className="p-4 flex items-center space-x-3">
          <CheckCircle className="h-8 w-8 text-green-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-gray-600">Confirmações</p>
            <p className="text-2xl font-bold text-gray-900">
              {confirmations}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Pending Card */}
      <Card>
        <CardContent className="p-4 flex items-center space-x-3">
          <Clock className="h-8 w-8 text-yellow-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-gray-600">Pendentes</p>
            <p className="text-2xl font-bold text-gray-900">
              {pendingConfirmations}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Response Rate Card */}
      <Card>
        <CardContent className="p-4 flex items-center space-x-3">
          <Activity className="h-8 w-8 text-purple-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-gray-600">Taxa Resposta</p>
            <p className="text-2xl font-bold text-gray-900">{responseRate}%</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}