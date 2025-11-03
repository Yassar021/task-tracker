'use client'

import { useState } from 'react'

export default function SetupSampleDataPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message?: string; error?: string; results?: { classesInserted?: number; assignmentsInserted?: number; classAssignmentsInserted?: number } } | null>(null)

  const handleSetupData = async () => {
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/setup-sample-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()
      setResult(data)

    } catch (error) {
      setResult({
        success: false,
        error: 'Failed to setup sample data'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-center mb-6">Setup Sample Data</h1>

        <div className="space-y-4">
          <p className="text-sm text-gray-600 text-center">
            This will create sample classes and assignments in your Supabase database.
          </p>

          <button
            onClick={handleSetupData}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Setting up data...' : 'Setup Sample Data'}
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
                <div className="mt-2 text-xs">
                  <p>Classes: {result.results?.classesInserted || 0}</p>
                  <p>Assignments: {result.results?.assignmentsInserted || 0}</p>
                  <p>Class Assignments: {result.results?.classAssignmentsInserted || 0}</p>
                </div>
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
          <p className="font-semibold mb-2">What will be created:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>18 classes (grades 7-9)</li>
            <li>Sample assignments for current week</li>
            <li>Class assignments linking</li>
          </ul>
          <p className="mt-2">
            After setup, visit <a href="/admin" className="text-blue-600 hover:underline">admin dashboard</a> to see the data.
          </p>
        </div>
      </div>
    </div>
  )
}