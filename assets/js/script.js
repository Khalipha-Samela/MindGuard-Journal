// DOM elements with null checks
let loadingState, dashboardContent, analysisLoading, analysisEmpty, analysisContent;
let journalText, wordCount, analyzeBtn, clearBtn;

// Initialize DOM elements after DOM is loaded
function initializeDOMElements() {
    loadingState = document.getElementById('loading-state');
    dashboardContent = document.getElementById('dashboard-content');
    analysisLoading = document.getElementById('analysis-loading');
    analysisEmpty = document.getElementById('analysis-empty');
    analysisContent = document.getElementById('analysis-content');
    journalText = document.getElementById('journal-text');
    wordCount = document.getElementById('word-count');
    analyzeBtn = document.getElementById('analyze-btn');
    clearBtn = document.getElementById('clear-btn');
}

// Global Supabase client reference
let supabaseClient = null;

// Get Supabase client
function getSupabaseClient() {
    if (supabaseClient) return supabaseClient;
    
    // Try to get from various possible sources
    if (window.supabase) {
        supabaseClient = window.supabase;
    } else if (typeof window.getSupabaseClient === 'function') {
        supabaseClient = window.getSupabaseClient();
    } else if (window.supabaseClient && typeof window.supabaseClient.auth === 'object') {
        supabaseClient = window.supabaseClient;
    }
    
    return supabaseClient;
}

// Simulate initial loading state
window.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM loaded, initializing...');
    
    // Initialize DOM elements
    initializeDOMElements();
    
    // Wait for supabase to be available
    const maxAttempts = 10;
    let attempts = 0;
    
    const waitForSupabase = async () => {
        const supabase = getSupabaseClient();
        
        if (!supabase && attempts < maxAttempts) {
            attempts++;
            console.log(`Supabase not available yet (attempt ${attempts}/${maxAttempts}), waiting...`);
            setTimeout(waitForSupabase, 500);
            return;
        }
        
        if (!supabase) {
            console.error('Supabase not available after waiting');
            showToast({
                title: "Connection Error",
                description: "Unable to connect to service. Please refresh.",
                type: "destructive"
            });
            return;
        }
        
        try {
            console.log('Supabase available, checking session...');
            const { data: { session }, error } = await supabase.auth.getSession();

            if (error) {
                console.error('Session error:', error);
                throw error;
            }

            if (!session) {
                console.log('No session, redirecting to login');
                window.location.replace('login.html');
                return;
            }

            console.log('User authenticated:', session.user.email);
            
            // User authenticated → show loader
            if (loadingState) loadingState.style.display = 'flex';
            if (dashboardContent) dashboardContent.style.display = 'none';

            // Simulate loading / init app
            setTimeout(() => {
                if (loadingState) loadingState.style.display = 'none';
                if (dashboardContent) dashboardContent.style.display = 'block';

                // Show page AFTER auth + init
                document.body.style.visibility = 'visible';

                // Initialize event listeners
                initializeEventListeners();
                
                updateWordCount();
            }, 800);

        } catch (err) {
            console.error('Auth check error:', err);
            showToast({
                title: "Authentication Error",
                description: "Please log in again.",
                type: "destructive"
            });
            setTimeout(() => {
                window.location.replace('login.html');
            }, 2000);
        }
    };
    
    waitForSupabase();
});

// Initialize event listeners
function initializeEventListeners() {
    if (journalText) {
        journalText.addEventListener('input', updateWordCount);
    }
    
    if (analyzeBtn) {
        analyzeBtn.addEventListener('click', analyzeJournal);
    }
    
    if (clearBtn) {
        clearBtn.addEventListener('click', clearJournalEntry);
    }
    
    // Add global event listeners
    document.addEventListener('click', function(e) {
        // Handle toast close buttons
        if (e.target.closest('.toast-close')) {
            const toast = e.target.closest('.toast');
            if (toast) {
                toast.remove();
            }
        }
        
        // Handle analyze another button if it exists
        if (e.target.closest('#analyze-another-btn')) {
            analyzeAnother();
        }
        
        // Handle save to history button if it exists
        if (e.target.closest('#save-history-btn')) {
            saveToHistory();
        }
    });
}

// Word count functionality
function updateWordCount() {
    if (!journalText || !wordCount) return;
    
    const text = journalText.value.trim();
    const words = text ? text.split(/\s+/).filter(word => word.length > 0).length : 0;
    wordCount.textContent = words;
    
    // Disable analyze button if no text
    if (analyzeBtn) {
        analyzeBtn.disabled = words === 0;
        analyzeBtn.classList.toggle('opacity-50', words === 0);
        analyzeBtn.classList.toggle('cursor-not-allowed', words === 0);
    }
}

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

