'use server'

import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function acceptInvite(formData: FormData) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/auth/login')
    }

    const token = formData.get('token') as string
    if (!token) throw new Error('No token provided')

    const invitation = await prisma.workspaceInvitation.findUnique({
        where: { token }
    })

    if (!invitation || new Date() > new Date(invitation.expiresAt)) {
        throw new Error('Invalid or expired invitation')
    }

    // Ensure the invite is for the logged-in user's email
    if (invitation.email.toLowerCase() !== user.email?.toLowerCase()) {
        throw new Error('This invitation was sent to a different email address.')
    }

    // Use a transaction
    await prisma.$transaction(async (tx) => {
        // Upsert the workspace member in case they are already a member
        await tx.workspaceMember.upsert({
            where: {
                workspaceId_userId: {
                    workspaceId: invitation.workspaceId,
                    userId: user.id
                }
            },
            create: {
                workspaceId: invitation.workspaceId,
                userId: user.id,
                role: invitation.role
            },
            update: {
                role: invitation.role // Optionally upgrade their role if they got re-invited
            }
        })

        // Audit Log
        await tx.auditLogEvent.create({
            data: {
                workspaceId: invitation.workspaceId,
                actorUserId: user.id,
                action: 'MEMBER_JOINED',
                entityType: 'MEMBER',
                entityId: user.id,
            }
        })

        // Delete the invitation
        await tx.workspaceInvitation.delete({
            where: { id: invitation.id }
        })
    })

    revalidatePath(`/workspaces/${invitation.workspaceId}`)
    redirect(`/workspaces/${invitation.workspaceId}`)
}
