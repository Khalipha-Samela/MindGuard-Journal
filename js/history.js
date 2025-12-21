// DOM elements
const loadingState = document.getElementById('loading-state');
const dashboardContent = document.getElementById('dashboard-content');
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
window.addEventListener('DOMContentLoaded', async () => {
    console.log('History page loading...');
    
    // Check if DOM elements are found
    console.log('Loading state element:', loadingState);
    console.log('Dashboard content element:', dashboardContent);
    
    // Wait for Supabase to be ready
    await waitForSupabase();
    
    // Check authentication
    try {
        // Get Supabase client
        const supabase = window.mindguardSupabase || window.supabaseClient || window.supabase;
        
        if (!supabase) {
            console.error('Supabase client not available');
            window.location.href = 'login.html';
            return;
        }
        
        console.log('Supabase client available, checking session...');
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
            console.error('Error getting session:', error);
            window.location.href = 'login.html';
            return;
        }
        
        if (!session) {
            console.log('No session found, redirecting to login');
            window.location.href = 'login.html';
            return;
        }
        
        console.log('User authenticated:', session.user.email);
        
        // Proceed with loading history
        if (loadingState) {
            loadingState.style.display = 'flex';
        }
        
        if (dashboardContent) {
            dashboardContent.style.display = 'none';
        }
        
        // Load entries from storage
        await loadEntriesFromStorage();
        
        // Set up event listeners
        setupEventListeners();
        
    } catch (error) {
        console.error('Auth check error:', error);
        window.location.href = 'login.html';
    }
});

// Wait for Supabase to be ready
function waitForSupabase() {
    return new Promise((resolve) => {
        // Check if already available
        const supabase = window.mindguardSupabase || window.supabaseClient || window.supabase;
        if (supabase && supabase.auth) {
            console.log('Supabase already available');
            resolve(supabase);
            return;
        }
        
        console.log('Waiting for Supabase...');
        
        // Listen for ready event
        const readyHandler = (event) => {
            console.log('mindguardSupabaseReady event received');
            window.removeEventListener('mindguardSupabaseReady', readyHandler);
            clearTimeout(timeoutId);
            resolve(event.detail.supabase || window.mindguardSupabase || window.supabaseClient || window.supabase);
        };
        
        window.addEventListener('mindguardSupabaseReady', readyHandler);
        
        // Also check periodically
        const intervalId = setInterval(() => {
            const supabaseCheck = window.mindguardSupabase || window.supabaseClient || window.supabase;
            if (supabaseCheck && supabaseCheck.auth) {
                console.log('Supabase found during periodic check');
                clearInterval(intervalId);
                window.removeEventListener('mindguardSupabaseReady', readyHandler);
                clearTimeout(timeoutId);
                resolve(supabaseCheck);
            }
        }, 100);
        
        // Timeout after 5 seconds
        const timeoutId = setTimeout(() => {
            clearInterval(intervalId);
            window.removeEventListener('mindguardSupabaseReady', readyHandler);
            console.warn('Supabase not loaded after timeout');
            resolve(null);
        }, 5000);
    });
}