// 1. Detect Recurring Patterns
function detectRecurringPatterns(content, allEntries = []) {
    const patterns = [];
    const lowerContent = content.toLowerCase();
    
    // Helper to get text from entry
    const getEntryText = (entry) => {
        if (typeof entry === 'string') return entry.toLowerCase();
        if (entry && typeof entry === 'object') {
            if (entry.text) return entry.text.toLowerCase();
            if (entry.content) return entry.content.toLowerCase();
        }
        return '';
    };
    
    // Work-related stress pattern
    const workKeywords = ['work', 'job', 'boss', 'colleague', 'office', 'project', 'deadline', 'meeting'];
    const workCount = workKeywords.filter(word => lowerContent.includes(word)).length;
    if (workCount > 1) {
        const frequency = workCount > 3 ? "Weekly Pattern" : "Occasional Pattern";
        patterns.push({
            theme: "Work-related Stress",
            frequency: frequency,
            description: "Recurring mentions of work-related topics across entries",
            confidence: workCount > 2 ? "High" : "Medium",
            trend: calculateTrend(allEntries, workKeywords, getEntryText)
        });
    }
    
    // Social anxiety pattern
    const socialKeywords = ['people', 'social', 'meeting', 'talk', 'conversation', 'interact', 'avoid'];
    const socialCount = socialKeywords.filter(word => lowerContent.includes(word)).length;
    if (socialCount > 0) {
        patterns.push({
            theme: "Social Interactions",
            frequency: "Regular Pattern",
            description: "Consistent mentions of social situations and interpersonal dynamics",
            confidence: socialCount > 1 ? "Medium" : "Low",
            trend: calculateTrend(allEntries, socialKeywords, getEntryText)
        });
    }
    
    // Sleep pattern
    const sleepKeywords = ['sleep', 'tired', 'exhausted', 'rest', 'insomnia', 'fatigue', 'awake'];
    const sleepCount = sleepKeywords.filter(word => lowerContent.includes(word)).length;
    if (sleepCount > 0) {
        patterns.push({
            theme: "Sleep Disturbances",
            frequency: "Daily Pattern",
            description: "Regular mentions of sleep issues and fatigue",
            confidence: sleepCount > 1 ? "High" : "Medium",
            trend: calculateTrend(allEntries, sleepKeywords, getEntryText)
        });
    }
    
    // Emotional state pattern
    const emotionalKeywords = ['sad', 'angry', 'frustrated', 'overwhelmed', 'stressed', 'anxious', 'depressed'];
    const emotionalCount = emotionalKeywords.filter(word => lowerContent.includes(word)).length;
    if (emotionalCount > 0) {
        patterns.push({
            theme: "Emotional Dysregulation",
            frequency: "Episodic Pattern",
            description: "Pattern of emotional fluctuations and distress",
            confidence: emotionalCount > 2 ? "High" : "Medium",
            trend: calculateTrend(allEntries, emotionalKeywords, getEntryText)
        });
    }
    
    // Self-worth pattern
    const worthKeywords = ['worthless', 'failure', 'stupid', 'useless', 'inadequate', 'not good enough'];
    const worthCount = worthKeywords.filter(word => lowerContent.includes(word)).length;
    if (worthCount > 0) {
        patterns.push({
            theme: "Self-Worth Concerns",
            frequency: "Recurring Pattern",
            description: "Patterns of negative self-talk and self-criticism",
            confidence: worthCount > 1 ? "High" : "Medium",
            trend: "Stable"
        });
    }
    
    return patterns;
}

// 2. Detect Trauma Triggers with Intensity Levels
function detectTraumaTriggers(content) {
    const triggers = [];
    const lowerContent = content.toLowerCase();
    
    // Define trigger categories with intensity levels
    const triggerPatterns = [
        {
            words: ['deadline', 'urgent', 'rush', 'pressure', 'overwhelm', 'too much'],
            intensity: 'high',
            type: 'performance_pressure',
            description: 'Time-based pressure and overwhelming demands'
        },
        {
            words: ['conflict', 'argument', 'fight', 'yell', 'angry', 'scream', 'shout'],
            intensity: 'high',
            type: 'interpersonal_conflict',
            description: 'Conflict-related triggers and confrontation'
        },
        {
            words: ['alone', 'isolated', 'lonely', 'abandoned', 'left', 'ignored'],
            intensity: 'medium',
            type: 'abandonment',
            description: 'Isolation or abandonment triggers'
        },
        {
            words: ['criticize', 'judge', 'blame', 'fail', 'mistake', 'wrong', 'error'],
            intensity: 'medium',
            type: 'criticism',
            description: 'Criticism or failure-related triggers'
        },
        {
            words: ['meeting', 'presentation', 'speak', 'talk', 'social', 'crowd', 'people'],
            intensity: 'medium',
            type: 'social_anxiety',
            description: 'Social interaction and performance triggers'
        },
        {
            words: ['memory', 'remember', 'past', 'flashback', 'dream', 'nightmare'],
            intensity: 'high',
            type: 'memory_trigger',
            description: 'Trauma memory activation triggers'
        },
        {
            words: ['touch', 'hug', 'close', 'physical', 'contact', 'proximity'],
            intensity: 'medium',
            type: 'physical_boundaries',
            description: 'Physical boundary and touch-related triggers'
        }
    ];
    
    triggerPatterns.forEach(pattern => {
        const foundWord = pattern.words.find(word => lowerContent.includes(word));
        if (foundWord) {
            triggers.push({
                word: foundWord,
                category: pattern.type,
                intensity: pattern.intensity,
                description: pattern.description,
                context: `Found in context: "${getContextAroundWord(content, foundWord, 30)}"`,
                suggested_approach: getTriggerApproach(pattern.intensity),
                category_icon: getCategoryIcon(pattern.type)
            });
        }
    });
    
    return triggers;
}

