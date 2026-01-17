import { baseTemplate } from './base';

interface OrderStatusChangeParams {
  customerName: string;
  orderNumber: string;
  oldStatus: string;
  newStatus: string;
  statusMessage?: string | undefined;
  orderUrl: string;
}

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

function getStatusLabel(status: string): string {
  return statusLabels[status] || status;
}

export function orderStatusChangeTemplate(params: OrderStatusChangeParams): {
  html: string;
  text: string;
} {
  const oldLabel = getStatusLabel(params.oldStatus);
  const newLabel = getStatusLabel(params.newStatus);

  const statusMessageHtml = params.statusMessage
    ? `
    <div style="margin: 24px 0; padding: 16px; background-color: #f4f4f5; border-radius: 6px;">
      <p style="margin: 0 0 8px; color: #3f3f46; font-weight: 600;">Message from the studio:</p>
      <p style="margin: 0; color: #3f3f46;">${params.statusMessage}</p>
    </div>
    `
    : '';

  const content = `
    <h1 style="margin: 0 0 24px; color: #18181b; font-size: 24px;">Order Status Updated</h1>
    <p style="margin: 0 0 16px; color: #3f3f46;">Hi ${params.customerName},</p>
    <p style="margin: 0 0 16px; color: #3f3f46;">The status of your order <strong>${params.orderNumber}</strong> has been updated.</p>

    <div style="margin: 24px 0; padding: 20px; background-color: #f0fdf4; border-radius: 6px; text-align: center;">
      <p style="margin: 0 0 8px; color: #71717a; font-size: 14px;">Status changed from</p>
      <p style="margin: 0; font-size: 18px;">
        <span style="color: #71717a;">${oldLabel}</span>
        <span style="margin: 0 12px; color: #d4d4d8;">&rarr;</span>
        <span style="color: #10b981; font-weight: 600;">${newLabel}</span>
      </p>
    </div>
    ${statusMessageHtml}
    <a href="${params.orderUrl}" style="display: inline-block; padding: 12px 24px; background-color: #10b981; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500;">View Order</a>

    <p style="margin: 24px 0 0; color: #71717a; font-size: 14px;">If you have any questions about your order, please contact the studio directly.</p>
  `;

  const statusMessageText = params.statusMessage
    ? `\nMessage from the studio:\n${params.statusMessage}\n`
    : '';

  const text = `
Order Status Updated

Hi ${params.customerName},

The status of your order ${params.orderNumber} has been updated.

Status changed from: ${oldLabel} -> ${newLabel}
${statusMessageText}
View your order: ${params.orderUrl}

If you have any questions about your order, please contact the studio directly.
  `.trim();

  return { html: baseTemplate(content, 'Order Status Updated'), text };
}
