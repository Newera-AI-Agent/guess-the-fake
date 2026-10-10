import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Guess the Fake',
  description: 'Can you spot the AI-generated image? Test your visual perception in this fast-paced game.',
  openGraph: {
    title: 'Guess the Fake',
    description: 'Can you spot the AI-generated image? Test your visual perception in this fast-paced game.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: '#0a0f1a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://image.pollinations.ai" />
      </head>
      <body className="min-h-screen bg-dark-950 text-dark-50 antialiased">
        {children}
      </body>
    </html>
  )
}
