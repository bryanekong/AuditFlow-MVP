'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'



export async function login(formData: FormData) {
    const supabase = createClient()
    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    }

    const { error } = await supabase.auth.signInWithPassword(data)
    if (error) {
        return redirect('/auth/login?error=' + encodeURIComponent(error.message))
    }

    revalidatePath('/', 'layout')
    redirect('/workspaces')
}

export async function signup(formData: FormData) {
    const supabase = createClient()
    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
        name: formData.get('name') as string,
    }

    const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
            data: {
                name: data.name,
            }
        }
    })

    if (error) {
        return redirect('/auth/signup?error=' + encodeURIComponent(error.message))
    }

    if (authData.user) {
        // Sync newly created user to Prisma
        try {
            await prisma.user.upsert({
                where: { id: authData.user.id },
                update: {},
                create: {
                    id: authData.user.id,
                    email: data.email,
                    name: data.name,
                    onboardingCompleted: false
                }
            })
        } catch (e) {
            console.error('Failed to sync user to Prisma', e)
        }
    }

    // If email confirmation is required, session might be null
    if (!authData.session) {
        return redirect('/auth/signup?message=' + encodeURIComponent('Check your email to continue sign in process.'))
    }

    revalidatePath('/', 'layout')
    redirect('/onboarding')
}

export async function signout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    revalidatePath('/', 'layout')
    redirect('/')
}
