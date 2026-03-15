import { prisma } from './prisma'

export type Role = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER'

const ROLE_HIERARCHY: Record<Role, number> = {
    OWNER: 40,
    ADMIN: 30,
    MEMBER: 20,
    VIEWER: 10
}

export async function checkPermissions(userId: string, workspaceId: string, requiredRole: Role): Promise<boolean> {
    const member = await prisma.workspaceMember.findUnique({
        where: {
            workspaceId_userId: {
                workspaceId,
                userId
            }
        }
    })

    if (!member) return false

    const userRoleValue = ROLE_HIERARCHY[member.role as Role] || 0
    const requiredRoleValue = ROLE_HIERARCHY[requiredRole] || 0

    return userRoleValue >= requiredRoleValue
}

export async function getRole(userId: string, workspaceId: string): Promise<Role | null> {
    const member = await prisma.workspaceMember.findUnique({
        where: {
            workspaceId_userId: {
                workspaceId,
                userId
            }
        }
    })
    return (member?.role as Role) || null
}
