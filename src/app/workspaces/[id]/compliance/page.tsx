import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function ComplianceHubPage({ params }: { params: { id: string } }) {
    // Only ISO27001 is supported
    const framework = await prisma.framework.findFirst({
        where: { code: 'ISO27001' },
        include: {
            requirements: {
                orderBy: { code: 'asc' },
                include: {
                    evidenceTypes: {
                        include: {
                            evidenceItems: {
                                where: { workspaceId: params.id },
                                select: { id: true, ownerName: true, systemSource: true }
                            }
                        }
                    }
                }
            }
        }
    })

    if (!framework) {
        return <div className="p-6">Framework not found</div>
    }

    // Group controls by Annex A domain
    const domains = [
        { prefix: 'A.5', name: 'Organisational Controls' },
        { prefix: 'A.6', name: 'People Controls' },
        { prefix: 'A.7', name: 'Physical Controls' },
        { prefix: 'A.8', name: 'Technological Controls' },
    ]

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold dark:text-white">Compliance Hub &middot; {framework.name}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Map your evidence to the specific controls required by the framework. Mapped evidence drives the CEG verification engine.
                </p>
            </div>

            <div className="space-y-10">
                {domains.map(domain => {
                    const controls = framework.requirements.filter(r => r.code.startsWith(domain.prefix))
                    if (controls.length === 0) return null

                    return (
                        <div key={domain.prefix} className="space-y-4">
                            <h2 className="text-lg font-semibold dark:text-gray-200 border-b border-gray-200 dark:border-zinc-800 pb-2">
                                {domain.prefix} {domain.name}
                            </h2>
                            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                                <ul className="divide-y divide-gray-100 dark:divide-zinc-800">
                                    {controls.map(control => {
                                        // For now assumes 1:1 relation per the seed
                                        const evidenceType = control.evidenceTypes[0]
                                        const items = evidenceType?.evidenceItems || []
                                        const isMapped = items.length > 0
                                        const isFullyTraceable = isMapped && items.some(i => i.ownerName && i.systemSource)

                                        return (
                                            <li key={control.id}>
                                                <Link 
                                                    href={`/workspaces/${params.id}/compliance/${framework.id}/${control.id}`} 
                                                    className="block hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition px-6 py-4"
                                                >
                                                    <div className="flex items-center justify-between gap-4">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-3 mb-1">
                                                                <span className="font-mono text-sm font-bold text-gray-700 dark:text-gray-300">{control.code}</span>
                                                                <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{control.title}</span>
                                                            </div>
                                                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{evidenceType?.name || 'No evidence type defined'}</p>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            {isMapped ? (
                                                                isFullyTraceable ? (
                                                                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                                                        Mapped & Traceable
                                                                    </span>
                                                                ) : (
                                                                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                                                                        Mapped (Missing Metadata)
                                                                    </span>
                                                                )
                                                            ) : (
                                                                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-gray-400">
                                                                    Missing Evidence
                                                                </span>
                                                            )}
                                                            <span className="text-gray-400">→</span>
                                                        </div>
                                                    </div>
                                                </Link>
                                            </li>
                                        )
                                    })}
                                </ul>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
