'use client'

import { useMemo } from 'react'

export function DocumentViewerClient({ text, highlights }: { text: string, highlights: string[] }) {

    // Simple highlighter function that splits text by keywords
    const highlightedText = useMemo(() => {
        if (!highlights || highlights.length === 0 || !text) return text

        // Escape highlights for regex
        const escapedHighlights = highlights.filter(h => h.trim().length > 0).map(h => h.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'))

        if (escapedHighlights.length === 0) return text

        const pattern = new RegExp(`(${escapedHighlights.join('|')})`, 'gi')
        const parts = text.split(pattern)

        return parts.map((part, i) => {
            if (pattern.test(part)) {
                // Return matched part wrapped in a highlight span
                return <mark key={i} className="bg-yellow-200 dark:bg-yellow-900/60 dark:text-yellow-100 rounded-sm px-0.5 font-medium">{part}</mark>
            }
            return <span key={i}>{part}</span>
        })
    }, [text, highlights])

    return (
        <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-2 overflow-y-auto max-h-[600px] whitespace-pre-wrap font-mono text-xs text-gray-700 dark:text-gray-300">
            {highlightedText}
        </div>
    )
}
