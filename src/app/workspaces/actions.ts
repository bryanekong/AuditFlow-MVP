'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'



export async function createWorkspace(formData: FormData) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Not authenticated')

    const name = formData.get('name') as string
    if (!name) throw new Error('Name is required')

    const workspace = await prisma.workspace.create({
        data: {
            name,
            ownerId: user.id,
            members: {
                create: {
                    userId: user.id,
                    role: 'OWNER'
                }
            }
        }
    })

    // Audit log
    await prisma.auditLogEvent.create({
        data: {
            workspaceId: workspace.id,
            actorUserId: user.id,
            action: 'WORKSPACE_CREATED',
            entityType: 'WORKSPACE',
            entityId: workspace.id,
        }
    })

    revalidatePath('/workspaces')
    redirect(`/workspaces/${workspace.id}`)
}
