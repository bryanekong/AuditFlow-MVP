'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { checkPermissions } from '@/lib/rbac'
import { evaluateRequirement, computeARI, EvidenceTypeConfig } from '@/lib/ceg-engine'



export async function runScan(workspaceId: string, formData: FormData) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const hasAccess = await checkPermissions(user.id, workspaceId, 'MEMBER')
    if (!hasAccess) throw new Error('Not authorized')

    const frameworkId = formData.get('frameworkId') as string
    if (!frameworkId) throw new Error('Framework required')

    const framework = await prisma.framework.findUnique({
        where: { id: frameworkId },
        include: { requirements: true }
    })
    if (!framework) throw new Error('Framework not found')

    // ── Load active library version for this framework (CEG) ──────────────────
    const activeLibrary = await prisma.controlLibraryVersion.findFirst({
        where: { frameworkId, isActive: true },
        include: {
            evidenceTypes: true,
        },
        orderBy: { releasedAt: 'desc' }
    })

    const scanRun = await prisma.scanRun.create({
        data: {
            workspaceId,
            frameworkId,
            status: 'RUNNING',
            ruleSetVersion: activeLibrary
                ? `${framework.version}-lib${activeLibrary.version}`
                : framework.version,
            createdBy: user.id,
        }
    })

    // ── Load all processed workspace documents ─────────────────────────────────
    const docs = await prisma.document.findMany({
        where: { workspaceId, status: 'PROCESSED' },
        include: { metadata: true }
    })

    const evidenceDocs = docs.map(d => ({
        id: d.id,
        docType: d.metadata?.docType ?? null,
        extractedTextPreview: d.metadata?.extractedTextPreview ?? null,
        uploadedAt: d.uploadedAt,
        ownerName: null,
        evidenceDate: null,
    }))

    // Build a map: requirementId → EvidenceTypeConfig
    const evidenceTypeMap = new Map(
        (activeLibrary?.evidenceTypes ?? []).map(et => [et.requirementId, {
            id: et.id,
            requirementId: et.requirementId,
            maxAgeDays: et.maxAgeDays,
            requiredKeywords: et.requiredKeywords,
            requiredDocTypes: et.requiredDocTypes,
        }])
    )

    const severityWeights: Record<string, number> = {
        CRITICAL: 3,
        MEDIUM: 2,
        LOW: 1,
    }

    const evaluations = []
    const findingsData = []
    const qualityGateData = []
    const now = new Date()

    for (const req of framework.requirements) {
        const evidenceType = evidenceTypeMap.get(req.id)

        // ── Layer 1: Ingestion – filter candidate docs ─────────────────────────
        const candidateDocs = evidenceDocs.filter(doc => {
            if (!doc.docType) return false
            const typeMatch = (evidenceType?.requiredDocTypes ?? req.requiredDocTypes).includes(doc.docType)
            if (!typeMatch) return false
            const textLower = (doc.extractedTextPreview ?? '').toLowerCase()
            const keywords = evidenceType?.requiredKeywords ?? req.keywords
            return keywords.some(kw => textLower.includes(kw.toLowerCase()))
        })

        // ── Layer 2 & 3: Quality Gate + Evaluation ─────────────────────────────
        const evaluation = evaluateRequirement(
            req.id,
            req.severity,
            req.guidance,
            evidenceType,
            candidateDocs,
            evidenceDocs,
            now,
        )
        evaluations.push({ evaluation, severity: req.severity })

        findingsData.push({
            scanRunId: scanRun.id,
            requirementId: req.id,
            status: evaluation.status,
            confidence: evaluation.confidence,
            matchedDocumentIds: evaluation.matchedDocIds,
            notes: evaluation.notes,
            recommendedActions: evaluation.recommendedActions,
            freshnessPass: evaluation.freshnessPass,
            completenessPass: evaluation.completenessPass,
            consistencyPass: evaluation.consistencyPass,
        })
    }

    // ── Layer 3: ARI Computation ───────────────────────────────────────────────
    const ari = computeARI(evaluations.map(e => e.evaluation), severityWeights)

    await prisma.scanFinding.createMany({ data: findingsData })

    await prisma.scanRun.update({
        where: { id: scanRun.id },
        data: {
            status: 'DONE',
            finishedAt: now,
            // Legacy score (backwards compat)
            score: ari.score,
            // ARI components
            ariScore: ari.score,
            ariCoverage: Math.round(ari.coverage * 1000) / 10,
            ariValidity: Math.round(ari.validity * 1000) / 10,
            ariFreshness: Math.round(ari.freshness * 1000) / 10,
            ariExceptionLoad: Math.round(ari.exceptionLoad * 1000) / 10,
        }
    })

    await prisma.auditLogEvent.create({
        data: {
            workspaceId,
            actorUserId: user.id,
            action: 'SCAN_RUN',
            entityType: 'SCAN_RUN',
            entityId: scanRun.id,
            metadata: { frameworkId, ariScore: ari.score, libraryVersion: activeLibrary?.version ?? null }
        }
    })

    revalidatePath(`/workspaces/${workspaceId}/scans`)
    revalidatePath(`/workspaces/${workspaceId}`)

    redirect(`/workspaces/${workspaceId}/scans/${scanRun.id}`)
}
