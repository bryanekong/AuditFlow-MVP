import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-5xl font-black mb-6 text-gray-900 dark:text-white tracking-tight">AuditFlow AI</h1>
      <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl">
        The simplest way for SMEs to prepare for ISO 27001 and GDPR audits. Ingest, scan, and export Auditor Packs in seconds.
      </p>

      {user ? (
        <Link href="/workspaces" className="rounded-full bg-black px-8 py-3 text-lg font-semibold text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 transition-transform hover:scale-105 active:scale-95 shadow-lg">
          Go to Workspaces
        </Link>
      ) : (
        <div className="flex gap-4">
          <Link href="/auth/login" className="rounded-full bg-white border border-gray-200 px-8 py-3 text-lg font-semibold text-black hover:bg-gray-50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-white dark:hover:bg-zinc-800 transition-transform hover:scale-105 active:scale-95 shadow-sm">
            Log In
          </Link>
          <Link href="/auth/signup" className="rounded-full bg-black px-8 py-3 text-lg font-semibold text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 transition-transform hover:scale-105 active:scale-95 shadow-lg">
            Get Started
          </Link>
        </div>
      )}
    </div>
  )
}
