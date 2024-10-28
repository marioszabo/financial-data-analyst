'use client'

import { Button } from "@/components/ui/button"
import { useState } from "react"

export function TestSubscriptionButton() {
  const [testResult, setTestResult] = useState<any>(null)

  const testSubscription = async () => {
    try {
      const response = await fetch('/api/test-subscription')
      const data = await response.json()
      console.log('Subscription test results:', data)
      setTestResult(data)
    } catch (error) {
      console.error('Test failed:', error)
      setTestResult({ error: 'Test failed' })
    }
  }

  return (
    <div className="space-y-2">
      <Button 
        onClick={testSubscription}
        variant="outline"
        className="w-full"
      >
        Test Subscription Status
      </Button>
      {testResult && (
        <pre className="p-4 bg-gray-100 rounded text-sm overflow-auto">
          {JSON.stringify(testResult, null, 2)}
        </pre>
      )}
    </div>
  )
}
