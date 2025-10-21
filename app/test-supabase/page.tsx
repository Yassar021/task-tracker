import { createClient } from '@/utils/supabase/server'

export default async function TestSupabase() {
  const supabase = await createClient()

  // Test connection dengan query simple
  const { data, error } = await supabase
    .from('classes')
    .select('*')
    .limit(5)

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Supabase Connection Test</h1>

      <div className="space-y-4">
        <div className="p-4 bg-gray-100 rounded">
          <h2 className="font-semibold mb-2">Connection Status:</h2>
          {error ? (
            <div className="text-red-600">
              <p>❌ Connection Failed</p>
              <p className="text-sm">{error.message}</p>
            </div>
          ) : (
            <div className="text-green-600">
              <p>✅ Connection Successful</p>
            </div>
          )}
        </div>

        <div className="p-4 bg-gray-100 rounded">
          <h2 className="font-semibold mb-2">Test Data (Classes):</h2>
          <pre className="text-xs overflow-auto bg-white p-2 rounded">
            {JSON.stringify({ data, error }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
}