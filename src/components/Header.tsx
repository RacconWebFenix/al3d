'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, Plus, Box } from 'lucide-react';
import { MONTH_NAMES } from '@/lib/formatters';

interface HeaderProps {
  currentMonth: number; // 1-12
  currentYear: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onOpenNewTransaction: () => void;
}

export function Header({
  currentMonth,
  currentYear,
  onPrevMonth,
  onNextMonth,
  onOpenNewTransaction,
}: HeaderProps) {
  const monthName = MONTH_NAMES[currentMonth - 1] || '';

  return (
    <header className="flex flex-col md:flex-row items-center justify-between gap-4 py-6 border-b border-[var(--border-subtle)]">
      {/* Brand */}
      <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Box className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              AL3D
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                3D Maker
              </span>
            </h1>
            <p className="text-xs text-[var(--text-muted)]">Fluxo de Caixa Mensal</p>
          </div>
        </div>

        {/* Mobile-only CTA */}
        <button
          onClick={onOpenNewTransaction}
          className="md:hidden flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm shadow-md shadow-emerald-500/20 active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Novo</span>
        </button>
      </div>

      {/* Month Navigator */}
      <div className="flex items-center gap-2 bg-[var(--bg-card)] border border-[var(--border-subtle)] px-2 py-1.5 rounded-2xl">
        <button
          onClick={onPrevMonth}
          className="p-1.5 rounded-xl hover:bg-white/5 text-[var(--text-muted)] hover:text-white transition-colors"
          title="Mês anterior"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="px-3 py-1 min-w-[170px] text-center">
          <span className="text-sm font-bold tracking-wide text-white uppercase">
            {monthName} {currentYear}
          </span>
        </div>

        <button
          onClick={onNextMonth}
          className="p-1.5 rounded-xl hover:bg-white/5 text-[var(--text-muted)] hover:text-white transition-colors"
          title="Próximo mês"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Desktop Action */}
      <div className="hidden md:flex items-center gap-3">
        <button
          onClick={onOpenNewTransaction}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.02] active:scale-98"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Novo Lançamento</span>
        </button>
      </div>
    </header>
  );
}
