import { baseTemplate } from './base';
import { e } from './utils';

interface WelcomeParams {
  email: string;
  userName: string;
  tenantName: string;
  loginUrl: string;
}

export function welcomeTemplate(params: WelcomeParams): {
  html: string;
  text: string;
} {
  const content = `
    <h1 style="margin: 0 0 24px; color: #18181b; font-size: 24px;">Welcome to ${e(params.tenantName)}!</h1>
    <p style="margin: 0 0 16px; color: #3f3f46;">Hi ${e(params.userName)},</p>
    <p style="margin: 0 0 24px; color: #3f3f46;">Your account has been created successfully. You can now access your dashboard and start managing your photos.</p>

    <a href="${params.loginUrl}" style="display: inline-block; padding: 12px 24px; background-color: #10b981; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500;">Go to Dashboard</a>

    <p style="margin: 24px 0 0; color: #71717a; font-size: 14px;">If you have any questions, feel free to reach out to our support team.</p>
  `;

  const text = `
Welcome to ${e(params.tenantName)}!

Hi ${e(params.userName)},

Your account has been created successfully. You can now access your dashboard and start managing your photos.

Go to Dashboard: ${params.loginUrl}

If you have any questions, feel free to reach out to our support team.
  `.trim();

  return {
    html: baseTemplate(content, `Welcome to ${e(params.tenantName)}`),
    text,
  };
}
