import './globals.css';
import { Space_Grotesk } from 'next/font/google';
import Sidebar from '@/components/Sidebar';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

export const metadata = {
  title: 'Retake CRM — Wholesale CRM',
  description:
    'CRM for managing wholesale clothing customers, orders, and products.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={spaceGrotesk.variable}>
      <body className="font-sans">
        <Sidebar />
        <div className="md:pl-[72px]">
          <main className="mx-auto max-w-7xl px-5 pb-16 pt-20 sm:px-8 md:pt-20">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
