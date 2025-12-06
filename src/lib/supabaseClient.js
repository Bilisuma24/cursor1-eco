import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://azvslusinlvnjymaufhw.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6dnNsdXNpbmx2bmp5bWF1Zmh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NjYwNjYsImV4cCI6MjA3NTU0MjA2Nn0.4MdiznfE-UOdDn25X8XocML44UrCxpsJ2fIgvULevnw'

// Debug: log if using environment variables
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key loaded:', !!supabaseKey);

// Check if Supabase URL is accessible
if (typeof window !== 'undefined') {
  // Test DNS resolution in browser
  const testConnection = async () => {
    try {
      const testUrl = supabaseUrl.replace('/rest/v1', '');
      const response = await fetch(`${testUrl}/rest/v1/`, { 
        method: 'HEAD',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      console.log('✅ Supabase connection test: SUCCESS');
    } catch (error) {
      console.error('❌ Supabase connection test: FAILED');
      console.error('Error:', error.message);
      if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
        console.warn('⚠️ SUPABASE PROJECT ISSUE DETECTED:');
        console.warn('   1. Check if your Supabase project is paused (free tier pauses after inactivity)');
        console.warn('   2. Go to https://supabase.com/dashboard and check project status');
        console.warn('   3. If paused, click "Restore project" to reactivate it');
        console.warn('   4. Verify the project URL is correct:', supabaseUrl);
        console.warn('   5. If using a different project, update VITE_SUPABASE_URL in .env file');
      }
    }
  };
  
  // Run connection test after a short delay
  setTimeout(testConnection, 1000);
}

export const supabase = createClient(supabaseUrl, supabaseKey)
