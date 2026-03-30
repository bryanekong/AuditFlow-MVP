"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export function ExceptionList({ exceptions, workspaceId }: { exceptions: any[], workspaceId: string }) {
    const router = useRouter()
    const [updating, setUpdating] = useState<string | null>(null)

    const handleStatusChange = async (exceptionId: string, newStatus: string) => {
        setUpdating(exceptionId)
        try {
            const res = await fetch(`/api/workspaces/${workspaceId}/exceptions`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ exceptionId, status: newStatus })
            })
            if (res.ok) {
                router.refresh()
            }
        } catch (e) {
            console.error(e)
        } finally {
            setUpdating(null)
        }
    }

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'OPEN': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800'
            case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800'
            case 'RESOLVED': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800'
            case 'RISK_ACCEPTED': return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800'
            default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300'
        }
    }

    const getSeverityIcon = (sev: string) => {
        switch (sev) {
            case 'CRITICAL': return '🔴'
            case 'HIGH': return '🟠'
            case 'MEDIUM': return '🟡'
            case 'LOW': return '🔵'
            default: return '⚪'
        }
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left align-middle">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-zinc-950/50 dark:text-gray-400 border-b border-gray-200 dark:border-zinc-800">
                    <tr>
                        <th className="px-6 py-4 font-semibold">Requirement</th>
                        <th className="px-6 py-4 font-semibold">Title</th>
                        <th className="px-6 py-4 font-semibold">Severity</th>
                        <th className="px-6 py-4 font-semibold">Owner</th>
                        <th className="px-6 py-4 font-semibold">Due Date</th>
                        <th className="px-6 py-4 font-semibold">Status</th>
                        <th className="px-6 py-4 font-semibold text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
                    {exceptions.map(ex => (
                        <tr key={ex.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition bg-white dark:bg-zinc-900">
                            <td className="px-6 py-4 whitespace-nowrap">
                                <Link 
                                    href={`/workspaces/${workspaceId}/compliance/${ex.requirement.frameworkId}/${ex.requirementId}`}
                                    className="font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-2"
                                >
                                    {ex.requirement.code}
                                    <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                </Link>
                            </td>
                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-200">
                                {ex.title}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                                    {getSeverityIcon(ex.severity)} {ex.severity}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">
                                {ex.ownerName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">
                                {ex.dueDate ? new Date(ex.dueDate).toLocaleDateString() : '—'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${getStatusStyle(ex.status)}`}>
                                    {ex.status.replace('_', ' ')}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <select 
                                    value={ex.status}
                                    onChange={(e) => handleStatusChange(ex.id, e.target.value)}
                                    disabled={updating === ex.id}
                                    className="text-xs bg-gray-50 border border-gray-300 text-gray-900 rounded focus:ring-blue-500 focus:border-blue-500 block w-full p-1.5 dark:bg-zinc-800 dark:border-zinc-700 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 disabled:opacity-50"
                                >
                                    <option value="OPEN">Open</option>
                                    <option value="IN_PROGRESS">In Progress</option>
                                    <option value="RESOLVED">Resolved</option>
                                    <option value="RISK_ACCEPTED">Risk Accepted</option>
                                </select>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
