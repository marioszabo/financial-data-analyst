import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ChartBar, FileText, PieChart, BarChart, LineChart, ArrowRight } from "lucide-react"
import Link from "next/link"
import { useRouter } from 'next/navigation'

// At the top of the file, add or update the interface:
interface LandingPageProps {
  basicPlanStripeLink?: string; // Make this prop optional
}

// Update the component definition:
export default function LandingPage({ basicPlanStripeLink }: LandingPageProps) {
  const router = useRouter();

  const handleLoginRedirect = () => {
    router.push('/auth/login');
  };

  const handleSubscribe = () => {
    if (basicPlanStripeLink) {
      window.location.href = basicPlanStripeLink;
    } else {
      // Handle the case where the link is not provided
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
              {/* Feature 1: Intelligent Analysis */}
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-gray-900">Intelligent Analysis</h3>
                <p className="text-gray-600">
                  Powered by state-of-the-art AI to extract insights from your data. Our advanced algorithms process and analyze your financial information, uncovering patterns and trends you might have missed.
                </p>
              </div>
              <div className="rounded-lg overflow-hidden shadow-lg">
                <video
                  className="w-full h-auto"
                  src="https://lutra.ai/assets/lutra-usp-2.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                />
              </div>

              {/* Feature 2: Multi-Format Upload */}
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-gray-900">Multi-Format Upload</h3>
                <p className="text-gray-600">
                  Upload .txt, .csv, PDF, and images to analyze financial data with ease. Our platform supports various file formats, making it simple to import and process your financial documents and datasets.
                </p>
              </div>
              <div className="https://lutra.ai/assets/lutra-usp-2.mp4">
                <video
                  className="w-full h-auto"
                  src="/videos/multi-format-upload.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                />
              </div>

              {/* Feature 3: Interactive Charts */}
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-gray-900">Interactive Charts</h3>
                <p className="text-gray-600">
                  Generate line, bar, pie, and area charts to explore trends and patterns. Our interactive visualization tools bring your data to life, allowing you to gain deeper insights and make informed decisions.
                </p>
              </div>
              <div className="rounded-lg overflow-hidden shadow-lg">
                <video
                  className="w-full h-auto"
                  src="https://lutra.ai/assets/lutra-usp-2.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                />
              </div>

              {/* Feature 4: Custom Insights */}
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-gray-900">Custom Insights</h3>
                <p className="text-gray-600">
                  Ask specific questions and get detailed visual answers. Our AI-powered system can understand complex queries and provide tailored insights, complete with relevant charts and explanations.
                </p>
              </div>
              <div className="rounded-lg overflow-hidden shadow-lg">
                <video
                  className="w-full h-auto"
                  src="https://lutra.ai/assets/lutra-usp-2.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                />
              </div>
            </div>
          </div>
        </section>

        {/* Use Cases Section */}
        <section id="use-cases" className="w-full py-12 md:py-24 lg:py-32 bg-gray-50">
          <div className="container px-4 md:px-6 mx-auto">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-center text-gray-900 mb-8">Adaptable to Your Needs</h2>
            <p className="text-xl text-center mb-12 text-gray-600">Whether you're analyzing financial data or tracking sports performance, our tool fits a wide variety of applications.</p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-12">
              {/* Use case cards */}
              <UseCaseCard
                icon={<LineChart className="w-10 h-10 text-blue-600" />}
                title="Financial Analysis"
                description="Upload financial documents, extract key metrics, and visualize trends."
              />
              <UseCaseCard
                icon={<BarChart className="w-10 h-10 text-blue-600" />}
                title="Environmental Data"
                description="Analyze climate change trends and visualize pollution levels."
              />
              <UseCaseCard
                icon={<PieChart className="w-10 h-10 text-blue-600" />}
                title="Sports Performance"
                description="Track athlete data, visualize key metrics, and analyze team statistics."
              />
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-50">
          <div className="container px-4 md:px-6 mx-auto">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-center text-gray-900 mb-8">Frequently Asked Questions</h2>
            <div className="max-w-3xl mx-auto space-y-4">
              {/* FAQ items */}
              <FAQItem
                question="What kind of data can FinanceAI analyze?"
                answer="FinanceAI can analyze a wide range of financial data, including market trends, company financials, economic indicators, and more. Our tool supports various file formats like CSV, PDF, and images."
              />
              <FAQItem
                question="How does the AI-powered analysis work?"
                answer="Our AI uses advanced machine learning algorithms to process and analyze your data. It can identify patterns, trends, and correlations that might not be immediately apparent, providing you with deeper insights into your financial data."
              />
              <FAQItem
                question="Can I customize the visualizations?"
                answer="Yes, you can customize the visualizations to suit your needs. You can choose from various chart types, adjust data ranges, and even ask specific questions to get tailored visual representations of your data."
              />
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
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <span className="text-2xl font-semibold">FinanceAI</span>
            </div>
            <nav className="flex flex-wrap justify-center md:justify-end space-x-6">
              <Link className="hover:text-gray-900 transition-colors" href="#features">Features</Link>
              <Link className="hover:text-gray-900 transition-colors" href="#use-cases">Use Cases</Link>
              <Link className="hover:text-gray-900 transition-colors" href="/pricing">Pricing</Link>
              <Link className="hover:text-gray-900 transition-colors" href="#">Contact</Link>
            </nav>
          </div>
          <div className="mt-8 text-center">
            <p>&copy; 2024 FinanceAI. All rights reserved.</p>
          </div>
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
