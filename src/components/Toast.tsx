import { CheckCircle, XCircle, Info } from 'lucide-react';

export function ToastView({
  toast,
}: {
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
}) {
  if (!toast) return null;
  const colors = {
    success: 'bg-brand-primary text-white',
    error: 'bg-red-600 text-white',
    info: 'bg-gray-800 text-white',
  };
  const Icon = toast.type === 'success' ? CheckCircle : toast.type === 'error' ? XCircle : Info;
  return (
    <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[100] animate-slide-up">
      <div className={`flex items-center gap-2 px-5 py-3 rounded-xl shadow-lg ${colors[toast.type]}`}>
        <Icon size={18} />
        <span className="text-sm font-medium">{toast.message}</span>
      </div>
    </div>
  );
}
