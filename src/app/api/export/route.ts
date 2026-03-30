import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import archiver from 'archiver'
import { Writable } from 'stream'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
    const formData = await req.formData()
    const workspaceId = formData.get('workspaceId') as string
    const scanId = formData.get('scanId') as string

    if (!workspaceId || !scanId) {
        return NextResponse.json({ error: 'Missing workspaceId or scanId' }, { status: 400 })
    }

    const scan = await prisma.scanRun.findUnique({
        where: { id: scanId, workspaceId },
        include: {
            framework: true,
            findings: { include: { requirement: true } },
            workspace: { select: { name: true } },
        }
    })

    if (!scan) {
        return NextResponse.json({ error: 'Scan not found' }, { status: 404 })
    }

    const documents = await prisma.document.findMany({
        where: { workspaceId },
        select: { id: true, filename: true, metadata: true }
    })
    const docMap = new Map(documents.map(d => [d.id, d]))

    const passes = scan.findings.filter(f => f.status === 'PASS')
    const partials = scan.findings.filter(f => f.status === 'PARTIAL')
    const fails = scan.findings.filter(f => f.status === 'FAIL')

    const ariScore = scan.ariScore ?? scan.score ?? 0
    const runDate = new Date(scan.startedAt).toLocaleString()

    // ── Build HTML gap report ────────────────────────────────────────────────
    const findingRows = scan.findings
        .sort((a, b) => (a.status === 'FAIL' ? -1 : b.status === 'FAIL' ? 1 : 0))
        .map(f => {
            const statusColour = f.status === 'PASS' ? '#16a34a' : f.status === 'PARTIAL' ? '#ca8a04' : '#dc2626'
            const matchedDocs = (f.matchedDocumentIds as string[])
                .map(id => docMap.get(id)?.filename ?? 'Unknown')
                .join(', ') || '—'
            const recommendation = (f.recommendedActions as string[]).join('; ') || '—'
            const gateIcons = [
                f.freshnessPass !== null ? `<span style="color:${f.freshnessPass ? '#16a34a' : '#dc2626'}">${f.freshnessPass ? '✓' : '✗'} Freshness</span>` : '',
                f.completenessPass !== null ? `<span style="color:${f.completenessPass ? '#16a34a' : '#dc2626'}">${f.completenessPass ? '✓' : '✗'} Completeness</span>` : '',
                f.consistencyPass !== null ? `<span style="color:${f.consistencyPass ? '#16a34a' : '#dc2626'}">${f.consistencyPass ? '✓' : '✗'} Consistency</span>` : '',
            ].filter(Boolean).join(' &nbsp; ')

            return `
        <tr>
            <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-family:monospace;font-size:13px;white-space:nowrap">${f.requirement.code}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px">${f.requirement.title}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb"><span style="font-weight:700;font-size:12px;color:${statusColour}">${f.status}</span></td>
            <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:12px;color:#6b7280">${gateIcons || '—'}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:12px;color:#6b7280">${matchedDocs}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:12px">${recommendation}</td>
        </tr>`
        }).join('')

    const htmlReport = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Auditor Pack – ${scan.workspace.name}</title>
