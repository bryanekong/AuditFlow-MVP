'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { inngest } from '@/inngest/client'
import { checkPermissions } from '@/lib/rbac'



export async function uploadDocument(workspaceId: string, formData: FormData) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const hasAccess = await checkPermissions(user.id, workspaceId, 'MEMBER')
    if (!hasAccess) throw new Error('Not authorized')

    const file = formData.get('file') as File
    if (!file || file.size === 0) throw new Error('No valid file provided')

    const fileExt = file.name.split('.').pop()
    const fileName = `${crypto.randomUUID()}.${fileExt}`
    const storagePath = `${workspaceId}/${fileName}`

    // For MVP: Uploads directly to 'documents' bucket which should be created in Supabase
    // We use a specifically crafted admin client to bypass RLS for file storage
    const adminSupabase = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error: uploadError } = await adminSupabase.storage
        .from('documents')
        .upload(storagePath, file, { upsert: false })

    if (uploadError) {
        console.error('Storage Upload Error:', uploadError)
        throw new Error('Storage upload failed: ' + uploadError.message)
    }

    // Check for existing document with same filename in this workspace
    const existingDoc = await prisma.document.findFirst({
        where: { workspaceId, filename: file.name },
        include: { versions: true }
    })

    let docId: string
    let actionType = 'DOCUMENT_UPLOADED'

    if (existingDoc) {
        // Create new version and update existing doc
        const nextVersion = existingDoc.versions.length + 1
        await prisma.documentVersion.create({
            data: {
                documentId: existingDoc.id,
                versionNumber: nextVersion,
                storagePath,
                uploadedBy: user.id
            }
        })

        await prisma.document.update({
            where: { id: existingDoc.id },
            data: {
                storagePath,
                size: file.size,
                uploadedBy: user.id,
                status: 'UPLOADED',
                extractedTextHash: null // Reset so we know to re-parse
            }
        })
        docId = existingDoc.id
        actionType = 'DOCUMENT_UPDATED'
    } else {
        // Create new document
        const newDoc = await prisma.document.create({
            data: {
                workspaceId,
                filename: file.name,
                mimeType: file.type || 'application/octet-stream',
                storagePath,
                size: file.size,
                uploadedBy: user.id,
                status: 'UPLOADED'
            }
        })

        await prisma.documentVersion.create({
            data: {
                documentId: newDoc.id,
                versionNumber: 1,
                storagePath,
                uploadedBy: user.id
            }
        })
        docId = newDoc.id
    }

    await prisma.auditLogEvent.create({
        data: {
            workspaceId,
            actorUserId: user.id,
            action: actionType,
            entityType: 'DOCUMENT',
            entityId: docId,
            metadata: { filename: file.name, size: file.size, isNewVersion: !!existingDoc }
        }
    })

    // Trigger background processing
    try {
        const inngestRes = await inngest.send({
            name: 'app/document.uploaded',
            data: { documentId: docId, workspaceId, storagePath }
        });
        console.log("INNGEST SEND SUCCESS:", inngestRes);
    } catch (inngestErr) {
        console.error("INNGEST SEND FAILED CRITICALLY:", inngestErr);
    }

    revalidatePath(`/workspaces/${workspaceId}/documents`)
    return { success: true, docId }
}

export async function deleteDocument(workspaceId: string, documentId: string, storagePath: string) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const hasAccess = await checkPermissions(user.id, workspaceId, 'ADMIN')
    if (!hasAccess) throw new Error('Not authorized to delete')

    // Delete from storage using admin client to bypass RLS
    const adminSupabase = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error: storageError } = await adminSupabase.storage.from('documents').remove([storagePath])
    if (storageError) console.error('Error removing from storage:', storageError)

    await prisma.document.delete({ where: { id: documentId } })

    await prisma.auditLogEvent.create({
        data: {
            workspaceId,
            actorUserId: user.id,
            action: 'DOCUMENT_DELETED',
            entityType: 'DOCUMENT',
            entityId: documentId,
        }
    })

    revalidatePath(`/workspaces/${workspaceId}/documents`)
}
