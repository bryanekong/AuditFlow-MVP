import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { getRole } from '@/lib/rbac'
import ClientTabs from './client-tabs'

export default async function SettingsPage({ params }: { params: { id: string } }) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/auth/login')

    const role = await getRole(user.id, params.id)
    if (!role) redirect('/workspaces')

    // Only OWNER and ADMIN can see the settings page
    if (role !== 'OWNER' && role !== 'ADMIN') {
        return (
            <div className="max-w-5xl mx-auto py-12 text-center">
                <h1 className="text-2xl font-bold dark:text-white">Access Denied</h1>
                <p className="text-gray-500 mt-2">You do not have permission to view workspace settings.</p>
            </div>
        )
    }

    const workspace = await prisma.workspace.findUnique({
        where: { id: params.id },
        include: {
            members: {
                include: { user: true },
                orderBy: { role: 'desc' }
            },
            invitations: {
                orderBy: { createdAt: 'desc' }
            }
        }
    })

    if (!workspace) redirect('/workspaces')

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold dark:text-white">Workspace Settings</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your team and preferences.</p>
            </div>

            <ClientTabs workspace={workspace} currentRole={role} currentUserId={user.id} />
        </div>
    )
}
