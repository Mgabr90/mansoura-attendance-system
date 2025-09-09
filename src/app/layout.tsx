/**
 * Root Layout - Application Shell
 * Provides global providers, styles, and modular architecture setup
 */

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/src/hooks/useAuth'
import { Suspense } from 'react'

const inter = Inter({ subsets: ['latin'] })

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#2563eb'
}

export const metadata: Metadata = {
  title: {
    template: '%s | El Mansoura CIH Attendance System',
    default: 'El Mansoura CIH Attendance System'
  },
  description: 'Modern, modular attendance management system with Telegram integration. Real-time location verification, automated reporting, and seamless employee experience.',
  keywords: ['attendance', 'telegram', 'management', 'employees', 'location', 'tracking'],
  authors: [{ name: 'El Mansoura CIH' }],
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL,
    title: 'El Mansoura CIH Attendance System',
    description: 'Modern attendance management with Telegram integration',
    siteName: 'El Mansoura CIH Attendance System'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'El Mansoura CIH Attendance System',
    description: 'Modern attendance management with Telegram integration'
  }
}

// Loading component for better UX
const GlobalLoading = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
      <p className="mt-4 text-gray-600">Loading...</p>
    </div>
  </div>
)

// Error boundary component
const _ErrorFallback = ({ error }: { error: Error }) => (
  <div className="min-h-screen flex items-center justify-center bg-red-50">
    <div className="text-center">
      <h2 className="text-xl font-semibold text-red-600 mb-2">
        Something went wrong
      </h2>
      <p className="text-gray-600 mb-4">
        {error.message || 'An unexpected error occurred'}
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
      >
        Reload Page
      </button>
    </div>
  </div>
)

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        {/* Additional meta tags for better SEO */}
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://api.telegram.org" />
        <link rel="dns-prefetch" href="https://api.telegram.org" />
      </head>
      <body className={`${inter.className} h-full antialiased`}>
        {/* Global Providers */}
        <Suspense fallback={<GlobalLoading />}>
          <AuthProvider>
            {/* Main Application Content */}
            <div id="app-root" className="min-h-full">
              {children}
            </div>
            
            {/* Global Modals Portal */}
            <div id="modal-root" />
            
            {/* Toast Notifications Portal */}
            <div id="toast-root" />
          </AuthProvider>
        </Suspense>

        {/* Development Tools (only in development) */}
        {process.env.NODE_ENV === 'development' && (
          <Suspense fallback={null}>
            <DevTools />
          </Suspense>
        )}

        {/* Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('SW registered: ', registration);
                    })
                    .catch(function(registrationError) {
                      console.log('SW registration failed: ', registrationError);
                    });
                });
              }
            `
          }}
        />
      </body>
    </html>
  )
}

// Development tools component (lazy loaded)
const DevTools = () => {
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-gray-800 text-white p-2 rounded text-xs">
        <div>Mode: Development</div>
        <div>Version: 2.0.0</div>
        <div>Modular: ✅</div>
      </div>
    </div>
  )
} 