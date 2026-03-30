"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
    LayoutDashboard, 
    ShieldCheck, 
    FileText, 
    Activity, 
    Settings,
    AlertTriangle 
} from 'lucide-react'

export function SidebarNav({ workspaceId }: { workspaceId: string }) {
    const pathname = usePathname()

    const navLinks = [
        { name: 'Dashboard', href: `/workspaces/${workspaceId}`, exact: true, icon: LayoutDashboard },
        { name: 'Documents', href: `/workspaces/${workspaceId}/documents`, exact: false, icon: FileText },
        { name: 'Compliance Hub', href: `/workspaces/${workspaceId}/compliance`, exact: false, icon: ShieldCheck },
        { name: 'Exceptions', href: `/workspaces/${workspaceId}/exceptions`, exact: false, icon: AlertTriangle },
        { name: 'Scans', href: `/workspaces/${workspaceId}/scans`, exact: false, icon: Activity },
        { name: 'Changelog', href: `/workspaces/${workspaceId}/settings/changelog`, exact: false, icon: Settings },
    ]


    return (
        <nav className="flex-1 px-4 space-y-1">
            {navLinks.map(link => {
                const isActive = link.exact
                    ? pathname === link.href
                    : pathname?.startsWith(link.href);

                return (
                    <Link
                        key={link.name}
                        href={link.href}
                        className={`block px-3 py-2 rounded-md text-sm font-medium transition ${isActive
                            ? 'text-gray-900 bg-gray-100 dark:bg-zinc-800 dark:text-white'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-zinc-800 dark:hover:text-white'
                            }`}
                    >
                        {link.name}
                    </Link>
                )
            })}
        </nav>
    )
}
