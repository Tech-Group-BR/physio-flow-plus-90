import React from 'react';
import { Shield, Lock } from 'lucide-react';

interface SSLBadgeProps {
  variant?: 'default' | 'compact';
  className?: string;
}

export function SSLBadge({ variant = 'default', className = '' }: SSLBadgeProps) {
  if (variant === 'compact') {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg ${className}`}>
        <Lock className="w-4 h-4 text-green-600" />
        <span className="text-xs font-medium text-green-700">
          Site Seguro
        </span>
      </div>
    );
  }

  return (
    <div className={`inline-flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl shadow-sm ${className}`}>
      <div className="relative">
        <Shield className="w-12 h-12 text-green-600" />
        <Lock className="w-5 h-5 text-green-700 absolute bottom-0 right-0 bg-white rounded-full p-0.5" />
      </div>
      <div className="text-center">
        <div className="flex items-center gap-1 mb-1">
          <span className="text-xs font-bold text-green-700 uppercase tracking-wide">
            Site Seguro
          </span>
        </div>
        <p className="text-[10px] text-green-600 font-medium">
          Protegido por<br />RSA Extended Validation
        </p>
      </div>
    </div>
  );
}
