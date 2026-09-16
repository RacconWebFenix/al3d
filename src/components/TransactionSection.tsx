'use client';

import React, { useState } from 'react';
import { Trash2, Tag, Calendar, AlertCircle } from 'lucide-react';
import { formatCurrency, formatDateShort } from '@/lib/formatters';

export interface Transaction {
  id: number;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  date: string;
  description: string;
  is_partial: boolean;
  partial_note?: string;
  total_value?: number;
}

interface TransactionSectionProps {
  transactions: Transaction[];
  onDelete: (id: number) => void;
}

export function TransactionSection({ transactions, onDelete }: TransactionSectionProps) {
  const [mobileTab, setMobileTab] = useState<'INCOME' | 'EXPENSE'>('INCOME');

  const incomes = transactions.filter((t) => t.type === 'INCOME');
  const expenses = transactions.filter((t) => t.type === 'EXPENSE');

  return (
    <div className="mt-4">
      {/* Mobile Tab Switcher */}
      <div className="flex md:hidden bg-[var(--bg-card)] p-1 rounded-xl border border-[var(--border-subtle)] mb-4">
        <button
          onClick={() => setMobileTab('INCOME')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            mobileTab === 'INCOME'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'text-[var(--text-muted)] hover:text-white'
          }`}
        >
          Entradas ({incomes.length})
        </button>
        <button
          onClick={() => setMobileTab('EXPENSE')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            mobileTab === 'EXPENSE'
              ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
              : 'text-[var(--text-muted)] hover:text-white'
          }`}
        >
          Saídas ({expenses.length})
        </button>
      </div>

      {/* Grid: 2 Colunas em Desktop / Tab no Mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Coluna Entradas */}
        <div className={`space-y-3 ${mobileTab === 'EXPENSE' ? 'hidden md:block' : 'block'}`}>
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
            <h2 className="text-base font-bold text-emerald-400 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              Entradas
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                {incomes.length}
              </span>
            </h2>
          </div>

          {incomes.length === 0 ? (
            <div className="glass-card p-8 text-center text-[var(--text-dim)]">
              Nenhuma entrada registrada neste mês.
            </div>
          ) : (
            <div className="space-y-2">
              {incomes.map((item) => (
                <div
                  key={item.id}
                  className="glass-card p-3.5 flex items-center justify-between group hover:border-emerald-500/40 hover:bg-[var(--bg-card-hover)] transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="shrink-0 px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-semibold text-[var(--text-muted)]">
                      {formatDateShort(item.date)}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {item.description}
                      </p>
                      {item.is_partial && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            <AlertCircle className="w-3 h-3" />
                            {item.partial_note || '50% pago'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    <span className="text-sm font-bold text-emerald-400 tabular-numbers">
                      + {formatCurrency(item.amount)}
                    </span>
                    <button
                      onClick={() => onDelete(item.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-[var(--text-dim)] hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                      title="Excluir lançamento"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Coluna Saídas */}
        <div className={`space-y-3 ${mobileTab === 'INCOME' ? 'hidden md:block' : 'block'}`}>
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
            <h2 className="text-base font-bold text-rose-400 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
              Saídas
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300">
                {expenses.length}
              </span>
            </h2>
          </div>

          {expenses.length === 0 ? (
            <div className="glass-card p-8 text-center text-[var(--text-dim)]">
              Nenhuma saída registrada neste mês.
            </div>
          ) : (
            <div className="space-y-2">
              {expenses.map((item) => (
                <div
                  key={item.id}
                  className="glass-card p-3.5 flex items-center justify-between group hover:border-rose-500/40 hover:bg-[var(--bg-card-hover)] transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="shrink-0 px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-semibold text-[var(--text-muted)]">
                      {formatDateShort(item.date)}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {item.description}
                      </p>
                      <span className="text-[11px] text-[var(--text-dim)]">Custo / Insumo</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    <span className="text-sm font-bold text-rose-400 tabular-numbers">
                      - {formatCurrency(item.amount)}
                    </span>
                    <button
                      onClick={() => onDelete(item.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-[var(--text-dim)] hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                      title="Excluir lançamento"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
