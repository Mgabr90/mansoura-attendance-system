/**
 * Homepage - Landing Page
 * Refactored to use modular components and modern architecture
 */

import { Suspense } from 'react'
import Link from 'next/link'
import { Button, Card } from '@/components'
import { 
  ArrowRightIcon, 
  CheckCircleIcon, 
  MapPinIcon, 
  ClockIcon, 
  ShieldCheckIcon,
  ChartBarIcon,
  UserGroupIcon,
  CogIcon
} from '@heroicons/react/24/outline'

// Loading components for better UX
const LoadingSpinner = () => (
  <div className="flex items-center justify-center">
    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
  </div>
)

// Feature component for better organization
const FeatureCard = ({ 
  icon: Icon, 
  title, 
  description 
}: {
  icon: React.ComponentType<any>
  title: string
  description: string
}) => (
  <div className="relative">
    <dt>
      <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
      <p className="ml-16 text-lg leading-6 font-medium text-gray-900">{title}</p>
    </dt>
    <dd className="mt-2 ml-16 text-base text-gray-500">
      {description}
    </dd>
  </div>
)

// Stat component for better reusability
const StatCard = ({ 
  value, 
  label, 
  description 
}: {
  value: string
  label: string
  description: string
}) => (
  <div className="flex flex-col">
    <dt className="order-2 mt-2 text-lg leading-6 font-medium text-primary-200">
      {label}
    </dt>
    <dd className="order-1 text-5xl font-extrabold text-white">
      {value}
    </dd>
    <dd className="order-3 text-sm text-primary-200">
      {description}
    </dd>
  </div>
)

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-gray-900">
                  El Mansoura CIH
                </h1>
              </div>
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-4">
                  <span className="text-gray-500 text-sm">Attendance Management System v2.0</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/admin">
                <Button variant="ghost" size="sm">
                  Admin Portal
                </Button>
              </Link>
              <Link href="/admin">
                <Button variant="primary" size="sm">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main>
        <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
          <div className="relative pt-6 pb-16 sm:pb-24">
            <div className="mt-16 mx-auto max-w-7xl px-4 sm:mt-24 sm:px-6">
              <div className="text-center">
                <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                  <span className="block">Modern Attendance</span>
                  <span className="block text-primary-600">Management System</span>
                </h1>
                <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
                  Streamline your workforce management with our Telegram-integrated attendance system. 
                  Real-time location verification, automated reporting, and seamless employee experience.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="https://t.me/CIH_Mansoura_bot"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button 
                      variant="primary" 
                      size="lg" 
                      fullWidth
                      rightIcon={<ArrowRightIcon className="h-5 w-5" />}
                    >
                      Start with Telegram Bot
                    </Button>
                  </Link>
                  <Link href="/admin">
                    <Button 
                      variant="outline" 
                      size="lg" 
                      fullWidth
                      rightIcon={<ChartBarIcon className="h-5 w-5" />}
                    >
                      Admin Dashboard
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:text-center">
              <h2 className="text-base text-primary-600 font-semibold tracking-wide uppercase">Features</h2>
              <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                Everything you need for attendance management
              </p>
              <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
                Our system combines modern technology with user-friendly design to make attendance tracking effortless.
              </p>
            </div>

            <div className="mt-10">
              <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
                <FeatureCard
                  icon={MapPinIcon}
                  title="Location-Based Verification"
                  description="Precise GPS validation ensures employees are physically present at the office location. 100-meter radius verification with real-time distance calculation."
                />
                <FeatureCard
                  icon={ClockIcon}
                  title="Real-Time Tracking"
                  description="Instant check-in/check-out with automatic working hours calculation. Late arrival and early departure detection with reason collection."
                />
                <FeatureCard
                  icon={CheckCircleIcon}
                  title="Telegram Integration"
                  description="Easy-to-use Telegram bot interface. No additional apps required - employees use Telegram for all attendance operations."
                />
                <FeatureCard
                  icon={ShieldCheckIcon}
                  title="Secure & Reliable"
                  description="Enterprise-grade security with encrypted data transmission. Comprehensive audit trails and admin controls."
                />
              </dl>
            </div>
          </div>
        </div>

        {/* New Modular Features Section */}
        <div className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:text-center mb-12">
              <h2 className="text-base text-primary-600 font-semibold tracking-wide uppercase">System Architecture</h2>
              <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                Modern, Modular & Scalable
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card variant="elevated" padding="lg">
                <Card.Header>
                  <div className="flex items-center">
                    <CogIcon className="h-8 w-8 text-primary-600 mr-3" />
                    <Card.Title className="text-xl">Modular Design</Card.Title>
                  </div>
                </Card.Header>
                <Card.Body>
                  <p className="text-gray-600">
                    Clean, separated modules for components, services, and utilities. 
                    Easy to maintain, test, and extend.
                  </p>
                </Card.Body>
              </Card>

              <Card variant="elevated" padding="lg">
                <Card.Header>
                  <div className="flex items-center">
                    <UserGroupIcon className="h-8 w-8 text-primary-600 mr-3" />
                    <Card.Title className="text-xl">Team Collaboration</Card.Title>
                  </div>
                </Card.Header>
                <Card.Body>
                  <p className="text-gray-600">
                    Structured for team development with clear boundaries, 
                    consistent patterns, and comprehensive documentation.
                  </p>
                </Card.Body>
              </Card>

              <Card variant="elevated" padding="lg">
                <Card.Header>
                  <div className="flex items-center">
                    <ChartBarIcon className="h-8 w-8 text-primary-600 mr-3" />
                    <Card.Title className="text-xl">Performance</Card.Title>
                  </div>
                </Card.Header>
                <Card.Body>
                  <p className="text-gray-600">
                    Optimized bundle splitting, lazy loading, and efficient 
                    state management for optimal performance.
                  </p>
                </Card.Body>
              </Card>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-primary-600">
          <div className="max-w-7xl mx-auto py-12 px-4 sm:py-16 sm:px-6 lg:px-8 lg:py-20">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
                Trusted by El Mansoura CIH
              </h2>
              <p className="mt-3 text-xl text-primary-200 sm:mt-4">
                Modern attendance management for the digital workplace
              </p>
            </div>
            <dl className="mt-10 text-center sm:max-w-3xl sm:mx-auto sm:grid sm:grid-cols-3 sm:gap-8">
              <StatCard
                value="100m"
                label="Office Location"
                description="Precision radius"
              />
              <StatCard
                value="9-17"
                label="Work Hours"
                description="Standard schedule"
              />
              <StatCard
                value="<1s"
                label="Response Time"
                description="Bot response"
              />
            </dl>
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-white">
          <div className="max-w-7xl mx-auto text-center py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              <span className="block">Ready to get started?</span>
              <span className="block text-primary-600">Join our Telegram bot today.</span>
            </h2>
            <div className="mt-8 flex justify-center">
              <Link
                href="https://t.me/CIH_Mansoura_bot"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button 
                  variant="primary" 
                  size="lg"
                  rightIcon={<ArrowRightIcon className="h-5 w-5" />}
                >
                  Get Started Now
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
          <div className="xl:grid xl:grid-cols-3 xl:gap-8">
            <div className="space-y-8 xl:col-span-1">
              <div>
                <h3 className="text-white text-lg font-semibold">
                  El Mansoura CIH
                </h3>
                <p className="mt-2 text-gray-300 text-sm">
                  Modern attendance management system with Telegram integration.
                </p>
              </div>
            </div>
            <div className="mt-12 grid grid-cols-2 gap-8 xl:mt-0 xl:col-span-2">
              <div>
                <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">
                  System
                </h3>
                <ul className="mt-4 space-y-4">
                  <li>
                    <Link href="/admin" className="text-base text-gray-300 hover:text-white">
                      Admin Dashboard
                    </Link>
                  </li>
                  <li>
                    <span className="text-base text-gray-300">
                      Version 2.0.0
                    </span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">
                  Contact
                </h3>
                <ul className="mt-4 space-y-4">
                  <li>
                    <Link 
                      href="https://t.me/CIH_Mansoura_bot" 
                      className="text-base text-gray-300 hover:text-white"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Telegram Bot
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-12 border-t border-gray-700 pt-8">
            <p className="text-base text-gray-400 xl:text-center">
              &copy; 2024 El Mansoura CIH. Modern modular attendance system.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
} 