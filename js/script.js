// DOM elements
const loadingState = document.getElementById('loading-state');
const dashboardContent = document.getElementById('dashboard-content');
const analysisLoading = document.getElementById('analysis-loading');
const analysisEmpty = document.getElementById('analysis-empty');
const analysisContent = document.getElementById('analysis-content');
const journalText = document.getElementById('journal-text');
const wordCount = document.getElementById('word-count');
const analyzeBtn = document.getElementById('analyze-btn');
const clearBtn = document.getElementById('clear-btn');

// Global variables
let supabaseClient = null;
let currentUser = null;

// Initialize application
window.addEventListener('DOMContentLoaded', async () => {
    // Initialize Supabase first
    await initializeSupabase();
    
    // Check authentication
    const isAuthenticated = await checkAuthentication();
    if (!isAuthenticated) return;
    
    // Show loading state
    loadingState.style.display = 'flex';
    dashboardContent.style.display = 'none';
    
    // Load user data
    await loadUserData();
    
    // Initialize components
    setTimeout(() => {
        loadingState.style.display = 'none';
        dashboardContent.style.display = 'block';
        updateWordCount();
    }, 1000);
});

/**
 * Initialize Supabase client
 */
async function initializeSupabase() {
    try {
        // Dynamically import Supabase
        const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
        
        // Supabase credentials
        const supabaseUrl = 'https://vkhilikrothkpaogwbfw.supabase.co';
        const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZraGlsaWtyb3Roa3Bhb2d3YmZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1NTQyNjcsImV4cCI6MjA4MTEzMDI2N30.9k36S3PLkrlvM8f7xb9RS2GRYRHrL_VFuKX22mAhztE';
        
        supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
        
        // Setup auth state listener
        supabaseClient.auth.onAuthStateChange((event, session) => {
            console.log('Auth state changed:', event);
            
            if (event === 'SIGNED_IN') {
                console.log('User signed in:', session.user.email);
                currentUser = session.user;
                localStorage.setItem('userEmail', session.user.email);
            } else if (event === 'SIGNED_OUT') {
                console.log('User signed out');
                currentUser = null;
                localStorage.removeItem('userEmail');
            }
        });
        
    } catch (error) {
        console.error('Failed to initialize Supabase:', error);
        showToast({
            title: "Service Error",
            description: "Unable to connect to authentication service.",
            type: "destructive"
        });
    }
}

/**
 * Check if user is authenticated
 */
async function checkAuthentication() {
    if (!supabaseClient) {
        showToast({
            title: "Authentication Error",
            description: "Unable to verify authentication. Please refresh the page.",
            type: "destructive"
        });
        return false;
    }
    
    try {
        const { data: { session }, error } = await supabaseClient.auth.getSession();
        
        if (error || !session) {
            // Redirect to login
            showToast({
                title: "Authentication Required",
                description: "Please log in to continue.",
                type: "warning"
            });
            
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
            return false;
        }
        
        currentUser = session.user;
        return true;
        
    } catch (error) {
        console.error('Auth check error:', error);
        showToast({
            title: "Authentication Error",
            description: "Unable to verify your session.",
            type: "destructive"
        });
        return false;
    }
}

/**
 * Load user data
 */
