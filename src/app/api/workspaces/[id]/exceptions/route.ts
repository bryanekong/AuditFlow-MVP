import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { checkPermissions } from '@/lib/rbac'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const hasAccess = await checkPermissions(user.id, params.id, 'MEMBER')
        if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

        const body = await req.json()
        const { requirementId, severity, title, description, ownerName, dueDate } = body

        if (!requirementId || !title || !ownerName || !severity) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const newException = await prisma.controlException.create({
            data: {
                workspaceId: params.id,
                requirementId,
                status: 'OPEN',
                severity,
                title,
                description: description || '',
                ownerName,
                dueDate: dueDate ? new Date(dueDate) : null,
            }
        })

        await prisma.auditLogEvent.create({
            data: {
                workspaceId: params.id,
                actorUserId: user.id,
                action: 'EXCEPTION_LOGGED',
                entityType: 'EXCEPTION',
                entityId: newException.id,
                metadata: { title, requirementId, status: 'OPEN' }
            }
        })

        return NextResponse.json(newException)
    } catch (error: any) {
        console.error('Failed to log exception:', error)
        return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 })
    }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const hasAccess = await checkPermissions(user.id, params.id, 'MEMBER')
        if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

        const body = await req.json()
        const { exceptionId, status, ownerName, dueDate, description } = body

        if (!exceptionId) {
            return NextResponse.json({ error: 'Missing exceptionId' }, { status: 400 })
        }

        const existing = await prisma.controlException.findUnique({
            where: { id: exceptionId, workspaceId: params.id }
        })

        if (!existing) {
            return NextResponse.json({ error: 'Exception not found' }, { status: 404 })
        }

        const updateData: any = {}
        if (status) {
            updateData.status = status
            // If newly resolved
            if (status === 'RESOLVED' || status === 'RISK_ACCEPTED') {
                updateData.resolvedAt = new Date()
            } else if (existing.status === 'RESOLVED' || existing.status === 'RISK_ACCEPTED') {
                // If reopening
                updateData.resolvedAt = null
            }
        }
        if (ownerName) updateData.ownerName = ownerName
        if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null
        if (description) updateData.description = description

        const updated = await prisma.controlException.update({
            where: { id: exceptionId },
            data: updateData
        })

        await prisma.auditLogEvent.create({
            data: {
                workspaceId: params.id,
                actorUserId: user.id,
                action: 'EXCEPTION_UPDATED',
                entityType: 'EXCEPTION',
                entityId: updated.id,
                metadata: { oldStatus: existing.status, newStatus: updated.status }
            }
        })

        return NextResponse.json(updated)
    } catch (error: any) {
        console.error('Failed to update exception:', error)
        return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 })
    }
}
