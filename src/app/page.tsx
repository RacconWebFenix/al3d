'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Header, AppTab } from '@/components/Header';
import { SummaryCards } from '@/components/SummaryCards';
import { TransactionSection, Transaction } from '@/components/TransactionSection';
import { QuickEntryModal } from '@/components/QuickEntryModal';
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal';
import { OrdersKanban } from '@/components/OrdersKanban';
import { NewOrderModal } from '@/components/NewOrderModal';
import { Order } from '@/components/OrderCard';
import { Loader2, Plus, Sparkles } from 'lucide-react';
import { formatCurrencyBRL } from '@/lib/formatters';

export default function Home() {
  // Aba ativa: Fluxo de Caixa ou Pedidos & Produção (Padrão: Pedidos & Produção para exibir o novo dashboard)
  const [activeTab, setActiveTab] = useState<AppTab>('ORDERS');

  // Mês e Ano do Fluxo de Caixa
  const [currentMonth, setCurrentMonth] = useState<number>(() => new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState<number>(() => new Date().getFullYear());

  // Estado das Transações
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0, netTotal: 0 });
  const [loadingTransactions, setLoadingTransactions] = useState<boolean>(true);

  // Estado dos Pedidos
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState<boolean>(true);

  // Modais
  const [isNewModalOpen, setIsNewModalOpen] = useState<boolean>(false);
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState<boolean>(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
  const [deleteOrderTargetId, setDeleteOrderTargetId] = useState<number | null>(null);
  const [deleteOrderLoading, setDeleteOrderLoading] = useState<boolean>(false);

  // Buscar Transações (Fluxo de Caixa)
  const fetchTransactions = useCallback(async () => {
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
      setLoadingTransactions(false);
    }
  }, [currentMonth, currentYear]);

  // Buscar Pedidos (Kanban)
  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error('Falha ao buscar pedidos:', err);
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadTransactions() {
      try {
        const res = await fetch(`/api/transactions?month=${currentMonth}&year=${currentYear}`);
        if (!ignore && res.ok) {
          const data = await res.json();
          setTransactions(data.transactions || []);
          setSummary(data.summary || { totalIncome: 0, totalExpense: 0, netTotal: 0 });
        }
      } catch (err) {
        console.error('Falha ao buscar transações:', err);
      } finally {
        if (!ignore) {
          setLoadingTransactions(false);
        }
      }
    }

    async function loadOrders() {
      try {
        const res = await fetch('/api/orders');
        if (!ignore && res.ok) {
          const data = await res.json();
          setOrders(data.orders || []);
        }
      } catch (err) {
        console.error('Falha ao buscar pedidos:', err);
      } finally {
        if (!ignore) {
          setLoadingOrders(false);
        }
      }
    }

    loadTransactions();
    loadOrders();

    return () => {
      ignore = true;
    };
  }, [currentMonth, currentYear]);

  // Atalho global de teclado: pressionar 'N' abre o modal da aba ativa
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === 'n' || e.key === 'N') {
        if (activeTab === 'CASHFLOW') {
          setIsNewModalOpen(true);
        } else {
          setIsNewOrderModalOpen(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab]);

  // Navegação de Mês no Fluxo de Caixa
  const handlePrevMonth = () => {
    setLoadingTransactions(true);
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear((prev) => prev - 1);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    setLoadingTransactions(true);
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear((prev) => prev + 1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
  };

  // Exclusão de Transação
  const handleConfirmDeleteTransaction = async () => {
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
      console.error('Erro ao deletar transação:', err);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Mover etapa do pedido via Drag and Drop
  const handleMoveOrderToStage = async (orderId: number, targetStage: Order['stage']) => {
    // Atualização otimista imediata na interface
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, stage: targetStage } : o))
    );

    try {
      await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, stage: targetStage }),
      });
      fetchOrders();
    } catch (err: unknown) {
      console.error('Erro ao mover pedido de etapa:', err);
      fetchOrders();
    }
  };

  const handleDeleteOrder = (id: number) => {
    setDeleteOrderTargetId(id);
  };

  const handleConfirmDeleteOrder = async () => {
    if (!deleteOrderTargetId) return;
    setDeleteOrderLoading(true);
    try {
      const res = await fetch(`/api/orders?id=${deleteOrderTargetId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setDeleteOrderTargetId(null);
        fetchOrders();
      }
    } catch (err: unknown) {
      console.error('Erro ao excluir pedido:', err);
    } finally {
      setDeleteOrderLoading(false);
    }
  };

  const deletingTransaction = transactions.find((t) => t.id === deleteTargetId);
  const deletingOrder = orders.find((o) => o.id === deleteOrderTargetId);

  return (
    <main className="min-h-screen px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-24">
      {/* Header Geral com Abas de Navegação */}
      <Header
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        currentMonth={currentMonth}
        currentYear={currentYear}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onOpenNewTransaction={() => setIsNewModalOpen(true)}
        onOpenNewOrder={() => setIsNewOrderModalOpen(true)}
      />

      {/* Visão 1: Pedidos & Produção (Kanban Pipeline) */}
      {activeTab === 'ORDERS' && (
        <div className="mt-4">
          <OrdersKanban
            orders={orders}
            loading={loadingOrders}
            onOpenNewOrder={() => setIsNewOrderModalOpen(true)}
            onRefresh={fetchOrders}
            onMoveOrderToStage={handleMoveOrderToStage}
            onDeleteOrder={handleDeleteOrder}
          />
        </div>
      )}

      {/* Visão 2: Fluxo de Caixa Mensal */}
      {activeTab === 'CASHFLOW' && (
        <div className="space-y-6 mt-4">
          {/* Cards de Resumo */}
          <SummaryCards
            totalIncome={summary.totalIncome}
            totalExpense={summary.totalExpense}
            netTotal={summary.netTotal}
          />

          {/* Dica de atalho */}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5 text-xs text-[var(--text-dim)]">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Lançamentos financeiros da <strong>AL3D</strong> gravados no PostgreSQL</span>
            </div>
            <div className="hidden sm:block">
              Dica: pressione a tecla <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-[10px]">N</kbd> para novo lançamento
            </div>
          </div>

          {/* Feed de Transações */}
          {loadingTransactions ? (
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
        </div>
      )}

      {/* Botão Flutuante Mobile (FAB) - Apenas para Fluxo de Caixa (em Pedidos já existe o botão dedicado) */}
      {activeTab === 'CASHFLOW' && (
        <div className="md:hidden fixed bottom-6 right-6 z-40">
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="w-14 h-14 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center shadow-xl shadow-emerald-500/40 active:scale-95 transition-transform"
            title="Novo Lançamento"
          >
            <Plus className="w-6 h-6 stroke-[3]" />
          </button>
        </div>
      )}

      {/* Modal de Novo Lançamento (Fluxo de Caixa) */}
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

      {/* Modal de Novo Pedido (Pipeline de Produção) */}
      <NewOrderModal
        isOpen={isNewOrderModalOpen}
        onClose={() => setIsNewOrderModalOpen(false)}
        onSuccess={fetchOrders}
      />

      {/* Modal de Confirmação de Exclusão (Fluxo de Caixa) */}
      <DeleteConfirmModal
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleConfirmDeleteTransaction}
        loading={deleteLoading}
        title="Confirmar Exclusão"
        description="Tem certeza que deseja excluir este lançamento do fluxo de caixa? Essa ação não pode ser desfeita."
        itemName={deletingTransaction?.description}
        itemSubtitle={
          deletingTransaction
            ? deletingTransaction.type === 'INCOME'
              ? 'Entrada'
              : 'Saída'
            : undefined
        }
        itemValue={deletingTransaction ? formatCurrencyBRL(deletingTransaction.amount) : undefined}
      />

      {/* Modal de Confirmação de Exclusão (Pipeline de Pedidos) */}
      <DeleteConfirmModal
        isOpen={deleteOrderTargetId !== null}
        onClose={() => setDeleteOrderTargetId(null)}
        onConfirm={handleConfirmDeleteOrder}
        loading={deleteOrderLoading}
        title="Confirmar Exclusão"
        description="Tem certeza que deseja remover este pedido do pipeline? Essa ação não pode ser desfeita."
        itemName={deletingOrder?.client_name}
        itemSubtitle={deletingOrder?.description}
        itemValue={deletingOrder ? formatCurrencyBRL(deletingOrder.total_value) : undefined}
      />
    </main>
  );
}
