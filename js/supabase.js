// js/supabase.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

// Initialize Supabase client
const supabaseUrl = 'https://vkhilikrothkpaogwbfw.supabase.co' // Replace with your Supabase URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZraGlsaWtyb3Roa3Bhb2d3YmZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1NTQyNjcsImV4cCI6MjA4MTEzMDI2N30.9k36S3PLkrlvM8f7xb9RS2GRYRHrL_VFuKX22mAhztE' // Replace with your Supabase anon key
export const supabase = createClient(supabaseUrl, supabaseKey)

// Auth state listener
export function setupAuthListener() {
    supabase.auth.onAuthStateChange((event, session) => {
        console.log('Auth event:', event)
        
        if (session) {
            // User is signed in
            console.log('User signed in:', session.user.email)
            localStorage.setItem('supabase.auth.token', JSON.stringify(session))
        } else {
            // User is signed out
            console.log('User signed out')
            localStorage.removeItem('supabase.auth.token')
            
            // Redirect to login if not already there
            if (!window.location.pathname.includes('login.html') && 
                !window.location.pathname.includes('register.html')) {
                window.location.href = 'login.html'
            }
        }
    })
}

// Check if user is authenticated
export async function isAuthenticated() {
    const { data: { session }, error } = await supabase.auth.getSession()
    return !!session && !error
}

// Get current user
export async function getCurrentUser() {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error || !session) return null
    return session.user
}

// Sign out
export async function signOutUser() {
    const { error } = await supabase.auth.signOut()
    if (error) {
        console.error('Sign out error:', error)
        return false
    }
    return true
}