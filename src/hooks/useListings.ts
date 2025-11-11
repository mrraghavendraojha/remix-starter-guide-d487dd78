import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number | null;
  type: "sell" | "rent" | "donate";
  category: string;
  condition: "new" | "good" | "used";
  images: string[];
  owner: {
    name: string;
    block: string;
    rating: number;
  };
  location: string;
  postedAt: Date;
  userId: string;
  rentPeriod?: string;
  deposit?: number;
  availableFrom?: string;
  availableTo?: string;
  isActive: boolean;
}

export const useListings = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchListings = async () => {
    try {
      setLoading(true);
      
      // Get current user's hostel_name for filtering
      const { data: { user } } = await supabase.auth.getUser();
      let userHostelName = null;
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('hostel_name')
          .eq('user_id', user.id)
          .single();
        
        userHostelName = profile?.hostel_name;
      }
      
      const { data, error } = await supabase
        .from('listings')
        .select(`
          *,
          profiles!listings_user_id_fkey (
            name,
            block,
            rating,
            hostel_name
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Filter listings by hostel_name if user has one
      const filteredData = userHostelName 
        ? data?.filter(listing => (listing as any).profiles?.hostel_name === userHostelName)
        : data;

      const formattedListings: Listing[] = filteredData?.map(listing => ({
        id: listing.id,
        title: listing.title,
        description: listing.description,
        price: listing.price,
        type: listing.type,
        category: listing.category,
        condition: listing.condition,
        images: listing.images || [],
        owner: {
          name: (listing as any).profiles?.name || 'Unknown',
          block: (listing as any).profiles?.block || 'Unknown',
          rating: (listing as any).profiles?.rating || 0
        },
        location: listing.location,
        postedAt: new Date(listing.created_at),
        userId: listing.user_id,
        rentPeriod: listing.rent_period,
        deposit: listing.deposit,
        availableFrom: listing.available_from,
        availableTo: listing.available_to,
        isActive: listing.is_active
      })) || [];

      setListings(formattedListings);
    } catch (error: any) {
      toast({
        title: "Error fetching listings",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createListing = async (listingData: any, imageFiles: File[]) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upload images first
      const imageUrls: string[] = [];
      for (const file of imageFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('listing-images')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('listing-images')
          .getPublicUrl(fileName);

        imageUrls.push(publicUrl);
      }

      // Create listing
      const { data, error } = await supabase
        .from('listings')
        .insert({
          user_id: user.id,
          title: listingData.title,
          description: listingData.description,
          price: listingData.type === 'donate' ? null : parseFloat(listingData.price),
          type: listingData.type,
          category: listingData.category,
          condition: listingData.condition,
          images: imageUrls,
          location: listingData.location,
          rent_period: listingData.rentPeriod,
          deposit: listingData.deposit ? parseFloat(listingData.deposit) : null,
          available_from: listingData.availableFrom || null,
          available_to: listingData.availableTo || null
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Listing created!",
        description: "Your item has been listed successfully.",
        variant: "default"
      });

      // Refresh listings
      await fetchListings();
      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Failed to create listing",
        description: error.message,
        variant: "destructive"
      });
      return { data: null, error };
    }
  };

  const updateListing = async (listingId: string, listingData: any, imageFiles: File[], existingImages: string[]) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upload new images
      const newImageUrls: string[] = [];
      for (const file of imageFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('listing-images')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('listing-images')
          .getPublicUrl(fileName);

        newImageUrls.push(publicUrl);
      }

      // Combine existing and new images
      const allImageUrls = [...existingImages, ...newImageUrls];

      // Update listing
      const { data, error } = await supabase
        .from('listings')
        .update({
          title: listingData.title,
          description: listingData.description,
          price: listingData.type === 'donate' ? null : parseFloat(listingData.price),
          type: listingData.type,
          category: listingData.category,
          condition: listingData.condition,
          images: allImageUrls,
          location: listingData.location,
          rent_period: listingData.rentPeriod,
          deposit: listingData.deposit ? parseFloat(listingData.deposit) : null,
          available_from: listingData.availableFrom || null,
          available_to: listingData.availableTo || null
        })
        .eq('id', listingId)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Listing updated!",
        description: "Your item has been updated successfully.",
        variant: "default"
      });

      // Refresh listings
      await fetchListings();
      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Failed to update listing",
        description: error.message,
        variant: "destructive"
      });
      return { data: null, error };
    }
  };

  useEffect(() => {
    // Only fetch if listings are empty
    if (listings.length === 0) {
      fetchListings();
    }
  }, []);

  return {
    listings,
    loading,
    createListing,
    updateListing,
    refetch: fetchListings
  };
};