'use client';

import React, { useState } from 'react';
import { Calendar, Trash2, AlertTriangle, GripVertical } from 'lucide-react';
import { formatCurrencyBRL } from '@/lib/formatters';

export interface Order {
  id: number;
  client_name: string;
  description: string;
  stage: 'COTACAO' | 'MODELANDO' | 'IMPRIMINDO' | 'PAGAMENTO' | 'ENTREGUE';
  total_value: number;
  paid_amount: number;
  is_partial_paid: boolean;
  delivery_date: string;
  notes?: string;
}

interface OrderCardProps {
  order: Order;
  onDelete: (id: number) => void;
}

export function OrderCard({ order, onDelete }: OrderCardProps) {
  const [isDragging, setIsDragging] = useState(false);

  // Cálculo de dias restantes para o prazo de entrega
  const getDeadlineInfo = (dateStr: string) => {
    if (!dateStr) return { text: 'Sem prazo', status: 'normal' };

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
      };
    } else if (diffDays === 0) {
      return {
        text: `Entrega: ${formattedDate} · Hoje!`,
        status: 'today',
      };
    } else if (diffDays === 1) {
      return {
        text: `Entrega: ${formattedDate} · Amanhã`,
        status: 'soon',
      };
    } else {
      return {
        text: `Entrega: ${formattedDate} · ${diffDays} dias restantes`,
        status: 'normal',
      };
    }
  };

  const deadline = getDeadlineInfo(order.delivery_date);

  // Status de Pagamento
  const isFullyPaid = order.paid_amount >= order.total_value && order.total_value > 0;
  const isPartiallyPaid = order.is_partial_paid || (order.paid_amount > 0 && order.paid_amount < order.total_value);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('text/plain', String(order.id));
    e.dataTransfer.effectAllowed = 'move';
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`group relative bg-[#121826]/90 border rounded-2xl p-4 shadow-xl backdrop-blur-md transition-all cursor-grab active:cursor-grabbing select-none ${
        isDragging
          ? 'opacity-40 scale-95 border-emerald-500/60 shadow-emerald-500/20 shadow-2xl'
          : 'border-white/10 hover:border-white/25 hover:shadow-2xl hover:-translate-y-0.5'
      }`}
    >
      {/* Topo do Card: Ícone Grip, Nome do Cliente e Exclusão */}
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <GripVertical className="w-3.5 h-3.5 text-[var(--text-dim)] group-hover:text-emerald-400/80 transition-colors flex-shrink-0" />
          <h4 className="font-bold text-white text-base tracking-tight truncate" title={order.client_name}>
            {order.client_name}
          </h4>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(order.id);
          }}
          className="opacity-0 group-hover:opacity-100 text-[var(--text-dim)] hover:text-rose-400 p-1 rounded-lg hover:bg-white/5 transition-all"
          title="Excluir pedido"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Descrição do Pedido / Peça 3D */}
      <p className="text-sm text-[var(--text-muted)] line-clamp-2 mb-3 leading-relaxed pl-5">
        {order.description}
      </p>

      {/* Badge de Prazo de Entrega */}
      <div className="mb-3.5 pl-5">
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
            deadline.status === 'late'
              ? 'bg-rose-500/10 text-rose-300 border-rose-500/25'
              : deadline.status === 'today' || deadline.status === 'soon'
              ? 'bg-amber-500/10 text-amber-300 border-amber-500/25'
              : 'bg-teal-500/10 text-teal-300 border-teal-500/20'
          }`}
        >
          {deadline.status === 'late' ? (
            <AlertTriangle className="w-3 h-3" />
          ) : (
            <Calendar className="w-3 h-3" />
          )}
          <span>{deadline.text}</span>
        </span>
      </div>

      {/* Linha Inferior: Valor e Status de Pagamento */}
      <div className="flex items-center justify-between pt-2 border-t border-white/5">
        <span className="text-base font-extrabold text-white tabular-numbers">
          {formatCurrencyBRL(order.total_value)}
        </span>

        <div className="flex items-center gap-2">
          {isFullyPaid ? (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              Pago
            </span>
          ) : isPartiallyPaid ? (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
              50% Pago
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/5 text-[var(--text-dim)] border border-white/10">
              Pendente
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
