import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'

async function testClassesAPI() {
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/classes`, {
      cache: 'no-store'
    })
    const data = await response.json()
    return { success: response.ok, data }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

async function testAssignmentsAPI() {
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/home/assignments`, {
      cache: 'no-store'
    })
    const data = await response.json()
    return { success: response.ok, data }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

async function testDirectSupabase() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .limit(3)

    return { success: !error, data: data || [], error }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

export default async function TestAPIs() {
  const classesResult = await testClassesAPI()
  const assignmentsResult = await testAssignmentsAPI()
  const directSupabaseResult = await testDirectSupabase()

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">API Integration Tests</h1>

      <div className="grid gap-6 mb-8">
        {/* Test Results */}
        <div className="p-6 bg-white border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>

          <div className="space-y-4">
            <div className={`p-4 rounded ${classesResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border`}>
              <h3 className="font-semibold">Classes API</h3>
              <p className={classesResult.success ? 'text-green-600' : 'text-red-600'}>
                {classesResult.success ? '✅ Success' : '❌ Failed'}
              </p>
              {classesResult.data?.classes && (
                <p className="text-sm text-gray-600">
                  Found {classesResult.data.classes.length} classes
                </p>
              )}
              {!classesResult.success && (
                <p className="text-sm text-red-600">{classesResult.error}</p>
              )}
            </div>

            <div className={`p-4 rounded ${assignmentsResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border`}>
              <h3 className="font-semibold">Assignments API</h3>
              <p className={assignmentsResult.success ? 'text-green-600' : 'text-red-600'}>
                {assignmentsResult.success ? '✅ Success' : '❌ Failed'}
              </p>
              {assignmentsResult.data?.assignments && (
                <p className="text-sm text-gray-600">
                  Found {assignmentsResult.data.assignments.length} assignments
                </p>
              )}
              {!assignmentsResult.success && (
                <p className="text-sm text-red-600">{assignmentsResult.error}</p>
              )}
            </div>

            <div className={`p-4 rounded ${directSupabaseResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border`}>
              <h3 className="font-semibold">Direct Supabase Connection</h3>
              <p className={directSupabaseResult.success ? 'text-green-600' : 'text-red-600'}>
                {directSupabaseResult.success ? '✅ Success' : '❌ Failed'}
              </p>
              {directSupabaseResult.data && (
                <p className="text-sm text-gray-600">
                  Connected successfully, {directSupabaseResult.data.length} classes found
                </p>
              )}
              {!directSupabaseResult.success && (
                <p className="text-sm text-red-600">{typeof directSupabaseResult.error === 'string' ? directSupabaseResult.error : JSON.stringify(directSupabaseResult.error)}</p>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="p-6 bg-white border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="flex gap-4 flex-wrap">
            <Link
              href="/test-supabase"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            >
              Test Supabase Connection
            </Link>
            <Link
              href="/api/classes"
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
            >
              View Classes API
            </Link>
            <Link
              href="/api/home/assignments"
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition"
            >
              View Assignments API
            </Link>
          </div>
        </div>

        {/* Raw Data */}
        <div className="p-6 bg-white border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Raw Data</h2>
          <div className="space-y-4">
            <details className="border rounded p-4">
              <summary className="cursor-pointer font-medium">Classes Response</summary>
              <pre className="mt-2 text-xs overflow-auto bg-gray-50 p-2 rounded">
                {JSON.stringify(classesResult, null, 2)}
              </pre>
            </details>

            <details className="border rounded p-4">
              <summary className="cursor-pointer font-medium">Assignments Response</summary>
              <pre className="mt-2 text-xs overflow-auto bg-gray-50 p-2 rounded">
                {JSON.stringify(assignmentsResult, null, 2)}
              </pre>
            </details>

            <details className="border rounded p-4">
              <summary className="cursor-pointer font-medium">Direct Supabase Response</summary>
              <pre className="mt-2 text-xs overflow-auto bg-gray-50 p-2 rounded">
                {JSON.stringify(directSupabaseResult, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      </div>
    </div>
  )
}