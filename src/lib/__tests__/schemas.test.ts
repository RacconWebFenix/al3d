import { describe, it, expect } from 'vitest';
import { orderSchema } from '@/components/NewOrderModal';
import { transactionSchema } from '@/components/QuickEntryModal';
import { zodResolver } from '@hookform/resolvers/zod';
import { buildOrderEditPayload, buildOrderSingleFieldPayload, computePaidAmount, orderPatchSchema } from '@/lib/orderSchemas';

describe('orderSchema (NewOrderModal)', () => {
  const validOrder = {
    clientName: 'Marcos Banespinha',
    description: '3 Troféus Banespinha em PLA Silk Ouro + Preto',
    stage: 'COTACAO' as const,
    deliveryDate: '2026-09-25',
    amountValue: 400.0,
    isPartialPaid: true,
  };

  it('valida com sucesso um pedido completo e correto', () => {
    const result = orderSchema.safeParse(validOrder);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.clientName).toBe('Marcos Banespinha');
      expect(result.data.stage).toBe('COTACAO');
      expect(result.data.amountValue).toBe(400.0);
    }
  });

  it('rejeita clientName ausente ou apenas com espaços', () => {
    const emptyResult = orderSchema.safeParse({ ...validOrder, clientName: '' });
    expect(emptyResult.success).toBe(false);
    if (!emptyResult.success) {
      const messages = emptyResult.error.issues.map((i) => i.message);
      expect(messages).toContain('Informe o nome do cliente.');
    }

    const spacesResult = orderSchema.safeParse({ ...validOrder, clientName: '    ' });
    expect(spacesResult.success).toBe(false);
    if (!spacesResult.success) {
      const messages = spacesResult.error.issues.map((i) => i.message);
      expect(messages).toContain('Informe o nome do cliente.');
    }
  });

  it('rejeita description ausente ou apenas com espaços', () => {
    const result = orderSchema.safeParse({ ...validOrder, description: '   ' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages).toContain('Informe a descrição do item ou modelo 3D.');
    }
  });

  it('rejeita stage inválido', () => {
    const result = orderSchema.safeParse({ ...validOrder, stage: 'STAGE_INVALIDO' });
    expect(result.success).toBe(false);
  });

  it('rejeita deliveryDate vazia', () => {
    const result = orderSchema.safeParse({ ...validOrder, deliveryDate: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages).toContain('Defina o prazo de entrega.');
    }
  });

  it('rejeita amountValue menor ou igual a zero', () => {
    const zeroResult = orderSchema.safeParse({ ...validOrder, amountValue: 0 });
    expect(zeroResult.success).toBe(false);
    if (!zeroResult.success) {
      const messages = zeroResult.error.issues.map((i) => i.message);
      expect(messages).toContain('Informe o valor total do pedido.');
    }

    const negResult = orderSchema.safeParse({ ...validOrder, amountValue: -25.5 });
    expect(negResult.success).toBe(false);
    if (!negResult.success) {
      const messages = negResult.error.issues.map((i) => i.message);
      expect(messages).toContain('Informe o valor total do pedido.');
    }
  });

  it('executa zodResolver(orderSchema) e retorna erros estruturados esperados pelo React Hook Form', async () => {
    const resolver = zodResolver(orderSchema);
    const invalidPayload = {
      clientName: '  ',
      description: '',
      stage: 'OUTRO',
      deliveryDate: '',
      amountValue: 0,
      isPartialPaid: false,
    };

    const resolverResult = await resolver(invalidPayload as never, {}, {} as never);
    expect(resolverResult.errors).toBeDefined();
    expect(resolverResult.errors.clientName?.message).toBe('Informe o nome do cliente.');
    expect(resolverResult.errors.description?.message).toBe('Informe a descrição do item ou modelo 3D.');
    expect(resolverResult.errors.deliveryDate?.message).toBe('Defina o prazo de entrega.');
    expect(resolverResult.errors.amountValue?.message).toBe('Informe o valor total do pedido.');
  });
});

