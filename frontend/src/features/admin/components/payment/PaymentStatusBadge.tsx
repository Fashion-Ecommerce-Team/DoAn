import AdminStatusBadge from '../common/AdminStatusBadge';

export default function PaymentStatusBadge({ status, large = false }: { status: string; large?: boolean }) {
  return (
    <AdminStatusBadge
      status={status}
      type="payment"
      className={large ? 'px-3 py-1 text-xs' : ''}
    />
  );
}
