import { baseTemplate } from './base';

interface StudioNewOrderParams {
  studioName: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  itemCount: number;
  total: number;
  currency: string;
  dashboardUrl: string;
}

export function studioNewOrderTemplate(params: StudioNewOrderParams): {
  html: string;
  text: string;
} {
  const formattedTotal = new Intl.NumberFormat('hr-HR', {
    style: 'currency',
    currency: params.currency,
  }).format(params.total / 100);

  const content = `
    <h1 style="margin: 0 0 24px; color: #18181b; font-size: 24px;">New Order Received</h1>
    <p style="margin: 0 0 16px; color: #3f3f46;">Hi ${params.studioName},</p>
    <p style="margin: 0 0 24px; color: #3f3f46;">You have received a new order!</p>
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #e5e5e5;"><strong>Order Number</strong></td>
        <td style="padding: 8px 0; border-bottom: 1px solid #e5e5e5; text-align: right;">${params.orderNumber}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #e5e5e5;"><strong>Customer</strong></td>
        <td style="padding: 8px 0; border-bottom: 1px solid #e5e5e5; text-align: right;">${params.customerName}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #e5e5e5;"><strong>Email</strong></td>
        <td style="padding: 8px 0; border-bottom: 1px solid #e5e5e5; text-align: right;">${params.customerEmail}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #e5e5e5;"><strong>Items</strong></td>
        <td style="padding: 8px 0; border-bottom: 1px solid #e5e5e5; text-align: right;">${params.itemCount}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0;"><strong>Total</strong></td>
        <td style="padding: 8px 0; text-align: right; font-size: 18px; font-weight: bold;">${formattedTotal}</td>
      </tr>
    </table>
    <p style="text-align: center; margin: 24px 0;">
      <a href="${params.dashboardUrl}" style="display: inline-block; padding: 12px 24px; background-color: #059669; color: white; text-decoration: none; border-radius: 6px;">
        View Order Details
      </a>
    </p>
  `;

  const text = `
New Order Received!

Hi ${params.studioName},

You have received a new order!

Order: ${params.orderNumber}
Customer: ${params.customerName} (${params.customerEmail})
Items: ${params.itemCount}
Total: ${formattedTotal}

View order: ${params.dashboardUrl}
  `.trim();

  return { html: baseTemplate(content, 'New Order Received'), text };
}
