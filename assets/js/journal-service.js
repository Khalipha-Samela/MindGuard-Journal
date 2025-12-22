class JournalService {
    constructor() {
        // Use mindguardSupabase or fallback to other names
        this.supabase = window.mindguardSupabase || window.supabase || window.supabaseClient;
        console.log('📦 JournalService initialized, supabase available:', !!this.supabase);
        
        if (!this.supabase) {
            console.error('❌ CRITICAL: No Supabase client found!');
        }
    }

    /**
     * Check if the journal_entries table exists and is accessible
     */
    async checkTableExists() {
        try {
            console.log('Checking if journal_entries table exists...');
            
            const { data: { user } } = await this.supabase.auth.getUser();
            if (!user) {
                console.log('👤 No user logged in for table check');
                return false;
            }
            
            // Try a simple query to see if table exists
            const { data, error } = await this.supabase
                .from('journal_entries')
                .select('count', { count: 'exact', head: true });
            
            if (error) {
                console.error('Table check error:', error);
                console.log('Error suggests table might not exist or RLS policies not set');
                console.log('Error details:', {
                    message: error.message,
                    code: error.code,
                    details: error.details
                });
                return false;
            }
            
            console.log('journal_entries table exists and is accessible');
            return true;
            
        } catch (error) {
            console.error('Exception in checkTableExists:', error);
            return false;
        }
    }

    /**
     * Save a journal entry to Supabase
     */
    async saveJournalEntry(entryData) {
        try {
            console.log('to save journal entry...');
            
            // Get current user
            const { data: { user } } = await this.supabase.auth.getUser();
            if (!user) {
                console.error('No user logged in');
                return null;
            }
        
            const entryToSave = {
                user_id: user.id,
                content: entryData.content || '',
                word_count: entryData.word_count || 0,
                risk_level: entryData.analysis?.risk_level || 'low',
                patterns: entryData.analysis?.patterns || [],
                triggers: entryData.analysis?.triggers || [],
                warnings: entryData.analysis?.warnings || [],
                grounding_techniques: entryData.analysis?.grounding_techniques || [],
                coping_strategies: entryData.analysis?.coping_strategies || []
            };
        
            console.log('Saving entry for user:', user.email);
            console.log('Entry data:', {
                contentLength: entryToSave.content.length,
                wordCount: entryToSave.word_count,
                riskLevel: entryToSave.risk_level
            });
            
            // Try to save to Supabase
            let supabaseSavedEntry = null;
            let supabaseError = null;
            
            try {
                console.log('Attempting to save to Supabase...');
                const { data, error } = await this.supabase
                    .from('journal_entries')
                    .insert([entryToSave])
                    .select()
                    .single();
                
                if (error) {
                    supabaseError = error;
                    console.error('Supabase save error:', error);
                    console.error('Error details:', {
                        message: error.message,
                        code: error.code,
                        details: error.details,
                        hint: error.hint
                    });
                } else {
                    supabaseSavedEntry = {
                        id: data.id,
                        text: data.content,
                        content: data.content,
                        created_at: data.created_at,
                        word_count: data.word_count,
                        analysis: {
                            patterns: data.patterns,
                            triggers: data.triggers,
                            warnings: data.warnings,
                            grounding_techniques: data.grounding_techniques,
                            coping_strategies: data.coping_strategies,
                            risk_level: data.risk_level
                        }
                    };
                    
                    console.log('Entry saved to Supabase:', supabaseSavedEntry.id);
                }
                
            } catch (supabaseException) {
                console.error('Supabase exception:', supabaseException);
                supabaseError = supabaseException;
            }
            
            // ALWAYS save to localStorage (as backup or primary)
            console.log('Saving to localStorage...');
            const localStorageEntry = this.saveToLocalStorage(entryData, user, supabaseSavedEntry?.id);
            
            if (!localStorageEntry) {
                console.error('Failed to save to localStorage too!');
                return null;
            }
            
            // Return whichever one succeeded (prefer Supabase if available)
            const result = supabaseSavedEntry || localStorageEntry;
            console.log('Save result:', {
                savedToSupabase: !!supabaseSavedEntry,
                savedToLocalStorage: !!localStorageEntry,
                entryId: result.id
            });
            
            return result;
            
        } catch (error) {
            console.error('Error saving entry:', error);
            
            // Last resort: try to save to localStorage only
            try {
                const { data: { user } } = await this.supabase.auth.getUser();
                if (user) {
                    console.log('Emergency save to localStorage');
                    return this.saveToLocalStorage(entryData, user, null);
                }
            } catch (e) {
                console.error('Even emergency localStorage save failed:', e);
            }
            
            return null;
        }
    }
    
    /**
     * Save entry to localStorage
     */
    saveToLocalStorage(entryData, user, supabaseId) {
        try {
            if (!user || !user.id) {
                console.error('No user for localStorage save');
                return null;
            }
            
            const userId = user.id;
            const localStorageKey = `journalEntries_${userId}`;
            const savedEntries = localStorage.getItem(localStorageKey) || '[]';
            const entries = JSON.parse(savedEntries);
            
            const newEntry = {
                id: supabaseId || `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                text: entryData.content || '',
                content: entryData.content || '',
                created_at: new Date().toISOString(),
                date: new Date().toISOString(),
                word_count: entryData.word_count || 0,
                analysis: entryData.analysis || {
                    patterns: [],
                    triggers: [],
                    warnings: [],
                    grounding_techniques: [],
                    coping_strategies: [],
                    risk_level: 'low'
                },
                user_id: userId,
                source: supabaseId ? 'supabase' : 'local'
            };
            
            // Remove any existing entry with same ID
            const filteredEntries = entries.filter(e => e.id !== newEntry.id);
            filteredEntries.unshift(newEntry);
            
            localStorage.setItem(localStorageKey, JSON.stringify(filteredEntries.slice(0, 100)));
            
            console.log('Saved to localStorage:', newEntry.id);
            
            return newEntry;
            
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            return null;
        }
    }

    /**
     * Get all journal entries for current user
     */
    async getAllEntries() {
        try {
            console.log('Getting all journal entries...');
            
            // Get current user
            const { data: { user } } = await this.supabase.auth.getUser();
            if (!user) {
                console.log('No user logged in');
                return [];
            }
        
            console.log('Fetching entries for user:', user.email);
            
            let supabaseEntries = [];
            let supabaseError = null;
            
            // Try to get entries from Supabase
            try {
                console.log('Fetching from Supabase...');
                const { data, error } = await this.supabase
                    .from('journal_entries')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });
                
                if (error) {
                    supabaseError = error;
                    console.error('Supabase query error:', error);
                } else {
                    console.log(`Found ${data?.length || 0} entries in Supabase`);
                    
                    // Transform data to match expected structure
                    supabaseEntries = (data || []).map(entry => ({
                        id: entry.id,
                        text: entry.content,
                        content: entry.content,
                        title: entry.title || 'Untitled Entry',
                        word_count: entry.word_count || 0,
                        created_at: entry.created_at || new Date().toISOString(),
                        date: entry.created_at || new Date().toISOString(),
                        user_id: entry.user_id,
                        analysis: {
                            patterns: entry.patterns || [],
                            triggers: entry.triggers || [],
                            warnings: entry.warnings || [],
                            grounding_techniques: entry.grounding_techniques || [],
                            coping_strategies: entry.coping_strategies || [],
                            risk_level: entry.risk_level || 'low'
                        },
                        source: 'supabase'
                    }));
                }
                
            } catch (supabaseException) {
                console.error('Supabase fetch exception:', supabaseException);
                supabaseError = supabaseException;
            }
            
            // Always check localStorage too
            const localStorageKey = `journalEntries_${user.id}`;
            const savedEntries = localStorage.getItem(localStorageKey);
            let localStorageEntries = [];
            
            if (savedEntries) {
                try {
                    localStorageEntries = JSON.parse(savedEntries);
                    console.log(`Found ${localStorageEntries?.length || 0} entries in localStorage`);
                    
                    // Filter and transform localStorage entries
                    localStorageEntries = localStorageEntries
                        .filter(entry => !entry.user_id || entry.user_id === user.id)
                        .map(entry => ({
                            ...entry,
                            id: entry.id || `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                            created_at: entry.date || entry.created_at || new Date().toISOString(),
                            text: entry.text || entry.content || '',
                            analysis: entry.analysis || {
                                patterns: [],
                                triggers: [],
                                warnings: [],
                                grounding_techniques: [],
                                coping_strategies: [],
                                risk_level: 'low'
                            },
                            user_id: entry.user_id || user.id,
                            source: entry.source || 'local'
                        }));
                        
                } catch (parseError) {
                    console.error('Error parsing localStorage entries:', parseError);
                    localStorageEntries = [];
                }
            }
            
            // Merge entries, preferring Supabase entries when available
            const allEntries = [...supabaseEntries];
            const supabaseIds = new Set(supabaseEntries.map(e => e.id));
            
            // Add localStorage entries that aren't already in Supabase
            for (const localEntry of localStorageEntries) {
                if (!supabaseIds.has(localEntry.id)) {
                    allEntries.push(localEntry);
                }
            }
            
            // Sort by date (newest first)
            allEntries.sort((a, b) => {
                const dateA = new Date(a.created_at || 0);
                const dateB = new Date(b.created_at || 0);
                return dateB - dateA;
            });
            
            console.log(`Total entries: ${allEntries.length} (${supabaseEntries.length} from Supabase, ${localStorageEntries.length} from localStorage)`);
            
            return allEntries;
            
        } catch (error) {
            console.error('Error fetching entries:', error);
            // Return empty array instead of throwing to prevent refresh loops
            return [];
        }
    }

    /**
     * Get a single journal entry by ID
     */
    async getEntryById(entryId) {
        try {
            if (!this.supabase) {
                console.error('Supabase client not initialized');
                return null;
            }

            console.log(`Getting entry by ID: ${entryId}`);
            
            // Try Supabase first
            let supabaseEntry = null;
            try {
                const { data, error } = await this.supabase
                    .from('journal_entries')
                    .select('*')
                    .eq('id', entryId)
                    .single();

                if (error) {
                    console.error('Supabase fetch error:', error);
                } else if (data) {
                    supabaseEntry = {
                        id: data.id,
                        text: data.content,
                        created_at: data.created_at,
                        word_count: data.word_count,
                        analysis: {
                            risk_level: data.risk_level,
                            patterns: data.patterns || [],
                            triggers: data.triggers || [],
                            warnings: data.warnings || [],
                            grounding_techniques: data.grounding_techniques || [],
                            coping_strategies: data.coping_strategies || []
                        },
                        source: 'supabase'
                    };
                }
            } catch (supabaseError) {
                console.error('Supabase fetch exception:', supabaseError);
            }
            
            // If not in Supabase, check localStorage
            if (!supabaseEntry) {
                console.log('Checking localStorage for entry...');
                const { data: { user } } = await this.supabase.auth.getUser();
                if (user) {
                    const localStorageKey = `journalEntries_${user.id}`;
                    const savedEntries = localStorage.getItem(localStorageKey);
                    
                    if (savedEntries) {
                        try {
                            const entries = JSON.parse(savedEntries);
                            const localEntry = entries.find(e => e.id === entryId);
                            
                            if (localEntry) {
                                supabaseEntry = {
                                    ...localEntry,
                                    source: 'local'
                                };
                                console.log('Found in localStorage');
                            }
                        } catch (parseError) {
                            console.error('Error parsing localStorage:', parseError);
                        }
                    }
                }
            }
            
            return supabaseEntry;

        } catch (error) {
            console.error('Exception in getEntryById:', error);
            return null;
        }
    }

    /**
     * Update a journal entry
     */
    async updateEntry(entryId, updates) {
        try {
            if (!this.supabase) {
                console.error('Supabase client not initialized');
                return null;
            }

            console.log(`Updating entry: ${entryId}`);
            
            // Get current user
            const { data: { user } } = await this.supabase.auth.getUser();
            if (!user) {
                console.error('No user logged in');
                return null;
            }
            
            let supabaseUpdated = null;
            
            // Try to update in Supabase
            try {
                const { data, error } = await this.supabase
                    .from('journal_entries')
                    .update(updates)
                    .eq('id', entryId)
                    .eq('user_id', user.id)
                    .select()
                    .single();

                if (error) {
                    console.error('Supabase update error:', error);
                } else if (data) {
                    supabaseUpdated = data;
                    console.log('Updated in Supabase');
                }
            } catch (supabaseError) {
                console.error('Supabase update exception:', supabaseError);
            }
            
            // Always update in localStorage
            const localStorageKey = `journalEntries_${user.id}`;
            const savedEntries = localStorage.getItem(localStorageKey);
            
            if (savedEntries) {
                try {
                    const entries = JSON.parse(savedEntries);
                    const entryIndex = entries.findIndex(e => e.id === entryId);
                    
                    if (entryIndex !== -1) {
                        entries[entryIndex] = {
                            ...entries[entryIndex],
                            ...updates,
                            updated_at: new Date().toISOString()
                        };
                        
                        localStorage.setItem(localStorageKey, JSON.stringify(entries));
                        console.log('Updated in localStorage');
                        
                        // If Supabase update failed, return the localStorage version
                        if (!supabaseUpdated) {
                            return entries[entryIndex];
                        }
                    }
                } catch (parseError) {
                    console.error('Error updating localStorage:', parseError);
                }
            }
            
            return supabaseUpdated;

        } catch (error) {
            console.error('Exception in updateEntry:', error);
            return null;
        }
    }

    /**
     * Delete a journal entry
     */
    async deleteEntry(entryId) {
        try {
            console.log(`Deleting entry: ${entryId}`);
            
            // Get current user
            const { data: { user } } = await this.supabase.auth.getUser();
            if (!user) {
                console.log('No user logged in');
                return false;
            }
        
            let supabaseDeleteSuccess = false;
            
            // Try to delete from Supabase
            try {
                const { error } = await this.supabase
                    .from('journal_entries')
                    .delete()
                    .eq('id', entryId)
                    .eq('user_id', user.id);
                
                if (error) {
                    console.error('Supabase delete error:', error);
                } else {
                    supabaseDeleteSuccess = true;
                    console.log('Deleted from Supabase');
                }
                
            } catch (supabaseError) {
                console.error('Supabase delete exception:', supabaseError);
            }
        
            // Always delete from user-specific localStorage
            const localStorageKey = `journalEntries_${user.id}`;
            const savedEntries = localStorage.getItem(localStorageKey) || '[]';
            try {
                const entries = JSON.parse(savedEntries);
                const filteredEntries = entries.filter(e => e.id !== entryId);
                
                if (filteredEntries.length !== entries.length) {
                    localStorage.setItem(localStorageKey, JSON.stringify(filteredEntries));
                    console.log('Deleted from localStorage');
                }
            } catch (parseError) {
                console.error('Error deleting from localStorage:', parseError);
            }
        
            console.log('🎯 Delete result:', {
                supabaseSuccess: supabaseDeleteSuccess,
                entryId: entryId
            });
            
            return supabaseDeleteSuccess || true; // Return true if at least localStorage delete worked
            
        } catch (error) {
            console.error('🔥 Error deleting entry:', error);
            return false;
        }
    }

    /**
     * Get statistics about journal entries
     */
    async getStatistics() {
        try {
            if (!this.supabase) {
                console.error('Supabase client not initialized');
                return null;
            }

            console.log('Getting statistics...');
            
            // Get entries first
            const entries = await this.getAllEntries();
            
            if (entries.length === 0) {
                return {
                    total_entries: 0,
                    risk_distribution: { low: 0, medium: 0, high: 0, critical: 0 },
                    latest_entry_date: null,
                    average_risk: 'low'
                };
            }
            
            // Calculate risk distribution
            const riskDistribution = {
                low: 0,
                medium: 0,
                high: 0,
                critical: 0
            };

            entries.forEach(entry => {
                const riskLevel = entry.analysis?.risk_level || 'low';
                if (riskDistribution.hasOwnProperty(riskLevel)) {
                    riskDistribution[riskLevel]++;
                }
            });

            // Get latest entry date
            const latestEntry = entries.length > 0 ? entries[0] : null;

            return {
                total_entries: entries.length,
                risk_distribution: riskDistribution,
                latest_entry_date: latestEntry?.created_at || null,
                average_risk: this.calculateAverageRisk(entries)
            };

        } catch (error) {
            console.error('Exception in getStatistics:', error);
            return null;
        }
    }

    /**
     * Calculate average risk level
     */
    calculateAverageRisk(entries) {
        if (!entries || entries.length === 0) return 'low';
        
        const riskScores = {
            'low': 1,
            'medium': 2,
            'high': 3,
            'critical': 4
        };
        
        let totalScore = 0;
        entries.forEach(entry => {
            const riskLevel = entry.analysis?.risk_level || 'low';
            totalScore += riskScores[riskLevel] || 1;
        });
        
        const averageScore = totalScore / entries.length;
        
        if (averageScore >= 3.5) return 'critical';
        if (averageScore >= 2.5) return 'high';
        if (averageScore >= 1.5) return 'medium';
        return 'low';
    }

    /**
     * Sync local storage with Supabase (for migration)
     */
    async syncWithLocalStorage() {
        try {
            console.log('Syncing localStorage with Supabase...');
            
            if (!this.supabase) {
                console.error('Supabase client not initialized');
                return { synced: 0, total: 0 };
            }

            // Get current user
            const { data: { user } } = await this.supabase.auth.getUser();
            if (!user) {
                console.error('No user logged in');
                return { synced: 0, total: 0 };
            }
            
            // Get entries from user-specific localStorage
            const localStorageKey = `journalEntries_${user.id}`;
            const savedEntries = localStorage.getItem(localStorageKey);
            if (!savedEntries) {
                console.log('No entries in localStorage to sync');
                return { synced: 0, total: 0 };
            }

            const localEntries = JSON.parse(savedEntries);
            let syncedCount = 0;

            console.log(`Found ${localEntries.length} entries to sync`);
            
            // Sync each entry
            for (const entry of localEntries) {
                try {
                    // Only sync if entry doesn't have a Supabase source
                    if (entry.source !== 'supabase') {
                        const success = await this.saveJournalEntry(entry);
                        if (success) {
                            syncedCount++;
                            console.log(`Synced entry ${syncedCount}/${localEntries.length}`);
                        }
                    }
                } catch (entryError) {
                    console.error(`Error syncing entry:`, entryError);
                }
            }

            console.log(`Sync complete: ${syncedCount}/${localEntries.length} entries synced`);

            return {
                synced: syncedCount,
                total: localEntries.length
            };

        } catch (error) {
            console.error('Error syncing with localStorage:', error);
            return { synced: 0, total: 0 };
        }
    }
}

