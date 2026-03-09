import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { acceptInvite } from './actions'

export default async function InviteAcceptPage({ params }: { params: { token: string } }) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        // Redirect to signup with the intended destination so they can return
        redirect(`/auth/signup?message=${encodeURIComponent('Please sign up to accept your invitation.')}`)
    }

    const invitation = await prisma.workspaceInvitation.findUnique({
        where: { token: params.token },
        include: { workspace: true, inviter: true }
    })

    if (!invitation) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950">
                <div className="bg-white dark:bg-zinc-900 p-8 rounded-xl shadow-sm text-center max-w-md w-full border border-gray-200 dark:border-zinc-800">
                    <h1 className="text-xl font-bold text-red-600">Invalid Invitation</h1>
                    <p className="text-gray-500 mt-2">This invitation link is invalid or has expired.</p>
                </div>
            </div>
        )
    }

    if (new Date() > new Date(invitation.expiresAt)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950">
                <div className="bg-white dark:bg-zinc-900 p-8 rounded-xl shadow-sm text-center max-w-md w-full border border-gray-200 dark:border-zinc-800">
                    <h1 className="text-xl font-bold text-red-600">Invitation Expired</h1>
                    <p className="text-gray-500 mt-2">This invitation has expired. Please request a new one.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-zinc-950 py-12 px-4 sm:px-6">
            <div className="w-full max-w-md bg-white dark:bg-zinc-900 shadow-sm rounded-2xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
                <div className="p-8 text-center space-y-4">
                    <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mb-6">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                    </div>

                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Join {invitation.workspace.name}</h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        <span className="font-semibold">{invitation.inviter.email}</span> has invited you to join their workspace.
                    </p>

                    <form action={acceptInvite} className="pt-6">
                        <input type="hidden" name="token" value={params.token} />
                        <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black">
                            Accept Invitation
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
