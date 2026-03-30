/**
 * Control-Evidence Graph (CEG) Engine
 *
 * A deterministic, 3-layer evaluation engine that replaces the old
 * keyword-heuristic scan. This module is pure (no Next.js deps) so it
 * can be unit-tested independently.
 *
 * Layer 1 – Ingestion: only evidence matching a registered EvidenceType is used
 * Layer 2 – Quality Gate: freshness, completeness, consistency checks
 * Layer 3 – ARI Computation: weighted multi-component Audit Readiness Index
 */

export type EvidenceTypeConfig = {
    id: string
    name: string
    requirementId: string
    maxAgeDays: number
    requiredKeywords: string[]
    requiredDocTypes: string[]
    systemSource?: string | null
    accountableRole?: string | null
    testProcedure?: string | null
}

export type EvidenceDoc = {
    id: string
    docType: string | null
    extractedTextPreview: string | null
    uploadedAt: Date
    ownerName?: string | null
    evidenceDate?: Date | null
}

export type QualityCheckResult = {
    freshnessPass: boolean
    completenessPass: boolean
    consistencyPass: boolean
    overallPass: boolean
    failureReasons: string[]
}

export type RequirementEvaluation = {
    requirementId: string
    status: 'PASS' | 'FAIL' | 'PARTIAL'
    confidence: number
    matchedDocIds: string[]
    notes: string
    recommendedActions: string[]
    freshnessPass: boolean | null
    completenessPass: boolean | null
    consistencyPass: boolean | null
    hasOwner: boolean           // traceability: evidence has an identified owner
    hasSystemSource: boolean    // traceability: evidence came from a known system
}

export type ARIResult = {
    coverage: number        // % of requirements with any evidence (0-1)
    validity: number        // % of evidence passing quality gate (0-1)
    freshness: number       // % of evidence within time window (0-1)
    exceptionLoad: number   // inverse of fail weight (0-1)
    traceability: number    // % of passing controls with complete audit trail (0-1)
    score: number           // final ARI score (0-100)
}

// ARI component weights (must sum to 1.0)
const ARI_WEIGHTS = {
    coverage:      0.25,
    validity:      0.30,
    freshness:     0.15,
    exceptionLoad: 0.15,
    traceability:  0.15,
}

/**
 * Run the deterministic Quality Gate for a single piece of evidence
 * against a specific EvidenceType definition.
 */
export function runQualityGate(
    doc: EvidenceDoc,
    evidenceType: EvidenceTypeConfig,
    now: Date = new Date()
): QualityCheckResult {
    const failureReasons: string[] = []

    // ── Layer 2a: Freshness ──────────────────────────────────────────
    const referenceDate = doc.evidenceDate ?? doc.uploadedAt
    const ageInDays = (now.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24)
    const freshnessPass = ageInDays <= evidenceType.maxAgeDays
    if (!freshnessPass) {
        failureReasons.push(
            `Evidence is ${Math.round(ageInDays)} days old; maximum allowed is ${evidenceType.maxAgeDays} days.`
        )
    }

    // ── Layer 2b: Completeness ───────────────────────────────────────
    const typeMatch = doc.docType && evidenceType.requiredDocTypes.includes(doc.docType)
    const completenessPass = Boolean(typeMatch)
    if (!completenessPass) {
        failureReasons.push(
            `Document type "${doc.docType ?? 'Unknown'}" does not match required types: ${evidenceType.requiredDocTypes.join(', ')}.`
        )
    }

    // ── Layer 2c: Consistency ────────────────────────────────────────
    const textLower = (doc.extractedTextPreview ?? '').toLowerCase()
    const missingKeywords = evidenceType.requiredKeywords.filter(
        kw => !textLower.includes(kw.toLowerCase())
    )
    const consistencyPass = missingKeywords.length === 0
    if (!consistencyPass) {
        failureReasons.push(
            `Missing required keywords in document content: ${missingKeywords.join(', ')}.`
        )
    }

    return {
        freshnessPass,
        completenessPass,
        consistencyPass,
        overallPass: freshnessPass && completenessPass && consistencyPass,
        failureReasons,
    }
}

/**
 * Evaluate a single requirement against all candidate documents.
 */
