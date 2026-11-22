import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LinkPulse | Modern URL Shortener & Analytics',
  description: 'Fast, collision-resistant URL shortening with real-time click tracking and analytics dashboard.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased selection:bg-blue-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
