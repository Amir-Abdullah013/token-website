import { Inter } from 'next/font/google';
import './globals.css';
import ClientOnlyRoute from '../components/ClientOnlyRoute';
import { AuthProvider } from '../lib/auth-context';
import { TikiProvider } from '../lib/tiki-context';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Token Website - Secure Token Management',
  description: 'A modern token management platform with secure authentication and advanced features.',
  manifest: '/manifest.json',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.className}>
      <body className="min-h-screen bg-gray-50" suppressHydrationWarning={true}>
        <ClientOnlyRoute fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div></div>}>
          <AuthProvider>
            <TikiProvider>
              {children}
            </TikiProvider>
          </AuthProvider>
        </ClientOnlyRoute>
      </body>
    </html>
  );
}