// 3. Generate Early Warning Predictions
function generateEarlyWarnings(content, patterns, triggers) {
    const warnings = [];
    const lowerContent = content.toLowerCase();
    
    // Check for escalation patterns
    const emotionalWords = ['overwhelm', 'cant', 'stop', 'anxious', 'panic', 'breakdown', 'lose'];
    const emotionalCount = emotionalWords.filter(word => lowerContent.includes(word)).length;
    
    if (emotionalCount >= 3) {
        warnings.push({
            level: "high",
            message: "Heightened Emotional State Detected",
            reasoning: `Multiple emotional distress indicators found (${emotionalCount} strong signals)`,
            predicted_risk: "Potential for emotional escalation in next 24-48 hours",
            suggested_action: "Consider reaching out to support system or using grounding techniques immediately"
        });
    }
    
    // Check for trigger accumulation
    const highTriggers = triggers.filter(t => t.intensity === 'high').length;
    if (highTriggers >= 2) {
        warnings.push({
            level: "high",
            message: "Multiple High-Intensity Triggers Present",
            reasoning: `${highTriggers} high-intensity trauma triggers detected in single entry`,
            predicted_risk: "Increased vulnerability to trauma response and flashbacks",
            suggested_action: "Implement safety plan, use grounding techniques, and consider contacting support"
        });
    }
    
    // Check for cognitive patterns
    const cognitiveWords = ['confused', 'forget', 'foggy', 'disconnect', 'numb', 'detached', 'space'];
    const cognitiveCount = cognitiveWords.filter(word => lowerContent.includes(word)).length;
    
    if (cognitiveCount >= 2) {
        warnings.push({
            level: "medium",
            message: "Cognitive Disruption Indicators",
            reasoning: `${cognitiveCount} signs of dissociation or cognitive disruption detected`,
            predicted_risk: "Potential for decreased functioning and memory issues",
            suggested_action: "Practice grounding techniques, maintain routine, and monitor symptoms"
        });
    }
    
    // Pattern escalation warning
    const increasingPatterns = patterns.filter(p => p.trend === "Increasing");
    if (increasingPatterns.length > 0) {
        warnings.push({
            level: "medium",
            message: "Pattern Escalation Detected",
            reasoning: `${increasingPatterns.length} recurring patterns showing increasing frequency`,
            predicted_risk: "Patterns may intensify without intervention over next week",
            suggested_action: "Consider pattern interruption strategies and increase self-care"
        });
    }
    
    // Sleep disruption warning
    const sleepWords = ['sleep', 'insomnia', 'awake', 'tired', 'exhausted'];
    const sleepCount = sleepWords.filter(word => lowerContent.includes(word)).length;
    if (sleepCount >= 3) {
        warnings.push({
            level: "medium",
            message: "Severe Sleep Disruption",
            reasoning: "Multiple mentions of sleep issues indicating potential sleep deprivation",
            predicted_risk: "Increased emotional vulnerability and cognitive impairment",
            suggested_action: "Prioritize sleep hygiene and consider relaxation techniques before bed"
        });
    }
    
    // Social withdrawal warning
    if (lowerContent.includes('alone') && lowerContent.includes('people') && 
        (lowerContent.includes('avoid') || lowerContent.includes('dont want'))) {
        warnings.push({
            level: "medium",
            message: "Social Withdrawal Pattern",
            reasoning: "Combination of isolation mentions and avoidance language",
            predicted_risk: "Potential for increased isolation and depression",
            suggested_action: "Schedule small social interactions and reach out to trusted contacts"
        });
    }
    
    return warnings;
}

// 4. Generate Grounding Techniques with Step-by-Step Instructions
function generateGroundingTechniques(content, triggers) {
    const techniques = [];
    const lowerContent = content.toLowerCase();
    
    // Basic techniques always available
    techniques.push({
        name: "5-4-3-2-1 Sensory Grounding",
        description: "Engage all five senses to bring awareness to the present moment",
        steps: [
            "Look around and name 5 things you can see",
            "Notice 4 things you can feel or touch",
            "Listen for 3 things you can hear",
            "Identify 2 things you can smell",
            "Notice 1 thing you can taste"
        ],
        when_to_use: "When feeling disconnected, anxious, or overwhelmed",
        duration: "3-5 minutes",
        effectiveness: "High for immediate anxiety reduction",
        icon: "fas fa-hand-sparkles"
    });
    
    techniques.push({
        name: "Box Breathing (4-4-4-4)",
        description: "Regulate nervous system through controlled breathing",
        steps: [
            "Find a comfortable seated position",
            "Inhale slowly through your nose for 4 seconds",
            "Hold your breath for 4 seconds",
            "Exhale slowly through your mouth for 4 seconds",
            "Hold empty lungs for 4 seconds",
            "Repeat for 5 cycles"
        ],
        when_to_use: "When experiencing physical anxiety symptoms or panic",
        duration: "2-3 minutes",
        effectiveness: "High for physiological calming",
        icon: "fas fa-wind"
    });
    
    // Add techniques based on content
    if (triggers.some(t => t.category === 'social_anxiety')) {
        techniques.push({
            name: "Safe Place Visualization",
            description: "Create a mental safe space for emotional regulation",
            steps: [
                "Close your eyes and imagine a place where you feel completely safe",
                "Notice all the details: colors, sounds, smells, textures",
                "Place yourself in this space and feel the safety surround you",
                "Take 5 deep breaths while maintaining this visualization",
                "When ready, slowly bring awareness back to present"
            ],
            when_to_use: "Before or after social interactions, or when feeling unsafe",
            duration: "5-10 minutes",
            effectiveness: "Medium-High for emotional regulation",
            icon: "fas fa-umbrella-beach"
        });
    }
    
    if (lowerContent.includes('overwhelm') || lowerContent.includes('too much')) {
        techniques.push({
            name: "Progressive Muscle Relaxation",
            description: "Systematically tense and relax muscle groups to release tension",
            steps: [
                "Start at your feet, tense muscles for 5 seconds",
                "Release and notice the difference for 10 seconds",
                "Move up to calves, tense and release",
                "Continue through thighs, abdomen, chest, arms",
                "Finish with face and scalp muscles"
            ],
            when_to_use: "When feeling overwhelmed or disconnected from body",
            duration: "7-10 minutes",
            effectiveness: "High for physical tension release",
            icon: "fas fa-spa"
        });
    }
    
    if (triggers.some(t => t.category === 'memory_trigger')) {
        techniques.push({
            name: "Container Exercise",
            description: "Safely contain difficult memories or emotions",
            steps: [
                "Imagine a strong, secure container with a lid",
                "Visualize placing difficult feelings/memories inside",
                "Secure the container with multiple locks",
                "Place container in a safe location",
                "Remind yourself you can open it when ready"
            ],
            when_to_use: "When feeling flooded by memories or emotions",
            duration: "5-7 minutes",
            effectiveness: "High for emotional containment",
            icon: "fas fa-box"
        });
    }
    
    return techniques;
}

