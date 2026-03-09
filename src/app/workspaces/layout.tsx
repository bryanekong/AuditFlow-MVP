import { ReactNode } from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { signout } from "@/app/auth/actions"
import { prisma } from "@/lib/prisma"

export default async function WorkspacesLayout({ children }: { children: ReactNode }) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect("/auth/login")
    }

    const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { onboardingCompleted: true }
    })

    if (dbUser && !dbUser.onboardingCompleted) {
        redirect("/onboarding")
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col dark:bg-zinc-950">
            <header className="border-b bg-white px-6 py-4 flex items-center justify-between dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                <Link href="/workspaces" className="font-bold text-lg dark:text-white">AuditFlow AI</Link>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500 dark:text-gray-400">{user.email}</span>
                    <form action={signout}>
                        <button className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300">
                            Sign Out
                        </button>
                    </form>
                </div>
            </header>
            <main className="flex-1 w-full mx-auto p-6">
                {children}
            </main>
        </div>
    )
}
