'use client'

import { useState } from 'react'

export default function SetupAdmin() {
  const [email, setEmail] = useState('admin@ypssingkole.sch.id')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<unknown>(null)

  const handleSetupAdmin = async () => {
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/setup-admin', {
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
        error: 'Failed to setup admin user'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-center mb-6">Setup Admin User</h1>

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
              placeholder="Enter admin password"
            />
          </div>

          <button
            onClick={handleSetupAdmin}
            disabled={loading || !email || !password}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Creating Admin User...' : 'Create Admin User'}
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
                {result.user && (
                  <div className="mt-2 text-xs">
                    <p>User ID: {result.user.id}</p>
                    <p>Email: {result.user.email}</p>
                    <p>Email Confirmed: {result.user.email_confirmed ? 'Yes' : 'No'}</p>
                  </div>
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
            <li>Enter admin email and password</li>
            <li>Click &quot;Create Admin User&quot;</li>
            <li>Once created, go to login page and sign in</li>
            <li>After login, you should have admin access</li>
          </ol>
        </div>
      </div>
    </div>
  )
}