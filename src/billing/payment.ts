import { createInvoice, markPaid, Currency } from './invoice';
import { retryCharge, ChargeResult, RetryConfig, DEFAULT_RETRY_CONFIG } from './retry';

export interface PaymentRequest {
  userId: string;
  amount: number;
  currency: Currency;
  chargeFn: () => Promise<ChargeResult>;
  retryConfig?: RetryConfig;
}

export interface PaymentResult {
  success: boolean;
  invoiceId: string;
  transactionId?: string;
  error?: string;
}

export async function processPayment(req: PaymentRequest): Promise<PaymentResult> {
  const invoice = createInvoice(req.amount, req.currency);
  const config = req.retryConfig ?? DEFAULT_RETRY_CONFIG;

  const { finalResult } = await retryCharge(req.chargeFn, config);

  if (!finalResult.success) {
    return { success: false, invoiceId: invoice.id, error: finalResult.reason };
  }

  const paidInvoice = markPaid(invoice);

  return {
    success: true,
    invoiceId: paidInvoice.id,
    transactionId: finalResult.transactionId,
  };
}