<style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111827; margin: 0; padding: 40px; }
    h1 { font-size: 24px; font-weight: 700; margin-bottom: 4px; }
    .meta { color: #6b7280; font-size: 14px; margin-bottom: 32px; }
    .ari-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 16px; margin-bottom: 40px; }
    .ari-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; }
    .ari-label { font-size: 12px; font-weight: 500; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }
    .ari-value { font-size: 28px; font-weight: 700; margin-top: 6px; }
    table { width: 100%; border-collapse: collapse; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb; }
    thead { background: #f9fafb; }
    th { padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; border-bottom: 1px solid #e5e7eb; }
    tr:hover td { background: #f9fafb; }
    .green { color: #16a34a; } .yellow { color: #ca8a04; } .red { color: #dc2626; }
    .footer { margin-top: 40px; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 16px; }
</style>
</head>
<body>
<h1>Auditor Pack – ${scan.workspace.name}</h1>
<p class="meta">Framework: ${scan.framework.name} &nbsp;·&nbsp; Run: ${runDate} &nbsp;·&nbsp; Library version: ${scan.ruleSetVersion}</p>

<div class="ari-grid">
    <div class="ari-card">
        <div class="ari-label">ARI Score</div>
        <div class="ari-value ${ariScore >= 80 ? 'green' : ariScore >= 50 ? 'yellow' : 'red'}">${ariScore.toFixed(1)}%</div>
    </div>
    <div class="ari-card">
        <div class="ari-label">Coverage</div>
        <div class="ari-value ${(scan.ariCoverage ?? 0) >= 80 ? 'green' : (scan.ariCoverage ?? 0) >= 50 ? 'yellow' : 'red'}">${scan.ariCoverage?.toFixed(1) ?? '–'}%</div>
    </div>
    <div class="ari-card">
        <div class="ari-label">Validity</div>
        <div class="ari-value ${(scan.ariValidity ?? 0) >= 80 ? 'green' : (scan.ariValidity ?? 0) >= 50 ? 'yellow' : 'red'}">${scan.ariValidity?.toFixed(1) ?? '–'}%</div>
    </div>
    <div class="ari-card">
        <div class="ari-label">Freshness</div>
        <div class="ari-value ${(scan.ariFreshness ?? 0) >= 80 ? 'green' : (scan.ariFreshness ?? 0) >= 50 ? 'yellow' : 'red'}">${scan.ariFreshness?.toFixed(1) ?? '–'}%</div>
    </div>
    <div class="ari-card">
        <div class="ari-label">Exception Load</div>
        <div class="ari-value ${(scan.ariExceptionLoad ?? 0) >= 80 ? 'green' : (scan.ariExceptionLoad ?? 0) >= 50 ? 'yellow' : 'red'}">${scan.ariExceptionLoad?.toFixed(1) ?? '–'}%</div>
    </div>
    <div class="ari-card">
        <div class="ari-label">Traceability</div>
        <div class="ari-value ${(scan.ariTraceability ?? 0) >= 80 ? 'green' : (scan.ariTraceability ?? 0) >= 50 ? 'yellow' : 'red'}">${scan.ariTraceability?.toFixed(1) ?? '–'}%</div>
    </div>
</div>

<table>
    <thead>
        <tr>
            <th>Code</th>
            <th>Control</th>
            <th>Status</th>
            <th>Quality Gate</th>
            <th>Evidence Used</th>
            <th>Recommendation</th>
        </tr>
    </thead>
    <tbody>
        ${findingRows}
    </tbody>
</table>

<div class="footer">
    Generated by AuditFlow AI &nbsp;·&nbsp; ${new Date().toISOString()} &nbsp;·&nbsp;
    Pass: ${passes.length} &nbsp;·&nbsp; Partial: ${partials.length} &nbsp;·&nbsp; Fail: ${fails.length}
</div>
</body>
</html>`

    // ── Build findings.json ──────────────────────────────────────────────────
    const findingsJson = JSON.stringify({
        workspace: scan.workspace.name,
        framework: scan.framework.name,
        libraryVersion: scan.ruleSetVersion,
        runDate: scan.startedAt,
        ari: {
            score: ariScore,
            coverage: scan.ariCoverage,
            validity: scan.ariValidity,
            freshness: scan.ariFreshness,
            exceptionLoad: scan.ariExceptionLoad,
            traceability: scan.ariTraceability,
        },
        summary: { pass: passes.length, partial: partials.length, fail: fails.length },
        findings: scan.findings.map(f => ({
            code: f.requirement.code,
            title: f.requirement.title,
            severity: f.requirement.severity,
            status: f.status,
            confidence: f.confidence,
            qualityGate: {
                freshnessPass: f.freshnessPass,
                completenessPass: f.completenessPass,
                consistencyPass: f.consistencyPass,
            },
            notes: f.notes,
            recommendedActions: f.recommendedActions,
            matchedDocuments: (f.matchedDocumentIds as string[]).map(id => ({
                id,
                filename: docMap.get(id)?.filename ?? 'Unknown',
            }))
        }))
    }, null, 2)

    // ── Build evidence-manifest.json ─────────────────────────────────────────
    const evidenceManifest = JSON.stringify({
        generatedAt: new Date().toISOString(),
        workspaceId,
        scanId,
        documents: documents.map(d => ({
            id: d.id,
            filename: d.filename,
            docType: d.metadata?.docType ?? null,
            confidence: d.metadata?.confidence ?? null,
            processedAt: d.metadata?.processedAt ?? null,
        }))
    }, null, 2)

    // ── Pack into zip ────────────────────────────────────────────────────────
    const chunks: Buffer[] = []
    const writable = new Writable({
        write(chunk, _, cb) { chunks.push(chunk); cb() }
    })

    await new Promise<void>((resolve, reject) => {
        const archive = archiver('zip', { zlib: { level: 9 } })
        archive.on('error', reject)
        writable.on('finish', resolve)
        archive.pipe(writable)
        archive.append(htmlReport, { name: 'gap-report.html' })
        archive.append(findingsJson, { name: 'findings.json' })
        archive.append(evidenceManifest, { name: 'evidence-manifest.json' })
        archive.finalize()
    })

    const buf = Buffer.concat(chunks)
    const filename = `auditflow-pack-${scan.framework.code}-${new Date().toISOString().slice(0, 10)}.zip`

    return new NextResponse(buf, {
        headers: {
            'Content-Type': 'application/zip',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Content-Length': String(buf.length),
        }
    })
}
