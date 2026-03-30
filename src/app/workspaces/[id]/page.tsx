import { prisma } from '@/lib/prisma'
import Link from "next/link"



export default async function WorkspaceDashboard({ params }: { params: { id: string } }) {
    const docsCount = await prisma.document.count({ where: { workspaceId: params.id } })
    const scansCount = await prisma.scanRun.count({ where: { workspaceId: params.id } })
    const recentDocs = await prisma.document.findMany({
        where: { workspaceId: params.id },
        orderBy: { uploadedAt: 'desc' },
        take: 5
    })

    const latestScan = await prisma.scanRun.findFirst({
        where: { workspaceId: params.id },
        orderBy: { startedAt: 'desc' },
        include: { findings: true }
    })

    // ARI Score
    const ariScore = latestScan?.ariScore ?? latestScan?.score ?? null
    const ariDisplay = ariScore !== null ? `${ariScore.toFixed(1)}%` : "Not run"
    const ariClass = ariScore !== null
        ? (ariScore >= 80 ? "text-green-600 dark:text-green-400" : (ariScore >= 50 ? "text-yellow-600 dark:text-yellow-400" : "text-red-600 dark:text-red-400"))
        : "text-gray-400 italic"

    const missingDocsCount = latestScan ? latestScan.findings.filter((f: any) => f.status === 'FAIL').length : "N/A"

    // Pilot metrics
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const recentScans = await prisma.scanRun.findMany({
        where: { workspaceId: params.id, startedAt: { gte: sevenDaysAgo } },
        include: { findings: true }
    })

    const allRecentFindings = recentScans.flatMap(s => s.findings)
    const gatedFindings = allRecentFindings.filter((f: any) => f.freshnessPass !== null)
    const validFindings = gatedFindings.filter((f: any) => f.freshnessPass && f.completenessPass && f.consistencyPass)
    const evidenceValidityRate = gatedFindings.length > 0
        ? Math.round((validFindings.length / gatedFindings.length) * 100)
        : null

    const totalEvidenceItems = await prisma.evidenceItem.count({ where: { workspaceId: params.id } })

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold dark:text-white">Dashboard Overview</h1>
                <Link
                    href={`/workspaces/${params.id}/scans`}
                    className="bg-black text-white px-4 py-2 rounded-md font-semibold text-sm hover:bg-gray-800 transition shadow-sm dark:bg-white dark:text-black dark:hover:bg-gray-200"
                >
                    Run Scan
                </Link>
            </div>

            {/* ── Primary stats ───────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-gray-200 dark:border-zinc-800 shadow-sm transition hover:shadow-md">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Documents</h3>
                    <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{docsCount}</p>
                </div>
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-gray-200 dark:border-zinc-800 shadow-sm transition hover:shadow-md">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Scans</h3>
                    <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{scansCount}</p>
                </div>
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-gray-200 dark:border-zinc-800 shadow-sm transition hover:shadow-md">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">ARI Score</h3>
                    <p className={`mt-2 text-3xl font-bold ${ariClass}`}>{ariDisplay}</p>
                </div>
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-gray-200 dark:border-zinc-800 shadow-sm transition hover:shadow-md">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Missing Controls</h3>
                    <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{missingDocsCount}</p>
                </div>
            </div>

            {/* ── Pilot metrics row ───────────────────────────────────────────── */}
            <div>
                <div className="flex items-center gap-2 mb-3">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Pilot Metrics</h2>
                    <span className="text-xs text-gray-400 dark:text-gray-500">(last 7 days)</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-zinc-900 p-5 rounded-lg border border-blue-200 dark:border-blue-900/40 shadow-sm">
                        <h3 className="text-sm font-medium text-blue-600 dark:text-blue-400">Evidence Validity Rate</h3>
                        <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                            {evidenceValidityRate !== null ? `${evidenceValidityRate}%` : '–'}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">% of controls passing all gate checks</p>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 p-5 rounded-lg border border-purple-200 dark:border-purple-900/40 shadow-sm">
                        <h3 className="text-sm font-medium text-purple-600 dark:text-purple-400">Evidence Items</h3>
                        <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{totalEvidenceItems}</p>
                        <p className="text-xs text-gray-400 mt-1">Total registered evidence artefacts</p>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 p-5 rounded-lg border border-orange-200 dark:border-orange-900/40 shadow-sm">
                        <h3 className="text-sm font-medium text-orange-600 dark:text-orange-400">Scans This Week</h3>
                        <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{recentScans.length}</p>
                        <p className="text-xs text-gray-400 mt-1">Scan runs in the last 7 days</p>
                    </div>
                </div>
            </div>

            {/* ── Recent documents ────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-gray-200 dark:border-zinc-800 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold dark:text-white">Recent Documents</h2>
                        <Link href={`/workspaces/${params.id}/documents`} className="text-sm text-blue-600 hover:underline dark:text-blue-400">View all</Link>
                    </div>
                    {recentDocs.length > 0 ? (
                        <ul className="divide-y divide-gray-200 dark:divide-zinc-800 border-t border-gray-200 dark:border-zinc-800">
                            {recentDocs.map(doc => (
                                <li key={doc.id} className="py-3 flex flex-col sm:flex-row sm:justify-between gap-1">
                                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{doc.filename}</span>
                                    <span className="text-xs text-gray-500 bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full inline-block self-start sm:self-auto uppercase">{doc.status}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-sm text-gray-500 mb-4 dark:text-gray-400">No documents uploaded yet.</p>
                            <Link href={`/workspaces/${params.id}/documents`} className="text-sm bg-gray-100 text-gray-800 py-1.5 px-3 rounded-md hover:bg-gray-200 transition dark:bg-zinc-800 dark:text-gray-200 dark:hover:bg-zinc-700">Upload Document</Link>
                        </div>
                    )}
                </div>

                {/* ── Latest ARI breakdown ─────────────────────────────────────── */}
                {latestScan?.ariScore !== null && latestScan && (
                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-gray-200 dark:border-zinc-800 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold dark:text-white">Latest ARI Breakdown</h2>
                            <Link href={`/workspaces/${params.id}/scans/${latestScan.id}`} className="text-sm text-blue-600 hover:underline dark:text-blue-400">View scan</Link>
                        </div>
                        <div className="space-y-3">
                            {[
                                { label: 'Coverage', val: latestScan.ariCoverage },
                                { label: 'Validity', val: latestScan.ariValidity },
                                { label: 'Freshness', val: latestScan.ariFreshness },
                                { label: 'Exception Load', val: latestScan.ariExceptionLoad },
                                { label: 'Traceability', val: latestScan.ariTraceability },
                            ].map(({ label, val }) => (
                                <div key={label}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-600 dark:text-gray-400">{label}</span>
                                        <span className="font-medium text-gray-900 dark:text-white">{val !== null ? `${val?.toFixed(1)}%` : '–'}</span>
                                    </div>
                                    <div className="h-2 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all ${(val ?? 0) >= 80 ? 'bg-green-500' :
                                                    (val ?? 0) >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                                }`}
                                            style={{ width: `${val ?? 0}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