// 5. Generate Personalized Coping Strategies
function generateCopingStrategies(content, patterns, triggers) {
    const strategies = [];
    const lowerContent = content.toLowerCase();
    
    // Always include basic strategies
    strategies.push({
        title: "Structured Journaling Practice",
        description: "Use specific prompts to process emotions systematically and build emotional awareness",
        steps: [
            "Morning: Write 3 things you're grateful for or looking forward to",
            "Afternoon: Check in with your emotional state using a 1-10 scale",
            "Evening: Reflect on one challenge and one success from the day",
            "Weekly: Review patterns and progress in your journal entries"
        ],
        when_to_use: "Daily for emotional regulation and pattern awareness",
        effectiveness: "Builds emotional intelligence over time",
        personalization: "Based on your consistent journaling practice"
    });
    
    strategies.push({
        title: "Trigger Response Plan",
        description: "Pre-planned response protocol for when encountering known triggers",
        steps: [
            "Identify your top 3 triggers from today's analysis",
            "Create a specific 3-step response for each trigger",
            "Practice responses during calm moments this week",
            "Implement immediately when trigger occurs",
            "Debrief in journal after trigger response"
        ],
        when_to_use: "When facing known trauma triggers or anticipatory anxiety",
        effectiveness: "Reduces trauma response intensity and duration",
        personalization: "Customized to your specific trigger profile"
    });
    
    // Pattern-specific strategies
    const hasWorkPattern = patterns.some(p => p.theme.includes('Work'));
    if (hasWorkPattern) {
        strategies.push({
            title: "Work Stress Boundary System",
            description: "Create clear, consistent boundaries between work and personal life",
            steps: [
                "Define specific work hours and stick to them consistently",
                "Create a physical 'end of work' ritual (close laptop, change clothes)",
                "Use separate devices or accounts for work if possible",
                "Practice saying 'no' to non-essential tasks politely but firmly",
                "Schedule regular breaks every 90 minutes"
            ],
            when_to_use: "When work stress spills into personal time or causes burnout",
            effectiveness: "Prevents burnout and maintains work-life balance",
            personalization: "Targets your specific work-related stress pattern"
        });
    }
    
    const hasHighTriggers = triggers.some(t => t.intensity === 'high');
    if (hasHighTriggers) {
        strategies.push({
            title: "Safety First Protocol",
            description: "Immediate steps for high-intensity trigger situations to prevent trauma escalation",
            steps: [
                "Step 1: Remove yourself from triggering situation immediately if possible",
                "Step 2: Use grounding technique for 5 minutes",
                "Step 3: Contact support person or helpline if needed",
                "Step 4: Implement self-care protocol (water, comfortable space)",
                "Step 5: Process experience in journal when calm",
                "Step 6: Debrief with therapist or support system within 24 hours"
            ],
            when_to_use: "During or immediately after high-intensity trigger exposure",
            effectiveness: "Critical for trauma prevention and emotional safety",
            personalization: "Based on your specific high-intensity trigger profile"
        });
    }
    
    const hasSleepPattern = patterns.some(p => p.theme.includes('Sleep'));
    if (hasSleepPattern) {
        strategies.push({
            title: "Sleep Hygiene Protocol",
            description: "Structured approach to improve sleep quality and establish healthy patterns",
            steps: [
                "Consistent bedtime and wake time (±30 minutes)",
                "Screen-free 1 hour before bed (use blue light filters)",
                "Relaxing bedtime routine (reading, gentle stretching)",
                "Cool, dark, quiet sleep environment",
                "Journal to process day's thoughts 1 hour before bed",
                "Avoid caffeine after 2 PM and heavy meals before bed"
            ],
            when_to_use: "Daily, especially when sleep disturbances are noted",
            effectiveness: "Improves sleep quality and consistency over 2-3 weeks",
            personalization: "Addresses your specific sleep disturbance pattern"
        });
    }
    
    const hasSocialPattern = patterns.some(p => p.theme.includes('Social'));
    if (hasSocialPattern) {
        strategies.push({
            title: "Social Exposure Hierarchy",
            description: "Gradual exposure to social situations to build confidence and reduce anxiety",
            steps: [
                "Create hierarchy from least to most anxiety-provoking social situations",
                "Start with level 1 (e.g., brief eye contact) for 5 minutes daily",
                "Practice coping skills before, during, and after exposure",
                "Gradually progress to next level when comfortable",
                "Reward yourself after each successful exposure"
            ],
            when_to_use: "When preparing for social situations or building social confidence",
            effectiveness: "Reduces social anxiety through gradual exposure",
            personalization: "Based on your specific social interaction patterns"
        });
    }
    
    return strategies;
}

// Helper functions
function calculateRiskLevel(content, triggers, warnings) {
    let riskScore = 0;
    
    // Add points for high-intensity triggers
    riskScore += triggers.filter(t => t.intensity === 'high').length * 3;
    riskScore += triggers.filter(t => t.intensity === 'medium').length * 2;
    riskScore += triggers.filter(t => t.intensity === 'low').length;
    
    // Add points for high-level warnings
    riskScore += warnings.filter(w => w.level === 'high').length * 4;
    riskScore += warnings.filter(w => w.level === 'medium').length * 2;
    
    // Content-based risk indicators
    const criticalWords = ['suicide', 'self-harm', 'end it', 'cant take it', 'kill myself'];
    const urgentWords = ['emergency', 'help now', 'cant breathe', 'panic attack', 'losing control'];
    
    const lowerContent = content.toLowerCase();
    
    if (criticalWords.some(word => lowerContent.includes(word))) {
        riskScore += 15; // Critical risk
    } else if (urgentWords.some(word => lowerContent.includes(word))) {
        riskScore += 10; // Urgent risk
    }
    
    // Emotional intensity scoring
    const strongEmotionWords = ['overwhelm', 'drowning', 'suffocating', 'breaking', 'falling apart'];
    riskScore += strongEmotionWords.filter(word => lowerContent.includes(word)).length * 2;
    
    if (riskScore >= 12) return 'critical';
    if (riskScore >= 8) return 'high';
    if (riskScore >= 4) return 'medium';
    return 'low';
}

