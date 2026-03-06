export type Currency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'AUD';

export interface Invoice {
  id: string;
  amount: number;
  currency: Currency;
  paid: boolean;
  createdAt: Date;
  dueDate: Date;
}

export function createInvoice(amount: number, currency: Currency = 'USD', dueDays = 30): Invoice {
  const createdAt = new Date();
  const dueDate = new Date(createdAt);
  dueDate.setDate(dueDate.getDate() + dueDays);
  return {
    id: Math.random().toString(36).slice(2),
    amount,
    currency,
    paid: false,
    createdAt,
    dueDate,
  };
}

export function markPaid(invoice: Invoice): Invoice {
  return { ...invoice, paid: true };
}

export function isOverdue(invoice: Invoice): boolean {
  return !invoice.paid && new Date() > invoice.dueDate;
}

export function formatAmount(invoice: Invoice): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: invoice.currency,
  }).format(invoice.amount);
}
