import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/app/providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'CloudGuard - Enterprise Cloud Security Platform',
  description: 'Automated policy enforcement and security governance for multi-cloud environments',
  keywords: [
    'cloud security',
    'policy as code',
    'DevSecOps',
    'infrastructure as code',
    'compliance',
    'governance',
  ],
  authors: [{ name: 'CloudGuard' }],
  creator: 'CloudGuard',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://cloudguard.io',
    title: 'CloudGuard - Enterprise Cloud Security Platform',
    description:
      'Automated policy enforcement and security governance for multi-cloud environments',
    siteName: 'CloudGuard',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CloudGuard - Enterprise Cloud Security Platform',
    description:
      'Automated policy enforcement and security governance for multi-cloud environments',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
