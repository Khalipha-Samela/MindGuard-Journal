// DOM elements
const entriesContainer = document.getElementById('entries-container');
const alertDialog = document.getElementById('alert-dialog');
const cancelBtn = document.getElementById('cancel-btn');
const confirmDeleteBtn = document.getElementById('confirm-delete-btn');

// State variables
let journalEntries = [];
let expandedEntryId = null;
let entryToDelete = null;
let isDeleting = false;
let supabaseClient = null;
let currentUser = null;

// Initialize page
window.addEventListener('DOMContentLoaded', async () => {
    // Initialize Supabase
    await initializeSupabase();
    
    // Check authentication
    const isAuthenticated = await checkAuthentication();
    if (!isAuthenticated) return;
    
    // Show loading state
    document.getElementById('loading-state')?.classList?.remove('hidden');
    document.getElementById('dashboard-content')?.classList?.add('hidden');
    
    // Load entries from Supabase
    await loadEntriesFromSupabase();
    
    // Set up event listeners
    setTimeout(() => {
        setupEventListeners();
    }, 300);
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
        
    } catch (error) {
        console.error('Failed to initialize Supabase:', error);
        showToast({
            title: "Service Error",
            description: "Unable to connect to service.",
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
            description: "Unable to verify authentication. Please refresh.",
            type: "destructive"
        });
        
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        return false;
    }
    
    try {
        const { data: { session }, error } = await supabaseClient.auth.getSession();
        
        if (error || !session) {
            showToast({
                title: "Authentication Required",
                description: "Please log in to view your history.",
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
 * Load entries from Supabase
 */
async function loadEntriesFromSupabase() {
    try {
        let entries = [];
        
        if (supabaseClient && currentUser) {
            // Try to load from Supabase first
            const { data, error } = await supabaseClient
                .from('journal_entries')
                .select('*')
                .eq('user_id', currentUser.id)
                .order('created_at', { ascending: false })
                .limit(50);
            
            if (error) throw error;
            
            if (data && data.length > 0) {
                entries = data;
            } else {
                // No entries in Supabase, check localStorage
                entries = await loadFromLocalStorage();
            }
        } else {
            // Fallback to localStorage
            entries = await loadFromLocalStorage();
        }
        
        // Process entries
        journalEntries = entries.map(entry => {
            // Ensure entry has proper analysis
            if (!entry.analysis || !entry.analysis.risk_level) {
                return {
                    ...entry,
                    analysis: generateAnalysisForEntry(entry.text || '')
                };
            }
            return entry;
        });
        
        // Sort by date, newest first
        journalEntries.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
    } catch (error) {
        console.error('Error loading entries:', error);
        
        // Fallback to localStorage
        journalEntries = await loadFromLocalStorage();
        
        showToast({
            title: "Using Local Data",
            description: "Could not load from cloud. Showing local entries.",
            type: "warning"
        });
    }
    
    // Hide loading and render entries
    document.getElementById('loading-state')?.classList?.add('hidden');
    document.getElementById('dashboard-content')?.classList?.remove('hidden');
    renderEntries();
}

/**
 * Load entries from localStorage as fallback
 */
async function loadFromLocalStorage() {
    try {
        const savedEntries = localStorage.getItem('journalEntries');
        if (savedEntries) {
            const entries = JSON.parse(savedEntries);
            
            // Filter entries for current user if available
            if (currentUser) {
                return entries.filter(entry => entry.user_id === currentUser.id || !entry.user_id);
            }
            return entries;
        }
        return [];
    } catch (error) {
        console.error('Error loading from localStorage:', error);
        return [];
    }
}

/**
 * Generate analysis for entries that don't have it
 */
function generateAnalysisForEntry(content) {
    try {
        if (window.generateEnhancedAnalysis) {
            const allEntries = journalEntries.map(e => e.text).filter(Boolean);
            const enhancedAnalysis = window.generateEnhancedAnalysis(content, allEntries);
            
            return {
                patterns: enhancedAnalysis.patterns || [],
                triggers: enhancedAnalysis.triggers || [],
                warnings: enhancedAnalysis.warnings || [],
                grounding_techniques: enhancedAnalysis.grounding_techniques || [],
                coping_strategies: enhancedAnalysis.coping_strategies || [],
                risk_level: enhancedAnalysis.risk_level || 'low'
            };
        }
    } catch (error) {
        console.error('Error generating enhanced analysis:', error);
    }
    
    // Fallback analysis
    return generateFallbackAnalysis(content);
}

/**
 * Fallback analysis (simple version)
 */
function generateFallbackAnalysis(content) {
    const hasStressWords = /stress|overwhelm|anxious|worr|pressure/i.test(content);
    const hasWorkWords = /work|job|meeting|deadline|project/i.test(content);
    const hasSleepWords = /sleep|tired|rest|dream|energy/i.test(content);
    
    const patterns = [];
    const triggers = [];
    const warnings = [];
    const grounding_techniques = [];
    const coping_strategies = [];
    
    // Patterns
    if (hasStressWords && hasWorkWords) {
        patterns.push({
            theme: "Work-related stress",
            frequency: "Common",
            description: "Mentions of work combined with stress indicators"
        });
    }
    
    if (hasSleepWords) {
        patterns.push({
            theme: "Sleep and energy levels",
            frequency: "Occasional",
            description: "Discussion of sleep patterns and energy"
        });
    }
    
    // Triggers
    if (hasWorkWords) {
        triggers.push({
            word: "work",
            context: "Work-related discussions often accompanied by stress",
            intensity: hasStressWords ? "medium" : "low"
        });
    }
    
    // Grounding techniques
    grounding_techniques.push({
        name: "5-4-3-2-1 Sensory Grounding",
        description: "This technique helps bring you into the present moment by focusing on your five senses.",
        steps: []
    });
    
    // Coping strategies
    coping_strategies.push({
        title: "Journaling Practice",
        description: "Continue using journaling as an outlet for thoughts and emotions.",
        when_to_use: "Daily for maintaining emotional balance"
    });
    
    return {
        patterns,
        triggers,
        warnings,
        grounding_techniques,
        coping_strategies,
        risk_level: 'low'
    };
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    if (cancelBtn) cancelBtn.addEventListener('click', closeDeleteDialog);
    if (confirmDeleteBtn) confirmDeleteBtn.addEventListener('click', handleDeleteConfirm);
    
    // Close dialog when clicking outside
    if (alertDialog) {
        alertDialog.addEventListener('click', (e) => {
            if (e.target === alertDialog) {
                closeDeleteDialog();
            }
        });
    }
    
    // Close dialog with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && alertDialog && !alertDialog.classList.contains('hidden')) {
            closeDeleteDialog();
        }
    });
}

/**
 * Format date for display
 */
function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return 'Date unknown';
    }
}

