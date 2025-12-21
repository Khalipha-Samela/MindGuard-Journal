console.log('Loading MindGuard Supabase config...');

// ==============================================
// IMPORTANT: Supabase credentials for MindGuard Journal
// ==============================================
const MINDGUARD_SUPABASE_URL = 'https://udashmvrlcpdrjdqczig.supabase.co';
const MINDGUARD_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkYXNobXZybGNwZHJqZHFjemlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3MjAwMDAsImV4cCI6MjA4MTI5NjAwMH0.es2FIxEE5WKKYTI0jbQwmbCrl4V9tiI0kh9BcYwTwqw';         
// ==============================================

console.log('Supabase URL:', MINDGUARD_SUPABASE_URL);
console.log('Supabase Key available:', !!MINDGUARD_SUPABASE_KEY);

// Function to initialize Supabase
function initializeMindGuardSupabase() {
    try {
        console.log('Attempting to initialize Supabase...');
        
        // Check different ways Supabase might be available
        let createClientFunction = null;
        
        // Check 1: supabaseJs from CDN
        if (typeof supabaseJs !== 'undefined' && supabaseJs.createClient) {
            console.log('Found supabaseJs.createClient');
            createClientFunction = supabaseJs.createClient;
        }
        // Check 2: window.supabase (might be loaded by another script)
        else if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
            console.log('Found window.supabase.createClient');
            createClientFunction = window.supabase.createClient;
        }
        // Check 3: createClient might be global
        else if (typeof createClient !== 'undefined') {
            console.log('Found global createClient');
            createClientFunction = createClient;
        }
        // Check 4: maybe Supabase v2 style
        else if (typeof window.supabase !== 'undefined') {
            console.log('Found window.supabase, assuming it is the client');
            // If window.supabase is already a client, use it directly
            window.mindguardSupabase = window.supabase;
            
            // ALWAYS set these for compatibility (overwrite with our client)
            window.supabase = window.supabase; // Already set, but keep for consistency
            window.supabaseClient = window.supabase;
            
            console.log('Using existing Supabase client');
            console.log('Global Supabase variables set:', {
                mindguardSupabase: !!window.mindguardSupabase,
                supabase: !!window.supabase,
                supabaseClient: !!window.supabaseClient
            });
            
            dispatchReadyEvent(window.supabase);
            return;
        }
        
        if (!createClientFunction) {
            console.error('ERROR: Could not find Supabase createClient function');
            console.log('Available globals for debugging:', 
                Object.keys(window).filter(k => 
                    k.toLowerCase().includes('supabase') || 
                    k.toLowerCase().includes('createclient')
                ).join(', ')
            );
            createFallbackClient();
            return;
        }
        
        console.log('Creating Supabase client...');
        
        // Create the client with unique variable name
        const mindguardClient = createClientFunction(
            MINDGUARD_SUPABASE_URL, 
            MINDGUARD_SUPABASE_KEY, 
            {
                auth: {
                    persistSession: true,
                    autoRefreshToken: true,
                    detectSessionInUrl: true
                }
            }
        );
        
        console.log('Supabase client created:', !!mindguardClient);
        console.log('Auth available:', !!(mindguardClient && mindguardClient.auth));
        
        // Store with unique global name to avoid conflicts
        window.mindguardSupabase = mindguardClient;
        
        // ALWAYS set these for compatibility (overwrite with our client)
        window.supabase = mindguardClient;
        window.supabaseClient = mindguardClient;
        
        console.log('Global Supabase variables set:', {
            mindguardSupabase: !!window.mindguardSupabase,
            supabase: !!window.supabase,
            supabaseClient: !!window.supabaseClient
        });
        
        // Mark as ready immediately
        dispatchReadyEvent(mindguardClient);
        
        // Test connection (don't wait for it)
        testConnection(mindguardClient).catch(console.error);
        
    } catch (error) {
        console.error('ERROR in initializeMindGuardSupabase:', error);
        createFallbackClient();
    }
}

// Function to test the connection
async function testConnection(client) {
    if (!client || !client.auth) {
        console.warn('Cannot test connection - client not available');
        return;
    }
    
    console.log('Testing Supabase connection...');
    try {
        const { data, error } = await client.auth.getSession();
        if (error) {
            console.warn('Connection test warning:', error.message);
            console.log('This is normal if no user is logged in');
        } else {
            console.log('Connection successful');
            console.log('Session exists:', !!data.session);
        }
    } catch (err) {
        console.error('Connection test exception:', err);
    }
}

