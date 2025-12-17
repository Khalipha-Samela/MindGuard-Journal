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

// Simulate initial loading state
window.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM loaded, waiting for Supabase...');
    
    // Wait for supabase to be available
    if (!window.supabase && !window.supabaseClient) {
        console.log('Supabase not available yet, waiting...');
        setTimeout(() => {
            window.location.reload();
        }, 1000);
        return;
    }
    
    const supabase = window.supabase || window.supabaseClient;
    
    try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (!session) {
            console.log('No session, redirecting to login');
            window.location.replace('login.html');
            return;
        }

        // User authenticated → show loader
        loadingState.style.display = 'flex';
        dashboardContent.style.display = 'none';

        // Simulate loading / init app
        setTimeout(() => {
            loadingState.style.display = 'none';
            dashboardContent.style.display = 'block';

            // Show page AFTER auth + init
            document.body.style.visibility = 'visible';

            updateWordCount();
        }, 800);

    } catch (err) {
        console.error('Auth check error:', err);
        window.location.replace('login.html');
    }
});

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

// Save journal entry with enhanced analysis
async function saveJournalEntry(text, analysis) {
    try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            console.error('No user logged in');
            showToast({
                title: "Not Signed In",
                description: "Please sign in to save your journal entry.",
                type: "destructive"
            });
            return null;
        }
        
        const userId = user.id;
        const wordCount = text.split(/\s+/).length;
        
        const entryData = {
            content: text,
            word_count: wordCount,
            analysis: analysis
        };

        console.log('Saving entry for user:', user.email);
        
        // Save to Supabase
        if (window.journalService) {
            const savedEntry = await window.journalService.saveJournalEntry(entryData);
            
            if (savedEntry) {
                console.log('Saved to Supabase:', savedEntry);
                
                // Also save to user-specific localStorage
                const localStorageKey = `journalEntries_${userId}`;
                const savedEntries = localStorage.getItem(localStorageKey) || '[]';
                const entries = JSON.parse(savedEntries);
                
                const localEntry = {
                    id: savedEntry.id,
                    text: savedEntry.text,
                    content: savedEntry.content,
                    created_at: savedEntry.created_at,
                    date: savedEntry.created_at,
                    word_count: savedEntry.word_count,
                    analysis: savedEntry.analysis,
                    user_id: userId
                };
                
                entries.unshift(localEntry);
                localStorage.setItem(localStorageKey, JSON.stringify(entries.slice(0, 50)));
                console.log('Saved to localStorage for user:', user.email);
                
                return savedEntry;
            }
        }

        // Fallback to user-specific localStorage
        console.log('Using localStorage fallback for user:', user.email);
        const localStorageKey = `journalEntries_${userId}`;
        const savedEntries = localStorage.getItem(localStorageKey) || '[]';
        const entries = JSON.parse(savedEntries);
        
        const newEntry = {
            id: Date.now().toString(),
            text: text,
            content: text,
            created_at: new Date().toISOString(),
            date: new Date().toISOString(),
            word_count: wordCount,
            analysis: analysis,
            user_id: userId
        };
        
        entries.unshift(newEntry);
        localStorage.setItem(localStorageKey, JSON.stringify(entries.slice(0, 50)));
        console.log('Saved to localStorage (fallback) for user:', user.email);
        
        return newEntry;

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
    const text = journalText.value.trim();
    if (!text) return;
    
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
    if (window.journalService) {
        previousEntries = await window.journalService.getAllEntries();
    } else {
        // Fallback to localStorage with user prefix
        const localStorageKey = `journalEntries_${user.id}`;
        const savedEntries = localStorage.getItem(localStorageKey) || '[]';
        previousEntries = JSON.parse(savedEntries);
    }
    
    const previousTexts = previousEntries.map(e => e.text).filter(Boolean);
    
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
    analysisLoading.style.display = 'block';
    analysisEmpty.style.display = 'none';
    analysisContent.style.display = 'none';
            
    // Simulate API call delay
    setTimeout(() => {
        // Show analysis content with updated data
        analysisLoading.style.display = 'none';
        analysisContent.style.display = 'block';
                
        // Update the "Updated just now" text
        const updateText = document.querySelector('.analysis-header p');
        const now = new Date();
        const timeString = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        updateText.textContent = `Based on your latest journal entry • Updated at ${timeString}`;
                
        // Update analysis content with enhanced display
        updateAnalysisDisplay(analysis);
                
        // Show success message using toast
        showToast({ 
            title: "Analysis Complete", 
            description: "Your journal has been analyzed and saved to the cloud.", 
            type: "success" 
        });
                
        // Smooth scroll to analysis section
        document.getElementById('analysis-section').scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
    }, 1800);
}

function clearJournalEntry() {
    if (journalText.value.trim() && !confirm('Clear the current entry?')) {
        return;
    }
    journalText.value = '';
    updateWordCount();
    analysisContent.style.display = 'none';
    analysisEmpty.style.display = 'block';
    
    // Use toast instead of notification
    showToast({
        title: "Entry Cleared",
        description: "Your current journal entry has been cleared.",
        type: "info"
    });
}

