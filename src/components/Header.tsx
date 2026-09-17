'use client';

import React from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Box, 
  Wallet, 
  FileText, 
  Bell, 
  User,
  ChevronDown
} from 'lucide-react';
import { MONTH_NAMES } from '@/lib/formatters';

export type AppTab = 'CASHFLOW' | 'ORDERS';

interface HeaderProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  currentMonth: number; // 1-12
  currentYear: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onOpenNewTransaction: () => void;
  onOpenNewOrder: () => void;
}

export function Header({
  activeTab,
  onTabChange,
  currentMonth,
  currentYear,
  onPrevMonth,
  onNextMonth,
  onOpenNewTransaction,
  onOpenNewOrder,
}: HeaderProps) {
  const monthName = MONTH_NAMES[currentMonth - 1] || '';

  return (
    <header className="space-y-4 py-4 border-b border-[var(--border-subtle)]">
      {/* Barra Superior Principal (Fiel ao Mockup) */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Logo / Brand */}
        <div className="flex items-center justify-between w-full md:w-auto gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <Box className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
                AL3D
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                  3D Maker
                </span>
              </h1>
            </div>
          </div>

          {/* CTA Rápido Mobile */}
          <button
            onClick={activeTab === 'CASHFLOW' ? onOpenNewTransaction : onOpenNewOrder}
            className="md:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>{activeTab === 'CASHFLOW' ? 'Lançamento' : 'Pedido'}</span>
          </button>
        </div>

        {/* Abas Centrais de Navegação (Pills Idênticas ao Mockup) */}
        <nav className="flex items-center p-1 bg-white/5 border border-white/10 rounded-2xl">
          <button
            onClick={() => onTabChange('CASHFLOW')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'CASHFLOW'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm shadow-emerald-500/20'
                : 'text-[var(--text-muted)] hover:text-white'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>Fluxo de Caixa</span>
          </button>

          <button
            onClick={() => onTabChange('ORDERS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'ORDERS'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm shadow-emerald-500/20'
                : 'text-[var(--text-muted)] hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Pedidos & Produção</span>
          </button>
        </nav>

        {/* Lado Direito: Notificações e Perfil (Fiel ao Mockup) */}
        <div className="hidden md:flex items-center gap-3">
          <button 
            className="p-2 rounded-xl text-[var(--text-dim)] hover:text-white hover:bg-white/5 transition-colors"
            title="Notificações"
          >
            <Bell className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-medium text-white">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>AL3D 3D Maker</span>
            <ChevronDown className="w-3.5 h-3.5 text-[var(--text-dim)]" />
          </div>
        </div>
      </div>

      {/* Sub-barra específica para a aba de Fluxo de Caixa */}
      {activeTab === 'CASHFLOW' && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          {/* Navegador de Mês */}
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

          {/* Botão Novo Lançamento */}
          <button
            onClick={onOpenNewTransaction}
            className="hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.02] active:scale-98"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Novo Lançamento</span>
          </button>
        </div>
      )}
    </header>
  );
}
