import { baseTemplate } from './base';
import { e } from './utils';

interface RefundConfirmationParams {
  customerName: string;
  orderNumber: string;
  amount: number;
  currency: string;
}

export function refundConfirmationTemplate(params: RefundConfirmationParams): {
  html: string;
  text: string;
} {
  const formattedAmount = new Intl.NumberFormat('hr-HR', {
    style: 'currency',
    currency: params.currency,
  }).format(params.amount / 100);

  const content = `
    <h1 style="margin: 0 0 24px; color: #18181b; font-size: 24px;">Refund Processed</h1>
    <p style="margin: 0 0 16px; color: #3f3f46;">Hi ${e(params.customerName)},</p>
    <p style="margin: 0 0 16px; color: #3f3f46;">Your refund for order <strong>${e(params.orderNumber)}</strong> has been processed.</p>
    <p style="margin: 0 0 24px; color: #3f3f46;">Refund amount: <strong>${formattedAmount}</strong></p>
    <p style="margin: 0 0 16px; color: #3f3f46;">The refund will be credited to your original payment method within 5-10 business days, depending on your bank.</p>
    <p style="margin: 0; color: #71717a; font-size: 14px;">If you have any questions, please contact us.</p>
  `;

  const text = `
Refund Processed

Hi ${e(params.customerName)},

Your refund for order ${e(params.orderNumber)} has been processed.

Refund amount: ${formattedAmount}

The refund will be credited to your original payment method within 5-10 business days, depending on your bank.

If you have any questions, please contact us.
  `.trim();

  return { html: baseTemplate(content, 'Refund Processed'), text };
}
