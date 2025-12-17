console.log('Loading Supabase config...');

// ==============================================
// IMPORTANT: REPLACE THESE WITH YOUR ACTUAL VALUES!
// ==============================================
const SUPABASE_PROJECT_URL = 'https://udashmvrlcpdrjdqczig.supabase.co';  // ← YOUR ACTUAL PROJECT URL
const SUPABASE_PROJECT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkYXNobXZybGNwZHJqZHFjemlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3MjAwMDAsImV4cCI6MjA4MTI5NjAwMH0.es2FIxEE5WKKYTI0jbQwmbCrl4V9tiI0kh9BcYwTwqw';                // ← YOUR ACTUAL ANON KEY
// ==============================================

console.log('Supabase URL:', SUPABASE_PROJECT_URL);
console.log('Supabase Key available:', !!SUPABASE_PROJECT_KEY);

// Check if Supabase is already initialized globally
if (window.supabase && window.supabase.auth) {
    console.log('Supabase already initialized globally');
} else {
    initializeSupabaseClient();
}

function initializeSupabaseClient() {
    try {
        // Check if supabaseJs is available (from CDN)
        if (typeof supabaseJs !== 'undefined' && supabaseJs.createClient) {
            console.log('Using supabaseJs from CDN');
            createSupabaseClient(supabaseJs.createClient);
        } 
        // Check if createClient is available directly
        else if (typeof createClient !== 'undefined') {
            console.log('Using createClient directly');
            createSupabaseClient(createClient);
        }
        // Check if Supabase is available as window.supabase (might be from another script)
        else if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
            console.log('Using window.supabase.createClient');
            createSupabaseClient(window.supabase.createClient);
        }
        else {
            console.error('ERROR: Could not find Supabase createClient function');
            console.log('Available globals:', Object.keys(window).filter(k => 
                k.toLowerCase().includes('supabase') || 
                k.toLowerCase().includes('createclient')
            ));
            createFallbackSupabase();
        }
    } catch (error) {
        console.error('ERROR in initializeSupabaseClient:', error);
        createFallbackSupabase();
    }
}

function createSupabaseClient(createClientFunc) {
    console.log('Creating Supabase client...');
    
    try {
        // Create the client with a different variable name to avoid conflict
        const supabaseClient = createClientFunc(SUPABASE_PROJECT_URL, SUPABASE_PROJECT_KEY, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true
            }
        });
        
        console.log('Supabase client created successfully:', !!supabaseClient);
        console.log('Supabase auth available:', !!supabaseClient.auth);
        
        // Store with a different global name to avoid conflicts
        window.mindguardSupabase = supabaseClient;
        window.supabase = supabaseClient;  // Still set this for compatibility
        window.supabaseClient = supabaseClient;
        
        // Test the connection
        testConnection(supabaseClient);
        
        console.log('Supabase config loaded successfully');
        
        // Dispatch event to notify other scripts
        const event = new CustomEvent('supabaseReady', { detail: { supabase: supabaseClient } });
        window.dispatchEvent(event);
        
    } catch (error) {
        console.error('ERROR creating Supabase client:', error);
        createFallbackSupabase();
    }
}

async function testConnection(client) {
    console.log('Testing Supabase connection...');
    try {
        const { data, error } = await client.auth.getSession();
        if (error) {
            console.warn('Supabase connection test warning:', error.message);
        } else {
            console.log('Supabase connection test passed');
            console.log('User session:', data.session ? 'Logged in' : 'Not logged in');
        }
    } catch (err) {
        console.error('Connection test exception:', err);
    }
}

function createFallbackSupabase() {
    console.log('Creating fallback Supabase client (offline mode)...');
    
    const fallbackClient = {
        auth: {
            getSession: async () => { 
                console.warn('Using fallback getSession');
                // Try to get session from localStorage as fallback
                const sessionData = localStorage.getItem('supabase.auth.token');
                let session = null;
                if (sessionData) {
                    try {
                        session = JSON.parse(sessionData);
                    } catch (e) {
                        console.warn('Could not parse session data');
                    }
                }
                return { 
                    data: { session }, 
                    error: session ? null : new Error('Supabase not available') 
                }; 
            },
            getUser: async () => {
                console.warn('Using fallback getUser');
                const session = await this.getSession();
                return { 
                    data: { user: session.data.session ? session.data.session.user : null }, 
                    error: session.error 
                };
            },
            signOut: async () => {
                console.warn('Using fallback signOut');
                localStorage.removeItem('supabase.auth.token');
                return { error: null };
            },
            onAuthStateChange: () => {
                console.warn('Using fallback onAuthStateChange');
                return { data: { subscription: { unsubscribe: () => {} } } };
            }
        },
        from: () => {
            console.warn('Using fallback from');
            return {
                select: () => ({ data: null, error: new Error('Database offline') }),
                insert: () => ({ data: null, error: new Error('Database offline') }),
                update: () => ({ data: null, error: new Error('Database offline') }),
                delete: () => ({ data: null, error: new Error('Database offline') })
            };
        }
    };
    
    // Store with different names to avoid conflicts
    window.mindguardSupabase = fallbackClient;
    window.supabase = fallbackClient;  // For compatibility
    window.supabaseClient = fallbackClient;
    
    console.log('Fallback Supabase created - running in offline mode');
    
    // Dispatch event so other scripts can proceed
    const event = new CustomEvent('supabaseReady', { detail: { supabase: fallbackClient } });
    window.dispatchEvent(event);
}

// Helper to check status
window.checkSupabaseStatus = function() {
    const client = window.mindguardSupabase || window.supabase;
    return {
        isAvailable: !!(client && client.auth),
        isFallback: client && client.auth && 
                   typeof client.auth.getSession === 'function' && 
                   client.auth.getSession.toString().includes('fallback'),
        url: SUPABASE_PROJECT_URL,
        hasKey: !!SUPABASE_PROJECT_KEY,
        clientType: window.mindguardSupabase === window.supabase ? 'primary' : 'conflict'
    };
};

console.log('Supabase config script execution complete');