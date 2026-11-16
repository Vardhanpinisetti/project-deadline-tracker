import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div
      aria-live="polite"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const isSuccess = toast.type === 'success';
  const isInfo = toast.type === 'info';

  const borderClass = isSuccess
    ? 'border-l-4 border-l-[#35D49A] text-[#FFF6EA]'
    : isInfo
    ? 'border-l-4 border-l-[#5B93FF] text-[#FFF6EA]'
    : 'border-l-4 border-l-alert-red text-[#FFF6EA]';

  return (
    <div
      role="status"
      className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl solar-glass bg-[#0B1020]/95 shadow-solar-card transition-all duration-150 ease-out animate-slide-in ${borderClass}`}
    >
      <div className="shrink-0 mt-0.5">
        {isSuccess ? (
          <CheckCircle2 className="w-5 h-5 text-[#35D49A]" />
        ) : isInfo ? (
          <Info className="w-5 h-5 text-[#5B93FF]" />
        ) : (
          <AlertTriangle className="w-5 h-5 text-alert-red" />
        )}
      </div>

      <div className="flex-1 text-sm font-medium leading-snug">
        {toast.message}
      </div>

      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 p-1 text-muted hover:text-[#FFF6EA] rounded-lg hover:bg-white/[0.06] transition-colors"
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
