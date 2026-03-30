"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

type DocumentItem = { id: string; filename: string }

export function EvidenceSubmissionModal({ 
    workspaceId, 
    evidenceTypeId, 
    documents 
}: { 
    workspaceId: string
    evidenceTypeId: string
    documents: DocumentItem[]
}) {
    const router = useRouter()
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        setError("")

        const formData = new FormData(e.currentTarget)
        const documentId = formData.get("documentId") as string
        const ownerName = formData.get("ownerName") as string
        const systemSource = formData.get("systemSource") as string
        const evidenceDate = formData.get("evidenceDate") as string

        if (!documentId) {
            setError("Please select a document.")
            setLoading(false)
            return
        }

        try {
            const res = await fetch(`/api/workspaces/${workspaceId}/evidence`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    evidenceTypeId,
                    documentId,
                    ownerName,
                    systemSource,
                    evidenceDate: evidenceDate ? new Date(evidenceDate).toISOString() : null
                })
            })

            if (!res.ok) throw new Error(await res.text())

            setIsOpen(false)
            router.refresh()
        } catch (err: any) {
            setError(err.message || "Failed to submit evidence.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <button 
                onClick={() => setIsOpen(true)}
                className="bg-blue-600 text-white hover:bg-blue-700 px-3 py-1.5 rounded-md text-sm font-medium transition shadow-sm"
            >
                Add Evidence
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-gray-200 dark:border-zinc-800 w-full max-w-lg overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center">
                            <h3 className="text-lg font-bold dark:text-white">Map Evidence to Control</h3>
                            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">&times;</button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {error && <div className="p-3 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-sm rounded">{error}</div>}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Document</label>
                                <select 
                                    name="documentId" 
                                    required
                                    className="w-full bg-gray-50 dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 text-sm"
                                >
                                    <option value="">-- Select an uploaded document --</option>
                                    {documents.map(doc => (
                                        <option key={doc.id} value={doc.id}>{doc.filename}</option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-500 mt-1">If your document isn't here, upload it in the Documents tab first.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Evidence Date</label>
                                    <input 
                                        type="date" 
                                        name="evidenceDate" 
                                        className="w-full bg-gray-50 dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">System Source</label>
                                    <input 
                                        type="text" 
                                        name="systemSource" 
                                        required
                                        placeholder="e.g. AWS, Google Workspace"
                                        className="w-full bg-gray-50 dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Accountable Owner <span className="text-xs text-gray-500 font-normal">(Traceability)</span></label>
                                <input 
                                    type="text" 
                                    name="ownerName" 
                                    required
                                    placeholder="e.g. Jane Doe (CISO)"
                                    className="w-full bg-gray-50 dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 text-sm"
                                />
                                <p className="text-xs text-gray-500 mt-1">To achieve a passing Traceability score, evidence must have an owner and system source.</p>
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button 
                                    type="button" 
                                    onClick={() => setIsOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-zinc-800 dark:text-gray-300 dark:border-zinc-700 dark:hover:bg-zinc-700 transition"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={loading}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 disabled:opacity-50 transition shadow-sm"
                                >
                                    {loading ? 'Mapping...' : 'Map Evidence'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}
