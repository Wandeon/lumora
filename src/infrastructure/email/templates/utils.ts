/**
 * HTML escape utility for email templates
 * Prevents XSS attacks when user-controlled data is inserted into HTML emails
 */
export function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Escape HTML for use in email templates
 * Use this for all user-controlled values
 */
export function e(str: string): string {
  return escapeHtml(str);
}
