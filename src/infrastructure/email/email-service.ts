import { getEmailTransport } from './email-client';
import { env } from '@/shared/config/env';
import { orderConfirmationTemplate } from './templates/order-confirmation';
import { orderStatusChangeTemplate } from './templates/order-status-change';
import { orderStatusUpdateTemplate } from './templates/order-status-update';
import { passwordResetTemplate } from './templates/password-reset';
import { paymentFailureTemplate } from './templates/payment-failure';
import { refundConfirmationTemplate } from './templates/refund-confirmation';
import { studioNewOrderTemplate } from './templates/studio-new-order';
import { teamInvitationTemplate } from './templates/team-invitation';
import { welcomeTemplate } from './templates/welcome';

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text: string;
}

async function sendEmail(params: SendEmailParams): Promise<void> {
  const transport = getEmailTransport();
  await transport.sendMail({
    from: env.EMAIL_FROM,
    to: params.to,
    subject: params.subject,
    html: params.html,
    text: params.text,
  });
}

export async function sendOrderConfirmation(order: {
  customerEmail: string;
  customerName: string;
  orderNumber: string;
  total: number;
  currency: string;
  items: Array<{ name: string; quantity: number; unitPrice: number }>;
  orderUrl: string;
}): Promise<void> {
  const { html, text } = orderConfirmationTemplate(order);
  await sendEmail({
    to: order.customerEmail,
    subject: `Order Confirmed: ${order.orderNumber}`,
    html,
    text,
  });
}

export async function sendOrderStatusUpdate(order: {
  customerEmail: string;
  customerName: string;
  orderNumber: string;
  status: string;
  trackingUrl?: string;
}): Promise<void> {
  const { html, text } = orderStatusUpdateTemplate(order);
  await sendEmail({
    to: order.customerEmail,
    subject: `Order ${order.orderNumber} - ${order.status}`,
    html,
    text,
  });
}

export async function sendPasswordReset(params: {
  email: string;
  resetUrl: string;
  expiresIn: string;
}): Promise<void> {
  const { html, text } = passwordResetTemplate(params);
  await sendEmail({
    to: params.email,
    subject: 'Reset Your Password',
    html,
    text,
  });
}

export async function sendWelcome(params: {
  email: string;
  userName: string;
  tenantName: string;
  loginUrl: string;
}): Promise<void> {
  const { html, text } = welcomeTemplate(params);
  await sendEmail({
    to: params.email,
    subject: `Welcome to ${params.tenantName}`,
    html,
    text,
  });
}

export async function sendPaymentFailure(params: {
  customerEmail: string;
  customerName: string;
  orderNumber: string;
  amount: number;
  currency: string;
  retryUrl: string;
}): Promise<void> {
  const { html, text } = paymentFailureTemplate(params);
  await sendEmail({
    to: params.customerEmail,
    subject: `Payment Failed - Order ${params.orderNumber}`,
    html,
    text,
  });
}

export async function sendStudioNewOrder(params: {
  studioEmail: string;
  studioName: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  itemCount: number;
  total: number;
  currency: string;
  dashboardUrl: string;
}): Promise<void> {
  const { html, text } = studioNewOrderTemplate({
    studioName: params.studioName,
    orderNumber: params.orderNumber,
    customerName: params.customerName,
    customerEmail: params.customerEmail,
    itemCount: params.itemCount,
    total: params.total,
    currency: params.currency,
    dashboardUrl: params.dashboardUrl,
  });
  await sendEmail({
    to: params.studioEmail,
    subject: `New Order: ${params.orderNumber}`,
    html,
    text,
  });
}

export async function sendRefundConfirmation(params: {
  customerEmail: string;
  customerName: string;
  orderNumber: string;
  amount: number;
  currency: string;
}): Promise<void> {
  const { html, text } = refundConfirmationTemplate({
    customerName: params.customerName,
    orderNumber: params.orderNumber,
    amount: params.amount,
    currency: params.currency,
  });
  await sendEmail({
    to: params.customerEmail,
    subject: `Refund Processed - Order ${params.orderNumber}`,
    html,
    text,
  });
}

export async function sendTeamInvitation(params: {
  email: string;
  inviterName: string;
  tenantName: string;
  role: string;
  acceptUrl: string;
}): Promise<void> {
  const { html, text } = teamInvitationTemplate({
    inviterName: params.inviterName,
    tenantName: params.tenantName,
    role: params.role,
    acceptUrl: params.acceptUrl,
  });
  await sendEmail({
    to: params.email,
    subject: `You're invited to join ${params.tenantName}`,
    html,
    text,
  });
}

export async function sendOrderStatusChange(params: {
  customerEmail: string;
  customerName: string;
  orderNumber: string;
  oldStatus: string;
  newStatus: string;
  statusMessage?: string | undefined;
  orderUrl: string;
}): Promise<void> {
  const { html, text } = orderStatusChangeTemplate({
    customerName: params.customerName,
    orderNumber: params.orderNumber,
    oldStatus: params.oldStatus,
    newStatus: params.newStatus,
    statusMessage: params.statusMessage,
    orderUrl: params.orderUrl,
  });
  await sendEmail({
    to: params.customerEmail,
    subject: `Order ${params.orderNumber} - Status Updated`,
    html,
    text,
  });
}
