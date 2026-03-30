import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { EvidenceSubmissionModal } from './evidence-submission-modal'


export default async function ControlDetailsPage({ params }: { params: { id: string, frameworkId: string, requirementId: string } }) {
    const requirement = await prisma.frameworkRequirement.findUnique({
        where: { id: params.requirementId },
        include: {
            framework: { select: { name: true, code: true } },
            evidenceTypes: {
                include: {
                    evidenceItems: {
                        where: { workspaceId: params.id },
                        include: { document: true },
                        orderBy: { createdAt: 'desc' }
                    }
                }
            }
        }
    })

    if (!requirement) {
        return <div className="p-6">Control not found</div>
    }

    const evidenceType = requirement.evidenceTypes[0]
    const items = evidenceType?.evidenceItems || []
    
    // Get all workspace documents for the modal dropdown
    const documents = await prisma.document.findMany({
        where: { workspaceId: params.id },
        select: { id: true, filename: true },
        orderBy: { uploadedAt: 'desc' }
    })

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <Link href={`/workspaces/${params.id}/compliance`} className="text-sm text-gray-500 hover:underline mb-3 inline-block dark:text-gray-400 transition">← Back to Hub</Link>
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold dark:text-white">{requirement.code} {requirement.title}</h1>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                        requirement.severity === 'CRITICAL' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                        requirement.severity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    }`}>{requirement.severity}</span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{requirement.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                    {/* Auditor Test Procedure */}
                    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-5 shadow-sm">
                        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-2">
                            Auditor Test Procedure
                        </h2>
                        {evidenceType?.testProcedure ? (
                            <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-sans bg-gray-50 dark:bg-zinc-950 p-4 rounded-lg border border-gray-100 dark:border-zinc-800">
                                {evidenceType.testProcedure}
                            </pre>
                        ) : (
                            <p className="text-sm text-gray-500 italic">No test procedure defined.</p>
                        )}
                        {evidenceType?.accountableRole && (
                            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-zinc-800 flex items-center gap-2">
                                <span className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Accountability:</span>
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{evidenceType.accountableRole}</span>
                            </div>
                        )}
                    </div>

                    {/* CEG Requirements */}
                    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-5 shadow-sm">
                        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
                            Verification Rules (CEG Gate)
                        </h2>
                        {evidenceType ? (
                            <ul className="space-y-3 text-sm">
                                <li className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-zinc-800">
                                    <span className="text-gray-500 dark:text-gray-400">Target Type</span>
                                    <span className="font-medium dark:text-gray-200">{evidenceType.name}</span>
                                </li>
                                <li className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-zinc-800">
                                    <span className="text-gray-500 dark:text-gray-400">Max Age (Freshness)</span>
                                    <span className="font-medium dark:text-gray-200">{evidenceType.maxAgeDays} days</span>
                                </li>
                                <li className="flex flex-col py-2 border-b border-gray-100 dark:border-zinc-800">
                                    <span className="text-gray-500 dark:text-gray-400 mb-1">Required Keywords (Consistency)</span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {evidenceType.requiredKeywords.map(kw => (
                                            <span key={kw} className="bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800/50 px-2 py-0.5 rounded text-xs font-medium">
                                                {kw}
                                            </span>
                                        ))}
                                    </div>
                                </li>
                                <li className="flex flex-col py-2">
                                    <span className="text-gray-500 dark:text-gray-400 mb-1">Required Document Types (Completeness)</span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {evidenceType.requiredDocTypes.map(dt => (
                                            <span key={dt} className="bg-gray-100 text-gray-700 border border-gray-200 dark:bg-zinc-800 dark:text-gray-300 dark:border-zinc-700 px-2 py-0.5 rounded text-xs font-medium">
                                                {dt}
                                            </span>
                                        ))}
                                    </div>
                                </li>
                            </ul>
                        ) : (
                            <p className="text-sm text-gray-500 italic">No rules defined.</p>
                        )}
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                            Mapped Evidence Component
                        </h2>
                        {evidenceType && (
                            <EvidenceSubmissionModal 
                                workspaceId={params.id} 
                                evidenceTypeId={evidenceType.id} 
                                documents={documents}
                            />
                        )}
                    </div>
                    
                    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm overflow-hidden min-h-[500px]">
                        {items.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center p-8 text-gray-500 dark:text-gray-400">
                                <div className="text-4xl mb-3 opacity-20">📄</div>
                                <p className="text-sm font-medium mb-1">No Evidence Mapped</p>
                                <p className="text-xs">Map a document and assign ownership to satisfy this control.</p>
                            </div>
                        ) : (
                            <ul className="divide-y divide-gray-100 dark:divide-zinc-800">
                                {items.map(item => (
                                    <li key={item.id} className="p-5">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <span className="text-2xl">📄</span>
                                                <div>
                                                    <p className="text-sm font-medium dark:text-white truncate max-w-[200px]">
                                                        {item.document?.filename ?? 'External Link'}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        Mapped {new Date(item.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                                                    item.ownerName && item.systemSource 
                                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-500 border border-green-200 dark:border-green-800' 
                                                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-500 border border-yellow-200 dark:border-yellow-800'
                                                }`}>
                                                    {item.ownerName && item.systemSource ? 'Traceable' : 'Missing Metadata'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
                                            <div className="bg-gray-50 dark:bg-zinc-950 p-3 rounded border border-gray-100 dark:border-zinc-800">
                                                <span className="block text-gray-500 dark:text-gray-400 mb-1 uppercase font-semibold tracking-wider">Evidence Date</span>
                                                <span className="font-medium dark:text-gray-200">
                                                    {item.evidenceDate ? new Date(item.evidenceDate).toLocaleDateString() : '—'}
                                                </span>
                                            </div>
                                            <div className="bg-gray-50 dark:bg-zinc-950 p-3 rounded border border-gray-100 dark:border-zinc-800">
                                                <span className="block text-gray-500 dark:text-gray-400 mb-1 uppercase font-semibold tracking-wider">System Source</span>
                                                <span className="font-medium dark:text-gray-200 truncate block">
                                                    {item.systemSource || '—'}
                                                </span>
                                            </div>
                                            <div className="bg-gray-50 dark:bg-zinc-950 p-3 rounded border border-gray-100 dark:border-zinc-800 col-span-2">
                                                <span className="block text-gray-500 dark:text-gray-400 mb-1 uppercase font-semibold tracking-wider">Accountable Owner</span>
                                                <span className="font-medium dark:text-gray-200">
                                                    {item.ownerName || '—'}
                                                </span>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
