'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { checkPermissions, Role } from '@/lib/rbac'
import crypto from 'crypto'

export async function updateWorkspace(workspaceId: string, formData: FormData) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const hasAccess = await checkPermissions(user.id, workspaceId, 'ADMIN')
    if (!hasAccess) throw new Error('Unauthorized')

    const name = formData.get('name') as string
    if (!name) throw new Error('Name is required')

    await prisma.workspace.update({
        where: { id: workspaceId },
        data: { name }
    })

    await prisma.auditLogEvent.create({
        data: {
            workspaceId,
            actorUserId: user.id,
            action: 'WORKSPACE_UPDATED',
            entityType: 'WORKSPACE',
            entityId: workspaceId,
        }
    })

    revalidatePath(`/workspaces/${workspaceId}`)
    revalidatePath(`/workspaces/${workspaceId}/settings`)
}

export async function deleteWorkspace(workspaceId: string) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const hasAccess = await checkPermissions(user.id, workspaceId, 'OWNER')
    if (!hasAccess) throw new Error('Unauthorized. Only OWNER can delete a workspace.')

    await prisma.workspace.delete({
        where: { id: workspaceId }
    })

    revalidatePath('/workspaces')
    redirect('/workspaces')
}

export async function createInvite(workspaceId: string, formData: FormData) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const hasAccess = await checkPermissions(user.id, workspaceId, 'ADMIN')
    if (!hasAccess) throw new Error('Unauthorized')

    const email = formData.get('email') as string
    const role = formData.get('role') as string

    if (!email || !role) throw new Error('Email and role are required')

    // Check if user is already a member
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
        const isMember = await prisma.workspaceMember.findUnique({
            where: {
                workspaceId_userId: {
                    workspaceId,
                    userId: existingUser.id
                }
            }
        })
        if (isMember) throw new Error('User is already a member of this workspace')
    }

    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days from now

    await prisma.workspaceInvitation.upsert({
        where: {
            workspaceId_email: {
                workspaceId,
                email
            }
        },
        create: {
            workspaceId,
            email,
            role,
            token,
            expiresAt,
            invitedBy: user.id
        },
        update: {
            role,
            token,
            expiresAt,
            invitedBy: user.id
        }
    })

    await prisma.auditLogEvent.create({
        data: {
            workspaceId,
            actorUserId: user.id,
            action: 'MEMBER_INVITED',
            entityType: 'INVITATION',
            entityId: email,
            metadata: { role }
        }
    })

    // In a real application, we would trigger an email send here (via SendGrid/Resend)
    // containing a link to `/invite/${token}`.

    revalidatePath(`/workspaces/${workspaceId}/settings`)
}

export async function revokeInvite(workspaceId: string, inviteId: string) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const hasAccess = await checkPermissions(user.id, workspaceId, 'ADMIN')
    if (!hasAccess) throw new Error('Unauthorized')

    await prisma.workspaceInvitation.delete({
        where: { id: inviteId }
    })

    revalidatePath(`/workspaces/${workspaceId}/settings`)
}

export async function removeMember(workspaceId: string, userIdToRemove: string) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    if (user.id === userIdToRemove) throw new Error('Cannot remove yourself')

    const hasAccess = await checkPermissions(user.id, workspaceId, 'ADMIN')
    if (!hasAccess) throw new Error('Unauthorized')

    // Prevent removing the sole OWNER or removing an OWNER if you are just an ADMIN
    const targetMember = await prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId, userId: userIdToRemove } }
    })

    if (!targetMember) throw new Error('Member not found')

    if (targetMember.role === 'OWNER') {
        const hasOwnerAccess = await checkPermissions(user.id, workspaceId, 'OWNER')
        if (!hasOwnerAccess) throw new Error('Only an OWNER can remove another OWNER')
    }

    await prisma.workspaceMember.delete({
        where: { workspaceId_userId: { workspaceId, userId: userIdToRemove } }
    })

    await prisma.auditLogEvent.create({
        data: {
            workspaceId,
            actorUserId: user.id,
            action: 'MEMBER_REMOVED',
            entityType: 'MEMBER',
            entityId: userIdToRemove,
        }
    })

    revalidatePath(`/workspaces/${workspaceId}/settings`)
}

export async function updateMemberRole(workspaceId: string, userIdToUpdate: string, newRole: string) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const hasAccess = await checkPermissions(user.id, workspaceId, 'ADMIN')
    if (!hasAccess) throw new Error('Unauthorized')

    if (newRole === 'OWNER') {
        const hasOwnerAccess = await checkPermissions(user.id, workspaceId, 'OWNER')
        if (!hasOwnerAccess) throw new Error('Only an OWNER can grant OWNER status')
    }

    await prisma.workspaceMember.update({
        where: { workspaceId_userId: { workspaceId, userId: userIdToUpdate } },
        data: { role: newRole }
    })

    await prisma.auditLogEvent.create({
        data: {
            workspaceId,
            actorUserId: user.id,
            action: 'MEMBER_ROLE_UPDATED',
            entityType: 'MEMBER',
            entityId: userIdToUpdate,
            metadata: { newRole }
        }
    })

    revalidatePath(`/workspaces/${workspaceId}/settings`)
}
