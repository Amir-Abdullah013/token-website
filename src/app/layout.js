import { Inter } from 'next/font/google';
import './globals.css';
import ClientOnlyRoute from '@/components/ClientOnlyRoute';
import { AuthProvider } from '@/lib/auth-context';
import { VonProvider } from '@/lib/Von-context';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Pryvons - Secure Token Management',
  description: 'A modern token management platform with secure authentication and advanced features.',
  manifest: '/site.webmanifest',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.className}>
      <head>
        {/* ✅ Explicitly define favicon links for Chrome */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>

      <body
        className="min-h-screen bg-gray-50"
        suppressHydrationWarning={true}
      >
        <ClientOnlyRoute
          fallback={
            <div className="min-h-screen flex items-center justify-center">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
          }
        >
          <AuthProvider>
            <VonProvider>{children}</VonProvider>
          </AuthProvider>
        </ClientOnlyRoute>
      </body>
    </html>
  );
}
