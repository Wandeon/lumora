import { baseTemplate } from './base';

interface TeamInvitationParams {
  inviterName: string;
  tenantName: string;
  role: string;
  acceptUrl: string;
}

export function teamInvitationTemplate(params: TeamInvitationParams): {
  html: string;
  text: string;
} {
  const roleLabel = getRoleLabel(params.role);

  const content = `
    <h1 style="margin: 0 0 24px; color: #18181b; font-size: 24px;">You're Invited to Join ${params.tenantName}</h1>
    <p style="margin: 0 0 16px; color: #3f3f46;"><strong>${params.inviterName}</strong> has invited you to join their team on Lumora as a <strong>${roleLabel}</strong>.</p>
    <p style="margin: 0 0 24px; color: #3f3f46;">Click the button below to accept the invitation and join the team:</p>

    <a href="${params.acceptUrl}" style="display: inline-block; padding: 12px 24px; background-color: #10b981; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500;">Accept Invitation</a>

    <p style="margin: 24px 0 0; color: #71717a; font-size: 14px;">This invitation link will expire in 7 days.</p>
    <p style="margin: 8px 0 0; color: #71717a; font-size: 14px;">If you didn't expect this invitation, you can safely ignore this email.</p>
  `;

  const text = `
You're Invited to Join ${params.tenantName}

${params.inviterName} has invited you to join their team on Lumora as a ${roleLabel}.

Click this link to accept the invitation and join the team:
${params.acceptUrl}

This invitation link will expire in 7 days.

If you didn't expect this invitation, you can safely ignore this email.
  `.trim();

  return {
    html: baseTemplate(content, `Join ${params.tenantName} on Lumora`),
    text,
  };
}

function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    admin: 'Administrator',
    editor: 'Editor',
    viewer: 'Viewer',
  };
  return labels[role] || role;
}
