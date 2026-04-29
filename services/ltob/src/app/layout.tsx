import type { Metadata } from 'next'
import { Inter, Caveat } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const caveat = Caveat({ subsets: ['latin'], variable: '--font-caveat' })

export const metadata: Metadata = {
  title: 'LTO Archive',
  description: 'Visual LTO tape cartridge database',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${caveat.variable}`}>
      <body className="bg-bg text-text antialiased min-h-screen">
        {children}
      </body>
    </html>
  )
}
