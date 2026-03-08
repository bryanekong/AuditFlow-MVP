"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

export function ThemeToggle() {
    const { theme, setTheme } = useTheme()

    return (
        <button
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="inline-flex items-center justify-center p-2 rounded-md transition-colors hover:bg-gray-100 dark:hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
            {/* Light Mode Icon (Sun) - Shows when in Dark Mode to switch back */}
            <Sun className="h-5 w-5 dark:hidden block text-gray-700 hover:text-gray-900" />
            {/* Dark Mode Icon (Moon) - Shows when in Light Mode to switch */}
            <Moon className="h-5 w-5 hidden dark:block text-gray-400 hover:text-white" />
            <span className="sr-only">Toggle theme</span>
        </button>
    )
}
