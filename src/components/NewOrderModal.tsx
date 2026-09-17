'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar, Check, Sparkles } from 'lucide-react';
import { formatCurrencyBRL } from '@/lib/formatters';

interface NewOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export type OrderStage = 'COTACAO' | 'MODELANDO' | 'IMPRIMINDO' | 'PAGAMENTO' | 'ENTREGUE';

const STAGES: { key: OrderStage; label: string; activeClass: string }[] = [
  { key: 'COTACAO', label: 'Cotação', activeClass: 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30' },
  { key: 'MODELANDO', label: 'Modelando', activeClass: 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' },
  { key: 'IMPRIMINDO', label: 'Imprimindo', activeClass: 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/40 font-bold' },
  { key: 'PAGAMENTO', label: 'Pagamento', activeClass: 'bg-purple-500 text-white shadow-lg shadow-purple-500/30' },
  { key: 'ENTREGUE', label: 'Entregue', activeClass: 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30' },
];

export function NewOrderModal({ isOpen, onClose, onSuccess }: NewOrderModalProps) {
  const [clientName, setClientName] = useState('');
  const [description, setDescription] = useState('');
  const [stage, setStage] = useState<OrderStage>('IMPRIMINDO');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [amountDisplay, setAmountDisplay] = useState('');
  const [amountValue, setAmountValue] = useState<number>(0);
  const [isPartialPaid, setIsPartialPaid] = useState<boolean>(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const clientInputRef = useRef<HTMLInputElement>(null);

  // Formatar centavos para BRL
  const formatCentsToBRL = (cents: number): string => {
    return (cents / 100).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawDigits = e.target.value.replace(/\D/g, '');
    if (!rawDigits) {
      setAmountDisplay('');
      setAmountValue(0);
      return;
    }
    const cents = parseInt(rawDigits, 10);
    if (cents > 999999999) return;

    setAmountDisplay(formatCentsToBRL(cents));
    setAmountValue(cents / 100);
  };

  useEffect(() => {
    if (isOpen) {
      // Data padrão: hoje + 5 dias para prazo de entrega
      const target = new Date();
      target.setDate(target.getDate() + 5);
      const y = target.getFullYear();
      const m = String(target.getMonth() + 1).padStart(2, '0');
      const d = String(target.getDate()).padStart(2, '0');

      setClientName('');
      setDescription('');
      setStage('IMPRIMINDO');
      setDeliveryDate(`${y}-${m}-${d}`);
      setAmountDisplay('400,00');
      setAmountValue(400.0);
      setIsPartialPaid(true);
      setError('');

      setTimeout(() => {
        clientInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const halfValue = amountValue > 0 ? amountValue / 2 : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientName.trim()) {
      setError('Informe o nome do cliente.');
      return;
    }
    if (!description.trim()) {
      setError('Informe a descrição do item ou modelo 3D.');
      return;
    }
    if (amountValue <= 0) {
      setError('Informe o valor total do pedido.');
      return;
    }
    if (!deliveryDate) {
      setError('Defina o prazo de entrega.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const paidAmount = isPartialPaid ? halfValue : (stage === 'ENTREGUE' || stage === 'PAGAMENTO' ? amountValue : 0);

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_name: clientName.trim(),
          description: description.trim(),
          stage,
          total_value: amountValue,
          paid_amount: paidAmount,
          is_partial_paid: isPartialPaid,
          delivery_date: deliveryDate,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao criar pedido');
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar o pedido.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

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

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Nome do Cliente */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">
              Nome do cliente
            </label>
            <input
              ref={clientInputRef}
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
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
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
                  onClick={() => setStage(s.key)}
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
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
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
                <input
                  type="text"
                  inputMode="numeric"
                  value={amountDisplay}
                  onChange={handleAmountChange}
                  placeholder="0,00"
                  className="w-full text-xl font-black text-white bg-transparent focus:outline-none tabular-numbers"
                />
              </div>
            </div>
          </div>

          {/* Opção de Sinal / Pagamento Parcial */}
          <div className="pt-2">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isPartialPaid}
                onChange={(e) => setIsPartialPaid(e.target.checked)}
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