// Enhanced function to update all analysis components
function updateAnalysisDisplay(analysis) {
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
    const riskSummary = document.getElementById('risk-summary');
    const riskMeter = document.getElementById('risk-meter-fill');
    const riskText = document.getElementById('risk-level-text');
    const riskDesc = document.getElementById('risk-description');
    
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
    
    // Create risk summary if it doesn't exist
    if (!riskSummary) {
        const analysisHeader = document.querySelector('.analysis-header');
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
        
        if (analysisHeader && analysisHeader.nextSibling) {
            analysisHeader.insertAdjacentHTML('afterend', riskHTML);
        }
    } else {
        // Update existing risk summary
        riskMeter.style.width = config.percent + '%';
        riskMeter.style.backgroundColor = config.color;
        riskText.textContent = config.text;
        riskText.style.color = config.color;
        riskDesc.textContent = config.desc;
        
        // Update icon
        const icon = riskSummary.querySelector('i');
        if (icon) {
            icon.className = config.icon;
            icon.style.color = config.color;
        }
    }
}

function updatePatternsDisplay(patterns) {
    const container = document.getElementById('patterns-container') || createAnalysisContainer('patterns');
    
    if (!patterns || patterns.length === 0) {
        container.innerHTML = '<div class="empty-message">No recurring patterns detected in this entry</div>';
        return;
    }
    
    container.innerHTML = patterns.map(pattern => `
        <div class="pattern-item">
            <div class="flex items-start justify-between mb-1">
                <h4 class="font-semibold text-foreground">${pattern.theme}</h4>
                <div class="flex items-center gap-2">
                    <span class="frequency-indicator">
                        <i class="fas fa-chart-bar mr-1"></i>${pattern.frequency}
                    </span>
                    <span class="badge ${pattern.confidence === 'High' ? 'badge-success' : 'badge-secondary'}">
                        ${pattern.confidence}
                    </span>
                </div>
            </div>
            <p class="text-sm text-muted-foreground mb-2">${pattern.description}</p>
            <div class="trend-indicator">
                <i class="fas fa-${pattern.trend === 'Increasing' ? 'arrow-up trend-up' : pattern.trend === 'Decreasing' ? 'arrow-down trend-down' : 'minus trend-stable'} mr-1"></i>
                <span class="text-xs">${pattern.trend} trend detected</span>
            </div>
            ${patterns.indexOf(pattern) < patterns.length - 1 ? '<div class="separator mt-3"></div>' : ''}
        </div>
    `).join('');
}

function updateTriggersDisplay(triggers) {
    const container = document.getElementById('triggers-container') || createAnalysisContainer('triggers');
    
    if (!triggers || triggers.length === 0) {
        container.innerHTML = '<div class="empty-message">No trauma triggers detected in this entry</div>';
        return;
    }
    
    container.innerHTML = triggers.map(trigger => `
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
            ${triggers.indexOf(trigger) < triggers.length - 1 ? '<div class="separator mt-3"></div>' : ''}
        </div>
    `).join('');
}

function updateWarningsDisplay(warnings) {
    const container = document.getElementById('warnings-container') || createAnalysisContainer('warnings');
    
    if (!warnings || warnings.length === 0) {
        container.innerHTML = '<div class="empty-message">No immediate warnings detected. Continue monitoring your patterns.</div>';
        return;
    }
    
    container.innerHTML = warnings.map(warning => `
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
            ${warnings.indexOf(warning) < warnings.length - 1 ? '<div class="separator mt-3"></div>' : ''}
        </div>
    `).join('');
}

function updateGroundingDisplay(grounding) {
    const container = document.getElementById('grounding-container') || createAnalysisContainer('grounding');
    
    if (!grounding || grounding.length === 0) {
        container.innerHTML = '<div class="empty-message">No grounding techniques suggested</div>';
        return;
    }
    
    container.innerHTML = grounding.map(technique => `
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
                ${technique.steps.map((step, index) => `
                    <li class="text-xs text-muted-foreground">${step}</li>
                `).join('')}
            </ol>
            ${grounding.indexOf(technique) < grounding.length - 1 ? '<div class="separator mt-3"></div>' : ''}
        </div>
    `).join('');
}

function updateCopingDisplay(coping) {
    const container = document.getElementById('coping-container') || createAnalysisContainer('coping');
    
    if (!coping || coping.length === 0) {
        container.innerHTML = '<div class="empty-message">No coping strategies suggested</div>';
        return;
    }
    
    container.innerHTML = coping.map(strategy => `
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
                ${strategy.steps.map((step, index) => `
                    <li class="text-xs text-muted-foreground">${step}</li>
                `).join('')}
            </ol>
            <p class="text-xs font-medium mt-3"><i class="fas fa-user-check mr-1"></i>Why this is personalized for you:</p>
            <p class="text-xs text-muted-foreground">${strategy.personalization}</p>
            ${coping.indexOf(strategy) < coping.length - 1 ? '<div class="separator mt-3"></div>' : ''}
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
    if (analysisGrid) {
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
        
        analysisGrid.innerHTML += cardHTML;
        return document.getElementById(`${type}-container`);
    }
    
    return null;
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
        
        // Try to sign out from Supabase if available
        if (typeof supabase !== 'undefined' && supabase.auth) {
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
        
        // Clear any local session data (optional)
        // localStorage.removeItem('userSession'); // Uncomment if you store session data
        
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
        title: "Saved to History",
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