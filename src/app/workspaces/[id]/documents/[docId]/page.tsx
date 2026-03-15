import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { checkPermissions } from '@/lib/rbac'
import { DocumentViewerClient } from './client-viewer'

export default async function DocumentDetailsPage({ params, searchParams }: { params: { id: string, docId: string }, searchParams: { hl?: string } }) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/auth/login')
    }

    const hasAccess = await checkPermissions(user.id, params.id, 'MEMBER')
    if (!hasAccess) {
        redirect(`/workspaces/${params.id}`)
    }

    const document = await prisma.document.findUnique({
        where: { id: params.docId, workspaceId: params.id },
        include: {
            metadata: true,
            versions: {
                orderBy: { versionNumber: 'desc' },
                include: { document: true }
            },
            user: true
        }
    })

    if (!document) {
        return notFound()
    }

    const highlights = searchParams.hl ? searchParams.hl.split(',') : []

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Link href={`/workspaces/${params.id}/documents`} className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
                            &larr; Back to Documents
                        </Link>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        {document.filename}
                        <span className="text-sm font-normal text-gray-500 bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md border border-gray-200 dark:border-zinc-700">
                            v{document.versions.length}
                        </span>
                    </h1>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-3">
                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm min-h-[500px]">
                        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white border-b border-gray-100 dark:border-zinc-800 pb-2">Extracted Content</h2>
                        {document.status === 'UPLOADED' && (
                            <div className="flex items-center justify-center h-64 text-gray-500 flex-col gap-3">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
                                <p>Processing document...</p>
                            </div>
                        )}
                        {document.status === 'FAILED' && (
                            <div className="text-red-500 p-4 bg-red-50 dark:bg-red-900/10 rounded-lg">
                                Failed to extract text from this document.
                            </div>
                        )}
                        {document.status === 'PROCESSED' && document.metadata?.extractedTextPreview?.trim() ? (
                            <DocumentViewerClient
                                text={document.metadata.extractedTextPreview}
                                highlights={highlights}
                            />
                        ) : document.status === 'PROCESSED' && (
                            <div className="text-gray-500 italic flex items-center justify-center p-8 bg-gray-50 dark:bg-zinc-950 rounded-lg">
                                No parseable text detected. This document may be image-based or digitally corrupted.
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Metadata</h3>
                        <dl className="space-y-3 text-sm">
                            <div>
                                <dt className="text-gray-500 dark:text-gray-400">Classification</dt>
                                <dd className="font-medium text-gray-900 dark:text-gray-200 mt-0.5">{document.metadata?.docType || 'Unclassified'}</dd>
                            </div>
                            <div>
                                <dt className="text-gray-500 dark:text-gray-400">Confidence</dt>
                                <dd className="font-medium text-gray-900 dark:text-gray-200 mt-0.5">
                                    {document.metadata?.confidence ? (document.metadata.confidence * 100).toFixed(1) + '%' : 'N/A'}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-gray-500 dark:text-gray-400">Size</dt>
                                <dd className="font-medium text-gray-900 dark:text-gray-200 mt-0.5">
                                    {(document.size / 1024 / 1024).toFixed(2)} MB
                                </dd>
                            </div>
                            <div>
                                <dt className="text-gray-500 dark:text-gray-400">Uploaded By</dt>
                                <dd className="font-medium text-gray-900 dark:text-gray-200 mt-0.5 truncate" title={document.user?.email || 'Unknown'}>{document.user?.email || 'Unknown'}</dd>
                            </div>
                        </dl>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Version History</h3>
                        <div className="space-y-3">
                            {document.versions.map((ver) => (
                                <div key={ver.id} className="flex justify-between items-start text-sm">
                                    <div>
                                        <div className="font-medium text-gray-900 dark:text-gray-200">Version {ver.versionNumber}</div>
                                        <div className="text-xs text-gray-500 mt-0.5">{new Date(ver.uploadedAt).toLocaleString()}</div>
                                    </div>
                                    {ver.versionNumber === document.versions.length && (
                                        <span className="text-[10px] uppercase font-bold text-green-700 bg-green-100 dark:bg-green-900/40 dark:text-green-400 px-1.5 py-0.5 rounded">Current</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