function getContextAroundWord(content, word, charCount) {
    const lowerContent = content.toLowerCase();
    const lowerWord = word.toLowerCase();
    const index = lowerContent.indexOf(lowerWord);
    
    if (index === -1) return "";
    
    const start = Math.max(0, index - charCount);
    const end = Math.min(content.length, index + word.length + charCount);
    
    let context = content.substring(start, end);
    
    // Return plain text context (HTML version handled in display function)
    return context;
}

function getTriggerApproach(intensity) {
    const approaches = {
        high: "Immediate grounding and consider contacting support person",
        medium: "Use coping strategies, monitor response, and practice self-care",
        low: "Maintain awareness and use gentle processing techniques"
    };
    return approaches[intensity] || approaches.low;
}

function getCategoryIcon(category) {
    const icons = {
        performance_pressure: "fas fa-clock",
        interpersonal_conflict: "fas fa-users",
        abandonment: "fas fa-user-slash",
        criticism: "fas fa-comment-exclamation",
        social_anxiety: "fas fa-comments",
        memory_trigger: "fas fa-brain",
        physical_boundaries: "fas fa-hand-paper"
    };
    return icons[category] || "fas fa-exclamation-circle";
}

function calculateTrend(allEntries, keywords, getEntryText) {
    if (allEntries.length < 3) return "New Pattern";
    
    let recentCount = 0;
    let olderCount = 0;
    
    // Check recent entries (last 3)
    const recentEntries = allEntries.slice(0, Math.min(3, allEntries.length));
    recentEntries.forEach(entry => {
        const text = getEntryText(entry);
        if (keywords.some(keyword => text.includes(keyword))) {
            recentCount++;
        }
    });
    
    // Check older entries (previous 3)
    const olderEntries = allEntries.slice(3, Math.min(6, allEntries.length));
    olderEntries.forEach(entry => {
        const text = getEntryText(entry);
        if (keywords.some(keyword => text.includes(keyword))) {
            olderCount++;
        }
    });
    
    if (recentCount > olderCount) return "Increasing";
    if (recentCount < olderCount) return "Decreasing";
    return "Stable";
}

// Save journal entry with enhanced analysis
async function saveJournalEntry(text, analysis) {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            console.error('Supabase client not available');
            showToast({
                title: "Connection Error",
                description: "Unable to connect to service. Please try again.",
                type: "destructive"
            });
            return null;
        }
        
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            console.error('No user logged in:', userError);
            showToast({
                title: "Not Signed In",
                description: "Please sign in to save your journal entry.",
                type: "destructive"
            });
            return null;
        }
        
        const userId = user.id;
        const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
        
        const entryData = {
            content: text,
            word_count: wordCount,
            analysis: analysis,
            user_id: userId
        };

        console.log('Saving entry for user:', user.email);
        
        // Try to save to Supabase via journalService or direct API call
        let savedEntry = null;
        
        if (window.journalService && typeof window.journalService.saveJournalEntry === 'function') {
            savedEntry = await window.journalService.saveJournalEntry(entryData);
        } else {
            // Direct Supabase insert as fallback
            const { data, error } = await supabase
                .from('journal_entries')
                .insert([{
                    content: text,
                    word_count: wordCount,
                    analysis: analysis,
                    user_id: userId
                }])
                .select()
                .single();
                
            if (error) throw error;
            savedEntry = data;
        }
        
        if (savedEntry) {
            console.log('Saved to Supabase:', savedEntry);
            
            // Also save to user-specific localStorage for offline access
            const localStorageKey = `journalEntries_${userId}`;
            const savedEntries = localStorage.getItem(localStorageKey) || '[]';
            const entries = JSON.parse(savedEntries);
            
            const localEntry = {
                id: savedEntry.id || Date.now().toString(),
                text: text,
                content: text,
                created_at: savedEntry.created_at || new Date().toISOString(),
                date: savedEntry.created_at || new Date().toISOString(),
                word_count: wordCount,
                analysis: analysis,
                user_id: userId
            };
            
            entries.unshift(localEntry);
            localStorage.setItem(localStorageKey, JSON.stringify(entries.slice(0, 50)));
            console.log('Saved to localStorage for user:', user.email);
            
            return savedEntry;
        }

        return null;

    } catch (error) {
        console.error('Error saving journal entry:', error);
        showToast({
            title: "Save Error",
            description: "Could not save your entry. Please try again.",
            type: "destructive"
        });
        return null;
    }
}

