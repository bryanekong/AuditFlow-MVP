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

    // Simple Workspace RBAC check
    // If the user goes to /workspaces/[id]/..., we can check if they have access
    const workspaceMatch = path.match(/^\/workspaces\/([^/]+)/)
    if (workspaceMatch && user) {
        const workspaceId = workspaceMatch[1]

        // For MVP performance, rather than holding up middleware, RBAC checks
        // on specific workspace IDs are typically best done in layout.tsx or Server Actions.
        // However, if we must do it here, we'd query Prisma or Supabase RPC.
        // For simplicity, we'll verify it in the page/layout components and server actions.
    }

    return response
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
