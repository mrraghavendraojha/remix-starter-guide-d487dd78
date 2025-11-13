import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useListingActions = () => {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteListing = async (listingId: string) => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', listingId);

      if (error) throw error;

      toast({
        title: "Listing deleted",
        description: "Your listing has been deleted successfully."
      });

      return true;
    } catch (error: any) {
      toast({
        title: "Error deleting listing",
        description: error.message,
        variant: "destructive"
      });
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    deleteListing,
    isDeleting
  };
};
