import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, QrCode } from 'lucide-react';
import { toast } from 'sonner';
import { usePaymentPersistence } from '@/hooks/usePaymentPersistence';

interface PixQrCode {
  encodedImage: string;
  payload: string;
}

interface PixPaymentProps {
  paymentData: {
    id: string;
    invoiceUrl: string;
    status: string;
    pixQrCode?: PixQrCode;
  };
  onStatusChange?: (status: string) => void;
}

export function PixPayment({ paymentData, onStatusChange }: PixPaymentProps) {
  const [paymentStatus, setPaymentStatus] = useState(paymentData.status);
  const { persistedData, persistData, clearPixData } = usePaymentPersistence();

  // Persistir QR Code quando receber
  useEffect(() => {
    if (paymentData.pixQrCode) {
      persistData({
        pixQrCode: paymentData.pixQrCode.encodedImage,
        pixCopyPaste: paymentData.pixQrCode.payload,
      });
    }
  }, [paymentData.pixQrCode, persistData]);

  // Limpar dados do PIX quando o pagamento for confirmado
  useEffect(() => {
    if (paymentStatus === 'CONFIRMED' || paymentStatus === 'RECEIVED') {
      clearPixData();
    }
  }, [paymentStatus, clearPixData]);

  // Usar QR Code persistido se disponível
  const qrCodeImage = paymentData.pixQrCode?.encodedImage || persistedData.pixQrCode;
  const qrCodePayload = paymentData.pixQrCode?.payload || persistedData.pixCopyPaste;



  const copyPixCode = () => {
    if (qrCodePayload) {
      navigator.clipboard.writeText(qrCodePayload);
      toast.success('Código PIX copiado para a área de transferência!');
    } else {
      toast.error('Código PIX não disponível');
    }
  };

  // Verifica o status do pagamento a cada 10 segundos
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/payment-status/${paymentData.id}`);
        if (response.ok) {
          const data = await response.json();
          if (data.status !== paymentStatus) {
            setPaymentStatus(data.status);
            onStatusChange?.(data.status);
          }
        }
      } catch (error) {
        console.error('Erro ao verificar status do pagamento:', error);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [paymentData.id, paymentStatus, onStatusChange]);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <QrCode className="w-5 h-5" />
          Pagamento PIX
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Status: {paymentStatus === 'PENDING' ? 'Aguardando pagamento' : paymentStatus}
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {qrCodeImage ? (
          <div className="text-center">
            <img 
              src={`data:image/png;base64,${qrCodeImage}`}
              alt="QR Code PIX"
              className="mx-auto mb-4 border rounded"
              style={{ maxWidth: '200px', height: 'auto' }}
            />
            <p className="text-xs text-muted-foreground mb-4">
              Escaneie o QR Code com seu app bancário
            </p>
          </div>
        ) : (
          <div className="text-center bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <QrCode className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
            <p className="text-sm text-yellow-800 mb-2">
              QR Code não disponível no momento
            </p>
            <p className="text-xs text-yellow-600">
              Aguarde a geração do código ou tente novamente
            </p>
          </div>
        )}

        {qrCodePayload && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Código PIX (Copia e Cola):</p>
            <div className="flex gap-2">
              <div className="flex-1 p-2 bg-gray-50 rounded text-xs font-mono break-all">
                {qrCodePayload}
              </div>
              <Button onClick={copyPixCode} size="sm" variant="outline">
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        <div className="text-center">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.open(paymentData.invoiceUrl, '_blank')}
          >
            Ver detalhes do pagamento
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}