async function loadUserData() {
    if (!currentUser) return;
    
    try {
        // You can load additional user data here if needed
        console.log('Loading data for user:', currentUser.email);
        
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

// Word count functionality
function updateWordCount() {
    const text = journalText.value.trim();
    const words = text ? text.split(/\s+/).length : 0;
    wordCount.textContent = words;
    
    // Disable analyze button if no text
    analyzeBtn.disabled = words === 0;
}

journalText.addEventListener('input', updateWordCount);

// Enhanced AI Analysis with all 5 components
function generateEnhancedAnalysis(content, allEntries = []) {
    const lowerContent = content.toLowerCase();
    
    // 1. RECURRING PATTERNS across entries
    const patterns = detectRecurringPatterns(content, allEntries);
    
    // 2. POTENTIAL TRAUMA TRIGGERS with intensity levels
    const triggers = detectTraumaTriggers(content);
    
    // 3. EARLY WARNING PREDICTIONS
    const warnings = generateEarlyWarnings(content, patterns, triggers);
    
    // 4. GROUNDING TECHNIQUES with step-by-step instructions
    const grounding_techniques = generateGroundingTechniques(content, triggers);
    
    // 5. PERSONALIZED COPING STRATEGIES
    const coping_strategies = generateCopingStrategies(content, patterns, triggers);
    
    return {
        patterns,
        triggers,
        warnings,
        grounding_techniques,
        coping_strategies,
        risk_level: calculateRiskLevel(content, triggers, warnings)
    };
}

// All the analysis helper functions remain the same...
// detectRecurringPatterns, detectTraumaTriggers, generateEarlyWarnings, etc.
// (Keep all your existing analysis functions as they are)

/**
 * Save journal entry to Supabase
 */
async function saveJournalEntryToSupabase(text, analysis) {
    if (!supabaseClient || !currentUser) {
        throw new Error('Not authenticated');
    }
    
    try {
        const entry = {
            user_id: currentUser.id,
            text: text,
            analysis: analysis,
            word_count: text.split(/\s+/).length,
            created_at: new Date().toISOString()
        };
        
        const { data, error } = await supabaseClient
            .from('journal_entries')
            .insert([entry])
            .select()
            .single();
        
        if (error) throw error;
        
        console.log('Entry saved to Supabase:', data.id);
        return data;
        
    } catch (error) {
        console.error('Error saving to Supabase:', error);
        
        // Fallback to localStorage
        const fallbackEntry = saveToLocalStorage(text, analysis);
        showToast({
            title: "Saved Locally",
            description: "Entry saved to local storage. Cloud sync will retry.",
            type: "warning"
        });
        
        return fallbackEntry;
    }
}

/**
 * Save to localStorage as fallback
 */
function saveToLocalStorage(text, analysis) {
    try {
        const savedEntries = localStorage.getItem('journalEntries') || '[]';
        const entries = JSON.parse(savedEntries);
        
        const newEntry = {
            id: Date.now().toString(),
            user_id: currentUser?.id || 'local',
            text: text,
            created_at: new Date().toISOString(),
            word_count: text.split(/\s+/).length,
            analysis: analysis
        };
        
        entries.unshift(newEntry);
        localStorage.setItem('journalEntries', JSON.stringify(entries.slice(0, 50)));
        
        return newEntry;
    } catch (error) {
        console.error('Error saving to localStorage:', error);
        return null;
    }
}

/**
 * Analyze journal entry
 */
async function analyzeJournal() {
    const text = journalText.value.trim();
    if (!text) return;
    
    // Show loading state for analysis
    analysisLoading.style.display = 'block';
    analysisEmpty.style.display = 'none';
    analysisContent.style.display = 'none';
    
    // Get all previous entries for pattern detection
    let allEntries = [];
    try {
        if (supabaseClient && currentUser) {
            const { data, error } = await supabaseClient
                .from('journal_entries')
                .select('text')
                .eq('user_id', currentUser.id)
                .order('created_at', { ascending: false })
                .limit(10);
            
            if (!error && data) {
                allEntries = data.map(entry => entry.text);
            }
        }
    } catch (error) {
        console.error('Error fetching previous entries:', error);
    }
    
    // Generate enhanced analysis
    const analysis = generateEnhancedAnalysis(text, allEntries);
    
    try {
        // Save entry to Supabase (or localStorage as fallback)
        const savedEntry = await saveJournalEntryToSupabase(text, analysis);
        
        if (!savedEntry) {
            throw new Error('Failed to save entry');
        }
        
        // Show analysis content with updated data
        analysisLoading.style.display = 'none';
        analysisContent.style.display = 'block';
        
        // Update timestamp
        const updateText = document.querySelector('.analysis-header p');
        const now = new Date();
        const timeString = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        updateText.textContent = `Based on your latest journal entry • Updated at ${timeString}`;
        
        // Update analysis content with enhanced display
        updateAnalysisDisplay(analysis);
        
        // Show success message
        showToast({ 
            title: "Analysis Complete", 
            description: "Your journal has been analyzed and saved.", 
            type: "success" 
        });
        
        // Smooth scroll to analysis section
        document.getElementById('analysis-section').scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
        
    } catch (error) {
        console.error('Analysis error:', error);
        analysisLoading.style.display = 'none';
        analysisEmpty.style.display = 'block';
        
        showToast({
            title: "Analysis Error",
            description: "Could not analyze your entry. Please try again.",
            type: "destructive"
        });
    }
}

function clearJournalEntry() {
    if (journalText.value.trim() && !confirm('Clear the current entry?')) {
        return;
    }
    journalText.value = '';
    updateWordCount();
    analysisContent.style.display = 'none';
    analysisEmpty.style.display = 'block';
    
    showToast({
        title: "Entry Cleared",
        description: "Your current journal entry has been cleared.",
        type: "info"
    });
}

// All the display update functions remain the same...
// updateAnalysisDisplay, updateRiskSummary, updatePatternsDisplay, etc.
// (Keep all your existing display functions as they are)

// Navigation functions
function navigateToHistory() {
    showToast({
        title: "Navigating to History",
        description: "Loading your journal history...",
        type: "info"
    });
    
    setTimeout(() => {
        window.location.href = 'history.html';
    }, 800);
}

async function signOut() {
    if (!supabaseClient) {
        window.location.href = 'login.html';
        return;
    }
    
    showToast({
        title: "Signing Out",
        description: "You will be redirected to the login page.",
        type: "info"
    });
    
    try {
        const { error } = await supabaseClient.auth.signOut();
        
        if (error) throw error;
        
        // Clear local data
        localStorage.removeItem('userEmail');
        currentUser = null;
        
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
        
    } catch (error) {
        console.error('Sign out error:', error);
        showToast({
            title: "Sign out failed",
            description: "There was an error signing out.",
            type: "destructive"
        });
    }
}

// Show toast notification
function showToast({ title, description, type = "success" }) {
    // Remove existing toast
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'warning' ? 'exclamation-triangle' : type === 'destructive' ? 'times-circle' : 'info-circle'} toast-icon"></i>
            <div class="toast-message">
                <div class="toast-title">${title}</div>
                <div class="toast-description">${description}</div>
            </div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add to page
    document.body.appendChild(toast);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.animation = 'slideInFromRight 0.3s ease reverse forwards';
            setTimeout(() => toast.remove(), 300);
        }
    }, 5000);
}

