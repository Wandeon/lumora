import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { CookieConsentProvider } from '@/shared/contexts/cookie-consent-context';
import { CookieBanner } from '@/shared/ui/cookie-banner';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'Lumora - Professional Photo Galleries for Your Studio',
    template: '%s | Lumora',
  },
  description:
    'Create beautiful, branded photo galleries for your clients. Share, sell prints, and manage your photography business all in one place.',
  keywords: [
    'photo gallery',
    'photography',
    'studio',
    'prints',
    'client proofing',
  ],
  authors: [{ name: 'Lumora' }],
  openGraph: {
    title: 'Lumora - Professional Photo Galleries',
    description: 'Create beautiful photo galleries for your clients.',
    url: 'https://lumora.genai.hr',
    siteName: 'Lumora',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lumora - Professional Photo Galleries',
    description: 'Create beautiful photo galleries for your clients.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <CookieConsentProvider>
          {children}
          <CookieBanner />
        </CookieConsentProvider>
      </body>
    </html>
  );
}
