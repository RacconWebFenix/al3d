import { OrderStage } from '@/lib/orderSchemas';

export interface StageBadgeConfig {
  key: OrderStage;
  label: string;
  shortLabel: string;
  badgeClasses: string;
  glowBorder: string;
}

export const STAGES_CONFIG: StageBadgeConfig[] = [
  {
    key: 'COTACAO',
    label: 'Cotação',
    shortLabel: 'Cotação',
    badgeClasses: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    glowBorder: 'border-cyan-500/40',
  },
  {
    key: 'MODELANDO',
    label: 'Modelando',
    shortLabel: 'Modelando',
    badgeClasses: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    glowBorder: 'border-amber-500/40',
  },
  {
    key: 'IMPRIMINDO',
    label: 'Imprimindo',
    shortLabel: 'Imprimindo',
    badgeClasses: 'bg-cyan-400/15 text-cyan-300 border-cyan-400/40 shadow-[0_0_12px_rgba(6,182,212,0.18)]',
    glowBorder: 'border-cyan-400/50',
  },
  {
    key: 'PAGAMENTO',
    label: 'Pagamento',
    shortLabel: 'Pagamento',
    badgeClasses: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    glowBorder: 'border-purple-500/40',
  },
  {
    key: 'ENTREGUE',
    label: 'Entregue',
    shortLabel: 'Entregue',
    badgeClasses: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    glowBorder: 'border-emerald-500/40',
  },
];

export function getStageBadgeConfig(stage: OrderStage): StageBadgeConfig {
  return STAGES_CONFIG.find((s) => s.key === stage) || STAGES_CONFIG[0];
}

export interface DeadlineInfo {
  text: string;
  status: 'late' | 'today' | 'soon' | 'normal';
  badgeClasses: string;
}

export function getDeadlineInfo(dateStr: string): DeadlineInfo {
  if (!dateStr) {
    return {
      text: 'Sem prazo',
      status: 'normal',
      badgeClasses: 'bg-teal-500/10 text-teal-300 border-teal-500/20',
    };
  }

  const [y, m, d] = dateStr.split('-').map(Number);
  const target = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffMs = target.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  const formattedDate = `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`;

  if (diffDays < 0) {
    return {
      text: `Entrega: ${formattedDate} · ${Math.abs(diffDays)}d atrasado!`,
      status: 'late',
      badgeClasses: 'bg-rose-500/10 text-rose-300 border-rose-500/25',
    };
  } else if (diffDays === 0) {
    return {
      text: `Entrega: ${formattedDate} · Hoje!`,
      status: 'today',
      badgeClasses: 'bg-amber-500/10 text-amber-300 border-amber-500/25',
    };
  } else if (diffDays === 1) {
    return {
      text: `Entrega: ${formattedDate} · Amanhã`,
      status: 'soon',
      badgeClasses: 'bg-amber-500/10 text-amber-300 border-amber-500/25',
    };
  } else {
    return {
      text: `Entrega: ${formattedDate} · ${diffDays} dias restantes`,
      status: 'normal',
      badgeClasses: 'bg-teal-500/10 text-teal-300 border-teal-500/20',
    };
  }
}

export interface OrderPaymentBadge {
  isFullyPaid: boolean;
  isPartiallyPaid: boolean;
  label: 'Pago' | '50% Pago' | 'Pendente';
  badgeClasses: string;
}

export function getOrderPaymentBadge(order: {
  total_value: number;
  paid_amount: number;
  is_partial_paid: boolean;
}): OrderPaymentBadge {
  const isFullyPaid = order.paid_amount >= order.total_value && order.total_value > 0;
  const isPartiallyPaid = order.is_partial_paid || (order.paid_amount > 0 && order.paid_amount < order.total_value);

  if (isFullyPaid) {
    return {
      isFullyPaid: true,
      isPartiallyPaid: false,
      label: 'Pago',
      badgeClasses: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    };
  }

  if (isPartiallyPaid) {
    return {
      isFullyPaid: false,
      isPartiallyPaid: true,
      label: '50% Pago',
      badgeClasses: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
    };
  }

  return {
    isFullyPaid: false,
    isPartiallyPaid: false,
    label: 'Pendente',
    badgeClasses: 'bg-white/5 text-[var(--text-dim)] border border-white/10',
  };
}
