import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ChartBar, FileText, PieChart, BarChart, LineChart, ArrowRight } from "lucide-react"
import Link from "next/link"
import { useRouter } from 'next/navigation'

// Define props for the LandingPage component
interface LandingPageProps {
  basicPlanStripeLink?: string; // Optional Stripe link for the basic plan
}

export default function LandingPage({ basicPlanStripeLink }: LandingPageProps) {
  const router = useRouter();

  // Handler for redirecting to the login page
  const handleLoginRedirect = () => {
    router.push('/auth/login');
  };

  // Handler for initiating the subscription process
  const handleSubscribe = () => {
    if (basicPlanStripeLink) {
      window.location.href = basicPlanStripeLink;
    } else {
      // Log an error if the Stripe link is not provided
      console.error('Stripe link not provided');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-900">
      {/* Sticky Navbar */}
      <header className="sticky top-4 z-50 w-full flex justify-center px-4">
        <nav className="w-full max-w-6xl bg-white bg-opacity-70 backdrop-blur-md shadow-sm rounded-full px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between">
          {/* Logo and brand name */}
          <Link className="flex items-center justify-center" href="/">
            <span className="ml-2 text-xl sm:text-2xl font-bold text-gray-900">FinanceAI</span>
          </Link>
          {/* Navigation links */}
          <div className="flex flex-wrap gap-4 sm:gap-6 mt-2 sm:mt-0">
            <Link className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors" href="#features">
              Features
            </Link>
            <Link className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors" href="#use-cases">
              Use Cases
            </Link>
            <Link className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors" href="/pricing">
              Pricing
            </Link>
            <Link className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors" href="#">
              Contact
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gray-50">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  Revolutionize Financial Data Analysis with AI & Interactive Visualization
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-600 md:text-xl dark:text-gray-400">
                  Analyze, visualize, and interact with your data like never before using cutting-edge AI and dynamic charts.
                </p>
              </div>
              {/* Call-to-action buttons */}
              <div className="space-x-4">
                <Button className="bg-gray-900 text-white hover:bg-gray-800" onClick={handleLoginRedirect}>
                  Start Analyzing Now
                </Button>
                <Button variant="outline" className="text-gray-900 border-gray-900 hover:bg-gray-100">Learn More</Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-white">
          <div className="container px-4 md:px-6 mx-auto">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-center mb-12">Unlock Powerful Insights</h2>
            <div className="grid gap-12 lg:grid-cols-2">
              {/* Feature cards for Intelligent Analysis, Multi-Format Upload, Interactive Charts, and Custom Insights */}
              {/* Each feature includes a description and a video demonstration */}
              {/* ... (feature cards) ... */}
            </div>
          </div>
        </section>

        {/* Use Cases Section */}
        <section id="use-cases" className="w-full py-12 md:py-24 lg:py-32 bg-gray-50">
          <div className="container px-4 md:px-6 mx-auto">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-center text-gray-900 mb-8">Adaptable to Your Needs</h2>
            <p className="text-xl text-center mb-12 text-gray-600">Whether you're analyzing financial data or tracking sports performance, our tool fits a wide variety of applications.</p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-12">
              {/* Use case cards for Financial Analysis, Environmental Data, and Sports Performance */}
              {/* ... (use case cards) ... */}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-50">
          <div className="container px-4 md:px-6 mx-auto">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-center text-gray-900 mb-8">Frequently Asked Questions</h2>
            <div className="max-w-3xl mx-auto space-y-4">
              {/* FAQ items addressing common questions about the platform */}
              {/* ... (FAQ items) ... */}
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-white text-black">
          <div className="container px-4 md:px-6 mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Revolutionize Your Data Analysis?</h2>
            <p className="text-xl mb-8">Get started today and explore powerful insights from your financial data.</p>
            <Button className="bg-gray-900 text-white hover:bg-gray-800" onClick={handleLoginRedirect}>
              Sign Up Now <ArrowRight className="ml-2" />
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 text-gray-600 py-8">
        <div className="container mx-auto px-4 md:px-6">
          {/* Footer content with links and copyright information */}
          {/* ... (footer content) ... */}
        </div>
      </footer>
    </div>
  )
}

// Component for rendering feature cards
function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <Card className="bg-white">
      <CardContent className="flex flex-col items-center space-y-4 p-6 text-center">
        {icon}
        <h3 className="text-xl font-bold text-gray-900">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </CardContent>
    </Card>
  )
}

// Component for rendering use case cards
function UseCaseCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <Card className="bg-white">
      <CardContent className="flex flex-col items-center space-y-4 p-6 text-center">
        {icon}
        <h3 className="text-xl font-bold text-gray-900">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </CardContent>
    </Card>
  )
}

// Component for rendering FAQ items
function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group">
      <summary className="flex cursor-pointer items-center justify-between rounded-lg bg-white p-4 text-lg font-medium text-gray-900">
        {question}
        <svg
          className="h-5 w-5 transition duration-300 group-open:rotate-180"
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </summary>
      <p className="mt-4 px-4 text-gray-600">{answer}</p>
    </details>
  )
}