/**
 * Get intensity color class
 */
function getIntensityColor(intensity) {
    switch (intensity) {
        case 'high': return 'text-warning';
        case 'medium': return 'text-warning-70';
        default: return 'text-muted-foreground';
    }
}

/**
 * Get warning color class
 */
function getWarningColor(level) {
    switch (level) {
        case 'high': return 'warning-high';
        case 'medium': return 'warning-medium';
        default: return 'warning-low';
    }
}

/**
 * Render all entries
 */
function renderEntries() {
    if (!entriesContainer) return;
    
    if (journalEntries.length === 0) {
        entriesContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar"></i>
                <h2>No journal entries yet</h2>
                <p>Start writing to see your history here</p>
                <a href="index.html" class="btn btn-primary mt-4">Write Your First Entry</a>
            </div>
        `;
        return;
    }

    entriesContainer.innerHTML = `
        <div class="journey-header">
            <h2>Your Journey</h2>
            <p>${journalEntries.length} ${journalEntries.length === 1 ? 'entry' : 'entries'} recorded</p>
        </div>
        <div id="entries-list">
            ${journalEntries.map(entry => renderEntry(entry)).join('')}
        </div>
    `;

    // Attach event listeners to entry headers
    setTimeout(() => {
        document.querySelectorAll('.entry-header').forEach(header => {
            header.addEventListener('click', (e) => {
                if (!e.target.closest('.btn-icon')) {
                    const entryId = header.dataset.entryId;
                    toggleEntry(entryId);
                }
            });
        });
    }, 100);
}

/**
 * Render a single entry
 */
function renderEntry(entry) {
    const isExpanded = expandedEntryId === entry.id;
    const formattedDate = formatDate(entry.created_at);
    const contentPreview = entry.text ? 
        (entry.text.substring(0, 100) + (entry.text.length > 100 ? '...' : '')) : 
        'No content';
    
    return `
        <div class="entry-card" id="entry-${entry.id}">
            <div class="entry-header ${isExpanded ? 'active' : ''}" data-entry-id="${entry.id}">
                <div class="entry-header-content">
                    <div class="entry-info">
                        <div class="entry-date">
                            <i class="fas fa-calendar"></i>
                            <span>${formattedDate}</span>
                        </div>
                        <div class="entry-title">${contentPreview}</div>
                    </div>
                    <div class="entry-actions">
                        <button class="btn btn-ghost btn-icon" onclick="openDeleteDialog('${entry.id}', event)">
                            <i class="fas fa-trash"></i>
                        </button>
                        <i class="fas fa-chevron-down chevron-icon ${isExpanded ? 'rotated' : ''}"></i>
                    </div>
                </div>
            </div>
            <div class="entry-content ${isExpanded ? 'expanded' : ''}">
                <div class="entry-content-inner">
                    ${renderEntryContent(entry)}
                </div>
            </div>
        </div>
    `;
}

/**
 * Render entry content
 */
function renderEntryContent(entry) {
    if (!entry.analysis) {
        entry.analysis = generateAnalysisForEntry(entry.text || '');
    }

    return `
        <div class="full-entry">
            <h4><i class="fas fa-book"></i> Full Entry</h4>
            <p>${entry.text || 'No content'}</p>
        </div>
        
        ${entry.analysis.risk_level ? `
            <div class="history-risk-summary">
                <div class="flex items-center justify-between mb-2">
                    <h4 class="font-bold text-foreground">Risk Assessment</h4>
                    <span class="history-risk-level" style="color: ${getRiskColor(entry.analysis.risk_level)}">
                        ${entry.analysis.risk_level.toUpperCase()} RISK
                    </span>
                </div>
                <div class="history-risk-meter">
                    <div class="history-risk-fill" style="width: ${getRiskPercent(entry.analysis.risk_level)}%; background-color: ${getRiskColor(entry.analysis.risk_level)};"></div>
                </div>
                <div class="history-risk-info">
                    <span class="text-sm text-muted-foreground">Based on analysis of this entry</span>
                    <i class="fas fa-${getRiskIcon(entry.analysis.risk_level)}" style="color: ${getRiskColor(entry.analysis.risk_level)}"></i>
                </div>
            </div>
        ` : ''}
        
        <div class="section-title">Analysis Insights</div>
        <div class="analysis-grid">
            ${renderPatterns(entry.analysis.patterns)}
            ${renderTriggers(entry.analysis.triggers)}
            ${renderGrounding(entry.analysis.grounding_techniques)}
            ${renderCoping(entry.analysis.coping_strategies)}
        </div>
        ${renderWarnings(entry.analysis.warnings)}
    `;
}

/**
 * Get risk color
 */
function getRiskColor(riskLevel) {
    switch (riskLevel) {
        case 'critical':
        case 'high': return '#dc2626';
        case 'medium': return '#ea580c';
        case 'low': return '#16a34a';
        default: return '#6b7280';
    }
}

/**
 * Get risk percentage
 */
function getRiskPercent(riskLevel) {
    switch (riskLevel) {
        case 'critical': return 95;
        case 'high': return 75;
        case 'medium': return 50;
        case 'low': return 25;
        default: return 10;
    }
}

/**
 * Get risk icon
 */
function getRiskIcon(riskLevel) {
    switch (riskLevel) {
        case 'critical':
        case 'high': return 'exclamation-triangle';
        case 'medium': return 'exclamation-circle';
        case 'low': return 'check-circle';
        default: return 'info-circle';
    }
}

/**
 * Render patterns section
 */
function renderPatterns(patterns) {
    if (!patterns || patterns.length === 0) return '';
    
    return `
        <div class="analysis-card pattern-card">
            <div class="analysis-card-header">
                <div class="analysis-card-title">
                    <i class="fas fa-chart-line text-primary"></i>
                    Recurring Patterns
                </div>
                <div class="analysis-card-description">Patterns across your entries</div>
            </div>
            <div class="analysis-card-content">
                ${patterns.map((pattern, idx) => `
                    <div class="pattern-item">
                        <div class="flex items-start justify-between mb-1">
                            <h5 class="font-semibold text-foreground">${pattern.theme}</h5>
                            <div class="flex items-center gap-2">
                                <span class="frequency-indicator">
                                    <i class="fas fa-chart-bar mr-1"></i>${pattern.frequency || 'Common'}
                                </span>
                                <span class="badge ${pattern.confidence === 'High' ? 'badge-high' : pattern.confidence === 'Medium' ? 'badge-medium' : 'badge-low'}">
                                    ${pattern.confidence || 'Medium'}
                                </span>
                            </div>
                        </div>
                        <p class="text-sm text-muted-foreground mb-2">${pattern.description}</p>
                        ${pattern.trend ? `
                            <div class="trend-indicator">
                                <i class="fas fa-${pattern.trend === 'Increasing' ? 'arrow-up trend-up' : pattern.trend === 'Decreasing' ? 'arrow-down trend-down' : 'minus trend-stable'} mr-1"></i>
                                <span class="text-xs">${pattern.trend} trend detected</span>
                            </div>
                        ` : ''}
                        ${idx < patterns.length - 1 ? '<div class="separator mt-3"></div>' : ''}
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

/**
 * Render triggers section
 */
function renderTriggers(triggers) {
    if (!triggers || triggers.length === 0) return '';
    
    return `
        <div class="analysis-card trigger-card">
            <div class="analysis-card-header">
                <div class="analysis-card-title">
                    <i class="fas fa-exclamation-circle text-warning"></i>
                    Trauma Triggers
                </div>
                <div class="analysis-card-description">Potential triggers with intensity levels</div>
            </div>
            <div class="analysis-card-content">
                ${triggers.map((trigger, idx) => `
                    <div class="trigger-item">
                        <div class="flex items-start justify-between mb-1">
                            <div class="flex items-center gap-2">
                                <i class="${trigger.category_icon || 'fas fa-exclamation-circle'} text-warning"></i>
                                <h5 class="font-semibold text-foreground">${trigger.word}</h5>
                            </div>
                            <span class="intensity-badge intensity-${trigger.intensity}">
                                ${trigger.intensity} intensity
                            </span>
                        </div>
                        <p class="text-sm text-muted-foreground mb-2">${trigger.description}</p>
                        ${trigger.context ? `
                            <div class="context-display">
                                ${trigger.context}
                            </div>
                        ` : ''}
                        <p class="text-xs text-muted-foreground mt-2">
                            <i class="fas fa-lightbulb mr-1"></i>
                            <strong>Suggested approach:</strong> ${trigger.suggested_approach || 'Monitor and use grounding techniques'}
                        </p>
                        ${idx < triggers.length - 1 ? '<div class="separator mt-3"></div>' : ''}
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

/**
 * Render grounding techniques
 */
function renderGrounding(grounding) {
    if (!grounding || grounding.length === 0) return '';
    
    return `
        <div class="analysis-card grounding-card">
            <div class="analysis-card-header">
                <div class="analysis-card-title">
                    <i class="fas fa-heart text-primary"></i>
                    Grounding Techniques
                </div>
                <div class="analysis-card-description">Step-by-step instructions</div>
            </div>
            <div class="analysis-card-content">
                ${grounding.map((technique, idx) => `
                    <div class="grounding-item">
                        <div class="flex items-start justify-between mb-2">
                            <div class="flex items-center gap-2">
                                <i class="${technique.icon || 'fas fa-spa'} text-primary"></i>
                                <h5 class="font-semibold text-foreground">${technique.name}</h5>
                            </div>
                            <div class="flex items-center gap-2">
                                <span class="text-xs text-muted-foreground">${technique.duration || '3-5 minutes'}</span>
                                <span class="badge badge-success text-xs">${technique.effectiveness || 'Effective'}</span>
                            </div>
                        </div>
                        <p class="text-sm text-muted-foreground mb-3">${technique.description}</p>
                        ${technique.steps && technique.steps.length > 0 ? `
                            <p class="text-xs font-medium mb-1"><i class="fas fa-list-ol mr-1"></i>Steps:</p>
                            <ol class="step-list">
                                ${technique.steps.map((step, stepIdx) => `
                                    <li class="text-xs text-muted-foreground">${step}</li>
                                `).join('')}
                            </ol>
                        ` : ''}
                        ${idx < grounding.length - 1 ? '<div class="separator mt-3"></div>' : ''}
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

/**
 * Render coping strategies
 */
function renderCoping(coping) {
    if (!coping || coping.length === 0) return '';
    
    return `
        <div class="analysis-card coping-card">
            <div class="analysis-card-header">
                <div class="analysis-card-title">
                    <i class="fas fa-lightbulb text-primary"></i>
                    Personalized Coping Strategies
                </div>
                <div class="analysis-card-description">Tailored approaches for you</div>
            </div>
            <div class="analysis-card-content">
                ${coping.map((strategy, idx) => `
                    <div class="coping-item">
                        <div class="flex items-start justify-between mb-2">
                            <h5 class="font-semibold text-foreground">${strategy.title}</h5>
                            <span class="badge badge-info text-xs">${strategy.effectiveness || 'Effective'}</span>
                        </div>
                        <p class="text-sm text-muted-foreground mb-3">${strategy.description}</p>
                        ${strategy.steps && strategy.steps.length > 0 ? `
                            <p class="text-xs font-medium mb-1"><i class="fas fa-list-ol mr-1"></i>Implementation Steps:</p>
                            <ol class="step-list">
                                ${strategy.steps.map((step, stepIdx) => `
                                    <li class="text-xs text-muted-foreground">${step}</li>
                                `).join('')}
                            </ol>
                        ` : ''}
                        ${strategy.personalization ? `
                            <p class="text-xs font-medium mt-3"><i class="fas fa-user-check mr-1"></i>Personalized for you:</p>
                            <p class="text-xs text-muted-foreground">${strategy.personalization}</p>
                        ` : ''}
                        ${idx < coping.length - 1 ? '<div class="separator mt-3"></div>' : ''}
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

/**
 * Render warnings section
 */
function renderWarnings(warnings) {
    if (!warnings || warnings.length === 0) return '';
    
    return `
        <div class="analysis-card warning-card">
            <div class="analysis-card-header">
                <div class="analysis-card-title">
                    <i class="fas fa-exclamation-triangle text-warning"></i>
                    Early Warnings
                </div>
                <div class="analysis-card-description">Potential risks and predictions</div>
            </div>
            <div class="analysis-card-content">
                ${warnings.map((warning, idx) => `
                    <div class="warning-item warning-${warning.level || 'medium'}">
                        <div class="flex items-start justify-between mb-2">
                            <h5 class="font-semibold text-foreground">${warning.message}</h5>
                            <span class="badge ${warning.level === 'high' ? 'badge-destructive' : 'badge-warning'}">
                                ${warning.level || 'medium'} priority
                            </span>
                        </div>
                        <p class="text-sm mb-2">${warning.reasoning || 'Pattern detected'}</p>
                        ${warning.predicted_risk ? `
                            <div class="bg-white bg-opacity-50 p-3 rounded">
                                <p class="text-xs font-medium mb-1"><i class="fas fa-chart-line mr-1"></i>Predicted Risk:</p>
                                <p class="text-xs mb-2 pl-4">${warning.predicted_risk}</p>
                                ${warning.suggested_action ? `
                                    <p class="text-xs font-medium mb-1"><i class="fas fa-hands-helping mr-1"></i>Suggested Action:</p>
                                    <p class="text-xs pl-4">${warning.suggested_action}</p>
                                ` : ''}
                            </div>
                        ` : ''}
                        ${idx < warnings.length - 1 ? '<div class="separator mt-3"></div>' : ''}
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

/**
 * Toggle entry expansion
 */
function toggleEntry(entryId) {
    if (expandedEntryId === entryId) {
        expandedEntryId = null;
    } else {
        expandedEntryId = entryId;
    }
    renderEntries();
}

/**
 * Open delete confirmation dialog
 */
function openDeleteDialog(entryId, event) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }
    entryToDelete = entryId;
    alertDialog.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

/**
 * Close delete dialog
 */
function closeDeleteDialog() {
    alertDialog.classList.add('hidden');
    document.body.style.overflow = 'auto';
    entryToDelete = null;
}

/**
 * Handle delete confirmation
 */
async function handleDeleteConfirm() {
    if (!entryToDelete || isDeleting) return;
    
    isDeleting = true;
    confirmDeleteBtn.textContent = "Deleting...";
    confirmDeleteBtn.classList.add('disabled');
    
    try {
        let success = false;
        
        // Try to delete from Supabase first
        if (supabaseClient && currentUser) {
            const { error } = await supabaseClient
                .from('journal_entries')
                .delete()
                .eq('id', entryToDelete)
                .eq('user_id', currentUser.id);
            
            if (error) throw error;
            success = true;
        }
        
        // Also delete from localStorage
        const localStorageSuccess = deleteFromLocalStorage(entryToDelete);
        success = success || localStorageSuccess;
        
        if (success) {
            // Remove entry from local array
            const entryIndex = journalEntries.findIndex(entry => entry.id === entryToDelete);
            if (entryIndex !== -1) {
                journalEntries.splice(entryIndex, 1);
            }
            
            // Reset expanded entry if it was deleted
            if (expandedEntryId === entryToDelete) {
                expandedEntryId = null;
            }
            
            // Re-render entries
            renderEntries();
            
            showToast({
                title: "Entry deleted",
                description: "Your journal entry has been deleted.",
                type: "success"
            });
        } else {
            throw new Error('Delete failed');
        }
        
    } catch (error) {
        console.error('Delete error:', error);
        showToast({
            title: "Error",
            description: "Could not delete entry. Please try again.",
            type: "destructive"
        });
    }
    
    // Reset state
    isDeleting = false;
    closeDeleteDialog();
    confirmDeleteBtn.textContent = "Delete";
    confirmDeleteBtn.classList.remove('disabled');
}

/**
 * Delete from localStorage
 */
function deleteFromLocalStorage(entryId) {
    try {
        const savedEntries = localStorage.getItem('journalEntries') || '[]';
        const entries = JSON.parse(savedEntries);
        const filteredEntries = entries.filter(entry => entry.id !== entryId);
        localStorage.setItem('journalEntries', JSON.stringify(filteredEntries));
        return true;
    } catch (error) {
        console.error('Error deleting from localStorage:', error);
        return false;
    }
}

/**
 * Show toast notification
 */
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

/**
 * History page specific sign out
 */
async function signOut() {
    if (!supabaseClient) {
        window.location.href = 'login.html';
        return;
    }
    
    showToast({
        title: "Signing out...",
        description: "You will be redirected to the login page.",
        type: "success"
    });
    
    try {
        const { error } = await supabaseClient.auth.signOut();
        
        if (error) throw error;
        
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1000);
        
    } catch (error) {
        console.error('Sign out error:', error);
        showToast({
            title: "Sign out failed",
            description: "Please try again.",
            type: "destructive"
        });
    }
}

// Make functions available globally
window.toggleEntry = toggleEntry;
window.openDeleteDialog = openDeleteDialog;
window.closeDeleteDialog = closeDeleteDialog;
window.signOut = signOut;
window.showToast = showToast;