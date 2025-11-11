import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ListingCard } from "@/components/ListingCard";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Filter, Plus, Users, TrendingUp, Heart, PackageOpen } from "lucide-react";
import heroImage from "@/assets/hero-community.jpg";

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

interface CommunityStats {
  totalMembers: number;
  activeListings: number;
  completedDeals: number;
  hostelName?: string;
}

interface HomePageProps {
  isAuthenticated: boolean;
  onShowAuth: () => void;
  onCreateListing: () => void;
  onViewListing?: (listingId: string) => void;
  listings?: Listing[];
  onListingCreated?: (listing: Listing) => void;
  communityStats?: CommunityStats;
  favorites?: Set<string>;
  onFavorite?: (listingId: string) => void;
  isFavorited?: (listingId: string) => boolean;
}

export const HomePage = ({ 
  isAuthenticated, 
  onShowAuth, 
  onCreateListing, 
  onViewListing, 
  listings = [],
  onListingCreated,
  communityStats,
  favorites: externalFavorites,
  onFavorite: externalOnFavorite,
  isFavorited: externalIsFavorited
}: HomePageProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedType, setSelectedType] = useState("all");

  // Use provided stats with actual listing count from props
  const stats = communityStats ? {
    ...communityStats,
    activeListings: listings.length // Use actual listings count for real-time updates
  } : {
    totalMembers: 0,
    activeListings: listings.length,
    completedDeals: 0,
    hostelName: 'Community'
  };

  const categories = ["All", "Electronics", "Books", "Furniture", "Sports", "Clothing", "Others"];
  const types = ["All", "Sell", "Rent", "Donate"];

  const handleFavorite = (listingId: string) => {
    if (externalOnFavorite) {
      externalOnFavorite(listingId);
    }
  };

  const mainFilteredListings = listings.filter(listing => {
    const matchesSearch = listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         listing.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || listing.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesType = selectedType === "all" || listing.type === selectedType.toLowerCase();
    
    return matchesSearch && matchesCategory && matchesType;
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section 
          className="relative min-h-screen flex items-center justify-center overflow-hidden"
          aria-labelledby="hero-heading"
        >
          <div className="absolute inset-0" aria-hidden="true">
            <img 
              src={heroImage}
              alt="Happy community members sharing and trading items in a friendly hostel environment" 
              fetchPriority="high"
              decoding="async"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-hero-gradient opacity-95" />
          </div>
          
          <div className="relative z-10 text-center text-white px-6 max-w-5xl animate-fade-in">
            <h1 
              id="hero-heading" 
              className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight drop-shadow-2xl"
            >
              Share Within Your
              <span className="block bg-warm-gradient bg-clip-text text-transparent mt-3 drop-shadow-lg">
                Community
              </span>
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl mb-12 opacity-95 max-w-3xl mx-auto leading-relaxed drop-shadow-lg font-medium">
              Buy, sell, rent, and donate with your hostel mates. Safe, local, and convenient.
            </p>
            <div className="flex flex-col sm:flex-row gap-5 justify-center">
              <Button 
                size="lg" 
                variant="warm"
                onClick={onShowAuth}
                className="text-base md:text-lg px-12 py-7 h-auto shadow-glow hover:scale-105 transition-spring font-bold"
                aria-label="Join CommunityShare and start trading with your community"
              >
                Join Your Community
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="text-base md:text-lg px-12 py-7 h-auto bg-white/10 backdrop-blur-md border-2 border-white/40 text-white hover:bg-white/20 hover:border-white/60 shadow-soft hover:scale-105 transition-spring font-semibold"
                aria-label="Learn more about CommunityShare features"
              >
                Learn More
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-28 bg-gradient-to-b from-muted/30 via-background to-accent/10" aria-labelledby="features-heading">
          <div className="container mx-auto px-6">
            <h2 
              id="features-heading" 
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-center mb-20 text-foreground"
            >
              Why Choose CommunityShare?
            </h2>
            <div className="grid md:grid-cols-3 gap-8 lg:gap-10 max-w-6xl mx-auto">
              <Card 
                className="p-10 text-center shadow-hover hover:shadow-glow transition-spring bg-glass-gradient border-2 hover:border-primary/30 group"
                role="article"
                aria-labelledby="feature-verified"
              >
                <div className="w-24 h-24 bg-community-gradient rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-community group-hover:scale-110 transition-spring" aria-hidden="true">
                  <Users className="h-12 w-12 text-white" aria-hidden="true" />
                </div>
                <h3 id="feature-verified" className="text-2xl md:text-3xl font-bold mb-5 text-card-foreground">Community Verified</h3>
                <p className="text-muted-foreground leading-relaxed text-base">
                  Only verified members from your hostel can access listings. Safe and trusted.
                </p>
              </Card>
              
              <Card 
                className="p-10 text-center shadow-hover hover:shadow-glow transition-spring bg-glass-gradient border-2 hover:border-secondary/30 group"
                role="article"
                aria-labelledby="feature-transactions"
              >
                <div className="w-24 h-24 bg-warm-gradient rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-card group-hover:scale-110 transition-spring" aria-hidden="true">
                  <TrendingUp className="h-12 w-12 text-secondary-foreground" aria-hidden="true" />
                </div>
                <h3 id="feature-transactions" className="text-2xl md:text-3xl font-bold mb-5 text-card-foreground">Easy Transactions</h3>
                <p className="text-muted-foreground leading-relaxed text-base">
                  Simple buying, selling, and renting with built-in chat and rating system.
                </p>
              </Card>
              
              <Card 
                className="p-10 text-center shadow-hover hover:shadow-glow transition-spring bg-glass-gradient border-2 hover:border-accent-foreground/30 group"
                role="article"
                aria-labelledby="feature-giveback"
              >
                <div className="w-24 h-24 bg-accent rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-card group-hover:scale-110 transition-spring" aria-hidden="true">
                  <Heart className="h-12 w-12 text-accent-foreground" aria-hidden="true" />
                </div>
                <h3 id="feature-giveback" className="text-2xl md:text-3xl font-bold mb-5 text-card-foreground">Give Back</h3>
                <p className="text-muted-foreground leading-relaxed text-base">
                  Donate items you no longer need and help fellow community members.
                </p>
              </Card>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="pb-16 md:pb-0 bg-gradient-to-b from-background via-muted/10 to-background">
      {/* Community Stats Header */}
      <section 
        className="bg-hero-gradient text-white px-2 py-2.5 shadow-glow" 
        aria-labelledby="community-heading"
      >
        <div className="container mx-auto max-w-6xl">
          <h2 
            id="community-heading" 
            className="text-sm md:text-3xl font-bold mb-1.5 md:mb-4 drop-shadow-lg"
          >
            {communityStats?.hostelName || 'Your Community'}
          </h2>
          <div className="grid grid-cols-3 gap-1 md:gap-4" role="list">
            <div className="bg-white/15 backdrop-blur-md rounded-lg p-1.5 md:p-4 shadow-card hover:bg-white/20 transition-smooth border border-white/20" role="listitem">
              <p className="text-base md:text-3xl font-bold mb-0 md:mb-1" aria-label={`${stats.totalMembers} community members`}>{stats.totalMembers}</p>
              <p className="text-[9px] md:text-sm opacity-90 font-medium">Members</p>
            </div>
            <div className="bg-white/15 backdrop-blur-md rounded-lg p-1.5 md:p-4 shadow-card hover:bg-white/20 transition-smooth border border-white/20" role="listitem">
              <p className="text-base md:text-3xl font-bold mb-0 md:mb-1" aria-label={`${stats.activeListings} active items`}>{stats.activeListings}</p>
              <p className="text-[9px] md:text-sm opacity-90 font-medium">Active Items</p>
            </div>
            <div className="bg-white/15 backdrop-blur-md rounded-lg p-1.5 md:p-4 shadow-card hover:bg-white/20 transition-smooth border border-white/20" role="listitem">
              <p className="text-base md:text-3xl font-bold mb-0 md:mb-1" aria-label={`${stats.completedDeals} completed deals`}>{stats.completedDeals}</p>
              <p className="text-[9px] md:text-sm opacity-90 font-medium">Completed</p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="p-2 bg-background" aria-label="Quick actions">
        <div className="container mx-auto max-w-6xl">
          <Button 
            variant="cta" 
            className="w-full shadow-glow hover:shadow-hover transition-spring relative overflow-hidden group h-9 md:h-auto"
            size="xl"
            onClick={onCreateListing}
            aria-label="Create your first listing"
          >
            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" aria-hidden="true"></div>
            <Plus className="h-4 w-4 md:h-6 md:w-6 mr-1.5 md:mr-2 group-hover:rotate-90 transition-transform duration-300" aria-hidden="true" />
            <span className="relative z-10 text-xs md:text-base">List Your First Item</span>
          </Button>
        </div>
      </section>

      {/* Search and Filters */}
      <section className="px-2 pb-2 bg-background" aria-label="Search and filter listings">
        <div className="container mx-auto max-w-6xl space-y-1.5">
          <div className="flex gap-1.5">
            <div className="relative flex-1">
              <Search className="absolute left-2 md:left-4 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 md:h-5 md:w-5 text-muted-foreground" aria-hidden="true" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-7 md:pl-12 h-7 md:h-11 text-xs md:text-base shadow-card border focus:shadow-glow transition-smooth rounded-lg"
                aria-label="Search listings by title or description"
                type="search"
              />
            </div>
            <Button 
              variant="outline" 
              size="icon" 
              className="h-7 w-7 md:h-11 md:w-11 border rounded-lg shadow-soft hover:shadow-card transition-smooth"
              aria-label="Open advanced filters"
            >
              <Filter className="h-3.5 w-3.5 md:h-5 md:w-5" aria-hidden="true" />
            </Button>
          </div>

          {/* Category Filters */}
          <div className="flex gap-1 md:gap-3 overflow-x-auto pb-1 scrollbar-hide" role="group" aria-label="Filter by category">
            {categories.map((category) => (
              <Badge
                key={category}
                variant={selectedCategory === category.toLowerCase() ? "default" : "outline"}
                className="cursor-pointer whitespace-nowrap text-[10px] md:text-sm py-0.5 md:py-1.5 px-2 md:px-4 border font-semibold shadow-soft hover:shadow-card transition-spring active:scale-95"
                onClick={() => setSelectedCategory(category.toLowerCase())}
                role="button"
                tabIndex={0}
                aria-pressed={selectedCategory === category.toLowerCase()}
                aria-label={`Filter by ${category}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedCategory(category.toLowerCase());
                  }
                }}
              >
                {category}
              </Badge>
            ))}
          </div>

          {/* Type Filters */}
          <div className="flex gap-1 md:gap-3 overflow-x-auto pb-1 scrollbar-hide" role="group" aria-label="Filter by listing type">
            {types.map((type) => (
              <Badge
                key={type}
                variant={selectedType === type.toLowerCase() ? "default" : "outline"}
                className="cursor-pointer whitespace-nowrap text-[10px] md:text-sm py-0.5 md:py-1.5 px-2 md:px-4 border font-semibold shadow-soft hover:shadow-card transition-spring active:scale-95"
                onClick={() => setSelectedType(type.toLowerCase())}
                role="button"
                tabIndex={0}
                aria-pressed={selectedType === type.toLowerCase()}
                aria-label={`Filter by ${type}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedType(type.toLowerCase());
                  }
                }}
              >
                {type}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* Listings Grid */}
      <section className="px-2 pb-2 bg-gradient-to-b from-background to-muted/20" aria-label="Available listings">
        <div className="container mx-auto max-w-6xl">
          <div 
            className="grid gap-1.5 grid-cols-2 md:gap-4 md:grid-cols-3"
            role="list"
            aria-label={`${mainFilteredListings.length} listings available`}
          >
            {mainFilteredListings.length > 0 ? (
              mainFilteredListings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  onViewDetails={onViewListing}
                  onFavorite={handleFavorite}
                  isFavorited={externalIsFavorited ? externalIsFavorited(listing.id) : false}
                />
              ))
            ) : null}
          </div>
          
          {mainFilteredListings.length === 0 && listings.length > 0 && (
            <EmptyState
              icon={PackageOpen}
              title="No Items Found"
              description="Try adjusting your search or filters to find what you're looking for."
              actionLabel="Clear Filters"
              onAction={() => {
                setSearchQuery("");
                setSelectedCategory("all");
                setSelectedType("all");
              }}
              className="mt-6"
            />
          )}
          
          {mainFilteredListings.length === 0 && listings.length === 0 && (
            <EmptyState
              icon={Plus}
              title="No Items Yet"
              description="Be the first to share something with your community! List an item to get started."
              actionLabel="Create First Listing"
              onAction={onCreateListing}
              className="mt-6"
            />
          )}
        </div>
      </section>
    </div>
  );
};