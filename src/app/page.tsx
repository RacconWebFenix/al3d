'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/Header';
import { SummaryCards } from '@/components/SummaryCards';
import { TransactionSection, Transaction } from '@/components/TransactionSection';
import { QuickEntryModal } from '@/components/QuickEntryModal';
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal';
import { Loader2, Plus, Sparkles } from 'lucide-react';

export default function Home() {
  // Inicializa automaticamente com o mês e ano atuais
  const [currentMonth, setCurrentMonth] = useState<number>(() => new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState<number>(() => new Date().getFullYear());

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0, netTotal: 0 });
  const [loading, setLoading] = useState<boolean>(true);

  // Modais
  const [isNewModalOpen, setIsNewModalOpen] = useState<boolean>(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);

  // Buscar dados da API
  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/transactions?month=${currentMonth}&year=${currentYear}`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
        setSummary(data.summary || { totalIncome: 0, totalExpense: 0, netTotal: 0 });
      }
    } catch (err) {
      console.error('Falha ao buscar transações:', err);
    } finally {
      setLoading(false);
    }
  }, [currentMonth, currentYear]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Atalho global de teclado: pressionar 'N' abre novo lançamento (se nenhum modal estiver aberto)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === 'n' || e.key === 'N') {
        setIsNewModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Navegação de Mês
  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear((prev) => prev - 1);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear((prev) => prev + 1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
  };

  // Exclusão
  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/transactions?id=${deleteTargetId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setDeleteTargetId(null);
        fetchTransactions();
      }
    } catch (err) {
      console.error('Erro ao deletar:', err);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <main className="min-h-screen px-4 sm:px-8 max-w-5xl mx-auto pb-24">
      {/* Top Header */}
      <Header
        currentMonth={currentMonth}
        currentYear={currentYear}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onOpenNewTransaction={() => setIsNewModalOpen(true)}
      />

      {/* Cards de Resumo */}
      <SummaryCards
        totalIncome={summary.totalIncome}
        totalExpense={summary.totalExpense}
        netTotal={summary.netTotal}
      />

      {/* Barra de Status e Dica Rápida */}
      <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5 text-xs text-[var(--text-dim)] mb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>Lançamentos rápidos da <strong>AL3D</strong> gravados no PostgreSQL</span>
        </div>
        <div className="hidden sm:block">
          Dica: pressione a tecla <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-[10px]">N</kbd> para novo lançamento
        </div>
      </div>

      {/* Feed de Transações */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-[var(--text-dim)]">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mb-2" />
          <p className="text-sm">Carregando lançamentos...</p>
        </div>
      ) : (
        <TransactionSection
          transactions={transactions}
          onDelete={(id) => setDeleteTargetId(id)}
        />
      )}

      {/* Botão Flutuante Mobile (FAB) */}
      <div className="md:hidden fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsNewModalOpen(true)}
          className="w-14 h-14 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center shadow-xl shadow-emerald-500/40 active:scale-95 transition-transform"
          title="Novo Lançamento"
        >
          <Plus className="w-6 h-6 stroke-[3]" />
        </button>
      </div>

      {/* Modais */}
      <QuickEntryModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onSuccess={fetchTransactions}
        defaultDate={(() => {
          const now = new Date();
          const isCurrentPeriod =
            currentMonth === now.getMonth() + 1 &&
            currentYear === now.getFullYear();
          if (isCurrentPeriod) {
            const y = now.getFullYear();
            const m = String(now.getMonth() + 1).padStart(2, '0');
            const d = String(now.getDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
          }
          return `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
        })()}
      />

      <DeleteConfirmModal
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleConfirmDelete}
        loading={deleteLoading}
      />
    </main>
  );
}
