console.log('Loading Supabase config...');

// Your Supabase URL and anon key
const SUPABASE_URL = 'https://udashmvrlcpdrjdqczig.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkYXNobXZybGNwZHJqZHFjemlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3MjAwMDAsImV4cCI6MjA4MTI5NjAwMH0.es2FIxEE5WKKYTI0jbQwmbCrl4V9tiI0kh9BcYwTwqw';

console.log('Supabase URL:', SUPABASE_URL);
console.log('Supabase Key available:', !!SUPABASE_ANON_KEY);

try {
    // Check if supabaseJs is available
    if (typeof supabaseJs === 'undefined') {
        console.error('ERROR: Supabase JS library not loaded!');
        throw new Error('Supabase JS library not loaded');
    }
    
    // Initialize Supabase client
    const supabase = supabaseJs.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
        }
    });
    
    console.log('Supabase client created successfully:', !!supabase);
    console.log('Supabase auth available:', !!supabase.auth);
    
    // Make it globally available
    window.supabase = supabase;
    window.supabaseClient = supabase;
    
    console.log('Supabase config loaded successfully');
    
    // Dispatch event to notify other scripts
    const event = new CustomEvent('supabaseReady', { detail: { supabase } });
    window.dispatchEvent(event);
    
} catch (error) {
    console.error('ERROR initializing Supabase:', error);
    
    // Create fallback object to prevent errors
    const fallbackSupabase = {
        auth: {
            getSession: async () => { 
                console.warn('Using fallback getSession');
                return { data: { session: null }, error: new Error('Supabase not available') }; 
            },
            getUser: async () => {
                console.warn('Using fallback getUser');
                return { data: { user: null }, error: new Error('Supabase not available') };
            },
            signOut: async () => {
                console.warn('Using fallback signOut');
                return { error: new Error('Supabase not available') };
            },
            onAuthStateChange: () => {
                console.warn('Using fallback onAuthStateChange');
                return { data: { subscription: { unsubscribe: () => {} } } };
            }
        },
        from: () => {
            console.warn('Using fallback from');
            return {
                select: () => ({ data: null, error: new Error('Supabase not available') }),
                insert: () => ({ data: null, error: new Error('Supabase not available') }),
                update: () => ({ data: null, error: new Error('Supabase not available') }),
                delete: () => ({ data: null, error: new Error('Supabase not available') })
            };
        }
    };
    
    window.supabase = fallbackSupabase;
    window.supabaseClient = fallbackSupabase;
    
    console.log('Fallback Supabase created');
}