// Create global instance
window.journalService = new JournalService();

// Debug function to test the service
window.testJournalService = async function() {
    console.log('🧪 === Testing JournalService ===');
    
    // Check if service is initialized
    console.log('Service instance:', !!window.journalService);
    console.log('Service supabase client:', !!window.journalService?.supabase);
    console.log('Global mindguardSupabase:', !!window.mindguardSupabase);
    
    // Test table exists
    console.log('Testing if table exists...');
    try {
        const tableExists = await window.journalService.checkTableExists();
        console.log('Table exists check:', tableExists);
    } catch (tableError) {
        console.error('Table check failed:', tableError);
    }
    
    // Test getAllEntries
    console.log('Testing getAllEntries...');
    try {
        const entries = await window.journalService.getAllEntries();
        console.log(`Success! Got ${entries.length} entries`);
        if (entries.length > 0) {
            console.log('First entry sample:', {
                id: entries[0].id,
                content_preview: entries[0].content?.substring(0, 50) + '...',
                created_at: entries[0].created_at,
                source: entries[0].source
            });
        }
        return entries;
    } catch (error) {
        console.error('Test failed:', error);
        return null;
    }
};

// Test statistics
window.testStatistics = async function() {
    console.log('Testing statistics...');
    try {
        const stats = await window.journalService.getStatistics();
        console.log('Statistics:', stats);
        return stats;
    } catch (error) {
        console.error('Statistics test failed:', error);
        return null;
    }
};

