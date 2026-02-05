import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Our Journey Together 💕',
  description: 'A map of our memories across time and place',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