// Analyze journal entry
async function analyzeJournal() {
    if (!journalText) return;
    
    const text = journalText.value.trim();
    if (!text) {
        showToast({
            title: "Empty Entry",
            description: "Please write something before analyzing.",
            type: "warning"
        });
        return;
    }
    
    const supabase = getSupabaseClient();
    if (!supabase) {
        showToast({
            title: "Connection Error",
            description: "Unable to connect to service. Please refresh.",
            type: "destructive"
        });
        return;
    }
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        showToast({
            title: "Error",
            description: "You must be logged in to analyze entries.",
            type: "destructive"
        });
        return;
    }
    
    // Get user-specific previous entries for pattern detection
    let previousEntries = [];
    const userId = user.id;
    
    if (window.journalService && typeof window.journalService.getAllEntries === 'function') {
        previousEntries = await window.journalService.getAllEntries();
    } else {
        // Fallback to localStorage with user prefix
        const localStorageKey = `journalEntries_${userId}`;
        const savedEntries = localStorage.getItem(localStorageKey) || '[]';
        previousEntries = JSON.parse(savedEntries);
        
        // Also try to get from Supabase directly
        try {
            const { data, error } = await supabase
                .from('journal_entries')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(20);
                
            if (!error && data) {
                previousEntries = [...data, ...previousEntries];
            }
        } catch (e) {
            console.warn('Could not fetch from Supabase:', e);
        }
    }
    
    const previousTexts = previousEntries.map(e => e.text || e.content || '').filter(Boolean);
    
    // Generate analysis
    const analysis = generateEnhancedAnalysis(text, previousTexts);
    
    // Save entry with analysis
    const savedEntry = await saveJournalEntry(text, analysis);

    if (!savedEntry) {
        showToast({
            title: "Save Error",
            description: "Could not save your entry. Please try again.",
            type: "destructive"
        });
        return;
    }

    // Show loading state for analysis
    if (analysisLoading) analysisLoading.style.display = 'block';
    if (analysisEmpty) analysisEmpty.style.display = 'none';
    if (analysisContent) analysisContent.style.display = 'none';
    
    // Disable analyze button during processing
    if (analyzeBtn) {
        analyzeBtn.disabled = true;
        analyzeBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Analyzing...';
    }
            
    // Simulate API call delay
    setTimeout(() => {
        // Show analysis content with updated data
        if (analysisLoading) analysisLoading.style.display = 'none';
        if (analysisContent) analysisContent.style.display = 'block';
                
        // Update the "Updated just now" text
        const updateText = document.querySelector('.analysis-header p');
        if (updateText) {
            const now = new Date();
            const timeString = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            updateText.textContent = `Based on your latest journal entry • Updated at ${timeString}`;
        }
                
        // Update analysis content with enhanced display
        updateAnalysisDisplay(analysis);
        
        // Re-enable analyze button
        if (analyzeBtn) {
            analyzeBtn.disabled = false;
            analyzeBtn.innerHTML = '<i class="fas fa-brain mr-2"></i>Analyze Entry';
        }
                
        // Show success message using toast
        showToast({ 
            title: "Analysis Complete", 
            description: "Your journal has been analyzed and saved.", 
            type: "success" 
        });
                
        // Smooth scroll to analysis section
        const analysisSection = document.getElementById('analysis-section');
        if (analysisSection) {
            analysisSection.scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
        }
    }, 1800);
}

function clearJournalEntry() {
    if (!journalText) return;
    
    if (journalText.value.trim() && !confirm('Clear the current entry?')) {
        return;
    }
    
    journalText.value = '';
    updateWordCount();
    
    if (analysisContent) analysisContent.style.display = 'none';
    if (analysisEmpty) analysisEmpty.style.display = 'block';
    
    // Use toast instead of notification
    showToast({
        title: "Entry Cleared",
        description: "Your current journal entry has been cleared.",
        type: "info"
    });
}

// Enhanced function to update all analysis components
function updateAnalysisDisplay(analysis) {
    if (!analysis) return;
    
    // Update Risk Summary
    updateRiskSummary(analysis.risk_level);
    
    // Update each component
    updatePatternsDisplay(analysis.patterns);
    updateTriggersDisplay(analysis.triggers);
    updateWarningsDisplay(analysis.warnings);
    updateGroundingDisplay(analysis.grounding_techniques);
    updateCopingDisplay(analysis.coping_strategies);
}

function updateRiskSummary(riskLevel) {
    const riskConfig = {
        critical: {
            percent: 95,
            color: '#dc2626',
            text: 'Critical Risk',
            desc: 'Immediate attention and support recommended',
            icon: 'fas fa-exclamation-triangle'
        },
        high: {
            percent: 75,
            color: '#f97316',
            text: 'High Risk',
            desc: 'Close monitoring and immediate coping strategies needed',
            icon: 'fas fa-exclamation-circle'
        },
        medium: {
            percent: 50,
            color: '#eab308',
            text: 'Medium Risk',
            desc: 'Monitor patterns and implement coping strategies',
            icon: 'fas fa-eye'
        },
        low: {
            percent: 25,
            color: '#10b981',
            text: 'Low Risk',
            desc: 'Maintain current coping strategies and self-care',
            icon: 'fas fa-check-circle'
        }
    };
    
    const config = riskConfig[riskLevel] || riskConfig.low;
    
    // Look for existing risk summary
    let riskSummary = document.getElementById('risk-summary');
    
    if (!riskSummary) {
        const analysisHeader = document.querySelector('.analysis-header');
        if (!analysisHeader) return;
        
        const riskHTML = `
            <div id="risk-summary" class="risk-summary-card">
                <div class="risk-level-display">
                    <div class="flex items-center justify-between mb-2">
                        <h4>Current Risk Assessment</h4>
                        <i class="${config.icon}" style="color: ${config.color}"></i>
                    </div>
                    <div class="risk-meter">
                        <div id="risk-meter-fill" class="risk-meter-fill" style="width: ${config.percent}%; background-color: ${config.color};"></div>
                    </div>
                    <div class="risk-info">
                        <span id="risk-level-text" class="risk-level" style="color: ${config.color}">${config.text}</span>
                        <span id="risk-description" class="risk-description">${config.desc}</span>
                    </div>
                </div>
            </div>
        `;
        
        analysisHeader.insertAdjacentHTML('afterend', riskHTML);
        riskSummary = document.getElementById('risk-summary');
    }
    
    // Update existing risk summary
    const riskMeter = document.getElementById('risk-meter-fill');
    const riskText = document.getElementById('risk-level-text');
    const riskDesc = document.getElementById('risk-description');
    
    if (riskMeter) {
        riskMeter.style.width = config.percent + '%';
        riskMeter.style.backgroundColor = config.color;
    }
    
    if (riskText) {
        riskText.textContent = config.text;
        riskText.style.color = config.color;
    }
    
    if (riskDesc) {
        riskDesc.textContent = config.desc;
    }
    
    // Update icon
    const icon = riskSummary.querySelector('i');
    if (icon) {
        icon.className = config.icon;
        icon.style.color = config.color;
    }
}

