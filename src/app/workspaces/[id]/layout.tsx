import { ReactNode } from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { prisma } from '@/lib/prisma'
import Link from "next/link"
import { SidebarNav } from "./sidebar-nav"
import { ThemeToggle } from "@/components/theme-toggle"



export default async function WorkspaceDetailsLayout({ params, children }: { params: { id: string }, children: ReactNode }) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect("/auth")

    // RBAC Check
    const membership = await prisma.workspaceMember.findUnique({
        where: {
            workspaceId_userId: {
                workspaceId: params.id,
                userId: user.id
            }
        },
        include: { workspace: true }
    })

    // Deny access if not a member
    if (!membership) {
        redirect("/workspaces")
    }

    return (
        <div className="flex bg-gray-50 dark:bg-zinc-950 min-h-[calc(100vh-73px)] border-t border-gray-200 dark:border-zinc-800">
            {/* Sidebar */}
            <aside className="w-64 bg-white dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-800 flex flex-col pt-6 hidden md:flex">
                <div className="px-6 mb-6">
                    <h2 className="text-lg font-bold truncate text-gray-900 dark:text-white" title={membership.workspace.name}>
                        {membership.workspace.name}
                    </h2>
                    <span className="text-xs text-gray-500 uppercase font-semibold mt-1 block dark:text-gray-400">{membership.role}</span>
                </div>
                <SidebarNav workspaceId={params.id} />
                <div className="mt-auto p-4 border-t border-gray-200 dark:border-zinc-800 flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Theme</span>
                    <ThemeToggle />
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-4 sm:p-8 overflow-auto">
                {children}
            </main>
        </div>
    )
}