describe('orderPatchSchema', () => {
  const validPatch = {
    id: 7,
    client_name: 'Marcos Banespinha',
    description: 'Troféu 3D em PLA Silk',
    delivery_date: '2026-09-25',
    total_value: 400,
    paid_amount: 200,
    is_partial_paid: true,
  };

  it('aceita um payload parcial válido', () => {
    const result = orderPatchSchema.safeParse({ id: 7, client_name: ' Marcos ' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.client_name).toBe('Marcos');
    }
  });

  it('rejeita client_name vazio após trim', () => {
    const result = orderPatchSchema.safeParse({ ...validPatch, client_name: '   ' });
    expect(result.success).toBe(false);
  });

  it('rejeita stage inválido', () => {
    const result = orderPatchSchema.safeParse({ ...validPatch, stage: 'STAGE_INVALIDA' });
    expect(result.success).toBe(false);
  });

  it('rejeita chave desconhecida', () => {
    const result = orderPatchSchema.safeParse({ ...validPatch, extraField: true });
    expect(result.success).toBe(false);
  });

  it('rejeita valores negativos', () => {
    const totalNegative = orderPatchSchema.safeParse({ ...validPatch, total_value: -10 });
    const paidNegative = orderPatchSchema.safeParse({ ...validPatch, paid_amount: -1 });

    expect(totalNegative.success).toBe(false);
    expect(paidNegative.success).toBe(false);
  });
});

describe('computePaidAmount e buildOrderEditPayload', () => {
  const orderBase = {
    id: 7,
    client_name: 'Marcos Banespinha',
    description: 'Troféu 3D em PLA Silk',
    stage: 'COTACAO' as const,
    total_value: 400,
    paid_amount: 200,
    is_partial_paid: true,
    delivery_date: '2026-09-25',
    notes: 'Prazo urgente',
  };

  it('calcula paid_amount para cada ramo da regra', () => {
    expect(computePaidAmount({ amountValue: 400, isPartialPaid: true, stage: 'COTACAO' })).toBe(200);
    expect(computePaidAmount({ amountValue: 400, isPartialPaid: false, stage: 'COTACAO' })).toBe(0);
    expect(computePaidAmount({ amountValue: 400, isPartialPaid: false, stage: 'PAGAMENTO' })).toBe(400);
    expect(computePaidAmount({ amountValue: 400, isPartialPaid: false, stage: 'ENTREGUE' })).toBe(400);
  });

  it('retorna payload vazio quando nada mudou', () => {
    const payload = buildOrderEditPayload(
      orderBase,
      {
        clientName: 'Marcos Banespinha',
        description: 'Troféu 3D em PLA Silk',
        deliveryDate: '2026-09-25',
        amountValue: 400,
        isPartialPaid: true,
      },
      {}
    );

    expect(payload).toEqual({});
  });

  it('só descrição alterada não envia paid_amount', () => {
    const payload = buildOrderEditPayload(
      orderBase,
      {
        clientName: 'Marcos Banespinha',
        description: 'Troféu 3D em PLA Silk — novo modelo',
        deliveryDate: '2026-09-25',
        amountValue: 400,
        isPartialPaid: true,
      },
      { description: true }
    );

    expect(payload).toEqual({ description: 'Troféu 3D em PLA Silk — novo modelo' });
  });

  it('valor alterado recalcula paid_amount', () => {
    const payload = buildOrderEditPayload(
      orderBase,
      {
        clientName: 'Marcos Banespinha',
        description: 'Troféu 3D em PLA Silk',
        deliveryDate: '2026-09-25',
        amountValue: 600,
        isPartialPaid: true,
      },
      { amountValue: true, isPartialPaid: true }
    );

    expect(payload).toEqual({
      total_value: 600,
      is_partial_paid: true,
      paid_amount: 300,
    });
  });
});

