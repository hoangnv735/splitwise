import type { Metadata } from 'next';
import { Geist } from 'next/font/google'; // Using Geist_Sans from the original setup, just renamed variable
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { cn } from '@/lib/utils';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

// Removed Geist_Mono as it's not explicitly used or requested. 
// If needed later, it can be re-added.

export const metadata: Metadata = {
  title: 'Splitwise',
  description: 'Easily split expenses for your group activities.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(geistSans.variable, "antialiased min-h-screen flex flex-col")}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
