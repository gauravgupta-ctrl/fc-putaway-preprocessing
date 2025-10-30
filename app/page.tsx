export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Putaway Preprocess</h1>
        <p className="text-lg text-gray-600 mb-8">
          Welcome! Please follow the setup instructions in SETUP.md
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-2xl mx-auto">
          <h2 className="text-xl font-semibold mb-4 text-blue-900">
            Next Steps:
          </h2>
          <ol className="list-decimal list-inside text-left space-y-2 text-blue-800">
            <li>Install Node.js from nodejs.org</li>
            <li>Create Supabase account at supabase.com</li>
            <li>Create Resend account at resend.com</li>
            <li>Add credentials to .env.local file</li>
            <li>Run: npm install && npm run dev</li>
          </ol>
        </div>
      </div>
    </main>
  )
}

