'use client'

import { useState } from 'react'
import { updateWorkspace, deleteWorkspace, createInvite, revokeInvite, removeMember, updateMemberRole } from './actions'
import { Role } from '@/lib/rbac'

type Workspace = any // From Prisma

export default function ClientTabs({ workspace, currentRole, currentUserId }: { workspace: Workspace, currentRole: Role, currentUserId: string }) {
    const [activeTab, setActiveTab] = useState<'general' | 'team'>('general')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // Forms
    const [wsName, setWsName] = useState(workspace.name)
    const [inviteEmail, setInviteEmail] = useState('')
    const [inviteRole, setInviteRole] = useState<Role>('MEMBER')

    const handleUpdateName = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true); setError('')
        try {
            const formData = new FormData()
            formData.append('name', wsName)
            await updateWorkspace(workspace.id, formData)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm('Are you ABSOLUTELY sure? This deletes all documents and scans permanently.')) return
        setLoading(true); setError('')
        try {
            await deleteWorkspace(workspace.id)
        } catch (err: any) {
            setError(err.message)
            setLoading(false)
        }
    }

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true); setError('')
        try {
            const formData = new FormData()
            formData.append('email', inviteEmail)
            formData.append('role', inviteRole)
            await createInvite(workspace.id, formData)
            setInviteEmail('') // reset
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleRevoke = async (inviteId: string) => {
        setLoading(true); setError('')
        try {
            await revokeInvite(workspace.id, inviteId)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleRemoveMember = async (userId: string) => {
        if (!confirm('Remove this member?')) return
        setLoading(true); setError('')
        try {
            await removeMember(workspace.id, userId)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleRoleChange = async (userId: string, newRole: string) => {
        setLoading(true); setError('')
        try {
            await updateMemberRole(workspace.id, userId, newRole)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
            <div className="flex border-b border-gray-200 dark:border-zinc-800">
                <button
                    onClick={() => setActiveTab('general')}
                    className={`flex-1 py-4 text-sm font-medium transition-colors ${activeTab === 'general' ? 'bg-gray-50 dark:bg-zinc-800 text-black dark:text-white border-b-2 border-black dark:border-white' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'}`}
                >
                    General Settings
                </button>
                <button
                    onClick={() => setActiveTab('team')}
                    className={`flex-1 py-4 text-sm font-medium transition-colors ${activeTab === 'team' ? 'bg-gray-50 dark:bg-zinc-800 text-black dark:text-white border-b-2 border-black dark:border-white' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'}`}
                >
                    Team Management
                </button>
            </div>

            <div className="p-8">
                {error && <div className="mb-6 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

                {activeTab === 'general' && (
                    <div className="space-y-8 animate-in fade-in">
                        {/* Name Update */}
                        <form onSubmit={handleUpdateName} className="space-y-4 max-w-md">
                            <div>
                                <label className="block text-sm font-medium dark:text-gray-300 mb-1">Workspace Name</label>
                                <input type="text" value={wsName} onChange={e => setWsName(e.target.value)} required
                                    className="w-full border-gray-300 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white rounded-md p-2.5 shadow-sm focus:ring-black dark:focus:ring-white" />
                            </div>
                            <button disabled={loading} className="bg-black text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition dark:bg-white dark:text-black dark:hover:bg-gray-200 disabled:opacity-50">
                                Save Name
                            </button>
                        </form>

                        <div className="border-t border-gray-200 dark:border-zinc-800 pt-8" />

                        {/* Danger Zone */}
                        <div>
                            <h3 className="text-red-600 font-semibold mb-2">Danger Zone</h3>
                            <p className="text-sm text-gray-500 mb-4 items-center">Delete this workspace and all associated documents, logs, and scans.</p>
                            <button onClick={handleDelete} disabled={loading || currentRole !== 'OWNER'} className="border border-red-600 text-red-600 px-4 py-2 rounded-md text-sm font-medium hover:bg-red-50 transition disabled:opacity-50">
                                Delete Workspace
                            </button>
                            {currentRole !== 'OWNER' && <p className="text-xs text-red-500 mt-2">Only the Workspace Owner can perform this action.</p>}
                        </div>
                    </div>
                )}

                {activeTab === 'team' && (
                    <div className="space-y-8 animate-in fade-in">
                        {/* Invite Form */}
                        <div className="bg-gray-50 dark:bg-zinc-950 p-6 rounded-lg border border-gray-200 dark:border-zinc-800">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Invite new member</h3>
                            <form onSubmit={handleInvite} className="flex gap-4 items-end">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                                    <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} required placeholder="colleague@company.com"
                                        className="w-full border-gray-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white rounded-md shadow-sm focus:ring-black p-2.5" />
                                </div>
                                <div className="w-48">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                                    <select value={inviteRole} onChange={e => setInviteRole(e.target.value as Role)}
                                        className="w-full border-gray-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white rounded-md shadow-sm focus:ring-black p-2.5">
                                        <option value="ADMIN">Admin</option>
                                        <option value="MEMBER">Member</option>
                                        <option value="VIEWER">Viewer</option>
                                    </select>
                                </div>
                                <button type="submit" disabled={loading} className="bg-black text-white px-6 py-2.5 rounded-md font-medium hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 transition disabled:opacity-50">
                                    Send Invite
                                </button>
                            </form>
                        </div>

                        {/* Pending Invites list */}
                        {workspace.invitations.length > 0 && (
                            <div>
                                <h3 className="font-medium text-gray-900 dark:text-white mb-3">Pending Invitations ({workspace.invitations.length})</h3>
                                <ul className="divide-y divide-gray-200 dark:divide-zinc-800 border-t border-b border-gray-200 dark:border-zinc-800">
                                    {workspace.invitations.map((inv: any) => (
                                        <li key={inv.id} className="py-4 flex justify-between items-start">
                                            <div className="text-sm flex-1 mr-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium dark:text-white">{inv.email}</span>
                                                    <span className="text-xs text-gray-500 bg-gray-100 dark:bg-zinc-800 px-2 rounded-full">{inv.role}</span>
                                                </div>
                                                <p className="text-xs text-gray-400 mt-1">Expires: {new Date(inv.expiresAt).toLocaleDateString()}</p>

                                                {/* Local Testing MVP: Display the link directly */}
                                                <div className="mt-3 flex items-center gap-2">
                                                    <input
                                                        readOnly
                                                        value={typeof window !== 'undefined' ? `${window.location.origin}/invite/${inv.token}` : ''}
                                                        className="text-xs font-mono bg-gray-100 dark:bg-zinc-950 p-2 rounded-md border border-gray-200 dark:border-zinc-800 w-full max-w-[300px] text-gray-600 dark:text-gray-400 cursor-text"
                                                        onClick={(e) => (e.target as HTMLInputElement).select()}
                                                    />
                                                    <button
                                                        onClick={() => navigator.clipboard.writeText(typeof window !== 'undefined' ? `${window.location.origin}/invite/${inv.token}` : '')}
                                                        className="text-xs font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 dark:bg-zinc-800 dark:text-gray-300 dark:border-zinc-700 dark:hover:bg-zinc-700 rounded-md px-3 py-2 transition-colors shadow-sm"
                                                    >
                                                        Copy Link
                                                    </button>
                                                </div>
                                            </div>
                                            <button onClick={() => handleRevoke(inv.id)} disabled={loading} className="text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium py-1 px-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded disabled:opacity-50 transition-colors">
                                                Revoke
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Current Team list */}
                        <div>
                            <h3 className="font-medium text-gray-900 dark:text-white mb-3">Active Members ({workspace.members.length})</h3>
                            <ul className="divide-y divide-gray-200 dark:divide-zinc-800 border border-gray-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                                {workspace.members.map((member: any) => (
                                    <li key={member.userId} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-gray-900 dark:text-white text-sm">
                                                {member.user.email} {member.userId === currentUserId && "(You)"}
                                            </span>
                                            {member.user.name && <span className="text-xs text-gray-500">{member.user.name}</span>}
                                        </div>

                                        <div className="flex items-center gap-3">
                                            {/* Role Selector */}
                                            {member.role === 'OWNER' ? (
                                                <span className="text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded-md">OWNER</span>
                                            ) : (
                                                <select
                                                    value={member.role}
                                                    onChange={(e) => handleRoleChange(member.userId, e.target.value)}
                                                    disabled={loading || member.userId === currentUserId}
                                                    className="border-gray-300 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white rounded-md text-xs py-1 pl-2 pr-6 focus:ring-black shadow-sm"
                                                >
                                                    <option value="ADMIN">Admin</option>
                                                    <option value="MEMBER">Member</option>
                                                    <option value="VIEWER">Viewer</option>
                                                </select>
                                            )}

                                            {/* Remove Member Button */}
                                            {member.role !== 'OWNER' && member.userId !== currentUserId && (
                                                <button onClick={() => handleRemoveMember(member.userId)} disabled={loading} className="text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium">
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