export function evaluateRequirement(
    requirementId: string,
    severity: string,
    guidance: string,
    evidenceType: EvidenceTypeConfig | undefined,
    candidateDocs: EvidenceDoc[],
    allWorkspaceDocs: EvidenceDoc[],
    now: Date = new Date()
): RequirementEvaluation {
    // Traceability checks
    const hasOwner = candidateDocs.some(d => !!d.ownerName)
    const hasSystemSource = !!evidenceType?.systemSource

    // No EvidenceType defined for this requirement yet — legacy heuristic
    if (!evidenceType) {
        return {
            requirementId,
            status: candidateDocs.length > 0 ? 'PASS' : 'FAIL',
            confidence: candidateDocs.length > 0 ? 0.7 : 0,
            matchedDocIds: candidateDocs.map(d => d.id),
            notes: candidateDocs.length > 0
                ? `${candidateDocs.length} candidate document(s) found (legacy heuristic).`
                : 'No matching evidence found.',
            recommendedActions: candidateDocs.length > 0 ? [] : [guidance],
            freshnessPass: null,
            completenessPass: null,
            consistencyPass: null,
            hasOwner,
            hasSystemSource,
        }
    }

    // Run the quality gate on all candidate docs
    const gatedResults = candidateDocs.map(doc => ({
        doc,
        gate: runQualityGate(doc, evidenceType, now),
    }))

    const passingDocs = gatedResults.filter(r => r.gate.overallPass)
    const representativeGate = passingDocs[0]?.gate ?? gatedResults[0]?.gate ?? null

    if (passingDocs.length > 0) {
        return {
            requirementId,
            status: 'PASS',
            confidence: 0.9,
            matchedDocIds: passingDocs.map(r => r.doc.id),
            notes: `${passingDocs.length} document(s) passed all quality gate checks.`,
            recommendedActions: [],
            freshnessPass: representativeGate?.freshnessPass ?? null,
            completenessPass: representativeGate?.completenessPass ?? null,
            consistencyPass: representativeGate?.consistencyPass ?? null,
            hasOwner,
            hasSystemSource,
        }
    }

    if (gatedResults.length > 0) {
        const allFailureReasons = gatedResults
            .flatMap(r => r.gate.failureReasons)
            .filter((v, i, a) => a.indexOf(v) === i)
        return {
            requirementId,
            status: 'PARTIAL',
            confidence: 0.4,
            matchedDocIds: gatedResults.map(r => r.doc.id),
            notes: `Evidence found but failed quality gate: ${allFailureReasons.join(' | ')}`,
            recommendedActions: [
                `Review and update documents to meet quality gate requirements for: ${evidenceType.name}`,
                ...allFailureReasons.map(r => `Fix: ${r}`),
            ],
            freshnessPass: representativeGate?.freshnessPass ?? null,
            completenessPass: representativeGate?.completenessPass ?? null,
            consistencyPass: representativeGate?.consistencyPass ?? null,
            hasOwner,
            hasSystemSource,
        }
    }

    // Check if any docs of correct type exist workspace-wide
    const typeOnlyDocs = allWorkspaceDocs.filter(
        d => d.docType && evidenceType.requiredDocTypes.includes(d.docType)
    )
    if (typeOnlyDocs.length > 0) {
        return {
            requirementId,
            status: 'PARTIAL',
            confidence: 0.25,
            matchedDocIds: typeOnlyDocs.map(d => d.id),
            notes: `Document type found but required keywords missing for: ${evidenceType.name}`,
            recommendedActions: [
                `Update existing ${evidenceType.requiredDocTypes.join('/')} documents to include: ${evidenceType.requiredKeywords.join(', ')}`,
            ],
            freshnessPass: null,
            completenessPass: true,
            consistencyPass: false,
            hasOwner: false,
            hasSystemSource,
        }
    }

    return {
        requirementId,
        status: 'FAIL',
        confidence: 0,
        matchedDocIds: [],
        notes: 'No matching evidence found.',
        recommendedActions: [guidance],
        freshnessPass: null,
        completenessPass: null,
        consistencyPass: null,
        hasOwner: false,
        hasSystemSource: false,
    }
}

/**
 * Compute the Audit Readiness Index from a set of requirement evaluations.
 * 5-component ARI: Coverage, Validity, Freshness, Exception Load, Traceability.
 */
export function computeARI(
    evaluations: RequirementEvaluation[],
    severityWeights: Record<string, number>
): ARIResult {
    const total = evaluations.length
    if (total === 0) return { coverage: 0, validity: 0, freshness: 0, exceptionLoad: 0, traceability: 0, score: 0 }

    // Coverage: % of requirements that have any evidence
    const withEvidence = evaluations.filter(e => e.matchedDocIds.length > 0).length
    const coverage = withEvidence / total

    // Validity: % of evaluations where all quality gate checks passed
    const allGateResults = evaluations.filter(
        e => e.freshnessPass !== null && e.completenessPass !== null && e.consistencyPass !== null
    )
    const validityPassed = allGateResults.filter(
        e => e.freshnessPass && e.completenessPass && e.consistencyPass
    ).length
    const validity = allGateResults.length > 0 ? validityPassed / allGateResults.length : coverage

    // Freshness: % of evaluations where freshness specifically passed
    const freshnessResults = evaluations.filter(e => e.freshnessPass !== null)
    const freshnessPassed = freshnessResults.filter(e => e.freshnessPass).length
    const freshness = freshnessResults.length > 0 ? freshnessPassed / freshnessResults.length : coverage

    // Exception load: inverse weighted fail rate
    let totalWeight = 0
    let failWeight = 0
    for (const e of evaluations) {
        const w = 1
        totalWeight += w
        if (e.status === 'FAIL') failWeight += w
        else if (e.status === 'PARTIAL') failWeight += w * 0.5
    }
    const exceptionLoad = totalWeight > 0 ? 1 - (failWeight / totalWeight) : 1

    // Traceability: % of passing controls with complete audit trail
    // A control is fully traceable if it has: matched docs + owner + system source
    const passingControls = evaluations.filter(e => e.status === 'PASS')
    const traceableControls = passingControls.filter(e => e.hasOwner && e.hasSystemSource)
    const traceability = passingControls.length > 0
        ? traceableControls.length / passingControls.length
        : 0

    const score =
        (coverage      * ARI_WEIGHTS.coverage +
         validity      * ARI_WEIGHTS.validity +
         freshness     * ARI_WEIGHTS.freshness +
         exceptionLoad * ARI_WEIGHTS.exceptionLoad +
         traceability  * ARI_WEIGHTS.traceability) * 100

    return {
        coverage:      Math.round(coverage * 1000) / 1000,
        validity:      Math.round(validity * 1000) / 1000,
        freshness:     Math.round(freshness * 1000) / 1000,
        exceptionLoad: Math.round(exceptionLoad * 1000) / 1000,
        traceability:  Math.round(traceability * 1000) / 1000,
        score:         Math.round(score * 10) / 10,
    }
}
