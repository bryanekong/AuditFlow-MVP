import { prisma } from '@/lib/prisma'
import Link from "next/link"
import { ScanForm } from "./scan-form"



export default async function ScansPage({ params }: { params: { id: string } }) {
    const scans = await prisma.scanRun.findMany({
        where: { workspaceId: params.id },
        include: { framework: true },
        orderBy: { startedAt: 'desc' }
    })

    const frameworks = await prisma.framework.findMany()

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Readiness Scans</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Run automated scans against specific frameworks to identify gaps.</p>
                </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-gray-200 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Run a new scan</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Select a framework to evaluate against your uploaded documents.</p>
                </div>
                <ScanForm workspaceId={params.id} frameworks={frameworks.map(fw => ({ id: fw.id, name: fw.name, version: fw.version }))} />
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-800">
                    <thead className="bg-gray-50 dark:bg-zinc-950/50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Framework</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Date</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Score</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
                        {scans.length > 0 ? scans.map(scan => (
                            <tr key={scan.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {scan.framework.name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                    {new Date(scan.startedAt).toLocaleString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${scan.score && scan.score >= 80 ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' :
                                        scan.score && scan.score >= 50 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300' :
                                            'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                                        }`}>
                                        {scan.score !== null ? `${scan.score.toFixed(1)}%` : 'Pending'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <Link href={`/workspaces/${params.id}/scans/${scan.id}`} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                                        View Results
                                    </Link>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                                    No scans run yet. Selection a framework and click "Run Scan" above.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
