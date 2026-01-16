export function baseTemplate(content: string, title: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <tr>
      <td style="background-color: #ffffff; border-radius: 8px; padding: 40px;">
        ${content}
      </td>
    </tr>
    <tr>
      <td style="padding: 20px; text-align: center; color: #71717a; font-size: 12px;">
        <p>This email was sent by Lumora Photo Studio</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
