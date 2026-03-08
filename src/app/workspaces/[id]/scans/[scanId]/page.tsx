import { prisma } from '@/lib/prisma'
import Link from "next/link"



export default async function ScanResultsPage({ params }: { params: { id: string, scanId: string } }) {
    const scan = await prisma.scanRun.findUnique({
        where: { id: params.scanId, workspaceId: params.id },
        include: {
            framework: true,
            findings: {
                include: {
                    requirement: true
                }
            }
        }
    })

    if (!scan) return <div>Scan not found</div>

    const documents = await prisma.document.findMany({
        where: { workspaceId: params.id },
        select: { id: true, filename: true }
    })
    const docMap = new Map(documents.map(d => [d.id, d.filename]))

    const passes = scan.findings.filter(f => f.status === 'PASS').length
    const partials = scan.findings.filter(f => f.status === 'PARTIAL').length
    const fails = scan.findings.filter(f => f.status === 'FAIL').length

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                    <Link href={`/workspaces/${params.id}/scans`} className="text-sm text-gray-500 hover:underline mb-2 inline-block dark:text-gray-400 transition">← Back to Scans</Link>
                    <h1 className="text-2xl font-bold dark:text-white">{scan.framework.name} Results</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Run on {new Date(scan.startedAt).toLocaleString()}</p>
                </div>
                <form action={`/api/export`} method="POST">
                    <input type="hidden" name="workspaceId" value={params.id} />
                    <input type="hidden" name="scanId" value={params.scanId} />
                    <button type="submit" className="bg-black text-white px-4 py-2 rounded-md font-semibold text-sm hover:bg-gray-800 transition shadow-sm dark:bg-white dark:text-black dark:hover:bg-gray-200">
                        Export Auditor Pack
                    </button>
                </form>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-gray-200 dark:border-zinc-800 shadow-sm transition hover:shadow-md">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Score</h3>
                    <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{scan.score?.toFixed(1) || 0}%</p>
                </div>
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-green-200 dark:border-green-900/50 shadow-sm transition hover:shadow-md">
                    <h3 className="text-sm font-medium text-green-600 dark:text-green-500">Pass</h3>
                    <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{passes}</p>
                </div>
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-yellow-200 dark:border-yellow-900/50 shadow-sm transition hover:shadow-md">
                    <h3 className="text-sm font-medium text-yellow-600 dark:text-yellow-500">Partial</h3>
                    <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{partials}</p>
                </div>
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-red-200 dark:border-red-900/50 shadow-sm transition hover:shadow-md">
                    <h3 className="text-sm font-medium text-red-600 dark:text-red-500">Fail</h3>
                    <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{fails}</p>
                </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-zinc-800">
                    <h2 className="text-lg font-semibold dark:text-white">Detailed Findings</h2>
                </div>
                <ul className="divide-y divide-gray-200 dark:divide-zinc-800">
                    {scan.findings.sort((a, b) => (a.status === 'FAIL' ? -1 : 1)).map(finding => (
                        <li key={finding.id} className="p-6 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition">
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-xs text-gray-500 bg-gray-100 dark:bg-zinc-800 px-2 py-1 rounded">{finding.requirement.code}</span>
                                        <h3 className="text-base font-semibold dark:text-white">{finding.requirement.title}</h3>
                                        {finding.requirement.severity === 'CRITICAL' && (
                                            <span className="text-xs bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 px-2 py-0.5 rounded-full font-medium">Critical</span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{finding.requirement.description}</p>

                                    {finding.notes && (
                                        <div className="mt-2 p-3 bg-gray-50 dark:bg-zinc-950 rounded border border-gray-200 dark:border-zinc-800 text-sm py-2 px-3 italic text-gray-700 dark:text-gray-300">
                                            Evaluator: {finding.notes}
                                        </div>
                                    )}

                                    {((finding.matchedDocumentIds as string[])?.length > 0) && (
                                        <div className="mt-3 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-3 rounded-md">
                                            <strong className="text-xs text-gray-900 dark:text-gray-200 uppercase tracking-wide">Evaluated Documents:</strong>
                                            <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                {(finding.matchedDocumentIds as string[]).map(docId => (
                                                    <li key={docId}>{docMap.get(docId) || 'Unknown Document'}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {(finding.recommendedActions as string[])?.length > 0 && (
                                        <div className="mt-3 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-3 rounded-md">
                                            <strong className="text-xs text-gray-900 dark:text-gray-200 uppercase tracking-wide">Recommendation:</strong>
                                            <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                {(finding.recommendedActions as string[]).map((action, i) => <li key={i}>{action}</li>)}
                                            </ul>
                                        </div>
                                    )}
                                </div>

                                <div className="md:w-32 flex flex-col items-end gap-2 shrink-0">
                                    <span className={`px-3 py-1 text-xs font-bold rounded-full border shadow-sm ${finding.status === 'PASS' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:border-green-800/50 dark:text-green-400' :
                                        finding.status === 'PARTIAL' ? 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800/50 dark:text-yellow-400' :
                                            'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:border-red-800/50 dark:text-red-400'
                                        }`}>
                                        {finding.status}
                                    </span>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    )
}
