'use client';

import React, { useState } from 'react';
import { Calendar, Trash2, AlertTriangle, GripVertical, Eye } from 'lucide-react';
import { formatCurrencyBRL } from '@/lib/formatters';
import { getDeadlineInfo, getOrderPaymentBadge } from '@/lib/orderDisplay';

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
  onView: (order: Order) => void;
}

export function OrderCard({ order, onDelete, onView }: OrderCardProps) {
  const [isDragging, setIsDragging] = useState(false);

  const deadline = getDeadlineInfo(order.delivery_date);
  const paymentBadge = getOrderPaymentBadge(order);

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
      className={`group relative bg-[var(--surface-panel)]/90 border rounded-2xl p-4 shadow-xl backdrop-blur-md transition-all cursor-grab active:cursor-grabbing select-none ${
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

        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Ver e editar pedido"
            onClick={(e) => {
              e.stopPropagation();
              onView(order);
            }}
            className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 text-[var(--text-dim)] hover:text-[var(--emerald-main)] hover:bg-[var(--emerald-bg)] p-1.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] transition-all"
            title="Ver e editar pedido"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(order.id);
            }}
            className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 text-[var(--text-dim)] hover:text-rose-400 p-1.5 rounded-lg hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--coral-glow)] transition-all"
            title="Excluir pedido"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Descrição do Pedido / Peça 3D */}
      <p className="text-sm text-[var(--text-muted)] line-clamp-2 mb-3 leading-relaxed pl-5">
        {order.description}
      </p>

      {/* Badge de Prazo de Entrega */}
      <div className="mb-3.5 pl-5">
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${deadline.badgeClasses}`}
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
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${paymentBadge.badgeClasses}`}>
            {paymentBadge.label}
          </span>
        </div>
      </div>
    </div>
  );
}
