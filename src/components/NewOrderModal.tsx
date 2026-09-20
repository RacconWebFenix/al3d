'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { formatCurrencyBRL } from '@/lib/formatters';

interface NewOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const orderSchema = z.object({
  clientName: z.string().trim().min(1, 'Informe o nome do cliente.'),
  description: z.string().trim().min(1, 'Informe a descrição do item ou modelo 3D.'),
  stage: z.enum(['COTACAO', 'MODELANDO', 'IMPRIMINDO', 'PAGAMENTO', 'ENTREGUE']),
  deliveryDate: z.string().min(1, 'Defina o prazo de entrega.'),
  amountValue: z.number().positive('Informe o valor total do pedido.'),
  isPartialPaid: z.boolean(),
});

type OrderFormData = z.infer<typeof orderSchema>;
export type OrderStage = OrderFormData['stage'];

const STAGES: { key: OrderStage; label: string; activeClass: string }[] = [
  { key: 'COTACAO', label: 'Cotação', activeClass: 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30' },
  { key: 'MODELANDO', label: 'Modelando', activeClass: 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' },
  { key: 'IMPRIMINDO', label: 'Imprimindo', activeClass: 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/40 font-bold' },
  { key: 'PAGAMENTO', label: 'Pagamento', activeClass: 'bg-purple-500 text-white shadow-lg shadow-purple-500/30' },
  { key: 'ENTREGUE', label: 'Entregue', activeClass: 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30' },
];

function getDefaultDeliveryDate(): string {
  const target = new Date();
  target.setDate(target.getDate() + 5);
  const y = target.getFullYear();
  const m = String(target.getMonth() + 1).padStart(2, '0');
  const d = String(target.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Formatar centavos para BRL
const formatCentsToBRL = (cents: number): string => {
  return (cents / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

function NewOrderModalContent({ onClose, onSuccess }: Omit<NewOrderModalProps, 'isOpen'>) {
  const [amountDisplay, setAmountDisplay] = useState('400,00');
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const clientInputRef = useRef<HTMLInputElement | null>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      clientName: '',
      description: '',
      stage: 'COTACAO',
      deliveryDate: getDefaultDeliveryDate(),
      amountValue: 400.0,
      isPartialPaid: true,
    },
  });

  const stage = useWatch({ control, name: 'stage' });
  const amountValue = useWatch({ control, name: 'amountValue' });

  const { ref: clientRegisterRef, ...clientRegisterRest } = register('clientName');

  useEffect(() => {
    const timer = setTimeout(() => {
      clientInputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleAmountChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    onChange: (val: number) => void
  ) => {
    const rawDigits = e.target.value.replace(/\D/g, '');
    if (!rawDigits) {
      setAmountDisplay('');
      onChange(0);
      return;
    }
    const cents = parseInt(rawDigits, 10);
    if (cents > 999999999) return;

    setAmountDisplay(formatCentsToBRL(cents));
    onChange(cents / 100);
  };

  const halfValue = amountValue > 0 ? amountValue / 2 : 0;

  const onSubmit = async (data: OrderFormData) => {
    setLoading(true);
    setApiError('');

    try {
      const currentHalfValue = data.amountValue > 0 ? data.amountValue / 2 : 0;
      const paidAmount = data.isPartialPaid
        ? currentHalfValue
        : (data.stage === 'ENTREGUE' || data.stage === 'PAGAMENTO' ? data.amountValue : 0);

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_name: data.clientName.trim(),
          description: data.description.trim(),
          stage: data.stage,
          total_value: data.amountValue,
          paid_amount: paidAmount,
          is_partial_paid: data.isPartialPaid,
          delivery_date: data.deliveryDate,
        }),
      });

      if (!res.ok) {
        const resData = await res.json();
        throw new Error(resData.error || 'Erro ao criar pedido');
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar o pedido.';
      setApiError(msg);
    } finally {
      setLoading(false);
    }
  };

  const firstError = Object.values(errors)[0]?.message || apiError;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#121826] border border-white/10 rounded-2xl p-6 shadow-2xl modal-content-animation text-left">
        {/* Topo do Modal */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <h3 className="text-xl font-bold text-white tracking-tight">
            Novo Pedido de Impressão 3D
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-dim)] hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-5 space-y-4">
          {/* Nome do Cliente */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">
              Nome do cliente
            </label>
            <input
              {...clientRegisterRest}
              ref={(el) => {
                clientRegisterRef(el);
                clientInputRef.current = el;
              }}
              type="text"
              placeholder="Ex: Marcos Banespinha"
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-[var(--text-dim)] focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          {/* Item e Descrição 3D */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">
              Item e 3D model descrição
            </label>
            <textarea
              rows={3}
              {...register('description')}
              placeholder="Ex: 3 Troféus Banespinha em PLA Silk Ouro + Preto"
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-[var(--text-dim)] focus:outline-none focus:border-emerald-500/50 resize-none"
            />
          </div>

          {/* Stage Selector (5 Etapas em Pills) */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] mb-2">
              Stage selector
            </label>
            <div className="grid grid-cols-5 gap-1.5 p-1 bg-white/5 rounded-xl border border-white/10">
              {STAGES.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setValue('stage', s.key, { shouldValidate: true })}
                  className={`py-2 px-1 text-xs rounded-lg transition-all text-center truncate ${
                    stage === s.key
                      ? s.activeClass
                      : 'text-[var(--text-dim)] hover:text-white hover:bg-white/5'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Duas Colunas: Data de Entrega / Prazo & Valor Total */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* Data de Entrega */}
            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">
                Data de Entrega / Prazo
              </label>
              <div className="relative">
                <input
                  type="date"
                  {...register('deliveryDate')}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500/50"
                />
              </div>
            </div>

            {/* Valor Total com Máscara BRL */}
            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">
                Valor Total (R$)
              </label>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 focus-within:border-emerald-500/50">
                <span className="text-xl font-bold text-[var(--text-dim)]">R$</span>
                <Controller
                  name="amountValue"
                  control={control}
                  render={({ field }) => (
                    <input
                      ref={field.ref}
                      type="text"
                      inputMode="numeric"
                      value={amountDisplay}
                      onChange={(e) => handleAmountChange(e, field.onChange)}
                      placeholder="0,00"
                      className="w-full text-xl font-black text-white bg-transparent focus:outline-none tabular-numbers"
                    />
                  )}
                />
              </div>
            </div>
          </div>

          {/* Opção de Sinal / Pagamento Parcial */}
          <div className="pt-2">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                {...register('isPartialPaid')}
                className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
              />
              <span className="text-xs text-[var(--text-muted)] flex items-center gap-1.5">
                <span>Sinal / Pagamento 50% antecipado</span>
                {amountValue > 0 && (
                  <span className="text-amber-300 font-semibold">
                    ({formatCurrencyBRL(halfValue)} pago via Pix)
                  </span>
                )}
              </span>
            </label>
          </div>

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
              className="px-5 py-2.5 rounded-xl border border-white/10 text-[var(--text-muted)] hover:text-white hover:bg-white/5 text-sm font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/30 transition-all hover:scale-[1.02] active:scale-98 disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Salvar Pedido'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function NewOrderModal({ isOpen, onClose, onSuccess }: NewOrderModalProps) {
  if (!isOpen) return null;
  return <NewOrderModalContent onClose={onClose} onSuccess={onSuccess} />;
}
