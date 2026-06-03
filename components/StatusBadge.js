import { Clock, Loader2, Truck, CheckCircle2 } from 'lucide-react';

const STATUS = {
  pending: {
    label: 'PENDING',
    icon: Clock,
    cls: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  },
  processing: {
    label: 'PROCESSING',
    icon: Loader2,
    cls: 'bg-teal-500/15 text-teal-400 border-teal-500/20',
  },
  shipped: {
    label: 'SHIPPED',
    icon: Truck,
    cls: 'bg-violet-500/15 text-violet-400 border-violet-500/20',
  },
  delivered: {
    label: 'DELIVERED',
    icon: CheckCircle2,
    cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  },
};

export default function StatusBadge({ status }) {
  const s =
    STATUS[status] || {
      label: status?.toUpperCase() || 'UNKNOWN',
      icon: Clock,
      cls: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20',
    };
  const Icon = s.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-bold tracking-wider ${s.cls}`}
    >
      <Icon className="h-3 w-3" />
      {s.label}
    </span>
  );
}
