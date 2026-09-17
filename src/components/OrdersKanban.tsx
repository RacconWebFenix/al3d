'use client';

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Calendar as CalendarIcon, 
  Plus, 
  FileText, 
  Box, 
  Cog, 
  CreditCard, 
  PackageCheck,
  Filter,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { Order, OrderCard } from './OrderCard';

interface OrdersKanbanProps {
  orders: Order[];
  loading: boolean;
  onOpenNewOrder: () => void;
  onRefresh: () => void;
  onAdvanceStage: (order: Order, nextStage: Order['stage']) => void;
  onRegressStage: (order: Order, prevStage: Order['stage']) => void;
  onDeleteOrder: (id: number) => void;
}

interface ColumnConfig {
  key: Order['stage'];
  number: number;
  label: string;
  icon: React.ElementType;
  pillClasses: string;
  badgeClasses: string;
}

const COLUMNS: ColumnConfig[] = [
  {
    key: 'COTACAO',
    number: 1,
    label: 'Cotação',
    icon: FileText,
    pillClasses: 'border-cyan-500/30 text-cyan-400 bg-cyan-500/10',
    badgeClasses: 'bg-cyan-500 text-slate-950',
  },
  {
    key: 'MODELANDO',
    number: 2,
    label: 'Modelando',
    icon: Box,
    pillClasses: 'border-indigo-500/30 text-indigo-300 bg-indigo-500/10',
    badgeClasses: 'bg-indigo-500 text-white',
  },
  {
    key: 'IMPRIMINDO',
    number: 3,
    label: 'Imprimindo',
    icon: Cog,
    pillClasses: 'border-amber-500/30 text-amber-300 bg-amber-500/10 shadow-sm shadow-amber-500/10',
    badgeClasses: 'bg-amber-400 text-slate-950 font-bold',
  },
  {
    key: 'PAGAMENTO',
    number: 4,
    label: 'Pagamento',
    icon: CreditCard,
    pillClasses: 'border-purple-500/30 text-purple-300 bg-purple-500/10',
    badgeClasses: 'bg-purple-500 text-white',
  },
  {
    key: 'ENTREGUE',
    number: 5,
    label: 'Entregue',
    icon: PackageCheck,
    pillClasses: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10',
    badgeClasses: 'bg-emerald-500 text-slate-950 font-bold',
  },
];

export function OrdersKanban({
  orders,
  loading,
  onOpenNewOrder,
  onRefresh,
  onAdvanceStage,
  onRegressStage,
  onDeleteOrder,
}: OrdersKanbanProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<'ALL' | 'WEEK' | 'LATE'>('ALL');

  // Filtragem
  const filteredOrders = useMemo(() => {
    let result = orders;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (o) =>
          o.client_name.toLowerCase().includes(q) ||
          o.description.toLowerCase().includes(q)
      );
    }

    if (dateFilter !== 'ALL') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      result = result.filter((o) => {
        if (!o.delivery_date) return false;
        const [y, m, d] = o.delivery_date.split('-').map(Number);
        const target = new Date(y, m - 1, d);
        const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (dateFilter === 'LATE') return diffDays < 0;
        if (dateFilter === 'WEEK') return diffDays >= 0 && diffDays <= 7;
        return true;
      });
    }

    return result;
  }, [orders, searchTerm, dateFilter]);

  return (
    <div className="space-y-6">
      {/* Subheader: Busca, Filtro de Data e Botão Novo Pedido (Fiel ao Mockup) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        {/* Barra de Busca */}
        <div className="relative flex-1 max-w-xl">
          <Search className="w-4 h-4 text-[var(--text-dim)] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar cliente, peça ou pedido..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-[var(--text-dim)] focus:outline-none focus:border-emerald-500/50"
          />
        </div>

        <div className="flex items-center gap-3">
          {/* Seletor de Filtro de Data */}
          <div className="relative flex items-center">
            <CalendarIcon className="w-4 h-4 text-[var(--text-dim)] absolute left-3 pointer-events-none" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="pl-9 pr-8 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm appearance-none focus:outline-none focus:border-emerald-500/50 cursor-pointer"
            >
              <option value="ALL" className="bg-[#121826] text-white">Todos os prazos</option>
              <option value="WEEK" className="bg-[#121826] text-white">Próximos 7 dias</option>
              <option value="LATE" className="bg-[#121826] text-white">Atrasados</option>
            </select>
          </div>

          {/* Botão + Novo Pedido (Glowing Emerald Green) */}
          <button
            onClick={onOpenNewOrder}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/30 transition-all hover:scale-[1.02] active:scale-98"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Novo Pedido</span>
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-[var(--text-dim)]">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mb-2" />
          <p className="text-sm">Carregando pedidos da AL3D...</p>
        </div>
      ) : (
        /* Grid das 5 Colunas do Kanban */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-start pb-10">
          {COLUMNS.map((col) => {
            const columnOrders = filteredOrders.filter((o) => o.stage === col.key);
            const Icon = col.icon;

            return (
              <div
                key={col.key}
                className="flex flex-col min-h-[520px] bg-[#0c121e]/60 border border-white/5 rounded-2xl p-2.5 transition-all"
              >
                {/* Cabeçalho da Coluna (Pill com Número, Ícone e Label idênticos ao Mockup) */}
                <div
                  className={`flex items-center justify-between px-3 py-2 rounded-xl border mb-3 ${col.pillClasses}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-extrabold bg-white/20">
                      {col.number}
                    </span>
                    <span className="text-xs font-bold tracking-wide">
                      {col.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Icon className="w-4 h-4 opacity-80" />
                    <span className="text-xs font-bold opacity-80 ml-1">
                      {columnOrders.length}
                    </span>
                  </div>
                </div>

                {/* Lista de Cards da Coluna */}
                <div className="flex-1 space-y-3 overflow-y-auto max-h-[700px] pr-1">
                  {columnOrders.length === 0 ? (
                    <div className="h-36 flex flex-col items-center justify-center text-center p-4 border border-dashed border-white/5 rounded-xl text-[var(--text-dim)] text-xs">
                      <span>Nenhum pedido nesta etapa</span>
                    </div>
                  ) : (
                    columnOrders.map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        onAdvanceStage={onAdvanceStage}
                        onRegressStage={onRegressStage}
                        onDelete={onDeleteOrder}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
