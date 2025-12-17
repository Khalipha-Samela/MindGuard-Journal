class JournalService {
    constructor() {
        // FIX: Use mindguardSupabase (from your logs) or fallback to other names
        this.supabase = window.mindguardSupabase || window.supabase || window.supabaseClient;
        console.log('JournalService initialized, supabase available:', !!this.supabase);
        
        if (!this.supabase) {
            console.error('CRITICAL: No Supabase client found!');
        }
    }

    /**
     * Save a journal entry to Supabase
     */
    async saveJournalEntry(entryData) {
        try {
            // FIX: Use this.supabase instead of supabase
            const { data: { user } } = await this.supabase.auth.getUser();
            if (!user) {
                console.error('No user logged in');
                return null;
            }
        
            const entryToSave = {
                user_id: user.id,
                content: entryData.content,
                word_count: entryData.word_count,
                risk_level: entryData.analysis?.risk_level || 'low',
                patterns: entryData.analysis?.patterns || [],
                triggers: entryData.analysis?.triggers || [],
                warnings: entryData.analysis?.warnings || [],
                grounding_techniques: entryData.analysis?.grounding_techniques || [],
                coping_strategies: entryData.analysis?.coping_strategies || []
            };
        
            console.log('Saving entry for user:', user.email);
            
            const { data, error } = await this.supabase
                .from('journal_entries')
                .insert([entryToSave])
                .select()
                .single();
            
            if (error) {
                console.error('Save error:', error);
                throw error;
            }
        
            return {
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
        } catch (error) {
            console.error('Error saving entry:', error);
            return null;
        }
    }

    /**
     * Get all journal entries for current user
     */
    async getAllEntries() {
        try {
            // FIX: Use this.supabase instead of supabase
            const { data: { user } } = await this.supabase.auth.getUser();
            if (!user) {
                console.log('No user logged in');
                return [];
            }
        
            console.log('Fetching entries for user:', user.email);
            
            const { data, error } = await this.supabase
                .from('journal_entries')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });
            
            if (error) {
                console.error('Query error details:', {
                    message: error.message,
                    code: error.code,
                    details: error.details,
                    hint: error.hint
                });
                // Return empty array instead of throwing to prevent refresh loops
                return [];
            }
        
            console.log(`Found ${data?.length || 0} entries`);
            
            // Transform data to match expected structure
            return (data || []).map(entry => ({
                id: entry.id,
                text: entry.content,
                content: entry.content,
                title: entry.title || 'Untitled Entry',
                word_count: entry.word_count,
                created_at: entry.created_at,
                date: entry.created_at,
                user_id: entry.user_id,
                analysis: {
                    patterns: entry.patterns || [],
                    triggers: entry.triggers || [],
                    warnings: entry.warnings || [],
                    grounding_techniques: entry.grounding_techniques || [],
                    coping_strategies: entry.coping_strategies || [],
                    risk_level: entry.risk_level || 'low'
                }
            }));
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

            const { data, error } = await this.supabase
                .from('journal_entries')
                .select('*')
                .eq('id', entryId)
                .single();

            if (error) {
                console.error('Error fetching entry:', error);
                return null;
            }

            return {
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
                }
            };

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

            const { data, error } = await this.supabase
                .from('journal_entries')
                .update(updates)
                .eq('id', entryId)
                .select()
                .single();

            if (error) {
                console.error('Error updating entry:', error);
                return null;
            }

            return data;

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
            // FIX: Use this.supabase instead of supabase
            const { data: { user } } = await this.supabase.auth.getUser();
            if (!user) {
                console.log('No user logged in');
                return false;
            }
        
            console.log('Deleting entry for user:', user.email);
            
            // Verify ownership first
            const { data: entry, error: fetchError } = await this.supabase
                .from('journal_entries')
                .select('user_id')
                .eq('id', entryId)
                .single();
            
            if (fetchError) {
                console.error('Fetch error:', fetchError);
                return false;
            }
        
            if (entry.user_id !== user.id) {
                console.error('User does not own this entry');
                return false;
            }
        
            const { error } = await this.supabase
                .from('journal_entries')
                .delete()
                .eq('id', entryId)
                .eq('user_id', user.id);
            
            if (error) {
                console.error('Delete error:', error);
                return false;
            }
        
            // Also delete from user-specific localStorage
            const localStorageKey = `journalEntries_${user.id}`;
            const savedEntries = localStorage.getItem(localStorageKey) || '[]';
            const entries = JSON.parse(savedEntries);
            const filteredEntries = entries.filter(e => e.id !== entryId);
            localStorage.setItem(localStorageKey, JSON.stringify(filteredEntries));
        
            console.log('Entry deleted successfully');
            return true;
        } catch (error) {
            console.error('Error deleting entry:', error);
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

            // Get total entries
            const { count, error: countError } = await this.supabase
                .from('journal_entries')
                .select('*', { count: 'exact', head: true });

            if (countError) {
                console.error('Error getting count:', countError);
                return null;
            }

            // Get risk level distribution
            const { data: riskData, error: riskError } = await this.supabase
                .from('journal_entries')
                .select('risk_level');

            if (riskError) {
                console.error('Error getting risk levels:', riskError);
                return null;
            }

            const riskDistribution = {
                low: 0,
                medium: 0,
                high: 0,
                critical: 0
            };

            riskData.forEach(entry => {
                if (riskDistribution.hasOwnProperty(entry.risk_level)) {
                    riskDistribution[entry.risk_level]++;
                }
            });

            // Get latest entry date
            const { data: latestEntry, error: latestError } = await this.supabase
                .from('journal_entries')
                .select('created_at')
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            return {
                total_entries: count || 0,
                risk_distribution: riskDistribution,
                latest_entry_date: latestEntry?.created_at || null,
                average_risk: this.calculateAverageRisk(riskData)
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
            totalScore += riskScores[entry.risk_level] || 1;
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
            if (!this.supabase) {
                console.error('Supabase client not initialized');
                return { synced: 0, total: 0 };
            }

            // Get entries from localStorage
            const savedEntries = localStorage.getItem('journalEntries');
            if (!savedEntries) return { synced: 0, total: 0 };

            const localEntries = JSON.parse(savedEntries);
            let syncedCount = 0;

            // Sync each entry
            for (const entry of localEntries) {
                const success = await this.saveJournalEntry(entry);
                if (success) syncedCount++;
            }

            // Clear localStorage after sync (optional)
            // localStorage.removeItem('journalEntries');

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
    console.log('=== Testing JournalService ===');
    
    // Check if service is initialized
    console.log('Service instance:', !!window.journalService);
    console.log('Service supabase client:', !!window.journalService?.supabase);
    console.log('Global mindguardSupabase:', !!window.mindguardSupabase);
    
    // Test getAllEntries
    console.log('Testing getAllEntries...');
    try {
        const entries = await window.journalService.getAllEntries();
        console.log(`✅ Success! Got ${entries.length} entries`);
        if (entries.length > 0) {
            console.log('First entry sample:', {
                id: entries[0].id,
                title: entries[0].title,
                content_preview: entries[0].content?.substring(0, 50) + '...',
                created_at: entries[0].created_at
            });
        }
        return entries;
    } catch (error) {
        console.error('❌ Test failed:', error);
        return null;
    }
};

// Auto-test when page loads (optional)
setTimeout(() => {
    console.log('JournalService auto-test starting...');
    if (window.journalService && window.journalService.supabase) {
        window.testJournalService();
    }
}, 3000);