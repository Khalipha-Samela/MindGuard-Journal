// supabase-config.js - UPDATED VERSION
const supabaseUrl = 'https://udashmvrlcpdrjdqczig.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkYXNobXZybGNwZHJqZHFjemlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3MjAwMDAsImV4cCI6MjA4MTI5NjAwMH0.es2FIxEE5WKKYTI0jbQwmbCrl4V9tiI0kh9BcYwTwqw';

// Check if Supabase is already initialized
if (!window.supabaseClient) {
    try {
        // Check if Supabase SDK is loaded
        if (typeof window.supabase !== 'undefined') {
            const supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
            window.supabaseClient = supabase;
            console.log('✅ Supabase client initialized successfully');
        } else {
            console.error('❌ Supabase SDK not loaded. Make sure you added the script tag.');
        }
    } catch (error) {
        console.error('❌ Error initializing Supabase:', error);
    }
} else {
    console.log('✅ Supabase client already initialized');
}

// Debug log - always check this in console
console.log('Supabase client available:', !!window.supabaseClient);