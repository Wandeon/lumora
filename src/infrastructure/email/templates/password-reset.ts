import { baseTemplate } from './base';

interface PasswordResetParams {
  email: string;
  resetUrl: string;
  expiresIn: string;
}

export function passwordResetTemplate(params: PasswordResetParams): {
  html: string;
  text: string;
} {
  const content = `
    <h1 style="margin: 0 0 24px; color: #18181b; font-size: 24px;">Reset Your Password</h1>
    <p style="margin: 0 0 16px; color: #3f3f46;">We received a request to reset your password.</p>
    <p style="margin: 0 0 24px; color: #3f3f46;">Click the button below to create a new password:</p>

    <a href="${params.resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #10b981; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500;">Reset Password</a>

    <p style="margin: 24px 0 0; color: #71717a; font-size: 14px;">This link expires in ${params.expiresIn}.</p>
    <p style="margin: 8px 0 0; color: #71717a; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
  `;

  const text = `
Reset Your Password

We received a request to reset your password.

Click this link to create a new password:
${params.resetUrl}

This link expires in ${params.expiresIn}.

If you didn't request this, you can safely ignore this email.
  `.trim();

  return { html: baseTemplate(content, 'Reset Your Password'), text };
}
