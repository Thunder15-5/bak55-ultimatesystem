// frontend/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: 'BAK55 - AI-Powered African Music Talent Economy',
    template: '%s | BAK55',
  },
  description: 'Discover, support, and invest in the next generation of African music talent. Powered by AI talent scoring and real-time competitions.',
  keywords: ['African music', 'talent discovery', 'music competitions', 'AI scoring', 'music streaming'],
  authors: [{ name: 'BAK55 Team' }],
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#8B5CF6',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-dark-900 antialiased">
        <div className="relative min-h-screen">
          {/* Animated background gradient */}
          <div className="fixed inset-0 -z-10 overflow-hidden">
            <div className="absolute -inset-[10px] opacity-50">
              <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl animate-pulse-slow" />
              <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-secondary-500/20 rounded-full blur-3xl animate-pulse-slow delay-1000" />
              <div className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-accent-500/20 rounded-full blur-3xl animate-pulse-slow delay-2000" />
            </div>
          </div>
          
          {/* Main content */}
          <main className="relative z-10">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
