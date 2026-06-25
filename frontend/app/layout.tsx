import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AWS DevOps Dashboard',
  description: 'Next.js dashboard connected to AWS resources created by the Terraform stack.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}