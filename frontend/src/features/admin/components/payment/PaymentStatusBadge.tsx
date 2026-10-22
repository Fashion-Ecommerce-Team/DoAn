import { getPaymentStatusLabel } from '../../utils/adminPayment.util';

const COLORS: Record<string, string> = {
  PENDING: 'bg-amber-500',
  PAID: 'bg-green-600',
  FAILED: 'bg-red-600',
  EXPIRED: 'bg-slate-500',
  REFUNDED: 'bg-indigo-600',
};

export default function PaymentStatusBadge({ status, large = false }: { status: string; large?: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full ${large ? 'px-3 py-1' : 'px-2.5 py-0.5'} text-xs font-bold shadow-sm whitespace-nowrap text-white ${COLORS[status] || 'bg-slate-500'}`}
    >
      {getPaymentStatusLabel(status)}
    </span>
  );
}
