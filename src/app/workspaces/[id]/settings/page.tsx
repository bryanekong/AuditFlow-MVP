import { prisma } from '@/lib/prisma'



export default async function SettingsPage({ params }: { params: { id: string } }) {
    const logs = await prisma.auditLogEvent.findMany({
        where: { workspaceId: params.id },
        include: { actor: true },
        orderBy: { createdAt: 'desc' },
        take: 50
    })

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold dark:text-white mb-2">Workspace Settings & Audit Logs</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">View recent activity and compliance logs.</p>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-zinc-800">
                    <h2 className="text-lg font-semibold dark:text-white">Audit Log</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-800">
                        <thead className="bg-gray-50 dark:bg-zinc-950/50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Timestamp</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Actor</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Action</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
                            {logs.length > 0 ? logs.map(log => (
                                <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        {new Date(log.createdAt).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                                        {log.actor.email}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-medium">
                                        {log.action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                        {log.metadata ? (
                                            <ul className="list-disc list-inside">
                                                {Object.entries(log.metadata as Record<string, any>).map(([key, value]) => (
                                                    <li key={key}>
                                                        <span className="font-semibold text-gray-700 dark:text-gray-300 capitalize">{key}:</span> {String(value)}
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : '-'}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                                        No audit logs recorded yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
