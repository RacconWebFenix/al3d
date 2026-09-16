'use client';

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}

export function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  loading,
}: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="relative w-full max-w-sm glass-card bg-[var(--bg-primary)] p-6 border border-white/10 shadow-2xl modal-content-animation">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2 text-rose-400">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="text-base font-bold text-white">Confirmar Exclusão</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[var(--text-dim)] hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm text-[var(--text-muted)] my-4">
          Tem certeza que deseja excluir este lançamento do fluxo de caixa? Essa ação não pode ser desfeita.
        </p>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-[var(--text-muted)] hover:text-white rounded-xl hover:bg-white/5"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 text-sm font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-lg shadow-rose-600/30 transition-all active:scale-95"
          >
            {loading ? 'Excluindo...' : 'Excluir'}
          </button>
        </div>
      </div>
    </div>
  );
}
