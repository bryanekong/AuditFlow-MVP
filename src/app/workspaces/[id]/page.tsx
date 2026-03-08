import { prisma } from '@/lib/prisma'
import Link from "next/link"



export default async function WorkspaceDashboard({ params }: { params: { id: string } }) {
    // We know the user is authorized because the layout checked it.
    const docsCount = await prisma.document.count({ where: { workspaceId: params.id } })
    const scansCount = await prisma.scanRun.count({ where: { workspaceId: params.id } })
    const recentDocs = await prisma.document.findMany({
        where: { workspaceId: params.id },
        orderBy: { uploadedAt: 'desc' },
        take: 5
    })

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
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Readiness Score</h3>
                    <p className="mt-2 text-2xl font-bold text-gray-400 italic">Not run</p>
                </div>
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-gray-200 dark:border-zinc-800 shadow-sm transition hover:shadow-md">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Missing Docs</h3>
                    <p className="mt-2 text-2xl font-bold text-gray-400 italic">N/A</p>
                </div>
            </div>

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
            </div>
        </div>
    )
}
