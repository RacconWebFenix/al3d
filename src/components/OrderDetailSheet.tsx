'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Pencil, AlertTriangle, Calendar } from 'lucide-react';
import { Order } from '@/components/OrderCard';
import { formatCurrencyBRL } from '@/lib/formatters';
import {
  getStageBadgeConfig,
  getDeadlineInfo,
  getOrderPaymentBadge,
} from '@/lib/orderDisplay';
import {
  orderPatchSchema,
  buildOrderSingleFieldPayload,
  SingleFieldEdit,
} from '@/lib/orderSchemas';

interface OrderDetailSheetProps {
  order: Order;
  onClose: () => void;
  onSuccess: () => void;
}

type EditableField = 'client' | 'description' | 'delivery_date' | 'payment' | null;

const formatCentsToBRL = (cents: number): string => {
  return (cents / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export function OrderDetailSheet({ order, onClose, onSuccess }: OrderDetailSheetProps) {
  const router = useRouter();
  const [currentOrder, setCurrentOrder] = useState<Order>(() => order);
  const [editingField, setEditingField] = useState<EditableField>(null);

  // Estados locais dos campos em edição
  const [editClientName, setEditClientName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDeliveryDate, setEditDeliveryDate] = useState('');
  const [editAmountValue, setEditAmountValue] = useState(0);
  const [amountDisplay, setAmountDisplay] = useState('');
  const [editIsPartialPaid, setEditIsPartialPaid] = useState(false);

  const [loading, setLoading] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // Fechar com a tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const startEditing = (field: EditableField) => {
    setFieldError(null);
    setApiError(null);
    setEditingField(field);

    if (field === 'client') {
      setEditClientName(currentOrder.client_name);
    } else if (field === 'description') {
      setEditDescription(currentOrder.description);
    } else if (field === 'delivery_date') {
      setEditDeliveryDate(currentOrder.delivery_date);
    } else if (field === 'payment') {
      const val = Number(currentOrder.total_value) || 0;
      setEditAmountValue(val);
      setAmountDisplay(formatCentsToBRL(Math.round(val * 100)));
      setEditIsPartialPaid(currentOrder.is_partial_paid);
    }
  };

  const cancelEditing = () => {
    setEditingField(null);
    setFieldError(null);
    setApiError(null);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawDigits = e.target.value.replace(/\D/g, '');
    if (!rawDigits) {
      setAmountDisplay('');
      setEditAmountValue(0);
      return;
    }
    const cents = parseInt(rawDigits, 10);
    if (cents > 999999999) return;

    setAmountDisplay(formatCentsToBRL(cents));
    setEditAmountValue(cents / 100);
  };

  const handleSaveField = async (field: 'client' | 'description' | 'delivery_date' | 'payment') => {
    setFieldError(null);
    setApiError(null);

    let editPayloadParam: SingleFieldEdit;

    if (field === 'client') {
      editPayloadParam = { field: 'client_name', value: editClientName };
    } else if (field === 'description') {
      editPayloadParam = { field: 'description', value: editDescription };
    } else if (field === 'delivery_date') {
      editPayloadParam = { field: 'delivery_date', value: editDeliveryDate };
    } else {
      editPayloadParam = {
        field: 'payment',
        total_value: editAmountValue,
        is_partial_paid: editIsPartialPaid,
      };
    }

    const payload = buildOrderSingleFieldPayload(currentOrder, editPayloadParam);

    // Se o valor não mudou de fato, não chama a API e volta ao modo leitura
    if (Object.keys(payload).length === 0) {
      setEditingField(null);
      return;
    }

    // Validação client-side com orderPatchSchema
    const validationResult = orderPatchSchema.safeParse({
      id: currentOrder.id,
      ...payload,
    });

    if (!validationResult.success) {
      const issue = validationResult.error.issues[0];
      setFieldError(issue?.message || 'Dados inválidos.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentOrder.id,
          ...payload,
        }),
      });

      if (res.status === 401) {
        router.replace('/login');
        return;
      }

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Erro ao atualizar pedido');
      }

      const updatedOrder = (await res.json()) as Order;
      setCurrentOrder(updatedOrder);
      setEditingField(null);
      onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar alterações.';
      setApiError(msg);
    } finally {
      setLoading(false);
    }
  };

  const stageConfig = getStageBadgeConfig(currentOrder.stage);
  const deadline = getDeadlineInfo(currentOrder.delivery_date);
  const paymentBadge = getOrderPaymentBadge(currentOrder);

  // Formatar data para exibição dd/mm/aaaa
  const formattedDeliveryDate = (() => {
    if (!currentOrder.delivery_date) return 'Sem prazo';
    const parts = currentOrder.delivery_date.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return currentOrder.delivery_date;
  })();

  const halfValue = editAmountValue > 0 ? editAmountValue / 2 : 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-detail-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg max-h-[90dvh] rounded-t-3xl sm:rounded-2xl bg-[var(--surface-panel)] border border-[var(--border-subtle)] flex flex-col shadow-2xl overflow-hidden max-sm:animate-sheet-slide-up max-sm:motion-reduce:animate-none sm:modal-content-animation"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Puxador visual mobile */}
        <div className="w-12 h-1.5 bg-[var(--border-subtle)] rounded-full mx-auto sm:hidden mt-3 mb-1 flex-shrink-0" />

        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[var(--border-subtle)] flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <h3
              id="order-detail-title"
              className="text-lg font-bold text-[var(--text-main)] truncate"
              title={currentOrder.client_name}
            >
              {currentOrder.client_name}
            </h3>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border flex-shrink-0 ${stageConfig.badgeClasses}`}
            >
              {stageConfig.label}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="p-2 rounded-xl text-[var(--text-dim)] hover:text-[var(--text-main)] hover:bg-[var(--surface-panel-alt)] transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo com scroll interno */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5 flex-1">
          {/* Campo 1: Cliente */}
          <div className="space-y-1.5 pb-4 border-b border-[var(--border-subtle)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--text-muted)]">
                Cliente
              </span>
              <button
                type="button"
                aria-label="Editar cliente"
                disabled={editingField !== null}
                onClick={() => startEditing('client')}
                className="min-w-[40px] min-h-[40px] flex items-center justify-center p-2 rounded-lg text-[var(--text-dim)] hover:text-[var(--text-main)] hover:bg-[var(--surface-panel-alt)] disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>

            {editingField === 'client' ? (
              <div className="space-y-3 pt-1">
                <input
                  type="text"
                  value={editClientName}
                  onChange={(e) => setEditClientName(e.target.value)}
                  placeholder="Nome do cliente"
                  className="w-full px-3.5 py-2 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-main)] text-sm placeholder-[var(--text-dim)] focus:outline-none focus:border-[var(--border-focus)]"
                />

                {(fieldError || apiError) && (
                  <div className="p-2.5 rounded-lg bg-[var(--coral-bg)] border border-[var(--border-error)] text-[var(--coral-main)] text-xs font-medium">
                    {fieldError || apiError}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={cancelEditing}
                    disabled={loading}
                    className="px-4 py-1.5 rounded-lg border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)] text-xs font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleSaveField('client')}
                    className="px-4 py-1.5 rounded-lg bg-[var(--emerald-main)] hover:opacity-90 text-[var(--bg-primary)] font-bold text-xs shadow-md transition-all disabled:opacity-50"
                  >
                    {loading ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm font-medium text-[var(--text-main)]">
                {currentOrder.client_name}
              </p>
            )}
          </div>

          {/* Campo 2: Descrição */}
          <div className="space-y-1.5 pb-4 border-b border-[var(--border-subtle)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--text-muted)]">
                Descrição
              </span>
              <button
                type="button"
                aria-label="Editar descrição"
                disabled={editingField !== null}
                onClick={() => startEditing('description')}
                className="min-w-[40px] min-h-[40px] flex items-center justify-center p-2 rounded-lg text-[var(--text-dim)] hover:text-[var(--text-main)] hover:bg-[var(--surface-panel-alt)] disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>

            {editingField === 'description' ? (
              <div className="space-y-3 pt-1">
                <textarea
                  rows={4}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Descrição do pedido ou modelo 3D"
                  className="w-full px-3.5 py-2 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-main)] text-sm placeholder-[var(--text-dim)] focus:outline-none focus:border-[var(--border-focus)] resize-y min-h-[88px]"
                />

                {(fieldError || apiError) && (
                  <div className="p-2.5 rounded-lg bg-[var(--coral-bg)] border border-[var(--border-error)] text-[var(--coral-main)] text-xs font-medium">
                    {fieldError || apiError}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={cancelEditing}
                    disabled={loading}
                    className="px-4 py-1.5 rounded-lg border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)] text-xs font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleSaveField('description')}
                    className="px-4 py-1.5 rounded-lg bg-[var(--emerald-main)] hover:opacity-90 text-[var(--bg-primary)] font-bold text-xs shadow-md transition-all disabled:opacity-50"
                  >
                    {loading ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm font-normal text-[var(--text-main)] whitespace-pre-wrap leading-relaxed">
                {currentOrder.description}
              </p>
            )}
          </div>

          {/* Campo 3: Prazo de Entrega */}
          <div className="space-y-1.5 pb-4 border-b border-[var(--border-subtle)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--text-muted)]">
                Prazo de entrega
              </span>
              <button
                type="button"
                aria-label="Editar prazo de entrega"
                disabled={editingField !== null}
                onClick={() => startEditing('delivery_date')}
                className="min-w-[40px] min-h-[40px] flex items-center justify-center p-2 rounded-lg text-[var(--text-dim)] hover:text-[var(--text-main)] hover:bg-[var(--surface-panel-alt)] disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>

            {editingField === 'delivery_date' ? (
              <div className="space-y-3 pt-1">
                <input
                  type="date"
                  value={editDeliveryDate}
                  onChange={(e) => setEditDeliveryDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-main)] text-sm focus:outline-none focus:border-[var(--border-focus)]"
                />

                {(fieldError || apiError) && (
                  <div className="p-2.5 rounded-lg bg-[var(--coral-bg)] border border-[var(--border-error)] text-[var(--coral-main)] text-xs font-medium">
                    {fieldError || apiError}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={cancelEditing}
                    disabled={loading}
                    className="px-4 py-1.5 rounded-lg border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)] text-xs font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleSaveField('delivery_date')}
                    className="px-4 py-1.5 rounded-lg bg-[var(--emerald-main)] hover:opacity-90 text-[var(--bg-primary)] font-bold text-xs shadow-md transition-all disabled:opacity-50"
                  >
                    {loading ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-[var(--text-main)]">
                  {formattedDeliveryDate}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${deadline.badgeClasses}`}
                >
                  {deadline.status === 'late' ? (
                    <AlertTriangle className="w-3 h-3" />
                  ) : (
                    <Calendar className="w-3 h-3" />
                  )}
                  <span>{deadline.text}</span>
                </span>
              </div>
            )}
          </div>

          {/* Campo 4: Pagamento (Valor + Sinal) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--text-muted)]">
                Pagamento
              </span>
              <button
                type="button"
                aria-label="Editar pagamento"
                disabled={editingField !== null}
                onClick={() => startEditing('payment')}
                className="min-w-[40px] min-h-[40px] flex items-center justify-center p-2 rounded-lg text-[var(--text-dim)] hover:text-[var(--text-main)] hover:bg-[var(--surface-panel-alt)] disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>

            {editingField === 'payment' ? (
              <div className="space-y-3 pt-1">
                {/* Input Máscara BRL */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] focus-within:border-[var(--border-focus)]">
                  <span className="text-base font-bold text-[var(--text-dim)]">R$</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={amountDisplay}
                    onChange={handleAmountChange}
                    placeholder="0,00"
                    className="w-full text-base font-bold text-[var(--text-main)] bg-transparent focus:outline-none tabular-numbers"
                  />
                </div>

                {/* Checkbox de Sinal */}
                <div>
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={editIsPartialPaid}
                      onChange={(e) => setEditIsPartialPaid(e.target.checked)}
                      className="w-4 h-4 rounded accent-[var(--emerald-main)] cursor-pointer"
                    />
                    <span className="text-xs text-[var(--text-muted)] flex items-center gap-1.5">
                      <span>Sinal / Pagamento 50% antecipado</span>
                      {editAmountValue > 0 && (
                        <span className="text-[var(--amber-main)] font-semibold">
                          ({formatCurrencyBRL(halfValue)} pago via Pix)
                        </span>
                      )}
                    </span>
                  </label>
                </div>

                {(fieldError || apiError) && (
                  <div className="p-2.5 rounded-lg bg-[var(--coral-bg)] border border-[var(--border-error)] text-[var(--coral-main)] text-xs font-medium">
                    {fieldError || apiError}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={cancelEditing}
                    disabled={loading}
                    className="px-4 py-1.5 rounded-lg border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)] text-xs font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleSaveField('payment')}
                    className="px-4 py-1.5 rounded-lg bg-[var(--emerald-main)] hover:opacity-90 text-[var(--bg-primary)] font-bold text-xs shadow-md transition-all disabled:opacity-50"
                  >
                    {loading ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <span className="text-base font-extrabold text-[var(--text-main)] tabular-numbers">
                  {formatCurrencyBRL(currentOrder.total_value)}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${paymentBadge.badgeClasses}`}
                >
                  {paymentBadge.label}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Rodapé com botão Fechar */}
        <div className="p-4 sm:p-5 border-t border-[var(--border-subtle)] flex items-center justify-end flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-xl border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--surface-panel-alt)] text-sm font-medium transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
