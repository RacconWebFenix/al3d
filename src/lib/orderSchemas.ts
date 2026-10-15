import { z } from 'zod';

export const ORDER_STAGE_VALUES = ['COTACAO', 'MODELANDO', 'IMPRIMINDO', 'PAGAMENTO', 'ENTREGUE'] as const;

export type OrderStage = (typeof ORDER_STAGE_VALUES)[number];

export interface OrderEditFormValues {
  clientName: string;
  description: string;
  deliveryDate: string;
  amountValue: number;
  isPartialPaid: boolean;
}

export interface OrderEditDirtyFields {
  clientName?: boolean;
  description?: boolean;
  deliveryDate?: boolean;
  amountValue?: boolean;
  isPartialPaid?: boolean;
}

export const orderPatchSchema = z
  .object({
    id: z.number().int().positive(),
    stage: z.enum(ORDER_STAGE_VALUES).optional(),
    client_name: z.string().trim().min(1, 'Informe o nome do cliente.').max(150).optional(),
    description: z.string().trim().min(1, 'Informe a descrição do item ou modelo 3D.').optional(),
    delivery_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida.').optional(),
    total_value: z.number().nonnegative().optional(),
    paid_amount: z.number().nonnegative().optional(),
    is_partial_paid: z.boolean().optional(),
    notes: z.string().nullable().optional(),
  })
  .strict();

export function computePaidAmount({
  amountValue,
  isPartialPaid,
  stage,
}: {
  amountValue: number;
  isPartialPaid: boolean;
  stage: OrderStage;
}): number {
  const safeAmount = Number.isFinite(amountValue) ? amountValue : 0;

  if (isPartialPaid) {
    return safeAmount > 0 ? safeAmount / 2 : 0;
  }

  return stage === 'ENTREGUE' || stage === 'PAGAMENTO' ? safeAmount : 0;
}

export function buildOrderEditPayload(
  order: {
    client_name: string;
    description: string;
    stage: OrderStage;
    total_value: number;
    paid_amount: number;
    is_partial_paid: boolean;
    delivery_date: string;
  },
  formValues: OrderEditFormValues,
  dirtyFields: OrderEditDirtyFields
): Record<string, string | number | boolean> {
  const payload: Record<string, string | number | boolean> = {};

  if (dirtyFields.clientName && formValues.clientName.trim() !== order.client_name.trim()) {
    payload.client_name = formValues.clientName.trim();
  }

  if (dirtyFields.description && formValues.description.trim() !== order.description.trim()) {
    payload.description = formValues.description.trim();
  }

  if (dirtyFields.deliveryDate && formValues.deliveryDate !== order.delivery_date) {
    payload.delivery_date = formValues.deliveryDate;
  }

  if (dirtyFields.amountValue || dirtyFields.isPartialPaid) {
    const nextTotalValue = Number(formValues.amountValue) || 0;
    const nextIsPartialPaid = Boolean(formValues.isPartialPaid);
    const nextPaidAmount = computePaidAmount({
      amountValue: nextTotalValue,
      isPartialPaid: nextIsPartialPaid,
      stage: order.stage,
    });

    payload.total_value = nextTotalValue;
    payload.is_partial_paid = nextIsPartialPaid;
    payload.paid_amount = nextPaidAmount;
  }

  return payload;
}
