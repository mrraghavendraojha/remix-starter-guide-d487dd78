import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ListingCard } from "@/components/ListingCard";
import { ArrowLeft, Heart } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface FavoritesPageProps {
  onBack: () => void;
  onViewListing?: (listingId: string) => void;
}

interface Listing {
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
}

export const FavoritesPage = ({ onBack, onViewListing }: FavoritesPageProps) => {
  const { favorites, toggleFavorite, isFavorited } = useFavorites();
  const [favoriteListings, setFavoriteListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchFavoriteListings = async () => {
      if (favorites.size === 0) {
        setFavoriteListings([]);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('listings')
          .select(`
            *,
            profiles!listings_user_id_fkey (
              name,
              block,
              rating
            )
          `)
          .in('id', Array.from(favorites))
          .eq('is_active', true);

        if (error) throw error;

        const formattedListings: Listing[] = data?.map(listing => ({
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
          postedAt: new Date(listing.created_at)
        })) || [];

        setFavoriteListings(formattedListings);
      } catch (error: any) {
        toast({
          title: "Error fetching favorites",
          description: error.message,
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchFavoriteListings();
  }, [favorites, toast]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border p-2 md:p-4">
        <div className="flex items-center space-x-2 md:space-x-3">
          <Button variant="ghost" size="icon" className="h-8 w-8 md:h-10 md:w-10" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
          <div className="flex items-center space-x-1.5 md:space-x-2">
            <Heart className="h-4 w-4 md:h-5 md:w-5 fill-primary text-primary" />
            <h1 className="text-lg md:text-2xl font-bold text-foreground">My Favorites</h1>
          </div>
        </div>
      </div>

      {/* Favorites Grid */}
      <section className="p-2 md:p-4">
        <div className="container mx-auto">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-muted-foreground text-sm">Loading favorites...</p>
            </div>
          ) : favoriteListings.length > 0 ? (
            <div className="grid gap-1.5 grid-cols-2 md:gap-4 md:grid-cols-3">
              {favoriteListings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  onViewDetails={onViewListing}
                  onFavorite={toggleFavorite}
                  isFavorited={isFavorited(listing.id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-lg font-medium text-foreground mb-1">No favorites yet</h3>
              <p className="text-muted-foreground text-sm">
                Start browsing listings and tap the heart icon to save your favorites
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
