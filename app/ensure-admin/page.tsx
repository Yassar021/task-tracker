'use client'

import { useState } from 'react'

export default function EnsureAdmin() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [email, setEmail] = useState('admin@ypssingkole.sch.id')
  const [password, setPassword] = useState('admin123')

  const handleEnsureAdmin = async () => {
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/ensure-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()
      setResult(data)

    } catch (error) {
      setResult({
        success: false,
        error: 'Failed to ensure admin user'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-center mb-6">Ensure Admin User</h1>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Admin Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="admin@ypssingkole.sch.id"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="admin123"
            />
          </div>

          <button
            onClick={handleEnsureAdmin}
            disabled={loading || !email || !password}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Processing...' : 'Ensure Admin User'}
          </button>
        </div>

        {result && (
          <div className={`mt-4 p-3 rounded-md text-sm ${
            result.success ? 'bg-green-50 text-green-800 border border-green-200' :
            'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {result.success ? (
              <div>
                <p className="font-semibold">✅ Success!</p>
                <p>{result.message}</p>
                {result.action && (
                  <p className="mt-2 text-xs"><strong>Action:</strong> {result.action}</p>
                )}
              </div>
            ) : (
              <div>
                <p className="font-semibold">❌ Error</p>
                <p>{result.error}</p>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 text-xs text-gray-500 border-t pt-4">
          <p className="font-semibold mb-2">Instructions:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Click "Ensure Admin User" to create admin account</li>
            <li>Once created, go to <a href="/sign-in" className="text-blue-600 hover:underline">login page</a></li>
            <li>Login with email and password above</li>
            <li>You should have admin access</li>
          </ol>
        </div>
      </div>
    </div>
  )
}