describe('buildOrderSingleFieldPayload', () => {
  const orderBase = {
    id: 7,
    client_name: 'Marcos Banespinha',
    description: 'Troféu 3D em PLA Silk',
    stage: 'COTACAO' as const,
    total_value: 400,
    paid_amount: 200,
    is_partial_paid: true,
    delivery_date: '2026-09-25',
    notes: 'Prazo urgente',
  };

  it('descrição alterada → só description', () => {
    const payload = buildOrderSingleFieldPayload(orderBase, {
      field: 'description',
      value: 'Nova descrição do troféu',
    });
    expect(payload).toEqual({ description: 'Nova descrição do troféu' });
  });

  it('cliente igual ao original → payload vazio', () => {
    const payload = buildOrderSingleFieldPayload(orderBase, {
      field: 'client_name',
      value: '  Marcos Banespinha  ',
    });
    expect(payload).toEqual({});
  });

  it('pagamento sem mudança → payload vazio (sem paid_amount)', () => {
    const payload = buildOrderSingleFieldPayload(orderBase, {
      field: 'payment',
      total_value: 400,
      is_partial_paid: true,
    });
    expect(payload).toEqual({});
  });

  it('valor alterado → total_value + is_partial_paid + paid_amount recalculado com a etapa atual', () => {
    const payload = buildOrderSingleFieldPayload(orderBase, {
      field: 'payment',
      total_value: 600,
      is_partial_paid: true,
    });
    expect(payload).toEqual({
      total_value: 600,
      is_partial_paid: true,
      paid_amount: 300,
    });
  });

  it('só sinal alternado → recalcula paid_amount', () => {
    const payload = buildOrderSingleFieldPayload(orderBase, {
      field: 'payment',
      total_value: 400,
      is_partial_paid: false,
    });
    expect(payload).toEqual({
      total_value: 400,
      is_partial_paid: false,
      paid_amount: 0,
    });
  });

  it('prazo alterado → só delivery_date', () => {
    const payload = buildOrderSingleFieldPayload(orderBase, {
      field: 'delivery_date',
      value: '2026-10-10',
    });
    expect(payload).toEqual({ delivery_date: '2026-10-10' });
  });
});

describe('transactionSchema (QuickEntryModal)', () => {
  const validTransaction = {
    type: 'INCOME' as const,
    amountValue: 250.0,
    date: '2026-09-20',
    description: 'Sinal 50% pedido troféus',
    isPartial: true,
    partialNote: '50% pago',
  };

  it('valida com sucesso uma transação completa e correta', () => {
    const result = transactionSchema.safeParse(validTransaction);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe('INCOME');
      expect(result.data.amountValue).toBe(250.0);
      expect(result.data.isPartial).toBe(true);
      expect(result.data.partialNote).toBe('50% pago');
    }
  });

  it('valida transação de despesa (EXPENSE) sem partialNote', () => {
    const expenseTx = {
      type: 'EXPENSE' as const,
      amountValue: 120.0,
      date: '2026-09-20',
      description: 'Filamento PLA Silk Ouro 1kg',
      isPartial: false,
    };
    const result = transactionSchema.safeParse(expenseTx);
    expect(result.success).toBe(true);
  });

  it('rejeita type diferente de INCOME ou EXPENSE', () => {
    const result = transactionSchema.safeParse({ ...validTransaction, type: 'PIX' });
    expect(result.success).toBe(false);
  });

  it('rejeita date vazia', () => {
    const result = transactionSchema.safeParse({ ...validTransaction, date: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages).toContain('Selecione a data.');
    }
  });

  it('rejeita description ausente ou apenas com espaços', () => {
    const result = transactionSchema.safeParse({ ...validTransaction, description: '   ' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages).toContain('Preencha a descrição do pedido ou insumo.');
    }
  });

  it('rejeita amountValue menor ou igual a zero', () => {
    const zeroResult = transactionSchema.safeParse({ ...validTransaction, amountValue: 0 });
    expect(zeroResult.success).toBe(false);
    if (!zeroResult.success) {
      const messages = zeroResult.error.issues.map((i) => i.message);
      expect(messages).toContain('Informe um valor maior que zero.');
    }

    const negResult = transactionSchema.safeParse({ ...validTransaction, amountValue: -100 });
    expect(negResult.success).toBe(false);
    if (!negResult.success) {
      const messages = negResult.error.issues.map((i) => i.message);
      expect(messages).toContain('Informe um valor maior que zero.');
    }
  });

  it('executa zodResolver(transactionSchema) e retorna erros estruturados esperados pelo React Hook Form', async () => {
    const resolver = zodResolver(transactionSchema);
    const invalidPayload = {
      type: 'INVALIDO',
      amountValue: 0,
      date: '',
      description: '   ',
      isPartial: false,
    };

    const resolverResult = await resolver(invalidPayload as never, {}, {} as never);
    expect(resolverResult.errors).toBeDefined();
    expect(resolverResult.errors.amountValue?.message).toBe('Informe um valor maior que zero.');
    expect(resolverResult.errors.date?.message).toBe('Selecione a data.');
    expect(resolverResult.errors.description?.message).toBe('Preencha a descrição do pedido ou insumo.');
  });
});
