import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface BlockedUser {
  id: string;
  blocked_user_id: string;
  created_at: string;
  blocked_user_name?: string;
  blocked_user_avatar?: string;
}

export const useBlockedUsers = () => {
  const { user } = useAuth();
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBlockedUsers = async () => {
    if (!user) {
      setBlockedUsers([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('blocked_users')
        .select(`
          id,
          blocked_user_id,
          created_at,
          profiles!blocked_users_blocked_user_id_fkey (
            name,
            avatar_url
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedData = data?.map(item => ({
        id: item.id,
        blocked_user_id: item.blocked_user_id,
        created_at: item.created_at,
        blocked_user_name: (item as any).profiles?.name || 'Unknown User',
        blocked_user_avatar: (item as any).profiles?.avatar_url || null,
      })) || [];

      setBlockedUsers(formattedData);
    } catch (error) {
      console.error('Error fetching blocked users:', error);
      setBlockedUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlockedUsers();
  }, [user]);

  const blockUser = async (blockedUserId: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      const { error } = await supabase
        .from('blocked_users')
        .insert({
          user_id: user.id,
          blocked_user_id: blockedUserId,
        });

      if (error) throw error;

      await fetchBlockedUsers();
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const unblockUser = async (blockedUserId: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      const { error } = await supabase
        .from('blocked_users')
        .delete()
        .eq('user_id', user.id)
        .eq('blocked_user_id', blockedUserId);

      if (error) throw error;

      await fetchBlockedUsers();
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const isUserBlocked = (userId: string) => {
    return blockedUsers.some(blocked => blocked.blocked_user_id === userId);
  };

  return {
    blockedUsers,
    loading,
    blockUser,
    unblockUser,
    isUserBlocked,
    refetch: fetchBlockedUsers,
  };
};
