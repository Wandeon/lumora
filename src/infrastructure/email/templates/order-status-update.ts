import { baseTemplate } from './base';
import { e } from './utils';

interface OrderStatusUpdateParams {
  customerName: string;
  orderNumber: string;
  status: string;
  trackingUrl?: string;
}

const STATUS_MESSAGES: Record<string, { title: string; message: string }> = {
  confirmed: {
    title: 'Order Confirmed',
    message:
      'Your payment has been received and your order is being processed.',
  },
  processing: {
    title: 'Order Processing',
    message: 'Your order is being prepared.',
  },
  shipped: {
    title: 'Order Shipped',
    message: 'Your order is on its way!',
  },
  delivered: {
    title: 'Order Delivered',
    message: 'Your order has been delivered. We hope you love it!',
  },
  cancelled: {
    title: 'Order Cancelled',
    message:
      'Your order has been cancelled. If you have any questions, please contact us.',
  },
};

export function orderStatusUpdateTemplate(params: OrderStatusUpdateParams): {
  html: string;
  text: string;
} {
  const statusInfo = STATUS_MESSAGES[params.status] || {
    title: `Order ${params.status}`,
    message: `Your order status has been updated to: ${params.status}`,
  };

  const trackingHtml = params.trackingUrl
    ? `<p style="margin: 16px 0 0;"><a href="${params.trackingUrl}" style="display: inline-block; padding: 12px 24px; background-color: #10b981; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500;">Track Your Order</a></p>`
    : '';

  const content = `
    <h1 style="margin: 0 0 24px; color: #18181b; font-size: 24px;">${statusInfo.title}</h1>
    <p style="margin: 0 0 16px; color: #3f3f46;">Hi ${e(params.customerName)},</p>
    <p style="margin: 0 0 16px; color: #3f3f46;">${statusInfo.message}</p>
    <p style="margin: 0; color: #3f3f46;">Order Number: <strong>${e(params.orderNumber)}</strong></p>
    ${trackingHtml}
  `;

  const text = `
${statusInfo.title}

Hi ${e(params.customerName)},

${statusInfo.message}

Order Number: ${e(params.orderNumber)}
${params.trackingUrl ? `\nTrack your order: ${params.trackingUrl}` : ''}
  `.trim();

  return { html: baseTemplate(content, statusInfo.title), text };
}
