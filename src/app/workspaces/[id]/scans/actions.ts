'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'



export async function runScan(workspaceId: string, formData: FormData) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const membership = await prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId, userId: user.id } }
    })
    if (!membership) throw new Error('Not authorized')

    const frameworkId = formData.get('frameworkId') as string
    if (!frameworkId) throw new Error('Framework required')

    const framework = await prisma.framework.findUnique({
        where: { id: frameworkId },
        include: { requirements: true }
    })
    if (!framework) throw new Error('Framework not found')

    const scanRun = await prisma.scanRun.create({
        data: {
            workspaceId,
            frameworkId,
            status: 'RUNNING',
            ruleSetVersion: framework.version,
            createdBy: user.id,
        }
    })

    const docs = await prisma.document.findMany({
        where: { workspaceId, status: 'PROCESSED' },
        include: { metadata: true }
    })
    console.log("Documents fetched for scan:", docs.map(d => ({ id: d.id, name: d.filename, type: d.metadata?.docType, preview: Array.from((d.metadata?.extractedTextPreview || '').substring(0, 20)) })))

    let totalWeight = 0
    let earnedWeight = 0

    const severityWeights: Record<string, number> = {
        CRITICAL: 3,
        MEDIUM: 2,
        LOW: 1
    }

    const findingsData = []

    for (const req of framework.requirements) {
        const weight = severityWeights[req.severity] || 1
        totalWeight += weight

        const candidateDocs = docs.filter(doc => {
            if (!doc.metadata) return false
            const typeMatch = req.requiredDocTypes.includes(doc.metadata.docType)
            if (!typeMatch) return false

            const previewText = (doc.metadata.extractedTextPreview || '').toLowerCase()
            const keywordMatch = req.keywords.some(kw => previewText.includes(kw.toLowerCase()))

            return keywordMatch
        })

        let status = 'FAIL'
        let confidence = 0
        let recommendedActions = [req.guidance]
        let matchedDocs = candidateDocs

        if (candidateDocs.length > 0) {
            status = 'PASS'
            confidence = 0.8
            recommendedActions = []
            earnedWeight += weight
        } else {
            const partialDocs = docs.filter(d => d.metadata && req.requiredDocTypes.includes(d.metadata.docType))
            if (partialDocs.length > 0) {
                status = 'PARTIAL'
                confidence = 0.4
                earnedWeight += weight * 0.5
                recommendedActions = [`Documents of correct type found but keywords missing for ${req.title}. Review existing ones.`]
                matchedDocs = partialDocs
            }
        }

        findingsData.push({
            scanRunId: scanRun.id,
            requirementId: req.id,
            status,
            confidence,
            matchedDocumentIds: matchedDocs.map(d => d.id),
            notes: candidateDocs.length > 0 ? `Matched ${candidateDocs.length} evidence document(s).` : (matchedDocs.length > 0 ? `Evaluated ${matchedDocs.length} partial document(s).` : 'Missing required evidence.'),
            recommendedActions,
        })
    }

    await prisma.scanFinding.createMany({
        data: findingsData
    })

    const score = totalWeight > 0 ? (earnedWeight / totalWeight) * 100 : 0

    await prisma.scanRun.update({
        where: { id: scanRun.id },
        data: {
            status: 'DONE',
            score,
            finishedAt: new Date()
        }
    })

    await prisma.auditLogEvent.create({
        data: {
            workspaceId,
            actorUserId: user.id,
            action: 'SCAN_RUN',
            entityType: 'SCAN_RUN',
            entityId: scanRun.id,
            metadata: { frameworkId, score }
        }
    })

    revalidatePath(`/workspaces/${workspaceId}/scans`)
    revalidatePath(`/workspaces/${workspaceId}`)

    redirect(`/workspaces/${workspaceId}/scans/${scanRun.id}`)
}