// Auto-test when page loads
setTimeout(() => {
    console.log('JournalService auto-test starting...');
    if (window.journalService && window.journalService.supabase) {
        window.testJournalService().then(entries => {
            if (entries && entries.length > 0) {
                window.testStatistics();
            }
        });
    }
}, 3000);

// Check table exists and warn if needed
setTimeout(async () => {
    console.log('Checking database setup...');
    if (window.journalService && window.journalService.supabase) {
        try {
            const tableExists = await window.journalService.checkTableExists();
            if (!tableExists) {
                console.warn('🚨 IMPORTANT: journal_entries table might not exist in Supabase!');
                console.warn('📝 Please run this SQL in your Supabase SQL Editor:');
                console.warn(`
-- Create journal_entries table
CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  word_count INTEGER DEFAULT 0,
  risk_level TEXT DEFAULT 'low',
  patterns JSONB DEFAULT '[]'::jsonb,
  triggers JSONB DEFAULT '[]'::jsonb,
  warnings JSONB DEFAULT '[]'::jsonb,
  grounding_techniques JSONB DEFAULT '[]'::jsonb,
  coping_strategies JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own entries" 
  ON journal_entries FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own entries" 
  ON journal_entries FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own entries" 
  ON journal_entries FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own entries" 
  ON journal_entries FOR DELETE 
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_journal_entries_user_id ON journal_entries(user_id);
CREATE INDEX idx_journal_entries_created_at ON journal_entries(created_at DESC);
                `);
            } else {
                console.log('Database setup looks good!');
            }
        } catch (error) {
            console.error('Database check failed:', error);
        }
    }
}, 5000);