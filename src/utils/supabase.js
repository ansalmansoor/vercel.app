// Supabase Client Wrapper for SafeTClaim - User Management
// Users are stored in Supabase Postgres so passwords persist across all devices

const SUPABASE_URL = 'https://xogjvctufkisemwcizzd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhvZ2p2Y3R1Zmtpc2Vtd2NpenpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2NjMzODgsImV4cCI6MjA5NzIzOTM4OH0.bxY5hlDG3KLj3ekH6ejIvq9_mQ__vfRP6gv-y8XWLFc';

let _client = null;

function getClient() {
  if (!_client) {
    if (!window.supabase) {
      throw new Error('Supabase client not loaded. Check network connection.');
    }
    _client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return _client;
}

// Get all users from Supabase
export async function getSupabaseUsers() {
  const client = getClient();
  const { data, error } = await client
    .from('safet_users')
    .select('username, password, role, created_at');
  if (error) throw new Error('Failed to load users: ' + error.message);
  return data || [];
}

// Save (upsert) a user to Supabase
export async function saveSupabaseUser(user) {
  const client = getClient();
  const { error } = await client
    .from('safet_users')
    .upsert(
      { username: user.username, password: user.password, role: user.role },
      { onConflict: 'username' }
    );
  if (error) throw new Error('Failed to save user: ' + error.message);
  return user;
}

// Delete a user from Supabase by username
export async function deleteSupabaseUser(username) {
  const client = getClient();
  const { error } = await client
    .from('safet_users')
    .delete()
    .eq('username', username);
  if (error) throw new Error('Failed to delete user: ' + error.message);
  return true;
}
