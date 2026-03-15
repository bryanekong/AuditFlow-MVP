'use client'

import { useState } from 'react'
import { submitOnboarding } from './actions'

type Framework = { id: string; name: string; code: string; description: string | null }

export default function ClientWizard({ frameworks }: { frameworks: Framework[] }) {
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // Form states
    const [companyName, setCompanyName] = useState('')
    const [industry, setIndustry] = useState('')
    const [frameworkId, setFrameworkId] = useState('')
    const [invites, setInvites] = useState('')

    const handleNext = () => setStep(s => s + 1)
    const handleBack = () => setStep(s => s - 1)

    const handleSubmit = async () => {
        setLoading(true)
        setError('')
        try {
            const inviteArray = invites.split(',').map(e => e.trim()).filter(Boolean)
            await submitOnboarding({ companyName, industry, frameworkId, invites: inviteArray })
        } catch (e: any) {
            setError(e.message || 'Something went wrong')
            setLoading(false)
        }
    }

    return (
        <div className="w-full max-w-xl mx-auto bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden p-8 mt-12">
            {/* Progress indicators */}
            <div className="flex gap-2 mb-8">
                {[1, 2, 3].map((s) => (
                    <div key={s} className={`h-2 flex-1 rounded-full ${s <= step ? 'bg-black dark:bg-white' : 'bg-gray-200 dark:bg-zinc-800'}`} />
                ))}
            </div>

            {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

            {step === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                    <div>
                        <h2 className="text-2xl font-bold dark:text-white">Tell us about your organization</h2>
                        <p className="text-gray-500 dark:text-gray-400 mt-2">We'll use this to customize your workspaces and requirements.</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium dark:text-gray-300 mb-1">Company Name</label>
                        <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} required
                            className="w-full border-gray-300 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white rounded-md p-2.5 focus:ring-black dark:focus:ring-white"
                            placeholder="Acme Corp" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium dark:text-gray-300 mb-1">Industry</label>
                        <select value={industry} onChange={e => setIndustry(e.target.value)}
                            className="w-full border-gray-300 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white rounded-md p-2.5 focus:ring-black dark:focus:ring-white">
                            <option value="" disabled>Select an industry...</option>
                            <option value="SaaS / Software">SaaS / Software</option>
                            <option value="Finance">Finance</option>
                            <option value="Healthcare">Healthcare</option>
                            <option value="E-Commerce">E-Commerce</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <button onClick={handleNext} disabled={!companyName || !industry}
                        className="w-full bg-black text-white dark:bg-white dark:text-black font-semibold py-3 rounded-md hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 transition-colors">
                        Continue
                    </button>
                </div>
            )}

            {step === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                    <div>
                        <h2 className="text-2xl font-bold dark:text-white">Choose a primary target framework</h2>
                        <p className="text-gray-500 dark:text-gray-400 mt-2">Which audit are you preparing for first?</p>
                    </div>
                    <div className="space-y-3">
                        {frameworks.map(fw => (
                            <label key={fw.id} className={`flex cursor-pointer p-4 border rounded-xl items-center gap-4 transition-all ${frameworkId === fw.id ? 'border-black ring-1 ring-black dark:border-white dark:ring-white bg-gray-50 dark:bg-zinc-800' : 'border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600'}`}>
                                <input type="radio" name="framework" className="w-4 h-4 text-black focus:ring-black border-gray-300" checked={frameworkId === fw.id} onChange={() => setFrameworkId(fw.id)} />
                                <div>
                                    <div className="font-semibold dark:text-white">{fw.code}</div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{fw.description}</div>
                                </div>
                            </label>
                        ))}
                    </div>
                    <div className="flex gap-3">
                        <button onClick={handleBack} className="w-1/3 bg-white text-black border border-gray-300 font-semibold py-3 rounded-md hover:bg-gray-50 dark:bg-zinc-900 dark:text-white dark:border-zinc-700 dark:hover:bg-zinc-800 transition-colors">Back</button>
                        <button onClick={handleNext} disabled={!frameworkId} className="w-2/3 bg-black text-white dark:bg-white dark:text-black font-semibold py-3 rounded-md hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 transition-colors">Continue</button>
                    </div>
                </div>
            )}

            {step === 3 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                    <div>
                        <h2 className="text-2xl font-bold dark:text-white">Invite your team (optional)</h2>
                        <p className="text-gray-500 dark:text-gray-400 mt-2">Compliance is a team sport. Add their emails separated by commas.</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium dark:text-gray-300 mb-1">Teammate Emails</label>
                        <textarea value={invites} onChange={e => setInvites(e.target.value)} rows={4}
                            className="w-full border-gray-300 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white rounded-md p-2.5 focus:ring-black dark:focus:ring-white"
                            placeholder="jane@example.com, john@example.com" />
                    </div>
                    <div className="flex gap-3">
                        <button onClick={handleBack} className="w-1/3 bg-white text-black border border-gray-300 font-semibold py-3 rounded-md hover:bg-gray-50 dark:bg-zinc-900 dark:text-white dark:border-zinc-700 dark:hover:bg-zinc-800 transition-colors">Back</button>
                        <button onClick={handleSubmit} disabled={loading} className="w-2/3 bg-black text-white dark:bg-white dark:text-black font-semibold py-3 rounded-md hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 transition-colors">
                            {loading ? 'Setting up workspace...' : 'Complete Setup'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
