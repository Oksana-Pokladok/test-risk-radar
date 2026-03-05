export interface Invoice {
  id: string;
  amount: number;
  paid: boolean;
}

export function createInvoice(amount: number): Invoice {
  return { id: Math.random().toString(36).slice(2), amount, paid: false };
}

export function markPaid(invoice: Invoice): Invoice {
  return { ...invoice, paid: true };
}