function updatePatternsDisplay(patterns) {
    const container = document.getElementById('patterns-container') || createAnalysisContainer('patterns');
    if (!container) return;
    
    if (!patterns || patterns.length === 0) {
        container.innerHTML = '<div class="empty-message">No recurring patterns detected in this entry</div>';
        return;
    }
    
    container.innerHTML = patterns.map((pattern, index) => `
        <div class="pattern-item">
            <div class="flex items-start justify-between mb-1">
                <h4 class="font-semibold text-foreground">${pattern.theme}</h4>
                <div class="flex items-center gap-2">
                    <span class="frequency-indicator">
                        <i class="fas fa-chart-bar mr-1"></i>${pattern.frequency}
                    </span>
                    <span class="badge ${pattern.confidence === 'High' ? 'badge-success' : pattern.confidence === 'Medium' ? 'badge-warning' : 'badge-secondary'}">
                        ${pattern.confidence}
                    </span>
                </div>
            </div>
            <p class="text-sm text-muted-foreground mb-2">${pattern.description}</p>
            <div class="trend-indicator">
                <i class="fas fa-${pattern.trend === 'Increasing' ? 'arrow-up trend-up' : pattern.trend === 'Decreasing' ? 'arrow-down trend-down' : 'minus trend-stable'} mr-1"></i>
                <span class="text-xs">${pattern.trend} trend detected</span>
            </div>
            ${index < patterns.length - 1 ? '<div class="separator mt-3"></div>' : ''}
        </div>
    `).join('');
}

function updateTriggersDisplay(triggers) {
    const container = document.getElementById('triggers-container') || createAnalysisContainer('triggers');
    if (!container) return;
    
    if (!triggers || triggers.length === 0) {
        container.innerHTML = '<div class="empty-message">No trauma triggers detected in this entry</div>';
        return;
    }
    
    container.innerHTML = triggers.map((trigger, index) => `
        <div class="trigger-item">
            <div class="flex items-start justify-between mb-1">
                <div class="flex items-center gap-2">
                    <i class="${trigger.category_icon} text-muted-foreground"></i>
                    <h4 class="font-semibold text-foreground">${trigger.word}</h4>
                </div>
                <span class="intensity-badge intensity-${trigger.intensity}">
                    ${trigger.intensity} intensity
                </span>
            </div>
            <p class="text-sm text-muted-foreground mb-2">${trigger.description}</p>
            <div class="context-display">
                ${trigger.context}
            </div>
            <p class="text-xs text-muted-foreground mt-2">
                <i class="fas fa-lightbulb mr-1"></i>
                <strong>Suggested approach:</strong> ${trigger.suggested_approach}
            </p>
            ${index < triggers.length - 1 ? '<div class="separator mt-3"></div>' : ''}
        </div>
    `).join('');
}

function updateWarningsDisplay(warnings) {
    const container = document.getElementById('warnings-container') || createAnalysisContainer('warnings');
    if (!container) return;
    
    if (!warnings || warnings.length === 0) {
        container.innerHTML = '<div class="empty-message">No immediate warnings detected. Continue monitoring your patterns.</div>';
        return;
    }
    
    container.innerHTML = warnings.map((warning, index) => `
        <div class="warning-item warning-${warning.level}">
            <div class="flex items-start justify-between mb-2">
                <h4 class="font-semibold text-foreground">${warning.message}</h4>
                <span class="badge ${warning.level === 'high' ? 'badge-destructive' : 'badge-warning'}">
                    ${warning.level} priority
                </span>
            </div>
            <p class="text-sm mb-2">${warning.reasoning}</p>
            <div class="bg-white bg-opacity-50 p-3 rounded">
                <p class="text-xs font-medium mb-1"><i class="fas fa-chart-line mr-1"></i>Predicted Risk:</p>
                <p class="text-xs mb-2 pl-4">${warning.predicted_risk}</p>
                <p class="text-xs font-medium mb-1"><i class="fas fa-hands-helping mr-1"></i>Suggested Action:</p>
                <p class="text-xs pl-4">${warning.suggested_action}</p>
            </div>
            ${index < warnings.length - 1 ? '<div class="separator mt-3"></div>' : ''}
        </div>
    `).join('');
}

function updateGroundingDisplay(grounding) {
    const container = document.getElementById('grounding-container') || createAnalysisContainer('grounding');
    if (!container) return;
    
    if (!grounding || grounding.length === 0) {
        container.innerHTML = '<div class="empty-message">No grounding techniques suggested</div>';
        return;
    }
    
    container.innerHTML = grounding.map((technique, index) => `
        <div class="grounding-item">
            <div class="flex items-start justify-between mb-2">
                <div class="flex items-center gap-2">
                    <i class="${technique.icon} text-primary"></i>
                    <h4 class="font-semibold text-foreground">${technique.name}</h4>
                </div>
                <div class="flex items-center gap-2">
                    <span class="text-xs text-muted-foreground">${technique.duration}</span>
                    <span class="badge badge-success text-xs">${technique.effectiveness}</span>
                </div>
            </div>
            <p class="text-sm text-muted-foreground mb-3">${technique.description}</p>
            <p class="text-xs font-medium mb-1"><i class="fas fa-clock mr-1"></i>When to use:</p>
            <p class="text-xs text-muted-foreground mb-3 pl-4">${technique.when_to_use}</p>
            <p class="text-xs font-medium mb-1"><i class="fas fa-list-ol mr-1"></i>Step-by-Step Instructions:</p>
            <ol class="step-list">
                ${technique.steps.map((step, stepIndex) => `
                    <li class="text-xs text-muted-foreground">${stepIndex + 1}. ${step}</li>
                `).join('')}
            </ol>
            ${index < grounding.length - 1 ? '<div class="separator mt-3"></div>' : ''}
        </div>
    `).join('');
}

