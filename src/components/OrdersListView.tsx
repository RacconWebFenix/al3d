'use client';

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Calendar as CalendarIcon, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Box, 
  Trash2, 
  ChevronRight, 
  Filter 
} from 'lucide-react';
import { Order } from './OrderCard';
import { formatCurrencyBRL } from '@/lib/formatters';

interface OrdersListViewProps {
  orders: Order[];
  onOpenNewOrder: () => void;
  onMoveOrderToStage: (orderId: number, targetStage: Order['stage']) => void;
  onDeleteOrder: (id: number) => void;
}

type StageFilter = 'ALL' | Order['stage'];

const STAGES_CONFIG: { key: Order['stage']; label: string; shortLabel: string; badgeClasses: string; glowBorder: string }[] = [
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

export function OrdersListView({
  orders,
  onOpenNewOrder,
  onMoveOrderToStage,
  onDeleteOrder,
}: OrdersListViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeStageFilter, setActiveStageFilter] = useState<StageFilter>('ALL');
  const [stageMenuOpenId, setStageMenuOpenId] = useState<number | null>(null);

  // Cálculos de KPIs rápidos
  const kpis = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let totalRevenue = 0;
    let todayCount = 0;
    let lateCount = 0;

    orders.forEach((o) => {
      totalRevenue += Number(o.total_value) || 0;

      if (o.delivery_date && o.stage !== 'ENTREGUE') {
        const [y, m, d] = o.delivery_date.split('-').map(Number);
        const target = new Date(y, m - 1, d);
        const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
          todayCount++;
        } else if (diffDays < 0) {
          lateCount++;
        }
      }
    });

    return { totalRevenue, todayCount, lateCount };
  }, [orders]);

  // Contagens por estágio para as pills
  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = {
      ALL: orders.length,
      COTACAO: 0,
      MODELANDO: 0,
      IMPRIMINDO: 0,
      PAGAMENTO: 0,
      ENTREGUE: 0,
    };

    orders.forEach((o) => {
      if (counts[o.stage] !== undefined) {
        counts[o.stage]++;
      }
    });

    return counts;
  }, [orders]);

  // Filtragem dos pedidos
  const filteredOrders = useMemo(() => {
    let result = orders;

    if (activeStageFilter !== 'ALL') {
      result = result.filter((o) => o.stage === activeStageFilter);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (o) =>
          o.client_name.toLowerCase().includes(q) ||
          o.description.toLowerCase().includes(q)
      );
    }

    return result;
  }, [orders, activeStageFilter, searchTerm]);

  // Prazo e status formatado
  const getDeliveryDetails = (order: Order) => {
    if (order.stage === 'ENTREGUE') {
      return {
        text: 'Concluído',
        icon: CheckCircle2,
        classes: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      };
    }

    if (!order.delivery_date) {
      return {
        text: 'Sem prazo',
        icon: CalendarIcon,
        classes: 'bg-slate-800/60 text-slate-400 border-slate-700/50',
      };
    }

    const [y, m, d] = order.delivery_date.split('-').map(Number);
    const target = new Date(y, m - 1, d);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const formattedDate = `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`;

    if (diffDays < 0) {
      return {
        text: `${Math.abs(diffDays)}d atrasado (${formattedDate})`,
        icon: AlertTriangle,
        classes: 'bg-rose-500/15 text-rose-300 border-rose-500/30 font-semibold',
      };
    } else if (diffDays === 0) {
      return {
        text: 'Hoje, 18:00',
        icon: Clock,
        classes: 'bg-amber-500/15 text-amber-300 border-amber-500/30 font-bold animate-pulse',
      };
    } else if (diffDays === 1) {
      return {
        text: `Amanhã (${formattedDate})`,
        icon: CalendarIcon,
        classes: 'bg-amber-500/10 text-amber-300 border-amber-500/25',
      };
    } else {
      return {
        text: `${formattedDate}`,
        icon: CalendarIcon,
        classes: 'bg-slate-800/80 text-slate-300 border-slate-700/60',
      };
    }
  };

  return (
    <div className="space-y-4 pb-28">
      {/* 1. Barra de Busca e Filtro */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[var(--text-dim)] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar cliente, peça ou pedido..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-[var(--text-dim)] focus:outline-none focus:border-cyan-500/50 transition-colors"
          />
        </div>
        <button
          onClick={() => setActiveStageFilter('ALL')}
          title="Limpar filtros"
          className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-[var(--text-muted)] hover:text-white hover:border-white/20 transition-all"
        >
          <Filter className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Pills de Filtro por Etapa (Carrossel Horizontal Deslizável) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none -mx-1 px-1">
        <button
          onClick={() => setActiveStageFilter('ALL')}
          className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
            activeStageFilter === 'ALL'
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm shadow-cyan-500/20'
              : 'bg-white/5 text-[var(--text-muted)] border-white/10 hover:border-white/20 hover:text-white'
          }`}
        >
          Todos ({stageCounts.ALL})
        </button>

        {STAGES_CONFIG.map((stage) => {
          const isActive = activeStageFilter === stage.key;
          const count = stageCounts[stage.key] || 0;

          return (
            <button
              key={stage.key}
              onClick={() => setActiveStageFilter(stage.key)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                isActive
                  ? `${stage.badgeClasses} shadow-sm ring-1 ring-white/20`
                  : 'bg-white/5 text-[var(--text-muted)] border-white/10 hover:border-white/20 hover:text-white'
              }`}
            >
              {stage.shortLabel} ({count})
            </button>
          );
        })}
      </div>

      {/* 3. Barra Rápida de Métricas (KPI Quick Bar) */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="flex flex-col justify-between p-3 rounded-2xl bg-[#0f172a]/90 border border-white/10 shadow-lg">
          <span className="text-[11px] text-[var(--text-dim)] font-medium">Total</span>
          <span className="text-sm sm:text-base font-extrabold text-white tracking-tight mt-0.5 truncate">
            {formatCurrencyBRL(kpis.totalRevenue)}
          </span>
        </div>

        <div className="flex flex-col justify-between p-3 rounded-2xl bg-[#0f172a]/90 border border-white/10 shadow-lg">
          <span className="text-[11px] text-[var(--text-dim)] font-medium">Hoje</span>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-sm sm:text-base font-extrabold text-amber-400">
              {kpis.todayCount}
            </span>
            <span className="text-[11px] text-[var(--text-muted)]">Pedidos</span>
          </div>
        </div>

        <div className="flex flex-col justify-between p-3 rounded-2xl bg-[#0f172a]/90 border border-white/10 shadow-lg">
          <span className="text-[11px] text-[var(--text-dim)] font-medium">Atraso</span>
          <span className={`text-sm sm:text-base font-extrabold mt-0.5 ${kpis.lateCount > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
            {kpis.lateCount}
          </span>
        </div>
      </div>

      {/* 4. Lista Vertical de Cards (Sem fotos/avatares, 100% Fiel ao Mockup) */}
      <div className="space-y-3 pt-1">
        {filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 rounded-2xl bg-[#0f172a]/60 border border-dashed border-white/10 text-center">
            <Box className="w-10 h-10 text-[var(--text-dim)] mb-2 opacity-60" />
            <p className="text-sm text-white font-medium">Nenhum pedido encontrado</p>
            <p className="text-xs text-[var(--text-dim)] mt-1">
              {searchTerm ? 'Tente ajustar os termos de busca.' : 'Cadastre um novo pedido pelo botão abaixo.'}
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const stageConfig = STAGES_CONFIG.find((s) => s.key === order.stage) || STAGES_CONFIG[0];
            const delivery = getDeliveryDetails(order);
            const DeliveryIcon = delivery.icon;
            const isMenuOpen = stageMenuOpenId === order.id;

            const isFullyPaid = order.paid_amount >= order.total_value && order.total_value > 0;
            const isPartiallyPaid = !isFullyPaid && (order.is_partial_paid || (order.paid_amount > 0 && order.paid_amount < order.total_value));

            return (
              <div
                key={order.id}
                className="relative bg-[#101726] border border-white/10 hover:border-white/20 rounded-2xl p-4 shadow-xl backdrop-blur-md transition-all duration-200"
              >
                {/* Linha Superior: Nome do Cliente + Ícone 3D e Badge de Etapa */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Box className="w-4 h-4 text-cyan-400 flex-shrink-0 opacity-90" />
                    <h4 className="font-bold text-white text-base tracking-tight truncate" title={order.client_name}>
                      {order.client_name}
                    </h4>
                  </div>

                  <div className="relative flex items-center gap-1 flex-shrink-0">
                    {/* Badge de Etapa (Clicável para trocar no Mobile) */}
                    <button
                      onClick={() => setStageMenuOpenId(isMenuOpen ? null : order.id)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border transition-all ${stageConfig.badgeClasses} hover:scale-105 active:scale-95`}
                      title="Toque para mudar de etapa"
                    >
                      <span>{stageConfig.label}</span>
                      <ChevronRight className="w-3 h-3 opacity-70" />
                    </button>

                    {/* Botão de Excluir */}
                    <button
                      onClick={() => onDeleteOrder(order.id)}
                      className="text-[var(--text-dim)] hover:text-rose-400 p-1 rounded-lg hover:bg-white/5 transition-all ml-1"
                      title="Excluir pedido"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Popover de Seleção Rápida de Etapa para Touch */}
                    {isMenuOpen && (
                      <div className="absolute right-0 top-8 z-30 w-48 rounded-xl bg-[#162032] border border-white/15 p-1.5 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95">
                        <div className="text-[10px] uppercase font-bold text-[var(--text-dim)] px-2.5 py-1">
                          Mudar etapa:
                        </div>
                        {STAGES_CONFIG.map((st) => (
                          <button
                            key={st.key}
                            onClick={() => {
                              onMoveOrderToStage(order.id, st.key);
                              setStageMenuOpenId(null);
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                              order.stage === st.key
                                ? 'bg-white/10 text-white'
                                : 'text-[var(--text-muted)] hover:bg-white/5 hover:text-white'
                            }`}
                          >
                            <span>{st.label}</span>
                            {order.stage === st.key && <span className="text-cyan-400">●</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Descrição do Pedido */}
                <p className="text-sm text-slate-300 font-medium mb-3.5 line-clamp-2 leading-relaxed">
                  {order.description}
                </p>

                {/* Linha Inferior: Data de Entrega (Esquerda) e Status Financeiro (Direita) */}
                <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-white/5">
                  {/* Prazo de Entrega */}
                  <div className="flex items-center">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border ${delivery.classes}`}>
                      <DeliveryIcon className="w-3 h-3 flex-shrink-0" />
                      <span>{delivery.text}</span>
                    </span>
                  </div>

                  {/* Financeiro */}
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-extrabold text-white tabular-numbers">
                      {formatCurrencyBRL(order.total_value)}
                    </span>

                    {isFullyPaid && (
                      <span className="text-[10px] font-bold text-emerald-400 mt-0.5">
                        Total Pago
                      </span>
                    )}

                    {isPartiallyPaid && (
                      <span className="text-[10px] font-semibold text-cyan-300 mt-0.5">
                        50% Pago ({formatCurrencyBRL(order.paid_amount)})
                      </span>
                    )}

                    {!isFullyPaid && !isPartiallyPaid && (
                      <span className="text-[10px] font-medium text-[var(--text-dim)] mt-0.5">
                        Pendente
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 5. Botão Flutuante (FAB) `+ Novo Pedido` no Rodapé (Ergonomia Mobile) */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20">
        <button
          onClick={onOpenNewOrder}
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-sm shadow-[0_0_25px_rgba(6,182,212,0.45)] hover:shadow-[0_0_35px_rgba(6,182,212,0.6)] transition-all hover:scale-105 active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Novo Pedido</span>
        </button>
      </div>
    </div>
  );
}
