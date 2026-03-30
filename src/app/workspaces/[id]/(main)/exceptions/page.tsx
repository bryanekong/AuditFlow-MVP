import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ExceptionList } from './exception-list'

export default async function ExceptionsPage({ params }: { params: { id: string } }) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth')

    const exceptions = await prisma.controlException.findMany({
        where: { workspaceId: params.id },
        include: {
            requirement: {
                include: { framework: true }
            }
        },
        orderBy: { openedAt: 'desc' }
    })

    // Calculate Average Days to Close pilot metric
    const resolvedExceptions = exceptions.filter((e: any) => e.resolvedAt && e.openedAt)
    let avgDaysToClose = 0
    if (resolvedExceptions.length > 0) {
        const totalMs = resolvedExceptions.reduce((acc: number, curr: any) => {
            return acc + (curr.resolvedAt!.getTime() - curr.openedAt.getTime())
        }, 0)
        avgDaysToClose = totalMs / (1000 * 60 * 60 * 24 * resolvedExceptions.length)
    }

    const openCount = exceptions.filter((e: any) => e.status === 'OPEN' || e.status === 'IN_PROGRESS').length

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-12">
            <div>
                <h1 className="text-2xl font-bold dark:text-white">Exception Management</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Track and remediate controls that are currently failing the Quality Gate.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Exceptions</h3>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{openCount}</p>
                </div>
                <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Logged</h3>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{exceptions.length}</p>
                </div>
                <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center justify-between">
                        Avg Days to Close
                        <span title="Pilot metric for endorsing bodies" className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded cursor-help">Pilot Metric</span>
                    </h3>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                        {resolvedExceptions.length > 0 ? avgDaysToClose.toFixed(1) : '-'} <span className="text-sm font-normal text-gray-500">days</span>
                    </p>
                </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-zinc-800 flex justify-between items-center bg-gray-50 dark:bg-zinc-950/50">
                    <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300">Exception Tracker</h2>
                </div>
                {exceptions.length > 0 ? (
                    <ExceptionList exceptions={exceptions} workspaceId={params.id} />
                ) : (
                    <div className="p-12 text-center text-gray-500 dark:text-gray-400 text-sm">
                        No exceptions logged yet. You can log an exception directly from any failing control in the <Link href={`/workspaces/${params.id}/compliance`} className="text-blue-600 hover:underline">Compliance Hub</Link>.
                    </div>
                )}
            </div>
        </div>
    )
}
