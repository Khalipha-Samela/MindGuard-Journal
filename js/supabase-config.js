// Initialize Supabase client
const supabaseUrl = 'https://udashmvrlcpdrjdqczig.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkYXNobXZybGNwZHJqZHFjemlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3MjAwMDAsImV4cCI6MjA4MTI5NjAwMH0.es2FIxEE5WKKYTI0jbQwmbCrl4V9tiI0kh9BcYwTwqw';

// Create and initialize Supabase client
let supabase;

try {
    // Check if Supabase is loaded
    if (typeof window.supabase !== 'undefined') {
        supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
        console.log('✅ Supabase client initialized successfully');
    } else {
        console.error('❌ Supabase SDK not loaded. Make sure you added the script tag.');
    }
} catch (error) {
    console.error('❌ Error initializing Supabase:', error);
}

// Make it globally available
window.supabaseClient = supabase;

// Debug log
console.log('Supabase client available:', !!window.supabaseClient);