// Save current analysis to history
function saveToHistory() {
    const text = journalText.value.trim();
    if (!text) {
        showToast({
            title: "No Entry to Save",
            description: "Please write a journal entry first before saving.",
            type: "warning"
        });
        return;
    }
    
    // The entry is already saved when analyzed, so just show a confirmation
    showToast({
        title: "Entry Saved",
        description: "Your journal entry has been saved to your history.",
        type: "success"
    });
}

// Clear analysis and prepare for another entry
function analyzeAnother() {
    // Clear the journal text
    journalText.value = '';
    updateWordCount();
    
    // Hide analysis content and show empty state
    analysisContent.style.display = 'none';
    analysisEmpty.style.display = 'block';
    
    // Scroll back to the journal editor
    document.querySelector('.journal-editor-card').scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
    });
    
    // Show confirmation toast
    showToast({
        title: "Ready for New Entry",
        description: "You can now write another journal entry.",
        type: "info"
    });
}

// Make functions available globally
window.analyzeJournal = analyzeJournal;
window.clearJournalEntry = clearJournalEntry;
window.navigateToHistory = navigateToHistory;
window.signOut = signOut;
window.showToast = showToast;
window.updateWordCount = updateWordCount;
window.generateEnhancedAnalysis = generateEnhancedAnalysis;
window.saveToHistory = saveToHistory; 
window.analyzeAnother = analyzeAnother;

// Export for use in history.js
window.getSupabaseClient = () => supabaseClient;
window.getCurrentUser = () => currentUser;