import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import ClientWizard from './client-wizard'

export default async function OnboardingPage() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/auth/login')
    }

    const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { onboardingCompleted: true }
    })

    // If they already did onboarding, force them back to workspaces
    if (dbUser?.onboardingCompleted) {
        redirect('/workspaces')
    }

    const frameworks = await prisma.framework.findMany({
        select: { id: true, code: true, name: true, description: true }
    })

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex flex-col items-center py-16 px-4">
            <h1 className="text-3xl font-bold dark:text-white mt-12">Welcome to AuditFlow AI</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Let's get your account set up in 3 easy steps.</p>

            <ClientWizard frameworks={frameworks} />
        </div>
    )
}
