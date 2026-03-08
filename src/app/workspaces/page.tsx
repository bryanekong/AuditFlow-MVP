import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { createWorkspace } from './actions'



export default async function WorkspacesList() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const memberships = await prisma.workspaceMember.findMany({
        where: { userId: user.id },
        include: { workspace: true },
        orderBy: { workspace: { createdAt: 'desc' } }
    })

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Your Workspaces</h1>
            </div>

            {memberships.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {memberships.map((m) => (
                        <Link key={m.workspaceId} href={`/workspaces/${m.workspaceId}`} className="block border rounded-lg p-6 hover:shadow-md transition bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 group">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 group-hover:text-black dark:group-hover:text-white">{m.workspace.name}</h2>
                            <p className="text-sm text-gray-500 mt-2 dark:text-gray-400">Role: {m.role}</p>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="text-center p-12 border border-dashed rounded-lg bg-white dark:bg-zinc-900 border-gray-300 dark:border-zinc-800">
                    <p className="text-gray-500 mb-4 dark:text-gray-400">You don't belong to any workspaces yet.</p>
                </div>
            )}

            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-6 rounded-lg max-w-md mt-12 shadow-sm">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Create Workspace</h3>
                <form action={createWorkspace} className="space-y-4">
                    <div>
                        <input type="text" name="name" required placeholder="Workspace Name" className="w-full rounded-md border py-2 px-3 text-sm focus:ring-1 focus:ring-black border-gray-300 text-gray-900 dark:bg-zinc-950 dark:border-zinc-700 dark:text-white" />
                    </div>
                    <button type="submit" className="w-full bg-black text-white rounded-md py-2 px-4 text-sm font-semibold hover:bg-gray-800 transition dark:bg-white dark:text-black dark:hover:bg-gray-200">
                        Create
                    </button>
                </form>
            </div>
        </div>
    )
}
