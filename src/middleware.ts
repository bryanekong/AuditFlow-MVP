import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { createClient } from '@/lib/supabase/server'

export async function middleware(request: NextRequest) {
    // Update the Supabase session cookie to keep user logged in
    const response = await updateSession(request)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const path = request.nextUrl.pathname
    const isAuthRoute = path.startsWith('/auth')
    const isDashboardRoute = path.startsWith('/dashboard')
    const isWorkspaceRoute = path.startsWith('/workspaces')

    // Unauthenticated user attempting to access protected routes
    if (!user && (isDashboardRoute || isWorkspaceRoute)) {
        return NextResponse.redirect(new URL('/auth', request.url))
    }

    // Authenticated user attempting to access login page
    if (user && isAuthRoute) {
        return NextResponse.redirect(new URL('/workspaces', request.url))
    }

    // Workspace Onboarding Interceptor
    const workspaceMatch = path.match(/^\/workspaces\/([^/]+)/)
    if (workspaceMatch && user) {
        const workspaceId = workspaceMatch[1]
        
        // Only intercept if we are deep inside a workspace but NOT on the onboarding pages or APIs
        const isOnboardingRoute = path.includes('/onboarding')
        const isApiRoute = path.startsWith('/api')
        const isBaseWorkspaceRoute = path === '/workspaces'

        if (!isOnboardingRoute && !isApiRoute && !isBaseWorkspaceRoute) {
            // Query Supabase directly since Prisma isn't Edge-compatible here
            const { data: workspace } = await supabase
                .from('Workspace')
                .select('onboardingCompleted')
                .eq('id', workspaceId)
                .single()

            if (workspace && workspace.onboardingCompleted === false) {
                return NextResponse.redirect(new URL(`/workspaces/${workspaceId}/onboarding`, request.url))
            }
        }
    }

    return response
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
