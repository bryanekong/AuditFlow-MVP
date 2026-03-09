'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

export async function submitOnboarding(data: {
    companyName: string
    industry: string
    frameworkId: string
    invites: string[]
}) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Not authenticated')
    }

    if (!data.companyName || !data.frameworkId) {
        throw new Error('Company Name and Framework are required')
    }

    // Create Workspace inside a transaction, set user as Onboarded
    const workspace = await prisma.$transaction(async (tx) => {
        // Create Workspace
        const ws = await tx.workspace.create({
            data: {
                name: data.companyName,
                industry: data.industry || null,
                ownerId: user.id,
                members: {
                    create: {
                        userId: user.id,
                        role: 'OWNER'
                    }
                }
            }
        })

        // Audit Log for Workspace
        await tx.auditLogEvent.create({
            data: {
                workspaceId: ws.id,
                actorUserId: user.id,
                action: 'WORKSPACE_CREATED',
                entityType: 'WORKSPACE',
                entityId: ws.id,
            }
        })

        // (Optional) Initialize a pending scan or link the framework loosely.
        // For now, we wait for user to click Run Scan on dashboard, or we can just leave it to default dashboard handling.

        // Complete User Onboarding
        await tx.user.update({
            where: { id: user.id },
            data: { onboardingCompleted: true }
        })

        return ws
    })

    revalidatePath('/workspaces')
    revalidatePath('/')
    redirect(`/workspaces/${workspace.id}`)
}
