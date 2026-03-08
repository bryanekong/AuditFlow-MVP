'use client'

import { useRef, useState } from 'react'
import { uploadDocument } from './actions'

export function UploadForm({ workspaceId }: { workspaceId: string }) {
    const [isUploading, setIsUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const formRef = useRef<HTMLFormElement>(null)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        if (isUploading) return

        setIsUploading(true)
        setError(null)

        try {
            const formData = new FormData(e.currentTarget)
            await uploadDocument(workspaceId, formData)
            formRef.current?.reset()
        } catch (e: any) {
            setError(e.message || 'Upload failed')
        } finally {
            setIsUploading(false)
        }
    }

    return (
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col gap-2">
                <label htmlFor="file" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                    Upload new document (PDF, DOCX, XLSX)
                </label>
                <div className="flex items-center gap-4">
                    <input
                        id="file"
                        name="file"
                        type="file"
                        accept=".pdf,.docx,.xlsx"
                        required
                        className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-gray-400 focus:outline-none dark:bg-zinc-800 dark:border-zinc-700 dark:placeholder-gray-400 p-2"
                    />
                    <button
                        type="submit"
                        disabled={isUploading}
                        className="px-4 py-2 bg-black text-white text-sm font-semibold rounded-md shadow-sm hover:focus-visible:outline hover:bg-gray-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-gray-200 min-w-[100px] flex items-center justify-center transition-opacity disabled:cursor-not-allowed"
                    >
                        {isUploading ? (
                            <svg className="animate-spin h-5 w-5 text-white dark:text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : 'Upload'}
                    </button>
                </div>
                {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
            </div>
        </form>
    )
}
