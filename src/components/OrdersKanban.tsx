'use client';

import React, { useState, useMemo, useSyncExternalStore } from 'react';
import { 
  Search, 
  Calendar as CalendarIcon, 
  Plus, 
  FileText, 
  Box, 
  Cog, 
  CreditCard, 
  PackageCheck, 
  Loader2, 
  ArrowDown, 
  LayoutGrid, 
  List as ListIcon 
} from 'lucide-react';
import { Order, OrderCard } from './OrderCard';
import { OrdersListView } from './OrdersListView';

interface OrdersKanbanProps {
  orders: Order[];
  loading: boolean;
  onOpenNewOrder: () => void;
  onRefresh?: () => void;
  onMoveOrderToStage: (orderId: number, targetStage: Order['stage']) => void;
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

function subscribeToResize(callback: () => void) {
  window.addEventListener('resize', callback);
  return () => window.removeEventListener('resize', callback);
}

function getIsNarrowViewport(): boolean {
  return window.innerWidth < 768;
}

function getIsNarrowViewportServerSnapshot(): boolean {
  return false; // SSR nunca conhece a largura real — mesmo valor usado na primeira renderização do cliente, evita hydration mismatch
}

export function OrdersKanban({
  orders,
  loading,
  onOpenNewOrder,
  onMoveOrderToStage,
  onDeleteOrder,
}: OrdersKanbanProps) {
  const isNarrowViewport = useSyncExternalStore(
    subscribeToResize,
    getIsNarrowViewport,
    getIsNarrowViewportServerSnapshot
  );

  const [manualViewMode, setManualViewMode] = useState<'KANBAN' | 'LIST' | null>(null);
  const [prevIsNarrow, setPrevIsNarrow] = useState(isNarrowViewport);

  // Ajuste de estado durante o render (padrão oficial React para resetar estado derivado quando um valor externo muda — não é useEffect, não aciona react-hooks/set-state-in-effect)
  if (isNarrowViewport !== prevIsNarrow) {
    setPrevIsNarrow(isNarrowViewport);
    setManualViewMode(null);
  }

  const viewMode: 'KANBAN' | 'LIST' = manualViewMode ?? (isNarrowViewport ? 'LIST' : 'KANBAN');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<'ALL' | 'WEEK' | 'LATE'>('ALL');
  const [dragOverColumn, setDragOverColumn] = useState<Order['stage'] | null>(null);

  // Filtragem para o modo Kanban
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

  const handleDragOverColumn = (e: React.DragEvent<HTMLDivElement>, stage: Order['stage']) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== stage) {
      setDragOverColumn(stage);
    }
  };

  const handleDragLeaveColumn = (e: React.DragEvent<HTMLDivElement>) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setDragOverColumn(null);
  };

  const handleDropOnColumn = (e: React.DragEvent<HTMLDivElement>, targetStage: Order['stage']) => {
    e.preventDefault();
    setDragOverColumn(null);
    const orderIdStr = e.dataTransfer.getData('text/plain');
    if (!orderIdStr) return;

    const orderId = parseInt(orderIdStr, 10);
    if (!isNaN(orderId)) {
      onMoveOrderToStage(orderId, targetStage);
    }
  };

  return (
    <div className="space-y-6">
      {/* Barra de Alternância de Visão (Kanban / Lista) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        {/* Toggle de Visualização: Colunas (Kanban) / Lista */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10 w-fit">
          <button
            onClick={() => setManualViewMode('KANBAN')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'KANBAN'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-[var(--text-muted)] hover:text-white'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Colunas (Kanban)</span>
          </button>

          <button
            onClick={() => setManualViewMode('LIST')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'LIST'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-[var(--text-muted)] hover:text-white'
            }`}
          >
            <ListIcon className="w-3.5 h-3.5" />
            <span>Lista (Mobile)</span>
          </button>
        </div>

        {/* Controles do Cabeçalho para o modo Kanban */}
        {viewMode === 'KANBAN' && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 sm:justify-end">
            {/* Barra de Busca */}
            <div className="relative flex-1 max-w-xs">
              <Search className="w-4 h-4 text-[var(--text-dim)] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar cliente, peça..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder-[var(--text-dim)] focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <div className="flex items-center gap-2">
              {/* Seletor de Filtro de Data */}
              <div className="relative flex items-center">
                <CalendarIcon className="w-3.5 h-3.5 text-[var(--text-dim)] absolute left-3 pointer-events-none" />
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value as 'ALL' | 'WEEK' | 'LATE')}
                  className="pl-8 pr-7 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs appearance-none focus:outline-none focus:border-emerald-500/50 cursor-pointer"
                >
                  <option value="ALL" className="bg-[#121826] text-white">Todos os prazos</option>
                  <option value="WEEK" className="bg-[#121826] text-white">Próximos 7 dias</option>
                  <option value="LATE" className="bg-[#121826] text-white">Atrasados</option>
                </select>
              </div>

              {/* Botão + Novo Pedido */}
              <button
                onClick={onOpenNewOrder}
                className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/30 transition-all hover:scale-[1.02] active:scale-98"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>Novo Pedido</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-[var(--text-dim)]">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mb-2" />
          <p className="text-sm">Carregando pedidos da AL3D...</p>
        </div>
      ) : viewMode === 'LIST' ? (
        /* Modo Lista (Fiel ao Mockup Mobile) */
        <OrdersListView
          orders={orders}
          onOpenNewOrder={onOpenNewOrder}
          onMoveOrderToStage={onMoveOrderToStage}
          onDeleteOrder={onDeleteOrder}
        />
      ) : (
        /* Grid das 5 Colunas do Kanban com Drag and Drop */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-start pb-10">
          {COLUMNS.map((col) => {
            const columnOrders = filteredOrders.filter((o) => o.stage === col.key);
            const Icon = col.icon;
            const isHovered = dragOverColumn === col.key;

            return (
              <div
                key={col.key}
                onDragOver={(e) => handleDragOverColumn(e, col.key)}
                onDragLeave={handleDragLeaveColumn}
                onDrop={(e) => handleDropOnColumn(e, col.key)}
                className={`flex flex-col min-h-[550px] rounded-2xl p-2.5 transition-all duration-200 border ${
                  isHovered
                    ? 'border-emerald-500/60 bg-emerald-500/[0.06] shadow-xl shadow-emerald-500/10 ring-2 ring-emerald-500/30 scale-[1.01]'
                    : 'bg-[#0c121e]/60 border-white/5'
                }`}
              >
                {/* Cabeçalho da Coluna (Pill com Número, Ícone e Label) */}
                <div
                  className={`flex items-center justify-between px-3 py-2 rounded-xl border mb-3 transition-colors ${
                    isHovered
                      ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                      : col.pillClasses
                  }`}
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

                {/* Zona de Drop Interativa quando arrastando */}
                {isHovered && (
                  <div className="mb-3 py-2 px-3 border-2 border-dashed border-emerald-400/50 rounded-xl bg-emerald-500/10 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1.5 animate-pulse">
                    <ArrowDown className="w-3.5 h-3.5" />
                    <span>Solte para mover para {col.label}</span>
                  </div>
                )}

                {/* Lista de Cards da Coluna */}
                <div className="flex-1 space-y-3 overflow-y-auto max-h-[700px] pr-1">
                  {columnOrders.length === 0 ? (
                    <div className="h-36 flex flex-col items-center justify-center text-center p-4 border border-dashed border-white/5 rounded-xl text-[var(--text-dim)] text-xs">
                      <span>Arraste pedidos para cá</span>
                    </div>
                  ) : (
                    columnOrders.map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order}
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