// Function to dispatch ready event
function dispatchReadyEvent(client) {
    console.log('Supabase config loaded successfully');
    
    // Dispatch event to notify other scripts
    try {
        const event = new CustomEvent('mindguardSupabaseReady', { 
            detail: { 
                supabase: client,
                source: 'mindguard-config'
            } 
        });
        window.dispatchEvent(event);
        console.log('Dispatched mindguardSupabaseReady event');
    } catch (e) {
        console.log('Could not dispatch event:', e);
    }
}

// Function to create fallback client for offline mode
function createFallbackClient() {
    console.log('Creating fallback Supabase client for offline mode...');
    
    const fallbackClient = {
        _isFallback: true,
        auth: {
            getSession: async () => { 
                console.log('[Fallback] Getting session from localStorage');
                // Try to get session from localStorage
                try {
                    const sessionStr = localStorage.getItem('mindguard_session');
                    if (sessionStr) {
                        const session = JSON.parse(sessionStr);
                        // Check if session is expired
                        if (session.expires_at && session.expires_at > Date.now()) {
                            return { 
                                data: { session: { user: session.user } }, 
                                error: null 
                            };
                        }
                    }
                } catch (e) {
                    console.warn('Error reading session from localStorage:', e);
                }
                return { 
                    data: { session: null }, 
                    error: { message: 'Using offline mode' } 
                }; 
            },
            getUser: async () => {
                console.log('[Fallback] Getting user');
                const session = await this.getSession();
                return { 
                    data: { user: session.data.session ? session.data.session.user : null }, 
                    error: session.error 
                };
            },
            signInWithPassword: async ({ email, password }) => {
                console.log('[Fallback] Signing in (offline mode)');
                // Create a demo user for offline mode
                const demoUser = {
                    id: 'demo-' + Date.now(),
                    email: email,
                    created_at: new Date().toISOString()
                };
                
                // Store in localStorage
                localStorage.setItem('mindguard_session', JSON.stringify({
                    user: demoUser,
                    expires_at: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
                }));
                
                return { 
                    data: { 
                        user: demoUser,
                        session: { user: demoUser }
                    }, 
                    error: null 
                };
            },
            signUp: async ({ email, password, options }) => {
                console.log('[Fallback] Signing up (offline mode)');
                // Create a demo user for offline mode
                const demoUser = {
                    id: 'demo-' + Date.now(),
                    email: email,
                    user_metadata: options?.data || {},
                    created_at: new Date().toISOString()
                };
                
                // Store in localStorage
                localStorage.setItem('mindguard_session', JSON.stringify({
                    user: demoUser,
                    expires_at: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
                }));
                
                return { 
                    data: { 
                        user: demoUser,
                        session: { user: demoUser }
                    }, 
                    error: null 
                };
            },
            signOut: async () => {
                console.log('[Fallback] Signing out');
                localStorage.removeItem('mindguard_session');
                return { error: null };
            },
            onAuthStateChange: () => {
                console.log('[Fallback] Auth state change listener');
                return { data: { subscription: { unsubscribe: () => {} } } };
            }
        },
        from: () => {
            console.log('[Fallback] Database query (offline)');
            return {
                select: () => ({ data: [], error: null }),
                insert: () => ({ data: null, error: { message: 'Offline mode' } }),
                update: () => ({ data: null, error: { message: 'Offline mode' } }),
                delete: () => ({ data: null, error: { message: 'Offline mode' } })
            };
        }
    };
    
    // Store with unique name
    window.mindguardSupabase = fallbackClient;
    
    // ALWAYS set these for compatibility
    window.supabase = fallbackClient;
    window.supabaseClient = fallbackClient;
    
    console.log('Fallback client created - running in offline/demo mode');
    console.log('Global Supabase variables set:', {
        mindguardSupabase: !!window.mindguardSupabase,
        supabase: !!window.supabase,
        supabaseClient: !!window.supabaseClient
    });
    
    // Dispatch ready event for fallback too
    dispatchReadyEvent(fallbackClient);
}

// Helper to check status
window.checkMindGuardSupabase = function() {
    const client = window.mindguardSupabase;
    return {
        isAvailable: !!(client && client.auth),
        isFallback: !!(client && client._isFallback),
        url: MINDGUARD_SUPABASE_URL,
        hasKey: !!MINDGUARD_SUPABASE_KEY,
        allVariables: {
            mindguardSupabase: !!window.mindguardSupabase,
            supabase: !!window.supabase,
            supabaseClient: !!window.supabaseClient
        }
    };
};

// Initialize immediately when the script loads
console.log('Starting Supabase initialization...');

// Initialize immediately (don't wait for DOM or setTimeout)
initializeMindGuardSupabase();

console.log('Supabase config script loaded');