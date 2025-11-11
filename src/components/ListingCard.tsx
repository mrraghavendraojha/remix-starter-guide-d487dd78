import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, MapPin, Calendar, User } from "lucide-react";
import { useState } from "react";

interface ListingCardProps {
  listing: {
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
  };
  
  onFavorite?: (listingId: string) => void;
  onViewDetails?: (listingId: string) => void;
  isFavorited?: boolean;
}

export const ListingCard = ({ listing, onFavorite, onViewDetails, isFavorited = false }: ListingCardProps) => {

  const getTypeColor = (type: string) => {
    switch (type) {
      case "sell": return "bg-primary text-primary-foreground";
      case "rent": return "bg-warm-amber text-foreground";
      case "donate": return "bg-secondary text-secondary-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const formatPrice = (price: number | null, type: string) => {
    if (type === "donate") return "Free";
    if (!price) return "Price not set";
    return `₹${price}${type === "rent" ? "/day" : ""}`;
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    if ('vibrate' in navigator) {
      navigator.vibrate(isFavorited ? 10 : 20);
    }
    onFavorite?.(listing.id);
  };

  return (
    <Card 
      className="group overflow-hidden shadow-soft hover:shadow-hover transition-smooth bg-card-gradient cursor-pointer border" 
      onClick={() => onViewDetails?.(listing.id)}
      role="article"
      aria-label={`${listing.title} - ${formatPrice(listing.price, listing.type)}`}
    >
      {/* Image */}
      <div className="relative h-28 md:h-44 bg-muted overflow-hidden">
        {listing.images.length > 0 ? (
          <img
            src={listing.images[0]}
            alt={`${listing.title} - ${listing.condition} condition ${listing.category}`}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover group-hover:scale-105 transition-smooth"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-accent/30 backdrop-blur-sm" role="img" aria-label="No image available">
            <span className="text-accent-foreground text-xs md:text-sm font-medium">No image</span>
          </div>
        )}
        
        {/* Type Badge */}
        <Badge 
          className={`absolute top-1 left-1 md:top-2 md:left-2 shadow-soft font-semibold text-[9px] md:text-xs ${getTypeColor(listing.type)}`}
          aria-label={`Listing type: ${listing.type}`}
        >
          {listing.type.charAt(0).toUpperCase() + listing.type.slice(1)}
        </Badge>
        
        {/* Favorite Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-1 right-1 md:top-2 md:right-2 h-6 w-6 md:h-8 md:w-8 bg-background/90 backdrop-blur-sm hover:bg-background shadow-soft"
          onClick={handleFavorite}
          aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
          aria-pressed={isFavorited}
        >
          <Heart 
            className={`h-3 w-3 md:h-4 md:w-4 transition-smooth ${isFavorited ? "fill-red-500 text-red-500" : "text-muted-foreground"}`}
            aria-hidden="true"
          />
        </Button>
      </div>

      {/* Content */}
      <div className="p-1.5 md:p-4 space-y-1 md:space-y-2.5">
        {/* Title and Price */}
        <div className="flex justify-between items-start gap-1 md:gap-2">
          <h3 className="font-bold text-[11px] md:text-base line-clamp-2 text-card-foreground leading-tight">
            {listing.title}
          </h3>
          <div className="text-right flex-shrink-0">
            <p className="font-bold text-primary text-xs md:text-base whitespace-nowrap" aria-label={`Price: ${formatPrice(listing.price, listing.type)}`}>
              {formatPrice(listing.price, listing.type)}
            </p>
          </div>
        </div>

        {/* Description */}
        <p className="text-muted-foreground text-[10px] md:text-sm line-clamp-2 leading-relaxed hidden md:block">
          {listing.description}
        </p>

        {/* Details */}
        <div className="flex flex-wrap gap-1 md:gap-2" role="list" aria-label="Item details">
          <Badge variant="outline" className="text-[8px] md:text-xs font-medium border" role="listitem">
            {listing.category}
          </Badge>
          <Badge variant="outline" className="text-[8px] md:text-xs font-medium border" role="listitem">
            {listing.condition}
          </Badge>
        </div>

        {/* Location and Owner Info */}
        <div className="flex items-center justify-between text-[9px] md:text-sm text-muted-foreground pt-0.5">
          <div className="flex items-center gap-0.5 md:gap-1.5" aria-label={`Location: ${listing.location}`}>
            <MapPin className="h-2.5 w-2.5 md:h-3.5 md:w-3.5 flex-shrink-0" aria-hidden="true" />
            <span className="font-medium truncate">{listing.location}</span>
          </div>
          <div className="flex items-center gap-0.5 md:gap-1.5 hidden md:flex" aria-label={`Owner: ${listing.owner.name}, Block ${listing.owner.block}`}>
            <User className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
            <span className="font-medium truncate">{listing.owner.name} • {listing.owner.block}</span>
          </div>
        </div>

        {/* Posted Date */}
        <div className="flex items-center gap-0.5 md:gap-1.5 text-[9px] md:text-xs text-muted-foreground hidden md:flex">
          <Calendar className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
          <time dateTime={listing.postedAt.toISOString()}>
            {listing.postedAt.toLocaleDateString()}
          </time>
        </div>

        {/* View Details Button */}
        <Button 
          className="w-full mt-1 md:mt-2 group/btn h-6 md:h-auto text-[10px] md:text-sm"
          variant="community"
          size="default"
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails?.(listing.id);
          }}
          aria-label={`View details for ${listing.title}`}
        >
          <span>View Details</span>
          <svg className="w-3 h-3 md:w-4 md:h-4 group-hover/btn:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Button>
      </div>
    </Card>
  );
};