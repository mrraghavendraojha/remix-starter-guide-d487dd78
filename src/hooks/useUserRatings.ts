import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Rating {
  id: string;
  rating: number;
  review: string | null;
  created_at: string;
  rater_name: string;
  listing_title: string;
}

export const useUserRatings = (userId: string) => {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchRatings = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('ratings')
        .select(`
          id,
          rating,
          review,
          created_at,
          rater_id,
          listing_id
        `)
        .eq('rated_user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profile and listing data separately
      const raterIds = [...new Set(data?.map(r => r.rater_id) || [])];
      const listingIds = [...new Set(data?.map(r => r.listing_id) || [])];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name')
        .in('user_id', raterIds);

      const { data: listings } = await supabase
        .from('listings')
        .select('id, title')
        .in('id', listingIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p.name]) || []);
      const listingMap = new Map(listings?.map(l => [l.id, l.title]) || []);

      const formattedRatings: Rating[] = data?.map(r => ({
        id: r.id,
        rating: r.rating,
        review: r.review,
        created_at: r.created_at,
        rater_name: profileMap.get(r.rater_id) || 'Anonymous',
        listing_title: listingMap.get(r.listing_id) || 'Unknown Item'
      })) || [];

      setRatings(formattedRatings);
    } catch (error: any) {
      toast({
        title: "Error fetching ratings",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRatings();
  }, [userId]);

  return {
    ratings,
    loading,
    refetch: fetchRatings
  };
};
