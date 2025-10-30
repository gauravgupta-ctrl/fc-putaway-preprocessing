import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Putaway Preprocess',
  description: 'Fulfillment center putaway process management',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}

