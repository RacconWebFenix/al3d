'use client';

import React from 'react';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';

export interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
  title?: string;
  description?: string;
  itemName?: string;
  itemSubtitle?: string;
  itemValue?: string;
  confirmText?: string;
}

export function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  loading,
  title = 'Confirmar Exclusão',
  description = 'Tem certeza que deseja excluir este lançamento do fluxo de caixa? Essa ação não pode ser desfeita.',
  itemName,
  itemSubtitle,
  itemValue,
  confirmText = 'Excluir',
}: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#121826] border border-white/10 rounded-2xl p-6 shadow-2xl modal-content-animation text-left">
        {/* Topo / Header */}
        <div className="flex items-start justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3.5">
            <div className="w-[52px] h-[52px] rounded-2xl flex items-center justify-center bg-rose-500/10 border border-rose-500/25 text-[#f43f5e] shrink-0">
              <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                {title}
              </h3>
              <p className="text-xs text-[var(--text-dim)] mt-0.5">
                Esta ação é irreversível
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-lg text-[var(--text-dim)] hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mensagem descritiva */}
        <p className="text-sm text-[var(--text-muted)] my-4 leading-relaxed">
          {description}
        </p>

        {/* Card de Preview do Item (opcional) */}
        {itemName && (
          <div className="mb-5 p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate">
                {itemName}
              </p>
              {itemSubtitle && (
                <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">
                  {itemSubtitle}
                </p>
              )}
            </div>
            {itemValue && (
              <span className="text-sm font-bold text-white tabular-nums shrink-0">
                {itemValue}
              </span>
            )}
          </div>
        )}

        {/* Botões de Ação */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 text-sm font-semibold text-[var(--text-muted)] hover:text-white rounded-xl hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-[#f43f5e] hover:bg-[#e11d48] rounded-xl shadow-lg shadow-rose-600/30 transition-all hover:scale-[1.02] active:scale-98 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Excluindo...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 stroke-[2.2]" />
                <span>{confirmText}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
