'use client';

import { cn } from '@/lib/utils';
import { 
  getEstimateStatusColor, 
  getInvoiceStatusColor, 
  getProjectStatusColor 
} from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  type: 'estimate' | 'invoice' | 'project';
  className?: string;
}

export function StatusBadge({ status, type, className }: StatusBadgeProps) {
  const getColorFn = {
    estimate: getEstimateStatusColor,
    invoice: getInvoiceStatusColor,
    project: getProjectStatusColor,
  }[type];

  return (
    <span className={cn(
      'px-3 py-1 rounded-full text-xs font-medium',
      getColorFn(status),
      className
    )}>
      {status}
    </span>
  );
}
