import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { env } from '@/shared/config/env';

let transporter: Transporter | null = null;

export function getEmailTransport(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: false,
      tls: { rejectUnauthorized: false },
    });
  }
  return transporter;
}

export async function verifyEmailTransport(): Promise<boolean> {
  try {
    await getEmailTransport().verify();
    return true;
  } catch {
    return false;
  }
}
