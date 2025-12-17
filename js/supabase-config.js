console.log('Loading Supabase config...');

// Your Supabase URL and anon key
const SUPABASE_URL = 'https://udashmvrlcpdrjdqczig.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkYXNobXZybGNwZHJqZHFjemlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3MjAwMDAsImV4cCI6MjA4MTI5NjAwMH0.es2FIxEE5WKKYTI0jbQwmbCrl4V9tiI0kh9BcYwTwqw';

// Initialize Supabase client
const supabase = window.supabaseClient = window.supabase = supabaseJs.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('Supabase client initialized:', !!supabase);

// Make it globally available
window.supabase = supabase;
window.supabaseClient = supabase;

console.log('Supabase config loaded successfully');