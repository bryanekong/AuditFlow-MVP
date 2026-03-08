"use client"

import { useState } from "react"

export function DeleteForm({ actionFn }: { actionFn: () => Promise<void> }) {
    const [isDeleting, setIsDeleting] = useState(false)

    const [showModal, setShowModal] = useState(false)

    async function handleConfirmDelete() {
        if (isDeleting) return
        setIsDeleting(true)
        try {
            await actionFn()
            setShowModal(false)
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <>
            <button
                type="button"
                onClick={() => setShowModal(true)}
                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors"
            >
                Delete
            </button>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                        onClick={() => !isDeleting && setShowModal(false)}
                    />
                    <div className="relative z-50 w-full max-w-lg transform overflow-hidden rounded-xl bg-white dark:bg-zinc-900 p-6 text-left align-middle shadow-xl transition-all border border-gray-200 dark:border-zinc-800">
                        <h3 className="text-lg font-bold leading-6 text-gray-900 dark:text-white mb-2">
                            Delete Document
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 whitespace-normal break-words">
                            Are you sure you want to delete this document? This action cannot be undone and will permanently remove all associated AI metadata.
                        </p>

                        <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2 sm:gap-0">
                            <button
                                type="button"
                                disabled={isDeleting}
                                className="inline-flex justify-center rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 transition-colors disabled:opacity-50"
                                onClick={() => setShowModal(false)}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={isDeleting}
                                className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 transition-colors disabled:opacity-50 min-w-[100px] items-center"
                                onClick={handleConfirmDelete}
                            >
                                {isDeleting ? (
                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : (
                                    'Delete'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
