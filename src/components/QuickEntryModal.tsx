'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Check } from 'lucide-react';

interface QuickEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultDate?: string;
}

export const transactionSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE']),
  amountValue: z.number().positive('Informe um valor maior que zero.'),
  date: z.string().min(1, 'Selecione a data.'),
  description: z.string().trim().min(1, 'Preencha a descrição do pedido ou insumo.'),
  isPartial: z.boolean(),
  partialNote: z.string().optional(),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

function getTodayLocal(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Formata centavos para a máscara em reais (ex: 5000 -> 50,00)
const formatCentsToBRL = (cents: number): string => {
  return (cents / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

function QuickEntryModalContent({
  onClose,
  onSuccess,
  defaultDate,
}: Omit<QuickEntryModalProps, 'isOpen'>) {
  const [amountDisplay, setAmountDisplay] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const amountInputRef = useRef<HTMLInputElement | null>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: 'INCOME',
      amountValue: 0,
      date: defaultDate || getTodayLocal(),
      description: '',
      isPartial: false,
      partialNote: '50% pago',
    },
  });

  const type = useWatch({ control, name: 'type' });
  const isPartial = useWatch({ control, name: 'isPartial' });

  useEffect(() => {
    const timer = setTimeout(() => {
      amountInputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleAmountChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    onChange: (val: number) => void
  ) => {
    // Aceita ESTRITAMENTE números (remove qualquer letra ou caractere especial)
    const rawDigits = e.target.value.replace(/\D/g, '');

    if (!rawDigits) {
      setAmountDisplay('');
      onChange(0);
      return;
    }

    const cents = parseInt(rawDigits, 10);
    if (cents > 999999999) return; // Limite de R$ 9.999.999,99

    setAmountDisplay(formatCentsToBRL(cents));
    onChange(cents / 100);
  };

  const onSubmit = async (data: TransactionFormData) => {
    setLoading(true);
    setApiError('');

    try {
      const isPartialActive = data.type === 'INCOME' && data.isPartial;
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: data.type,
          amount: data.amountValue,
          date: data.date,
          description: data.description.trim(),
          is_partial: isPartialActive,
          partial_note: isPartialActive ? (data.partialNote?.trim() || '50% pago') : null,
        }),
      });

      if (!res.ok) {
        const resData = await res.json();
        throw new Error(resData.error || 'Erro ao salvar lançamento');
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro de conexão.';
      setApiError(msg);
    } finally {
      setLoading(false);
    }
  };

  const firstError = Object.values(errors)[0]?.message || apiError;

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

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-5 space-y-4">
          {/* Switch de Tipo */}
          <div className="grid grid-cols-2 p-1 bg-white/5 rounded-xl border border-white/10">
            <button
              type="button"
              onClick={() => setValue('type', 'INCOME', { shouldValidate: true })}
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
              onClick={() => setValue('type', 'EXPENSE', { shouldValidate: true })}
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
              <Controller
                name="amountValue"
                control={control}
                render={({ field }) => (
                  <input
                    ref={(el) => {
                      field.ref(el);
                      amountInputRef.current = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    value={amountDisplay}
                    onChange={(e) => handleAmountChange(e, field.onChange)}
                    placeholder="0,00"
                    className="w-56 text-left text-4xl font-extrabold bg-transparent text-white placeholder-white/20 focus:outline-none tabular-numbers"
                  />
                )}
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
              {...register('date')}
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
              {...register('description')}
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
                  {...register('isPartial')}
                  className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
                />
              </label>

              {isPartial && (
                <div className="mt-2">
                  <input
                    type="text"
                    {...register('partialNote')}
                    placeholder="Ex: 50% pago, 1/2 restante na entrega"
                    className="w-full px-3 py-1.5 text-xs rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 placeholder-amber-400/40 focus:outline-none"
                  />
                </div>
              )}
            </div>
          )}

          {firstError && (
            <div className="p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium">
              {firstError}
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

export function QuickEntryModal({
  isOpen,
  onClose,
  onSuccess,
  defaultDate,
}: QuickEntryModalProps) {
  if (!isOpen) return null;
  return (
    <QuickEntryModalContent
      onClose={onClose}
      onSuccess={onSuccess}
      defaultDate={defaultDate}
    />
  );
}
