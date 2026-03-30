'use client'

import { useState, useCallback, useRef } from 'react'
import { uploadDocument } from './actions'
import { UploadCloud, File, X, CheckCircle, AlertCircle } from 'lucide-react'

type UploadItem = {
    id: string
    file: File
    status: 'pending' | 'uploading' | 'success' | 'error'
    error?: string
}

export function UploadForm({ 
    workspaceId,
    onUploadSuccess 
}: { 
    workspaceId: string
    onUploadSuccess?: (documentId: string) => void
}) {
    const [uploads, setUploads] = useState<UploadItem[]>([])
    const [isDragging, setIsDragging] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const processFiles = useCallback((files: FileList | File[]) => {
        const newUploads = Array.from(files).map(file => ({
            id: crypto.randomUUID(),
            file,
            status: 'pending' as const
        }))

        setUploads(prev => [...newUploads, ...prev])

        // Start uploading them sequentially (or in parallel)
        newUploads.forEach(item => {
            handleUpload(item.id, item.file)
        })
    }, [workspaceId])

    const handleUpload = async (id: string, file: File) => {
        setUploads(prev => prev.map(u => u.id === id ? { ...u, status: 'uploading' } : u))

        try {
            const formData = new FormData()
            formData.append('file', file)
            const result = await uploadDocument(workspaceId, formData)

            setUploads(prev => prev.map(u => u.id === id ? { ...u, status: 'success' } : u))
            if (result?.docId && onUploadSuccess) {
                onUploadSuccess(result.docId)
            }
        } catch (err: any) {
            setUploads(prev => prev.map(u => u.id === id ? { ...u, status: 'error', error: err.message || 'Upload failed' } : u))
        }
    }

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const onDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
    }

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFiles(e.dataTransfer.files)
        }
    }

    const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            processFiles(e.target.files)
        }
        // Reset input so the same files can be selected again if needed
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const removeUpload = (id: string) => {
        setUploads(prev => prev.filter(u => u.id !== id))
    }

    return (
        <div className="space-y-6">
            <div
                className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors
                    ${isDragging
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10'
                        : 'border-gray-300 dark:border-zinc-700 hover:border-gray-400 dark:hover:border-zinc-500'}`}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
            >
                <input
                    type="file"
                    multiple
                    ref={fileInputRef}
                    onChange={onFileSelect}
                    accept=".pdf,.docx,.xlsx"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />

                <UploadCloud className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                    Drag & drop documents here
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs mx-auto mb-4">
                    Support for multiple PDF, DOCX, and XLSX files. Drag folders or select files.
                </p>
                <button
                    type="button"
                    className="px-4 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 pointer-events-none shadow-sm"
                >
                    Browse Files
                </button>
            </div>

            {uploads.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">Upload Queue</h4>
                        <button
                            onClick={() => setUploads([])}
                            className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        >
                            Clear all
                        </button>
                    </div>
                    <div className="grid gap-2 max-h-[300px] overflow-y-auto pr-2">
                        {uploads.map(item => (
                            <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800 rounded-lg text-sm">
                                <File className="w-5 h-5 text-gray-400 shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 dark:text-gray-200 truncate">{item.file.name}</p>
                                    <p className="text-xs text-gray-500">{(item.file.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    {item.status === 'uploading' && (
                                        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <span className="text-xs font-medium">Uploading</span>
                                        </div>
                                    )}
                                    {item.status === 'success' && (
                                        <CheckCircle className="w-5 h-5 text-green-500" />
                                    )}
                                    {item.status === 'error' && (
                                        <div className="flex items-center gap-2 text-red-500" title={item.error}>
                                            <AlertCircle className="w-5 h-5" />
                                            <span className="text-xs truncate max-w-[100px] hidden sm:inline-block">{item.error}</span>
                                        </div>
                                    )}
                                    <button
                                        onClick={() => removeUpload(item.id)}
                                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
