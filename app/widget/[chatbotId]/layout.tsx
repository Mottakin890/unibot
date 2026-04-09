import '@/app/globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'UniBot Widget',
}

export default function WidgetLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <body className="bg-card m-0 p-0 overflow-hidden">{children}</body>
    </html>
  )
}
