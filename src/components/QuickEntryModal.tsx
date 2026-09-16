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
  const [amountDisplay, setAmountDisplay] = useState('');
  const [amountValue, setAmountValue] = useState<number>(0);
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [isPartial, setIsPartial] = useState(false);
  const [partialNote, setPartialNote] = useState('50% pago');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const amountInputRef = useRef<HTMLInputElement>(null);

  // Formata centavos para a máscara em reais (ex: 5000 -> 50,00)
  const formatCentsToBRL = (cents: number): string => {
    return (cents / 100).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Aceita ESTRITAMENTE números (remove qualquer letra ou caractere especial)
    const rawDigits = e.target.value.replace(/\D/g, '');

    if (!rawDigits) {
      setAmountDisplay('');
      setAmountValue(0);
      return;
    }

    const cents = parseInt(rawDigits, 10);
    if (cents > 999999999) return; // Limite de R$ 9.999.999,99

    setAmountDisplay(formatCentsToBRL(cents));
    setAmountValue(cents / 100);
  };

  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      const todayLocal = `${y}-${m}-${d}`;

      setDate(defaultDate || todayLocal);
      setAmountDisplay('');
      setAmountValue(0);
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
    if (amountValue <= 0) {
      setError('Informe um valor maior que zero.');
      return;
    }
    if (!description.trim()) {
      setError('Preencha a descrição do pedido ou insumo.');
      return;
    }
    if (!date) {
      setError('Selecione a data.');
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
          amount: amountValue,
          date,
          description: description.trim(),
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

          {/* Campo de Valor Grande com Máscara em Reais */}
          <div className="text-center py-2">
            <label className="block text-xs font-semibold text-[var(--text-dim)] uppercase tracking-wider mb-2">
              Valor (R$)
            </label>
            <div className="relative inline-flex items-center justify-center gap-2 w-full">
              <span className="text-2xl font-extrabold text-[var(--text-muted)]">R$</span>
              <input
                ref={amountInputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={amountDisplay}
                onChange={handleAmountChange}
                placeholder="0,00"
                className="w-56 text-left text-4xl font-extrabold bg-transparent text-white placeholder-white/20 focus:outline-none tabular-numbers"
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
