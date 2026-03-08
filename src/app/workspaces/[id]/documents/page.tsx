import { prisma } from '@/lib/prisma'
import { UploadForm } from "./upload-form"
import { deleteDocument } from "./actions"
import { DeleteForm } from "./delete-form"



export default async function DocumentsPage({ params }: { params: { id: string } }) {
    const documents = await prisma.document.findMany({
        where: { workspaceId: params.id },
        include: { metadata: true, user: true },
        orderBy: { uploadedAt: 'desc' }
    })

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold dark:text-white mb-2">Documents</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Manage all evidence, policies, and records for your audits.</p>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-gray-200 dark:border-zinc-800 shadow-sm">
                <UploadForm workspaceId={params.id} />
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-800">
                        <thead className="bg-gray-50 dark:bg-zinc-950/50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Name</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Type</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Status</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Date</th>
                                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-zinc-900 divide-y divide-gray-200 dark:divide-zinc-800">
                            {documents.length > 0 ? (
                                documents.map(doc => (
                                    <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                            <span className="truncate max-w-[200px]" title={doc.filename}>{doc.filename}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {doc.metadata?.docType || 'Unclassified'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${doc.status === 'PROCESSED' ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' :
                                                doc.status === 'UPLOADED' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300' :
                                                    'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                                                }`}>
                                                {doc.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {new Date(doc.uploadedAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <DeleteForm actionFn={deleteDocument.bind(null, params.id, doc.id, doc.storagePath) as any} />
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                                        No documents found. Start by uploading one above.
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
