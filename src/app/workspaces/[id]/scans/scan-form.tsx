"use client"

import { useState } from "react"
import { runScan } from "./actions"

export function ScanForm({ workspaceId, frameworks }: { workspaceId: string, frameworks: { id: string, name: string, version: string }[] }) {
    const [pending, setPending] = useState(false)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setPending(true)
        try {
            const formData = new FormData(e.currentTarget)
            await runScan(workspaceId, formData)
        } finally {
            setPending(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="flex items-center gap-3 w-full md:w-auto">
            <select name="frameworkId" required className="flex-1 md:w-64 rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:ring-black text-gray-900 dark:bg-zinc-950 dark:border-zinc-700 dark:text-gray-200">
                {frameworks.map(fw => (
                    <option key={fw.id} value={fw.id} className="text-gray-900 dark:text-gray-200">{fw.name} ({fw.version})</option>
                ))}
            </select>
            <button
                type="submit"
                disabled={pending}
                className="bg-black text-white px-4 py-2 rounded-md font-semibold text-sm hover:bg-gray-800 transition shadow-sm dark:bg-white dark:text-black dark:hover:bg-gray-200 whitespace-nowrap min-w-[100px] flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {pending ? (
                    <svg className="animate-spin h-5 w-5 text-white dark:text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                ) : "Run Scan"}
            </button>
        </form>
    )
}
