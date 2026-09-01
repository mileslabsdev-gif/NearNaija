import type { NegotiationType } from '@/types';

export function NegotiationBadge({
  type,
  agentFeeMin,
  agentFeeMax,
  size = 'sm',
}: {
  type: NegotiationType;
  agentFeeMin?: number;
  agentFeeMax?: number;
  size?: 'sm' | 'md';
}) {
  const padding = size === 'md' ? 'px-3 py-1.5 text-sm' : 'px-2.5 py-1 text-xs';
  if (type === 'Negotiable') {
    return (
      <span className={`badge ${padding} bg-green-100 text-green-700`}>
        🟢 Price Negotiable
      </span>
    );
  }
  if (type === 'Fixed Price') {
    return (
      <span className={`badge ${padding} bg-red-100 text-red-700`}>
        🔴 Fixed Price
      </span>
    );
  }
  return (
    <span className={`badge ${padding} bg-orange-100 text-orange-700`}>
      🤝 Agent Fee {agentFeeMin}–{agentFeeMax}%
    </span>
  );
}

export function CategoryBadge({ category, subType }: { category: string; subType?: string }) {
  const labels: Record<string, string> = {
    Product: 'Product',
    Service: 'Service',
    Property: subType || 'Property',
    Vehicle: subType || 'Vehicle',
  };
  return (
    <span className="badge bg-blue-50 text-blue-600">
      {labels[category] || category}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    Active: 'bg-green-100 text-green-700',
    Sold: 'bg-gray-200 text-gray-600',
    Rented: 'bg-purple-100 text-purple-700',
    Unavailable: 'bg-orange-100 text-orange-700',
  };
  return <span className={`badge ${colors[status] || colors.Active}`}>{status}</span>;
}
