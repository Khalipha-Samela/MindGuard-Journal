console.log('Loading Supabase config...');

// Your Supabase URL and anon key
const SUPABASE_URL = 'https://udashmvrlcpdrjdqczig.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkYXNobXZybGNwZHJqZHFjemlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3MjAwMDAsImV4cCI6MjA4MTI5NjAwMH0.es2FIxEE5WKKYTI0jbQwmbCrl4V9tiI0kh9BcYwTwqw';

console.log('Supabase URL:', SUPABASE_URL);
console.log('Supabase Key available:', !!SUPABASE_ANON_KEY);

// Check if we're using the right Supabase import name
// The library might be available as window.supabase or createClient directly
let createClientFunction;

if (typeof supabaseJs !== 'undefined' && supabaseJs.createClient) {
    createClientFunction = supabaseJs.createClient;
    console.log('Using supabaseJs.createClient');
} else if (typeof window.createSupabaseClient !== 'undefined') {
    createClientFunction = window.createSupabaseClient;
    console.log('Using window.createSupabaseClient');
} else if (typeof supabase !== 'undefined' && supabase.createClient) {
    createClientFunction = supabase.createClient;
    console.log('Using supabase.createClient');
} else {
    console.error('ERROR: Could not find Supabase createClient function');
    console.log('Available globals:', Object.keys(window).filter(k => k.includes('supabase') || k.includes('Supabase')));
}

try {
    if (!createClientFunction) {
        console.error('ERROR: Supabase JS library not loaded properly!');
        
        // Try to load it dynamically
        console.log('Attempting to load Supabase dynamically...');
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/@supabase/supabase-js@2';
        script.onload = () => {
            console.log('Supabase loaded dynamically, retrying initialization...');
            // Try to initialize again after load
            if (window.supabase && window.supabase.createClient) {
                initializeSupabase(window.supabase.createClient);
            }
        };
        document.head.appendChild(script);
        throw new Error('Supabase JS library not loaded');
    }
    
    initializeSupabase(createClientFunction);
    
} catch (error) {
    console.error('ERROR initializing Supabase:', error);
    createFallbackSupabase();
}

function initializeSupabase(createClient) {
    console.log('Initializing Supabase with createClient function...');
    
    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
        }
    });
    
    console.log('Supabase client created successfully:', !!supabase);
    console.log('Supabase auth available:', !!supabase.auth);
    
    // Test the connection immediately
    testSupabaseConnection(supabase);
    
    // Make it globally available
    window.supabase = supabase;
    window.supabaseClient = supabase;
    
    console.log('Supabase config loaded successfully');
    
    // Dispatch event to notify other scripts
    const event = new CustomEvent('supabaseReady', { detail: { supabase } });
    window.dispatchEvent(event);
}

async function testSupabaseConnection(supabaseClient) {
    console.log('Testing Supabase connection...');
    try {
        const { data, error } = await supabaseClient.auth.getSession();
        if (error) {
            console.error('Supabase connection test failed:', error.message);
            console.log('This might be OK if no user is logged in');
        } else {
            console.log('Supabase connection successful');
            console.log('Session exists:', !!data.session);
            if (data.session) {
                console.log('Logged in user:', data.session.user.email);
            }
        }
    } catch (err) {
        console.error('Exception during connection test:', err);
    }
}

function createFallbackSupabase() {
    console.log('Creating fallback Supabase client...');
    
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
    
    console.log('Fallback Supabase created - running in offline mode');
    
    // Still dispatch the event so other scripts can proceed
    const event = new CustomEvent('supabaseReady', { detail: { supabase: fallbackSupabase } });
    window.dispatchEvent(event);
}

// Add a global helper function to check Supabase status
window.checkSupabaseStatus = function() {
    return {
        isAvailable: !!(window.supabase && window.supabase.auth),
        isFallback: window.supabase && window.supabase.auth && 
                   typeof window.supabase.auth.getSession === 'function' && 
                   window.supabase.auth.getSession.toString().includes('fallback'),
        url: SUPABASE_URL,
        hasKey: !!SUPABASE_ANON_KEY
    };
};

console.log('Supabase config script loaded');