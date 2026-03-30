"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UploadForm } from '../documents/upload-form'

export function OnboardingFlow({ 
    workspace, 
    frameworkId, 
    evidenceTypeId, 
    controlDetails 
}: { 
    workspace: any
    frameworkId?: string
    evidenceTypeId?: string
    controlDetails: { code?: string, title?: string } 
}) {
    const router = useRouter()
    const [step, setStep] = useState(workspace.onboardingStep || 1)
    const [loading, setLoading] = useState(false)
    const [name, setName] = useState(workspace.name || '')
    const [industry, setIndustry] = useState(workspace.industry || '')

    // For mapping step
    const [uploadedDocId, setUploadedDocId] = useState<string | null>(null)
    const [ownerName, setOwnerName] = useState('')
    const [systemSource, setSystemSource] = useState('')
    const [mappingError, setMappingError] = useState('')

    async function advanceStep(nextStep: number, isComplete = false) {
        setLoading(true)
        try {
            await fetch(`/api/workspaces/${workspace.id}/onboarding`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    onboardingStep: nextStep,
                    onboardingCompleted: isComplete,
                    name,
                    industry
                })
            })
            if (isComplete) {
                router.refresh()
                router.push(`/workspaces/${workspace.id}`)
            } else {
                setStep(nextStep)
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    async function handleMappingSubmit(e: React.FormEvent) {
        e.preventDefault()
        setMappingError('')
        setLoading(true)

        if (!uploadedDocId) {
            setMappingError('Please upload a document first.')
            setLoading(false)
            return
        }

        try {
            const res = await fetch(`/api/workspaces/${workspace.id}/evidence`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    evidenceTypeId,
                    documentId: uploadedDocId,
                    ownerName,
                    systemSource,
                    evidenceDate: new Date().toISOString()
                })
            })

            if (!res.ok) throw new Error(await res.text())
            
            await advanceStep(4)
        } catch (err: any) {
            setMappingError(err.message || 'Failed to map evidence.')
            setLoading(false)
        }
    }

    async function handleRunBaseline() {
        setLoading(true)
        try {
            // Simply mark onboarding as complete. The dashboard will show 0% and encourage running a scan, 
            // OR we can trigger the scan form submission.
            // Let's just create a FormData payload and POST it to the scans endpoint!
            const formData = new FormData()
            if (frameworkId) formData.append('frameworkId', frameworkId)
            
            // This assumes the Scan backend can take a POST. Currently, `runScan` is a Server Action in `actions.ts`.
            // The cleanest way is to just advance to Step 4 (Dashboard) and prompt them there, 
            // OR we can just complete onboarding and redirect to the Scans page!
            await advanceStep(4, true)
        } catch (e) {
            console.error(e)
            setLoading(false)
        }
    }

    return (
        <div className="bg-white dark:bg-zinc-900 shadow-xl rounded-2xl overflow-hidden border border-gray-200 dark:border-zinc-800">
            {/* Progress Bar */}
            <div className="bg-gray-100 dark:bg-zinc-950 px-8 py-4 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">
                        {step}
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {step === 1 ? 'Workspace Profile' : step === 2 ? 'Audit Framework' : step === 3 ? 'First Evidence' : 'Baseline Scan'}
                    </span>
                </div>
                <div className="text-xs text-gray-500 font-medium">Step {step} of 4</div>
            </div>

            <div className="p-8">
                {/* STEP 1: Profile */}
                {step === 1 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome to AuditFlow AI</h2>
                            <p className="mt-2 text-gray-600 dark:text-gray-400">Let's set up your workspace profile before we begin verifying your compliance posture.</p>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Workspace Name</label>
                                <input 
                                    type="text" 
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Industry</label>
                                <input 
                                    type="text" 
                                    value={industry}
                                    onChange={e => setIndustry(e.target.value)}
                                    placeholder="e.g. Financial Services, SaaS"
                                    className="w-full bg-gray-50 dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 text-sm"
                                />
                            </div>
                        </div>
                        <div className="pt-4 flex justify-end">
                            <button 
                                onClick={() => advanceStep(2)}
                                disabled={loading || !name}
                                className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition shadow-sm disabled:opacity-50"
                            >
                                Continue →
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 2: Framework Education */}
                {step === 2 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Deterministic Verification</h2>
                            <p className="mt-2 text-gray-600 dark:text-gray-400">
                                AuditFlow is a **Compliance Evidence Verification Engine**. We don't just store documents; we run deterministic quality gates against your evidence to prove you are audit-ready.
                            </p>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 p-5 rounded-xl">
                            <h3 className="font-semibold text-blue-900 dark:text-blue-300 flex items-center gap-2">
                                <span className="text-xl">🛡️</span> Selected Framework: ISO 27001:2022
                            </h3>
                            <p className="text-sm text-blue-800 dark:text-blue-400 mt-2">
                                Your workspace is configured with 22 core Annex A controls (A.5 Organisational, A.6 People, A.7 Physical, A.8 Technological).
                            </p>
                            <ul className="mt-4 space-y-2 text-sm text-blue-800 dark:text-blue-400 list-disc list-inside">
                                <li><strong>Traceability:</strong> Every piece of evidence must have an accountable owner and system source.</li>
                                <li><strong>Freshness:</strong> Documents are flagged if they expire or exceed their max age.</li>
                                <li><strong>Consistency:</strong> The engine scans document text for required keywords to prove completeness.</li>
                            </ul>
                        </div>
                        <div className="pt-4 flex justify-between">
                            <button 
                                onClick={() => setStep(1)}
                                className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-zinc-800 dark:text-gray-300 dark:border-zinc-700 transition"
                            >
                                ← Back
                            </button>
                            <button 
                                onClick={() => advanceStep(3)}
                                disabled={loading}
                                className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition shadow-sm disabled:opacity-50"
                            >
                                Acknowledge & Continue →
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 3: Evidence Mapping */}
                {step === 3 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Map Your First Evidence</h2>
                            <p className="mt-2 text-gray-600 dark:text-gray-400 text-sm">
                                Let's map evidence to <strong>{controlDetails.code} {controlDetails.title}</strong>. This proves to an auditor that the control is in place.
                            </p>
                        </div>

                        {!uploadedDocId ? (
                            <div className="border-2 border-dashed border-gray-200 dark:border-zinc-800 rounded-xl p-6 bg-gray-50 dark:bg-zinc-950/50 text-center">
                                <h3 className="text-sm font-semibold mb-4 text-gray-700 dark:text-gray-300">1. Upload a Document</h3>
                                <div className="max-w-xs mx-auto text-left">
                                    <UploadForm workspaceId={workspace.id} onUploadSuccess={(docId) => setUploadedDocId(docId)} />
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleMappingSubmit} className="space-y-4">
                                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 p-4 rounded-xl flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center text-green-600 dark:text-green-300">✓</div>
                                        <div>
                                            <p className="text-sm font-semibold text-green-900 dark:text-green-300">Document Uploaded</p>
                                            <p className="text-xs text-green-700 dark:text-green-400">Now provide traceability metadata.</p>
                                        </div>
                                    </div>
                                    <button type="button" onClick={() => setUploadedDocId(null)} className="text-xs text-green-700 hover:underline">Change</button>
                                </div>

                                {mappingError && <div className="p-3 bg-red-50 text-red-700 text-sm rounded">{mappingError}</div>}

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">System Source <span className="text-red-500">*</span></label>
                                        <input 
                                            type="text" 
                                            required
                                            value={systemSource}
                                            onChange={e => setSystemSource(e.target.value)}
                                            placeholder="e.g. Google Drive, AWS"
                                            className="w-full bg-gray-50 dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Accountable Owner <span className="text-red-500">*</span></label>
                                        <input 
                                            type="text" 
                                            required
                                            value={ownerName}
                                            onChange={e => setOwnerName(e.target.value)}
                                            placeholder="e.g. Jane Doe (CISO)"
                                            className="w-full bg-gray-50 dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 text-sm"
                                        />
                                    </div>
                                </div>
                                
                                <div className="pt-4 flex justify-between">
                                    <button 
                                        type="button"
                                        onClick={() => setStep(2)}
                                        className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-zinc-800 transition"
                                    >
                                        ← Back
                                    </button>
                                    <button 
                                        type="submit"
                                        disabled={loading || !ownerName || !systemSource}
                                        className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition shadow-sm disabled:opacity-50"
                                    >
                                        {loading ? 'Mapping...' : 'Map Evidence →'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                )}

                {/* STEP 4: Baseline Scan */}
                {step === 4 && (
                    <div className="space-y-6 text-center animate-in fade-in zoom-in-95 duration-500 py-8">
                        <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">
                            🎯
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Workspace Ready</h2>
                        <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                            You've mapped your first piece of evidence! You're now ready to enter the dashboard and run a baseline scan to calculate your initial Audit Readiness Index (ARI).
                        </p>
                        
                        <div className="pt-8">
                            <button 
                                onClick={handleRunBaseline}
                                disabled={loading}
                                className="px-8 py-4 text-base font-bold text-white bg-black hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 rounded-xl transition shadow-lg hover:shadow-xl hover:-translate-y-1 transform disabled:opacity-50 disabled:hover:translate-y-0"
                            >
                                {loading ? 'Finalizing Setup...' : 'Enter Dashboard →'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
