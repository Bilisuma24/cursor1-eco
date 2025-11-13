import { supabase } from '../lib/supabaseClient';

export async function getUserLevel(userId, role) {
  const { data, error } = await supabase.rpc('get_user_level', { p_user_id: userId, p_role: role });
  if (error) throw error;
  return data?.[0] || null;
}

export async function getUserAchievements(userId, role) {
  const { data, error } = await supabase.rpc('get_user_achievements', { p_user_id: userId, p_role: role });
  if (error) throw error;
  return data || [];
}

export async function getProgress(userId, role) {
  const { data, error } = await supabase.rpc('get_progress', { p_user_id: userId, p_role: role });
  if (error) throw error;
  return data || {};
}

export function onNewAchievement(callback) {
  // Listen to inserts on user_achievements for realtime celebration
  const channel = supabase
    .channel('achievements')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'user_achievements' }, (payload) => {
      callback(payload?.new);
    })
    .subscribe();
  return () => supabase.removeChannel(channel);
}


















