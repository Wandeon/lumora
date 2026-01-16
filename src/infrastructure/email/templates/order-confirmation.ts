import { baseTemplate } from './base';

interface OrderConfirmationParams {
  customerName: string;
  orderNumber: string;
  total: number;
  currency: string;
  items: Array<{ name: string; quantity: number; unitPrice: number }>;
}

export function orderConfirmationTemplate(params: OrderConfirmationParams): {
  html: string;
  text: string;
} {
  const itemsHtml = params.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7;">${item.name}</td>
        <td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7; text-align: right;">${(item.unitPrice / 100).toFixed(2)} ${params.currency}</td>
      </tr>
    `
    )
    .join('');

  const content = `
    <h1 style="margin: 0 0 24px; color: #18181b; font-size: 24px;">Order Confirmed</h1>
    <p style="margin: 0 0 16px; color: #3f3f46;">Hi ${params.customerName},</p>
    <p style="margin: 0 0 24px; color: #3f3f46;">Thank you for your order! Your order <strong>${params.orderNumber}</strong> has been confirmed.</p>

    <table width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
      <tr style="background-color: #f4f4f5;">
        <th style="padding: 12px 8px; text-align: left; font-weight: 600;">Item</th>
        <th style="padding: 12px 8px; text-align: center; font-weight: 600;">Qty</th>
        <th style="padding: 12px 8px; text-align: right; font-weight: 600;">Price</th>
      </tr>
      ${itemsHtml}
      <tr>
        <td colspan="2" style="padding: 12px 8px; text-align: right; font-weight: 600;">Total:</td>
        <td style="padding: 12px 8px; text-align: right; font-weight: 600;">${(params.total / 100).toFixed(2)} ${params.currency}</td>
      </tr>
    </table>

    <p style="margin: 0; color: #71717a; font-size: 14px;">We'll notify you when your order ships.</p>
  `;

  const text = `
Order Confirmed

Hi ${params.customerName},

Thank you for your order! Your order ${params.orderNumber} has been confirmed.

Items:
${params.items.map((item) => `- ${item.name} x${item.quantity}: ${(item.unitPrice / 100).toFixed(2)} ${params.currency}`).join('\n')}

Total: ${(params.total / 100).toFixed(2)} ${params.currency}

We'll notify you when your order ships.
  `.trim();

  return { html: baseTemplate(content, 'Order Confirmed'), text };
}
