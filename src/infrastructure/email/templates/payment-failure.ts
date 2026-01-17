import { baseTemplate } from './base';
import { e } from './utils';

interface PaymentFailureParams {
  customerName: string;
  orderNumber: string;
  amount: number;
  currency: string;
  retryUrl: string;
}

export function paymentFailureTemplate(params: PaymentFailureParams): {
  html: string;
  text: string;
} {
  const formattedAmount = new Intl.NumberFormat('hr-HR', {
    style: 'currency',
    currency: params.currency,
  }).format(params.amount / 100);

  const content = `
    <h1 style="margin: 0 0 24px; color: #18181b; font-size: 24px;">Payment Failed</h1>
    <p style="margin: 0 0 16px; color: #3f3f46;">Hi ${e(params.customerName)},</p>
    <p style="margin: 0 0 16px; color: #3f3f46;">Unfortunately, we were unable to process your payment for order <strong>${e(params.orderNumber)}</strong>.</p>
    <p style="margin: 0 0 24px; color: #3f3f46;">Amount: <strong>${formattedAmount}</strong></p>
    <p style="margin: 0 0 8px; color: #3f3f46;">This could be due to:</p>
    <ul style="margin: 0 0 24px; color: #3f3f46; padding-left: 20px;">
      <li>Insufficient funds</li>
      <li>Card declined by issuer</li>
      <li>Expired card details</li>
    </ul>
    <p style="margin: 0 0 24px; color: #3f3f46;">Please try again with a different payment method:</p>
    <p style="text-align: center; margin: 0 0 24px;">
      <a href="${params.retryUrl}" style="display: inline-block; padding: 12px 24px; background-color: #059669; color: white; text-decoration: none; border-radius: 6px;">
        Retry Payment
      </a>
    </p>
    <p style="margin: 0; color: #71717a; font-size: 14px;">If you continue to experience issues, please contact us.</p>
  `;

  const text = `
Payment Failed

Hi ${e(params.customerName)},

Unfortunately, we were unable to process your payment for order ${e(params.orderNumber)}.

Amount: ${formattedAmount}

This could be due to:
- Insufficient funds
- Card declined by issuer
- Expired card details

Please try again at: ${params.retryUrl}

If you continue to experience issues, please contact us.
  `.trim();

  return { html: baseTemplate(content, 'Payment Failed'), text };
}
