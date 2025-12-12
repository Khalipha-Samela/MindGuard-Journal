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

// Initialize page
window.addEventListener('DOMContentLoaded', () => {
    // Show loading state
    loadingState.classList.remove('hidden');
    dashboardContent.classList.add('hidden');

    // Load entries from localStorage
    loadEntriesFromStorage();
    
    // Set up event listeners
    setTimeout(() => {
        setupEventListeners();
    }, 300);
});

// Load entries from localStorage
function loadEntriesFromStorage() {
    try {
        const savedEntries = localStorage.getItem('journalEntries');
        if (savedEntries) {
            journalEntries = JSON.parse(savedEntries);
            
            // Convert dates and ensure proper structure WITH ENHANCED ANALYSIS
            journalEntries = journalEntries.map(entry => {
                // Check if entry already has enhanced analysis
                if (!entry.analysis || !entry.analysis.risk_level || entry.analysis.triggers?.length === 0) {
                    // Regenerate with enhanced analysis
                    return {
                        ...entry,
                        id: entry.id || Date.now().toString(),
                        created_at: entry.date || entry.created_at || new Date().toISOString(),
                        analysis: generateAnalysisForEntry(entry.text || '')
                    };
                }
                
                // Keep existing enhanced analysis
                return {
                    ...entry,
                    id: entry.id || Date.now().toString(),
                    created_at: entry.date || entry.created_at || new Date().toISOString()
                };
            });
            
            // Sort by date, newest first
            journalEntries.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        } else {
            // No saved entries, use empty array
            journalEntries = [];
        }
    } catch (error) {
        console.error('Error loading entries:', error);
        journalEntries = [];
    }
    
    // Render entries
    loadingState.classList.add('hidden');
    dashboardContent.classList.remove('hidden');
    renderEntries();
}

// Generate analysis for entries that don't have it
function generateAnalysisForEntry(content) {
    // Use the same enhanced analysis function as the dashboard
    if (window.generateEnhancedAnalysis) {
        try {
            // Get all previous entries for context
            const allEntries = journalEntries.map(e => e.text).filter(Boolean);
            
            // Generate the same enhanced analysis as the dashboard
            const enhancedAnalysis = window.generateEnhancedAnalysis(content, allEntries);
            
            // Ensure all required fields exist
            return {
                patterns: enhancedAnalysis.patterns || [],
                triggers: enhancedAnalysis.triggers || [],
                warnings: enhancedAnalysis.warnings || [],
                grounding_techniques: enhancedAnalysis.grounding_techniques || [],
                coping_strategies: enhancedAnalysis.coping_strategies || [],
                risk_level: enhancedAnalysis.risk_level || 'low'
            };
        } catch (error) {
            console.error('Error generating enhanced analysis:', error);
        }
    }
    
    // Fallback to the original simple analysis if enhanced function isn't available
    return generateFallbackAnalysis(content);
}

// Fallback analysis (original simple version)
function generateFallbackAnalysis(content) {
    const hasStressWords = /stress|overwhelm|anxious|worr|pressure/i.test(content);
    const hasPositiveWords = /good|great|happy|joy|grateful|thankful|peace/i.test(content);
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
    
    if (content.toLowerCase().includes('deadline')) {
        triggers.push({
            word: "deadline",
            context: "Associated with time pressure and stress",
            intensity: "high"
        });
    }
    
    // Warnings
    if (hasStressWords) {
        warnings.push({
            level: "medium",
            message: "Stress indicators present",
            reasoning: "Multiple stress-related words detected"
        });
    }
    
    // Grounding techniques
    grounding_techniques.push({
        name: "5-4-3-2-1 Sensory Grounding",
        description: "This technique helps bring you into the present moment by focusing on your five senses.",
        steps: []
    });
    
    grounding_techniques.push({
        name: "Deep Breathing",
        description: "Simple breathing exercise to calm the nervous system.",
        steps: []
    });
    
    // Coping strategies
    if (hasStressWords) {
        coping_strategies.push({
            title: "Scheduled Worry Time",
            description: "Designate a specific time each day to process worries.",
            when_to_use: "When worries accumulate throughout the day"
        });
    }
    
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
        risk_level: 'low' // Default risk level for fallback
    };
}

// Set up event listeners
function setupEventListeners() {
    cancelBtn.addEventListener('click', closeDeleteDialog);
    confirmDeleteBtn.addEventListener('click', handleDeleteConfirm);
    
    // Close dialog when clicking outside
    alertDialog.addEventListener('click', (e) => {
        if (e.target === alertDialog) {
            closeDeleteDialog();
        }
    });
    
    // Close dialog with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !alertDialog.classList.contains('hidden')) {
            closeDeleteDialog();
        }
    });
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Get intensity color class
function getIntensityColor(intensity) {
    switch (intensity) {
        case 'high': return 'text-warning';
        case 'medium': return 'text-warning-70';
        default: return 'text-muted-foreground';
    }
}

// Get warning color class
function getWarningColor(level) {
    switch (level) {
        case 'high': return 'warning-high';
        case 'medium': return 'warning-medium';
        default: return 'warning-low';
    }
}

// Render all entries
function renderEntries() {
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
    document.querySelectorAll('.entry-header').forEach(header => {
        header.addEventListener('click', (e) => {
            if (!e.target.closest('.btn-icon')) {
                const entryId = header.dataset.entryId;
                toggleEntry(entryId);
            }
        });
    });
}

// Render a single entry
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

