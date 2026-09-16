'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Check } from 'lucide-react';

interface QuickEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultDate?: string;
}

export function QuickEntryModal({
  isOpen,
  onClose,
  onSuccess,
  defaultDate,
}: QuickEntryModalProps) {
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>('INCOME');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [isPartial, setIsPartial] = useState(false);
  const [partialNote, setPartialNote] = useState('50% pago');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const amountInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const today = new Date().toISOString().split('T')[0];
      setDate(defaultDate || today);
      setAmount('');
      setDescription('');
      setIsPartial(false);
      setError('');
      setTimeout(() => {
        amountInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, defaultDate]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description || !date) {
      setError('Preencha o valor, data e descrição.');
      return;
    }

    const cleanAmount = amount.replace(',', '.');
    const numAmount = parseFloat(cleanAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Informe um valor numérico válido maior que zero.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          amount: numAmount,
          date,
          description,
          is_partial: isPartial,
          partial_note: isPartial ? partialNote : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao salvar lançamento');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro de conexão.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="relative w-full max-w-md glass-card bg-[var(--bg-primary)] p-6 border border-white/10 shadow-2xl modal-content-animation">
        {/* Header do Modal */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <h3 className="text-lg font-bold text-white">Novo Lançamento</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-dim)] hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Switch de Tipo */}
          <div className="grid grid-cols-2 p-1 bg-white/5 rounded-xl border border-white/10">
            <button
              type="button"
              onClick={() => setType('INCOME')}
              className={`py-2 text-sm font-bold rounded-lg transition-all ${
                type === 'INCOME'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-[var(--text-muted)] hover:text-white'
              }`}
            >
              Entrada (+)
            </button>
            <button
              type="button"
              onClick={() => setType('EXPENSE')}
              className={`py-2 text-sm font-bold rounded-lg transition-all ${
                type === 'EXPENSE'
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                  : 'text-[var(--text-muted)] hover:text-white'
              }`}
            >
              Saída (-)
            </button>
          </div>

          {/* Campo de Valor Grande */}
          <div className="text-center py-2">
            <label className="block text-xs font-semibold text-[var(--text-dim)] uppercase tracking-wider mb-1">
              Valor (R$)
            </label>
            <div className="relative inline-block w-full">
              <input
                ref={amountInputRef}
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
                className="w-full text-center text-4xl font-extrabold bg-transparent text-white placeholder-white/20 focus:outline-none tabular-numbers"
              />
            </div>
          </div>

          {/* Data */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
              Data
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
              Descrição do Pedido / Insumo
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: 3 troféus Banespinha, 100 chaveiros..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-[var(--text-dim)] focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          {/* Toggle de Pagamento Parcial (Sinal) */}
          {type === 'INCOME' && (
            <div className="pt-2 border-t border-white/5">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-xs font-medium text-[var(--text-muted)]">
                  Pagamento Parcial (Sinal / Entrada)
                </span>
                <input
                  type="checkbox"
                  checked={isPartial}
                  onChange={(e) => setIsPartial(e.target.checked)}
                  className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
                />
              </label>

              {isPartial && (
                <div className="mt-2">
                  <input
                    type="text"
                    value={partialNote}
                    onChange={(e) => setPartialNote(e.target.value)}
                    placeholder="Ex: 50% pago, 1/2 restante na entrega"
                    className="w-full px-3 py-1.5 text-xs rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 placeholder-amber-400/40 focus:outline-none"
                  />
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Botões de Ação */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-[var(--text-muted)] hover:text-white rounded-xl hover:bg-white/5 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-5 py-2 text-sm font-bold rounded-xl transition-all shadow-lg active:scale-95 flex items-center gap-1.5 ${
                type === 'INCOME'
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/25'
                  : 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/25'
              }`}
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{loading ? 'Salvando...' : 'Salvar Lançamento'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