function updateCopingDisplay(coping) {
    const container = document.getElementById('coping-container') || createAnalysisContainer('coping');
    if (!container) return;
    
    if (!coping || coping.length === 0) {
        container.innerHTML = '<div class="empty-message">No coping strategies suggested</div>';
        return;
    }
    
    container.innerHTML = coping.map((strategy, index) => `
        <div class="coping-item">
            <div class="flex items-start justify-between mb-2">
                <h4 class="font-semibold text-foreground">${strategy.title}</h4>
                <span class="badge badge-info text-xs">${strategy.effectiveness}</span>
            </div>
            <p class="text-sm text-muted-foreground mb-3">${strategy.description}</p>
            <p class="text-xs font-medium mb-1"><i class="fas fa-clock mr-1"></i>When to use:</p>
            <p class="text-xs text-muted-foreground mb-3 pl-4">${strategy.when_to_use}</p>
            <p class="text-xs font-medium mb-1"><i class="fas fa-list-ol mr-1"></i>Implementation Steps:</p>
            <ol class="step-list">
                ${strategy.steps.map((step, stepIndex) => `
                    <li class="text-xs text-muted-foreground">${stepIndex + 1}. ${step}</li>
                `).join('')}
            </ol>
            <p class="text-xs font-medium mt-3"><i class="fas fa-user-check mr-1"></i>Why this is personalized for you:</p>
            <p class="text-xs text-muted-foreground">${strategy.personalization}</p>
            ${index < coping.length - 1 ? '<div class="separator mt-3"></div>' : ''}
        </div>
    `).join('');
}

function createAnalysisContainer(type) {
    const cardSelectors = {
        patterns: '.pattern-card .analysis-card-content',
        triggers: '.trigger-card .analysis-card-content',
        warnings: '.warning-card .analysis-card-content',
        grounding: '.grounding-card .analysis-card-content',
        coping: '.coping-card .analysis-card-content'
    };
    
    const selector = cardSelectors[type];
    if (selector) {
        const container = document.querySelector(selector);
        if (container) return container;
    }
    
    // If card doesn't exist, create it in the analysis grid
    const analysisGrid = document.querySelector('.analysis-grid');
    if (!analysisGrid) return null;
    
    const cardTitles = {
        patterns: 'Recurring Patterns',
        triggers: 'Trauma Triggers',
        warnings: 'Early Warnings',
        grounding: 'Grounding Techniques',
        coping: 'Coping Strategies'
    };
    
    const cardHTML = `
        <div class="analysis-card ${type}-card">
            <div class="analysis-card-header">
                <div class="analysis-card-title">
                    <i class="fas fa-${getCardIcon(type)} text-primary"></i>
                    ${cardTitles[type]}
                </div>
            </div>
            <div class="analysis-card-content" id="${type}-container">
                <!-- Content will be populated -->
            </div>
        </div>
    `;
    
    analysisGrid.insertAdjacentHTML('beforeend', cardHTML);
    return document.getElementById(`${type}-container`);
}

function getCardIcon(type) {
    const icons = {
        patterns: 'chart-line',
        triggers: 'exclamation-circle',
        warnings: 'exclamation-triangle',
        grounding: 'heart',
        coping: 'lightbulb'
    };
    return icons[type] || 'chart-bar';
}

// Navigation functions
function navigateToHistory() {
    showToast({
        title: "Navigating to History",
        description: "Loading your journal history...",
        type: "info"
    });
    
    // Small delay to show toast, then redirect
    setTimeout(() => {
        window.location.href = 'history.html';
    }, 800);
}

async function signOut() {
    console.log('Sign out function called');
    
    try {
        // Show loading state immediately
        showToast({
            title: "Signing out...",
            description: "Please wait while we sign you out.",
            type: "info"
        });
        
        const supabase = getSupabaseClient();
        
        // Try to sign out from Supabase if available
        if (supabase && supabase.auth) {
            console.log('Attempting Supabase sign out');
            const { error } = await supabase.auth.signOut();
            if (error) {
                console.warn('Supabase sign out error:', error);
                // Continue with local sign out even if Supabase fails
            } else {
                console.log('Supabase sign out successful');
            }
        } else {
            console.log('Supabase not available, performing local sign out');
        }
        
        // Clear local storage for this user
        const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
        if (user) {
            localStorage.removeItem(`journalEntries_${user.id}`);
        }
        
        // Show success message
        showToast({
            title: "Signed out successfully",
            description: "Redirecting to login page...",
            type: "success"
        });
        
        // Redirect to login after a short delay
        setTimeout(() => {
            console.log('Redirecting to login.html');
            window.location.href = 'login.html';
        }, 1500);
        
    } catch (error) {
        console.error('Error during sign out:', error);
        
        // Show error but still redirect
        showToast({
            title: "Sign out incomplete",
            description: "There was an issue, but you're being redirected to login.",
            type: "warning"
        });
        
        // Still redirect even on error
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
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
    toast.className = `toast toast-${type}`;
    
    const typeIcons = {
        success: 'check-circle',
        warning: 'exclamation-triangle',
        destructive: 'times-circle',
        info: 'info-circle'
    };
    
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas fa-${typeIcons[type] || 'info-circle'} toast-icon"></i>
            <div class="toast-message">
                <div class="toast-title">${title}</div>
                <div class="toast-description">${description}</div>
            </div>
        </div>
        <button class="toast-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add to page
    document.body.appendChild(toast);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 300);
        }
    }, 5000);
}

// Save current analysis to history
function saveToHistory() {
    if (!journalText) return;
    
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
        title: "Saved to History",
        description: "Your journal entry has been saved to your history.",
        type: "success"
    });
}

// Clear analysis and prepare for another entry
function analyzeAnother() {
    // Clear the journal text
    if (journalText) {
        journalText.value = '';
    }
    updateWordCount();
    
    // Hide analysis content and show empty state
    if (analysisContent) analysisContent.style.display = 'none';
    if (analysisEmpty) analysisEmpty.style.display = 'block';
    
    // Scroll back to the journal editor
    const journalEditor = document.querySelector('.journal-editor-card');
    if (journalEditor) {
        journalEditor.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
    }
    
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
window.getSupabaseClient = getSupabaseClient;