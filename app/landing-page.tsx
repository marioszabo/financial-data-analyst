'use client'

import { Button } from "@/components/ui/button"
import { MessageSquare, ChartBar, Brain, ArrowRight, Menu } from "lucide-react"
import Link from "next/link"
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface LandingPageProps {
  basicPlanStripeLink?: string
}

interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="flex flex-col items-center text-center p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <div className="mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  )
}

export default function LandingPage({ basicPlanStripeLink }: LandingPageProps) {
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLoginRedirect = () => {
    router.push('/auth/login')
  }

  const handleSubscribe = () => {
    if (basicPlanStripeLink) {
      window.location.href = basicPlanStripeLink
    } else {
      console.error('Stripe link not provided')
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-900">
      {/* Header/Navbar */}
      <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link className="flex items-center" href="/">
              <ChartBar className="h-8 w-8 text-gray-900" />
              <span className="ml-2 text-xl font-bold text-gray-900">FinanceAI</span>
            </Link>
            <nav className="hidden md:flex space-x-8">
              <Link className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors" href="#features">Features</Link>
              <Link className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors" href="#how-it-works">How It Works</Link>
              <Link className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors" href="/pricing">Pricing</Link>
            </nav>
            <div className="hidden md:flex items-center space-x-4">
              <Button variant="outline" onClick={handleLoginRedirect}>Log In</Button>
              <Button onClick={handleSubscribe}>Get Started</Button>
            </div>
            <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <Menu className="h-6 w-6 text-gray-700" />
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden bg-white py-2 border-t border-gray-200">
            <div className="container mx-auto px-4 space-y-2">
              <Link className="block text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors" href="#features">Features</Link>
              <Link className="block text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors" href="#how-it-works">How It Works</Link>
              <Link className="block text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors" href="/pricing">Pricing</Link>
              <Button variant="outline" onClick={handleLoginRedirect} className="w-full mt-2">Log In</Button>
              <Button onClick={handleSubscribe} className="w-full mt-2">Get Started</Button>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-20 md:py-32 bg-gray-50 relative overflow-hidden">
          <div className="container px-4 md:px-6 mx-auto relative z-10">
            <div className="max-w-3xl">
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl text-gray-900 mb-6">
                Revolutionize Financial Data Analysis with AI
              </h1>
              <p className="max-w-[700px] text-gray-600 md:text-xl mb-8">
                Analyze, visualize, and interact with your data like never before using cutting-edge AI and dynamic charts.
              </p>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <Button size="lg" className="bg-gray-900 hover:bg-gray-800 text-white" onClick={handleLoginRedirect}>
                  Start Analyzing Now
                </Button>
                <Button size="lg" variant="outline" className="text-gray-900 border-gray-900 hover:bg-gray-100">
                  Watch Demo
                </Button>
              </div>
            </div>
          </div>
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 1000 1000"
            preserveAspectRatio="xMidYMid slice"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </section>

        {/* Core Features Section */}
        <section id="features" className="w-full py-20 bg-white">
          <div className="container px-4 md:px-6 mx-auto">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-center mb-12">
              Transform Your Financial Data
            </h2>
            <div className="grid gap-8 md:grid-cols-3">
              <FeatureCard
                icon={<MessageSquare className="h-10 w-10 text-gray-900" />}
                title="Chat with Your Data"
                description="Ask questions in plain English and get instant insights about your financial data."
              />
              <FeatureCard
                icon={<ChartBar className="h-10 w-10 text-gray-900" />}
                title="Instant Visualizations"
                description="Get beautiful, interactive charts and graphs that make your data easy to understand."
              />
              <FeatureCard
                icon={<Brain className="h-10 w-10 text-gray-900" />}
                title="AI-Powered Analysis"
                description="Uncover trends, patterns, and insights automatically with our advanced AI."
              />
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="w-full py-20 bg-gray-50">
          <div className="container px-4 md:px-6 mx-auto">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-center mb-12">
              Simple as 1-2-3
            </h2>
            <div className="grid gap-8 md:grid-cols-3">
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900 mb-4">1</div>
                <h3 className="text-xl font-semibold mb-2">Upload Your Data</h3>
                <p className="text-gray-600">Drop in your CSV, Excel, or JSON files</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900 mb-4">2</div>
                <h3 className="text-xl font-semibold mb-2">Ask Questions</h3>
                <p className="text-gray-600">Chat naturally with our AI about your data</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900 mb-4">3</div>
                <h3 className="text-xl font-semibold mb-2">Get Insights</h3>
                <p className="text-gray-600">Receive instant visualizations and analysis</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-20 bg-gray-900 text-white">
          <div className="container px-4 md:px-6 mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Start?</h2>
            <p className="text-xl mb-8 opacity-90">Transform your financial data into actionable insights</p>
            <Button 
              size="lg" 
              className="bg-white text-gray-900 hover:bg-gray-100" 
              onClick={handleLoginRedirect}
            >
              Try It Now <ArrowRight className="ml-2" />
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 text-gray-600 py-12">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Product</h3>
              <ul className="space-y-2">
                <li><Link href="#features" className="hover:text-gray-900">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-gray-900">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Legal</h3>
              <ul className="space-y-2">
                <li><Link href="/privacy" className="hover:text-gray-900">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-gray-900">Terms of Service</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Support</h3>
              <ul className="space-y-2">
                <li><Link href="/docs" className="hover:text-gray-900">Documentation</Link></li>
                <li><Link href="/contact" className="hover:text-gray-900">Contact</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200 text-center">
            <p>&copy; {new Date().getFullYear()} FinanceAI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
