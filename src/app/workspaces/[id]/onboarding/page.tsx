import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { OnboardingFlow } from './onboarding-flow'
import { createClient } from '@/lib/supabase/server'

export default async function OnboardingPage({ params }: { params: { id: string } }) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect("/auth")

    const workspace = await prisma.workspace.findUnique({
        where: { id: params.id }
    })

    if (!workspace) redirect("/workspaces")

    if (workspace.onboardingCompleted) {
        redirect(`/workspaces/${params.id}`)
    }

    // Get the ISO27001 framework ID and the A.5.1 control for Step 3 mapping
    const framework = await prisma.framework.findFirst({
        where: { code: 'ISO27001' },
    })

    const controlA51 = framework ? await prisma.frameworkRequirement.findFirst({
        where: { frameworkId: framework.id, code: 'A.5.1' },
        include: { evidenceTypes: true }
    }) : null

    const evidenceTypeId = controlA51?.evidenceTypes[0]?.id

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 dark:bg-zinc-950">
            <div className="sm:mx-auto sm:w-full sm:max-w-3xl">
                <OnboardingFlow 
                    workspace={workspace} 
                    frameworkId={framework?.id}
                    evidenceTypeId={evidenceTypeId}
                    controlDetails={{
                        code: controlA51?.code,
                        title: controlA51?.title,
                    }}
                />
            </div>
        </div>
    )
}
