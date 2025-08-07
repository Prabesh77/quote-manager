'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { FileText, BarChart3, CheckCircle, Users } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();

  // For quotes app, we don't need authentication
  // Users can directly access the quotes app
  const handleGetStarted = () => {
    router.push('/quotes/new');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <FileText className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Quote Management</h1>
                <p className="text-sm text-gray-500">Professional quote system</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Quote Management
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            A comprehensive quote management system for creating and tracking quotes.
            Streamline your quote operations with our modern interface.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <FileText className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Create Quotes</h3>
            <p className="text-gray-600">
              Create detailed quotes with multiple parts, pricing, and customer information in a modern interface.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Track Orders</h3>
            <p className="text-gray-600">
              Monitor quote status, track orders, and manage the complete quote-to-order workflow.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Complete Workflow</h3>
            <p className="text-gray-600">
              From quote creation to order completion with delivery tracking and status management.
            </p>
          </div>
        </div>

        {/* Login Options */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-md mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Sign In</h2>
          <div className="space-y-4">
            <Button
              onClick={handleGetStarted}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              <Users className="h-4 w-4 mr-2" />
              Get Started with Quotes
            </Button>
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Don't have an account? Contact your administrator.
              </p>
            </div>
          </div>
        </div>

        {/* Legacy App Link */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 mb-2">
            Looking for the quote management system?
          </p>
          <Button
            onClick={() => router.push('/quotes')}
            variant="outline"
            size="sm"
          >
            Go to Quote Manager
          </Button>
        </div>
      </div>
    </div>
  );
}
