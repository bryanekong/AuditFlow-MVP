import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const body = await req.json()
        const { onboardingStep, onboardingCompleted, name, industry } = body

        // Construct update data dynamically based on what's provided
        const updateData: any = {}
        if (typeof onboardingStep === 'number') updateData.onboardingStep = onboardingStep
        if (typeof onboardingCompleted === 'boolean') updateData.onboardingCompleted = onboardingCompleted
        if (name) updateData.name = name
        if (industry) updateData.industry = industry

        const updatedWorkspace = await prisma.workspace.update({
            where: { id: params.id },
            data: updateData,
        })

        return NextResponse.json(updatedWorkspace)
    } catch (error: any) {
        console.error('Failed to update workspace onboarding:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
