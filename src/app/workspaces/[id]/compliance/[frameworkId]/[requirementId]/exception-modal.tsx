"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function ExceptionModal({ 
    workspaceId, 
    requirementId, 
    severity 
}: { 
    workspaceId: string, 
    requirementId: string, 
    severity: string 
}) {
    const router = useRouter()
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    
    // Form state
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [ownerName, setOwnerName] = useState('')
    const [dueDate, setDueDate] = useState('')
    const [errorMsg, setErrorMsg] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setErrorMsg('')

        try {
            const res = await fetch(`/api/workspaces/${workspaceId}/exceptions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    requirementId,
                    severity,
                    title,
                    description,
                    ownerName,
                    dueDate
                })
            })

            if (!res.ok) throw new Error(await res.text())

            setIsOpen(false)
            setTitle('')
            setDescription('')
            setOwnerName('')
            setDueDate('')
            router.refresh()
            // Optionally redirect to the Exceptions Hub
            // router.push(`/workspaces/${workspaceId}/exceptions`)
        } catch (error: any) {
            setErrorMsg(error.message || 'Failed to log exception.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <button 
                onClick={() => setIsOpen(true)}
                className="px-3 py-1.5 bg-white text-gray-700 border border-gray-300 rounded-md text-xs font-semibold hover:bg-gray-50 dark:bg-zinc-800 dark:text-gray-300 dark:border-zinc-700 transition shadow-sm flex items-center gap-1.5"
            >
                <AlertTriangleIcon className="w-3.5 h-3.5" /> Log Exception
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center bg-gray-50/50 dark:bg-zinc-950/50">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Log Control Exception</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Track remediation for a failing requirement.</p>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {errorMsg && (
                                <div className="p-3 bg-red-100 text-red-700 text-sm rounded-lg border border-red-200 dark:bg-red-900/30 dark:border-red-800 dark:text-red-300">
                                    {errorMsg}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Issue Title <span className="text-red-500">*</span></label>
                                <input 
                                    type="text" 
                                    required
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    className="w-full bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 text-sm"
                                    placeholder="e.g. Missing Network Logs"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assignee / Owner <span className="text-red-500">*</span></label>
                                <input 
                                    type="text" 
                                    required
                                    value={ownerName}
                                    onChange={e => setOwnerName(e.target.value)}
                                    className="w-full bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 text-sm"
                                    placeholder="e.g. John Doe (IT)"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target Remediation Date</label>
                                <input 
                                    type="date"
                                    value={dueDate}
                                    onChange={e => setDueDate(e.target.value)}
                                    className="w-full bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description (Optional)</label>
                                <textarea 
                                    rows={3}
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    className="w-full bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 text-sm resize-none"
                                    placeholder="Brief explanation of why this control is failing..."
                                />
                            </div>

                            <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 dark:border-zinc-800 mt-6 !pt-6">
                                <button 
                                    type="button" 
                                    onClick={() => setIsOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-zinc-800 dark:text-gray-300 dark:border-zinc-700 transition"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={loading || !title || !ownerName}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 transition shadow-sm disabled:opacity-50 flex items-center justify-center min-w-[120px]"
                                >
                                    {loading ? 'Saving...' : 'Log Exception'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}

function AlertTriangleIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
    )
}
