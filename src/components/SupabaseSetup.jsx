import React from 'react'
import { Database, ExternalLink, Copy, CheckCircle } from 'lucide-react'

const SupabaseSetup = () => {
  const [copied, setCopied] = React.useState(false)

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const envTemplate = `# Replace these with your actual Supabase project credentials
# Get them from: https://supabase.com/dashboard/project/YOUR-PROJECT/settings/api
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here`

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto h-16 w-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
              <Database className="h-8 w-8 text-primary-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Supabase Setup Required</h1>
            <p className="text-gray-600 mt-2">
              Please configure your Supabase credentials to use the BillSprout Smart ERP system
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-primary-600">1</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Create a Supabase Project</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Go to{' '}
                  <a 
                    href="https://supabase.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-700 inline-flex items-center"
                  >
                    supabase.com <ExternalLink className="h-3 w-3 ml-1" />
                  </a>{' '}
                  and create a new project
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-primary-600">2</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Get Your Credentials</h3>
                <p className="text-sm text-gray-600 mt-1">
                  In your Supabase dashboard, go to <strong>Settings → API</strong> and copy:
                </p>
                <ul className="text-sm text-gray-600 mt-2 space-y-1">
                  <li>• <strong>Project URL</strong> (looks like: https://abcdef.supabase.co)</li>
                  <li>• <strong>anon public</strong> key (long JWT token)</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-primary-600">3</span>
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">Update Your .env File</h3>
                <p className="text-sm text-gray-600 mt-1 mb-3">
                  Replace the placeholder values in your <code className="bg-gray-100 px-1 rounded">.env</code> file:
                </p>
                <div className="relative">
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
{envTemplate}
                  </pre>
                  <button
                    onClick={() => copyToClipboard(envTemplate)}
                    className="absolute top-2 right-2 p-2 bg-gray-700 hover:bg-gray-600 rounded text-gray-300 hover:text-white transition-colors"
                    title="Copy to clipboard"
                  >
                    {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-primary-600">4</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Set Up Database</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Run the <code className="bg-gray-100 px-1 rounded">supabase-schema.sql</code> file in your Supabase SQL Editor to create all tables
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-primary-600">5</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Restart Development Server</h3>
                <p className="text-sm text-gray-600 mt-1">
                  After updating the .env file, restart your development server to load the new credentials
                </p>
              </div>
            </div>
          </div>

          {/* Help */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center">
              Need help? Check the{' '}
              <code className="bg-gray-100 px-1 rounded">README.md</code> file for detailed setup instructions
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SupabaseSetup