// Load entries from localStorage
// Load entries from localStorage
async function loadEntriesFromStorage() {
    try {
        console.log('📂 Loading entries from storage...');
        
        // Get Supabase client
        const supabase = window.mindguardSupabase || window.supabaseClient || window.supabase;
        
        let user = null;
        if (supabase && supabase.auth) {
            try {
                const { data: { user: supabaseUser } } = await supabase.auth.getUser();
                user = supabaseUser;
                console.log('✅ User from Supabase:', user.email);
            } catch (error) {
                console.warn('⚠️ Could not get user from Supabase:', error);
            }
        }
        
        if (!user) {
            console.log('❌ No user found');
            journalEntries = [];
            showDashboard();
            renderEntries();
            return;
        }
        
        const userId = user.id;
        console.log('📋 Loading entries for user:', userId, user.email);
        
        // ALWAYS check localStorage first for immediate display
        const localStorageKey = `journalEntries_${userId}`;
        const savedEntries = localStorage.getItem(localStorageKey);
        
        if (savedEntries) {
            console.log('💾 Found entries in localStorage, parsing...');
            try {
                journalEntries = JSON.parse(savedEntries);
                console.log(`✅ Loaded ${journalEntries?.length || 0} entries from localStorage`);
                
                // Ensure proper structure
                journalEntries = journalEntries
                    .filter(entry => !entry.user_id || entry.user_id === userId)
                    .map(entry => ({
                        ...entry,
                        id: entry.id || Date.now().toString(),
                        created_at: entry.date || entry.created_at || new Date().toISOString(),
                        text: entry.text || entry.content || '',
                        analysis: entry.analysis || generateAnalysisForEntry(entry.text || entry.content || ''),
                        user_id: entry.user_id || userId
                    }));
                
                // Sort by date
                journalEntries.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                
                console.log(`📊 Now have ${journalEntries.length} entries ready to display`);
                
            } catch (error) {
                console.error('❌ Error parsing localStorage entries:', error);
                journalEntries = [];
            }
        } else {
            console.log('📭 No entries found in localStorage');
            journalEntries = [];
        }
        
        // THEN try to sync from Supabase in the background
        if (window.journalService && journalEntries.length === 0) {
            console.log('☁️ No local entries, checking Supabase...');
            try {
                const supabaseEntries = await window.journalService.getAllEntries();
                if (supabaseEntries && supabaseEntries.length > 0) {
                    console.log(`✅ Found ${supabaseEntries.length} entries in Supabase`);
                    journalEntries = supabaseEntries;
                    
                    // Save to localStorage for next time
                    localStorage.setItem(localStorageKey, JSON.stringify(journalEntries.slice(0, 50)));
                }
            } catch (error) {
                console.error('❌ Error loading from Supabase:', error);
            }
        }
        
        console.log(`🎯 Final: ${journalEntries.length} entries to display`);
        
    } catch (error) {
        console.error('🔥 Error loading entries:', error);
        journalEntries = [];
        showToast({
            title: "Error Loading Entries",
            description: "Could not load your journal history.",
            type: "destructive"
        });
    } finally {
        // Always show dashboard
        showDashboard();
        renderEntries();
    }
}

// Enhanced AI Analysis with all 5 components (same as script.js)
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
function detectRecurringPatterns(content, allEntries) {
    const patterns = [];
    const lowerContent = content.toLowerCase();
    
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
            trend: calculateTrend(allEntries, workKeywords)
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
            trend: calculateTrend(allEntries, socialKeywords)
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
            trend: calculateTrend(allEntries, sleepKeywords)
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
            trend: calculateTrend(allEntries, emotionalKeywords)
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
    
    if (criticalWords.some(word => content.toLowerCase().includes(word))) {
        riskScore += 15; // Critical risk
    } else if (urgentWords.some(word => content.toLowerCase().includes(word))) {
        riskScore += 10; // Urgent risk
    }
    
    // Emotional intensity scoring
    const strongEmotionWords = ['overwhelm', 'drowning', 'suffocating', 'breaking', 'falling apart'];
    riskScore += strongEmotionWords.filter(word => content.toLowerCase().includes(word)).length * 2;
    
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
    
    // Highlight the trigger word
    const wordStart = index - start;
    const wordEnd = wordStart + word.length;
    
    return context.substring(0, wordStart) + 
           `<span class="highlight-word">${context.substring(wordStart, wordEnd)}</span>` + 
           context.substring(wordEnd);
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

function calculateTrend(allEntries, keywords) {
    if (allEntries.length < 3) return "New Pattern";
    
    let recentCount = 0;
    let olderCount = 0;
    
    // Check recent entries (last 3)
    const recentEntries = allEntries.slice(0, Math.min(3, allEntries.length));
    recentEntries.forEach(entry => {
        if (keywords.some(keyword => entry.toLowerCase().includes(keyword))) {
            recentCount++;
        }
    });
    
    // Check older entries (previous 3)
    const olderEntries = allEntries.slice(3, Math.min(6, allEntries.length));
    olderEntries.forEach(entry => {
        if (keywords.some(keyword => entry.toLowerCase().includes(keyword))) {
            olderCount++;
        }
    });
    
    if (recentCount > olderCount) return "Increasing";
    if (recentCount < olderCount) return "Decreasing";
    return "Stable";
}

// Generate analysis for entries that don't have it
function generateAnalysisForEntry(content) {
    // Always use enhanced analysis
    try {
        // Get all previous entries for context
        const allEntries = journalEntries.map(e => e.text).filter(Boolean);
        
        // Generate the same enhanced analysis as the dashboard
        const enhancedAnalysis = generateEnhancedAnalysis(content, allEntries);
        
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
        
        // Fallback to simple analysis if enhanced fails
        return generateFallbackAnalysis(content);
    }
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
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeDeleteDialog);
    }
    
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', handleDeleteConfirm);
    }
    
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

