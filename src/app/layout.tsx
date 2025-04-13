// src/app/layout.tsx
import './globals.css'
import React from 'react'
import Providers from '@/components/Providers'

export const metadata = {
  title: 'FSY Portal',
  description: 'FSY Portal Application',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
