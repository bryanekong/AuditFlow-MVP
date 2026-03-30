import { prisma } from '@/lib/prisma'

export default async function FrameworkChangelogPage({ params }: { params: { id: string } }) {
    const libraries = await prisma.controlLibraryVersion.findMany({
        orderBy: { releasedAt: 'desc' },
        include: {
            framework: { select: { name: true, code: true } },
            changeLogs: { orderBy: { createdAt: 'asc' } },
            evidenceTypes: {
                select: { name: true, maxAgeDays: true, systemSource: true, requiredDocTypes: true, testProcedure: true, accountableRole: true }
            }
        }
    })

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold dark:text-white">Framework Changelog</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Versioned release history of the control library. Every change is logged and peer-reviewed.
                </p>
            </div>

            {libraries.length === 0 ? (
                <div className="text-center py-16 text-gray-400 dark:text-gray-500 text-sm">
                    No library versions found. Run <code className="bg-gray-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-xs">npx tsx prisma/seed.ts</code> to seed the framework data.
                </div>
            ) : libraries.map(lib => (
                <div key={lib.id} className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                    {/* Header */}
                    <div className="px-6 py-5 border-b border-gray-100 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                            <div className="flex items-center gap-3">
                                <span className="font-mono text-sm font-bold bg-gray-100 dark:bg-zinc-800 px-2.5 py-1 rounded text-gray-700 dark:text-gray-300">
                                    v{lib.version}
                                </span>
                                <span className="text-base font-semibold text-gray-900 dark:text-white">{lib.framework.name}</span>
                                {lib.isActive && (
                                    <span className="text-[10px] uppercase font-bold text-green-700 bg-green-100 dark:bg-green-900/40 dark:text-green-400 px-2 py-0.5 rounded-full">Active</span>
                                )}
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Released {new Date(lib.releasedAt).toLocaleDateString()} &middot; Reviewed by <strong className="text-gray-700 dark:text-gray-300">{lib.reviewedBy}</strong>
                            </p>
                        </div>
                        <div className="text-right text-sm text-gray-500 dark:text-gray-400">
                            {lib.changeLogs.length} control{lib.changeLogs.length !== 1 ? 's' : ''} &middot; {lib.evidenceTypes.length} evidence type{lib.evidenceTypes.length !== 1 ? 's' : ''}
                        </div>
                    </div>

                    {/* Notes */}
                    {lib.notes && (
                        <div className="px-6 py-4 bg-blue-50 dark:bg-blue-950/20 border-b border-blue-100 dark:border-blue-900/30">
                            <p className="text-sm text-blue-700 dark:text-blue-300">{lib.notes}</p>
                        </div>
                    )}

                    {/* Evidence Types */}
                    {lib.evidenceTypes.length > 0 && (
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-zinc-800">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">Evidence Type Rules</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {lib.evidenceTypes.map((et, i) => (
                                    <div key={i} className="bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg px-4 py-3 text-sm">
                                        <div className="font-medium text-gray-900 dark:text-gray-100">{et.name}</div>
                                        <div className="text-gray-500 dark:text-gray-400 mt-1 space-y-0.5">
                                            <div>Max age: <span className="text-gray-700 dark:text-gray-300 font-medium">{et.maxAgeDays} days</span></div>
                                            <div>Doc types: <span className="text-gray-700 dark:text-gray-300 font-medium">{et.requiredDocTypes.join(', ')}</span></div>
                                            <div>Source: <span className="text-gray-700 dark:text-gray-300 font-medium">{et.systemSource ?? 'any'}</span></div>
                                            {et.accountableRole && <div>Owner: <span className="text-gray-700 dark:text-gray-300 font-medium">{et.accountableRole}</span></div>}
                                            {et.testProcedure && (
                                                <details className="mt-2">
                                                    <summary className="cursor-pointer text-xs text-blue-600 dark:text-blue-400 hover:underline">View test procedure</summary>
                                                    <pre className="mt-1 text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap font-sans">{et.testProcedure}</pre>
                                                </details>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Change log entries */}
                    {lib.changeLogs.length > 0 && (
                        <div className="px-6 py-4">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">Change Log</h3>
                            <ul className="space-y-3">
                                {lib.changeLogs.map(entry => (
                                    <li key={entry.id} className="flex gap-3 text-sm">
                                        <div className="flex-none">
                                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${entry.changeType === 'ADDED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                    entry.changeType === 'MODIFIED' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                }`}>{entry.changeType}</span>
                                        </div>
                                        <div className="flex-1">
                                            <span className="font-mono text-xs text-gray-500 dark:text-gray-400 mr-2">{entry.controlCode}</span>
                                            <span className="text-gray-700 dark:text-gray-300">{entry.summary}</span>
                                            {entry.customerImpact && (
                                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{entry.customerImpact}</p>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
}
