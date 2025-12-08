import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Putaway Pre-sortation',
  description: 'Fulfillment center putaway pre-sortation management',
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

