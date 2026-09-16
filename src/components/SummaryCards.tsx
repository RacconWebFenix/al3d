'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

interface SummaryCardsProps {
  totalIncome: number;
  totalExpense: number;
  netTotal: number;
}

export function SummaryCards({ totalIncome, totalExpense, netTotal }: SummaryCardsProps) {
  const isProfitable = netTotal >= 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
      {/* Entradas */}
      <div className="glass-card p-5 transition-all hover:border-emerald-500/30">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            Entradas
          </span>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-extrabold text-emerald-400 tabular-numbers">
          {formatCurrency(totalIncome)}
        </div>
        <p className="text-xs text-[var(--text-dim)] mt-1">Faturamento bruto do mês</p>
      </div>

      {/* Saídas */}
      <div className="glass-card p-5 transition-all hover:border-rose-500/30">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            Saídas
          </span>
          <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400">
            <TrendingDown className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-extrabold text-rose-400 tabular-numbers">
          {formatCurrency(totalExpense)}
        </div>
        <p className="text-xs text-[var(--text-dim)] mt-1">Insumos, matéria-prima e custos</p>
      </div>

      {/* Saldo Líquido */}
      <div className={`p-5 transition-all ${isProfitable ? 'glass-card-glow-green' : 'glass-card-glow-red'}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            Saldo Líquido
          </span>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isProfitable ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
            <Wallet className="w-4 h-4" />
          </div>
        </div>
        <div className={`text-3xl font-black tabular-numbers ${isProfitable ? 'text-emerald-300' : 'text-rose-400'}`}>
          {formatCurrency(netTotal)}
        </div>
        <p className="text-xs text-[var(--text-dim)] mt-1 font-medium">
          {isProfitable ? '✓ Lucro livre no caixa' : '⚠ Saldo negativo no período'}
        </p>
      </div>
    </div>
  );
}