// Format date
function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return 'Invalid date';
        }
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'Unknown date';
    }
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

// Get risk color
function getRiskColor(riskLevel) {
    switch (riskLevel) {
        case 'critical': return '#dc2626';
        case 'high': return '#dc2626';
        case 'medium': return '#f59e0b';
        case 'low': return '#10b981';
        default: return '#6b7280';
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

// Render all entries
function renderEntries() {
    if (!entriesContainer) {
        console.error('entriesContainer not found');
        return;
    }
    
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
    
    // Add user indicator if you want to show it (optional)
    const userIndicator = entry.user_id ? 
        `<span class="user-indicator" title="User ID: ${entry.user_id.substring(0, 8)}...">
            <i class="fas fa-user"></i>
        </span>` : '';
    
    return `
        <div class="entry-card" id="entry-${entry.id}" data-user-id="${entry.user_id || 'unknown'}">
            <div class="entry-header ${isExpanded ? 'active' : ''}" data-entry-id="${entry.id}">
                <div class="entry-header-content">
                    <div class="entry-info">
                        <div class="entry-date">
                            <i class="fas fa-calendar"></i>
                            <span>${formattedDate}</span>
                            ${userIndicator}
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
            <h4><i class="fas fa-book"></i> Full Entry</h4>
            <div class="entry-text">${entry.text || 'No content'}</div>
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
        
        <div class="section-title"><i class="fas fa-chart-bar"></i> Analysis Insights</div>
        <div class="analysis-grid">
            ${renderPatterns(entry.analysis.patterns)}
            ${renderTriggers(entry.analysis.triggers)}
            ${renderWarningsSection(entry.analysis.warnings)}
            ${renderGroundingSection(entry.analysis.grounding_techniques)}
            ${renderCopingSection(entry.analysis.coping_strategies)}
        </div>
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
                        ${idx < patterns.length - 1 ? '<div class="separator mt-3"></div>' : ''}
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
                                <i class="${trigger.category_icon || 'fas fa-exclamation-circle'} text-muted-foreground"></i>
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

// Render warnings section
function renderWarningsSection(warnings) {
    if (!warnings || warnings.length === 0) return '';
    
    return `
        <div class="analysis-card warning-card">
            <div class="analysis-card-header">
                <div class="analysis-card-title">
                    <i class="fas fa-exclamation-triangle text-warning"></i>
                    Early Warnings
                </div>
                <div class="analysis-card-description">Predictive insights for prevention</div>
            </div>
            <div class="analysis-card-content space-y-3">
                ${warnings.map((warning, idx) => `
                    <div class="warning-item warning-${warning.level}">
                        <div class="flex items-start justify-between mb-2">
                            <h5 class="font-semibold text-foreground">${warning.message}</h5>
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
                        ${idx < warnings.length - 1 ? '<div class="separator mt-3"></div>' : ''}
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Render grounding techniques
function renderGroundingSection(grounding) {
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
                                <i class="${technique.icon} text-primary"></i>
                                <h5 class="font-semibold text-foreground">${technique.name}</h5>
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
                            ${technique.steps.map((step, index) => `
                                <li class="text-xs text-muted-foreground">${step}</li>
                            `).join('')}
                        </ol>
                        ${idx < grounding.length - 1 ? '<div class="separator mt-3"></div>' : ''}
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Render coping strategies
function renderCopingSection(coping) {
    if (!coping || coping.length === 0) return '';
    
    return `
        <div class="analysis-card coping-card">
            <div class="analysis-card-header">
                <div class="analysis-card-title">
                    <i class="fas fa-lightbulb text-primary"></i>
                    Coping Strategies
                </div>
                <div class="analysis-card-description">Personalized for your patterns</div>
            </div>
            <div class="analysis-card-content">
                ${coping.map((strategy, idx) => `
                    <div class="coping-item">
                        <div class="flex items-start justify-between mb-2">
                            <h5 class="font-semibold text-foreground">${strategy.title}</h5>
                            <span class="badge badge-info text-xs">${strategy.effectiveness}</span>
                        </div>
                        <p class="text-sm text-muted-foreground mb-3">${strategy.description}</p>
                        <p class="text-xs font-medium mb-1"><i class="fas fa-clock mr-1"></i>When to use:</p>
                        <p class="text-xs text-muted-foreground mb-3 pl-4">${strategy.when_to_use}</p>
                        <p class="text-xs font-medium mb-1"><i class="fas fa-list-ol mr-1"></i>Implementation Steps:</p>
                        <ol class="step-list">
                            ${strategy.steps.map((step, index) => `
                                <li class="text-xs text-muted-foreground">${step}</li>
                            `).join('')}
                        </ol>
                        <p class="text-xs font-medium mt-3"><i class="fas fa-user-check mr-1"></i>Why this is personalized for you:</p>
                        <p class="text-xs text-muted-foreground">${strategy.personalization}</p>
                        ${idx < coping.length - 1 ? '<div class="separator mt-3"></div>' : ''}
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
    if (alertDialog) {
        alertDialog.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
}

// Close delete dialog
function closeDeleteDialog() {
    if (alertDialog) {
        alertDialog.classList.add('hidden');
    }
    document.body.style.overflow = 'auto';
    entryToDelete = null;
}

// Handle delete confirmation
async function handleDeleteConfirm() {
    if (!entryToDelete || isDeleting) return;
    
    isDeleting = true;
    if (confirmDeleteBtn) {
        confirmDeleteBtn.textContent = "Deleting...";
        confirmDeleteBtn.classList.add('disabled');
    }
    
    try {
        // Get Supabase client
        const supabase = window.mindguardSupabase || window.supabaseClient || window.supabase;
        
        if (!supabase) {
            showToast({
                title: "Error",
                description: "Authentication service not available.",
                type: "destructive"
            });
            return;
        }
        
        // Get current user for localStorage key
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id;
        
        // Try to delete from Supabase
        let deleteSuccess = false;
        
        if (window.journalService) {
            deleteSuccess = await window.journalService.deleteEntry(entryToDelete);
        }
        
        // Also delete from localStorage
        const entryIndex = journalEntries.findIndex(entry => entry.id === entryToDelete);
        if (entryIndex !== -1) {
            journalEntries.splice(entryIndex, 1);
            
            // Update user-specific localStorage
            if (userId) {
                const localStorageKey = `journalEntries_${userId}`;
                localStorage.setItem(localStorageKey, JSON.stringify(journalEntries.slice(0, 50)));
            }
            
            // Reset expanded entry if it was deleted
            if (expandedEntryId === entryToDelete) {
                expandedEntryId = null;
            }
            
            // Re-render entries
            renderEntries();
            
            // Show success toast
            showToast({
                title: "Entry deleted",
                description: deleteSuccess 
                    ? "Your journal entry has been permanently deleted from the cloud." 
                    : "Your journal entry has been deleted locally.",
                type: "success"
            });
        }
        
    } catch (error) {
        console.error('Error deleting entry:', error);
        showToast({
            title: "Error",
            description: "Could not delete the entry. Please try again.",
            type: "destructive"
        });
    } finally {
        // Reset state
        isDeleting = false;
        closeDeleteDialog();
        if (confirmDeleteBtn) {
            confirmDeleteBtn.textContent = "Delete";
            confirmDeleteBtn.classList.remove('disabled');
        }
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

// Navigate back to dashboard
function navigateToDashboard() {
    showToast({
        title: "Navigating to Dashboard",
        description: "Returning to the main journal page...",
        type: "info"
    });
    
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 800);
}

// History page specific sign out
async function signOut() {
    console.log('Sign out function called');
    
    try {
        // Get Supabase client
        const supabase = window.mindguardSupabase || window.supabaseClient || window.supabase;
        
        // Show loading state immediately
        showToast({
            title: "Signing out...",
            description: "Please wait while we sign you out.",
            type: "info"
        });
        
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
        
        // Clear any local session data
        localStorage.removeItem('user');
        localStorage.removeItem('mindguard_session');
        
        // Clear user-specific journal entries
        const userId = localStorage.getItem('user_id');
        if (userId) {
            localStorage.removeItem(`journalEntries_${userId}`);
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

// Make functions available globally
window.toggleEntry = toggleEntry;
window.openDeleteDialog = openDeleteDialog;
window.closeDeleteDialog = closeDeleteDialog;
window.signOut = signOut;
window.navigateToDashboard = navigateToDashboard;
window.generateEnhancedAnalysis = generateEnhancedAnalysis;

console.log('history.js loaded successfully');