// Render entry content
function renderEntryContent(entry) {
    if (!entry.analysis) {
        entry.analysis = generateAnalysisForEntry(entry.text || '');
    }

    return `
        <div class="full-entry">
            <h4>Full Entry</h4>
            <p>${entry.text || 'No content'}</p>
        </div>
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

// Render patterns section
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
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Render triggers section
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
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Add risk summary to entry content if available
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

// Add helper functions for risk display
function getRiskColor(riskLevel) {
    switch (riskLevel) {
        case 'critical': return 'var(--risk-high)';
        case 'high': return 'var(--risk-high)';
        case 'medium': return 'var(--risk-medium)';
        case 'low': return 'var(--risk-low)';
        default: return 'var(--muted-foreground)';
    }
}

function getRiskPercent(riskLevel) {
    switch (riskLevel) {
        case 'critical': return 95;
        case 'high': return 75;
        case 'medium': return 50;
        case 'low': return 25;
        default: return 10;
    }
}

function getRiskIcon(riskLevel) {
    switch (riskLevel) {
        case 'critical':
        case 'high': return 'exclamation-triangle';
        case 'medium': return 'exclamation-circle';
        case 'low': return 'check-circle';
        default: return 'info-circle';
    }
}

// Render grounding techniques
function renderGrounding(grounding) {
    if (!grounding || grounding.length === 0) return '';
    
    return `
        <div class="analysis-card">
            <div class="analysis-card-header">
                <div class="analysis-card-title">
                    <i class="fas fa-heart text-primary"></i>
                    Grounding
                </div>
            </div>
            <div class="analysis-card-content space-y-3">
                ${grounding.map((technique, idx) => `
                    <div class="space-y-1">
                        <h5 class="font-semibold text-sm text-foreground">${technique.name}</h5>
                        <p class="text-xs text-muted-foreground">${technique.description}</p>
                        ${idx < grounding.length - 1 ? '<div class="separator"></div>' : ''}
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Render coping strategies
function renderCoping(coping) {
    if (!coping || coping.length === 0) return '';
    
    return `
        <div class="analysis-card">
            <div class="analysis-card-header">
                <div class="analysis-card-title">
                    <i class="fas fa-lightbulb text-primary"></i>
                    Coping
                </div>
            </div>
            <div class="analysis-card-content space-y-3">
                ${coping.map((strategy, idx) => `
                    <div class="space-y-1">
                        <h5 class="font-semibold text-sm text-foreground">${strategy.title}</h5>
                        <p class="text-xs text-muted-foreground">${strategy.description}</p>
                        ${idx < coping.length - 1 ? '<div class="separator"></div>' : ''}
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Render warnings section
function renderWarnings(warnings) {
    if (!warnings || warnings.length === 0) return '';
    
    return `
        <div class="analysis-card">
            <div class="analysis-card-header">
                <div class="analysis-card-title">
                    <i class="fas fa-exclamation-triangle text-warning"></i>
                    Early Warnings
                </div>
            </div>
            <div class="analysis-card-content space-y-2">
                ${warnings.map((warning, idx) => `
                    <div class="warning-card ${getWarningColor(warning.level)}">
                        <div class="flex items-start justify-between mb-1">
                            <p class="font-medium text-sm text-foreground">${warning.message}</p>
                            <span class="badge badge-outline ml-2 text-xs">${warning.level}</span>
                        </div>
                        <p class="text-xs text-muted-foreground">${warning.reasoning}</p>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Toggle entry expansion
function toggleEntry(entryId) {
    if (expandedEntryId === entryId) {
        expandedEntryId = null;
    } else {
        expandedEntryId = entryId;
    }
    renderEntries();
}

// Open delete confirmation dialog
function openDeleteDialog(entryId, event) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }
    entryToDelete = entryId;
    alertDialog.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

// Close delete dialog
function closeDeleteDialog() {
    alertDialog.classList.add('hidden');
    document.body.style.overflow = 'auto';
    entryToDelete = null;
}

// Handle delete confirmation
function handleDeleteConfirm() {
    if (!entryToDelete || isDeleting) return;
    
    isDeleting = true;
    confirmDeleteBtn.textContent = "Deleting...";
    confirmDeleteBtn.classList.add('disabled');
    
    // Remove entry from array
    const entryIndex = journalEntries.findIndex(entry => entry.id === entryToDelete);
    if (entryIndex !== -1) {
        journalEntries.splice(entryIndex, 1);
        
        // Save to localStorage
        saveEntriesToStorage();
        
        // Reset expanded entry if it was deleted
        if (expandedEntryId === entryToDelete) {
            expandedEntryId = null;
        }
        
        // Re-render entries
        renderEntries();
        
        // Show success toast
        showToast({
            title: "Entry deleted",
            description: "Your journal entry has been permanently deleted.",
            type: "success"
        });
    }
    
    // Reset state
    isDeleting = false;
    closeDeleteDialog();
    confirmDeleteBtn.textContent = "Delete";
    confirmDeleteBtn.classList.remove('disabled');
}

// Save entries to localStorage
function saveEntriesToStorage() {
    try {
        localStorage.setItem('journalEntries', JSON.stringify(journalEntries));
    } catch (error) {
        console.error('Error saving entries:', error);
        showToast({
            title: "Error",
            description: "Could not save changes. Please try again.",
            type: "destructive"
        });
    }
}

// Make functions available globally
window.toggleEntry = toggleEntry;
window.openDeleteDialog = openDeleteDialog;
window.closeDeleteDialog = closeDeleteDialog;

// History page specific sign out
function signOut() {
    showToast({
        title: "Signing out...",
        description: "You will be redirected to the login page.",
        type: "success"
    });
    
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 1000);
}