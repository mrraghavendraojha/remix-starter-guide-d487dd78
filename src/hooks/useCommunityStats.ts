import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface CommunityStats {
  totalMembers: number;
  activeListings: number;
  completedDeals: number;
  hostelName: string;
}

export const useCommunityStats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<CommunityStats>({
    totalMembers: 0,
    activeListings: 0,
    completedDeals: 0,
    hostelName: 'Community'
  });

  const fetchStats = async () => {
    if (!user) return;

    try {
      // Get current user's hostel name
      const { data: profileData } = await supabase
        .from('profiles')
        .select('hostel_name')
        .eq('user_id', user.id)
        .single();

      const hostelName = profileData?.hostel_name || 'Community';

      // Get total members in the same hostel
      const { count: totalMembers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('hostel_name', hostelName);

      // Get active listings from the same hostel
      const { count: activeListings } = await supabase
        .from('listings')
        .select(`
          *,
          profiles!listings_user_id_fkey (hostel_name)
        `, { count: 'exact', head: true })
        .eq('is_active', true)
        .eq('profiles.hostel_name', hostelName);

      // For now, set completed deals to 0 since we don't have a completed deals table yet
      const completedDeals = 0;

      setStats({
        totalMembers: totalMembers || 0,
        activeListings: activeListings || 0,
        completedDeals,
        hostelName
      });
    } catch (error) {
      console.error('Error fetching community stats:', error);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [user]);

  return { stats, refetch: fetchStats };
};