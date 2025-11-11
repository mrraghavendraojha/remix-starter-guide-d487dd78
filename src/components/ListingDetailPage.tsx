import { useState } from "react";
import { useAuth } from '@/hooks/useAuth';
import { useConversations } from '@/hooks/useConversations';
import { useListingActions } from '@/hooks/useListingActions';
import { RatingDialog } from '@/components/RatingDialog';
import { ImageViewer } from '@/components/ImageViewer';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  ArrowLeft, 
  MessageCircle, 
  Heart, 
  Share2, 
  MapPin, 
  Calendar,
  Star,
  Shield,
  Clock,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2
} from "lucide-react";

interface ListingData {
  id: string;
  title: string;
  description: string;
  price: number | null;
  type: "sell" | "rent" | "donate";
  category: string;
  condition: "new" | "good" | "used";
  images: string[];
  owner: {
    id: string;
    name: string;
    block: string;
    room: string;
    rating: number;
    totalRatings: number;
    memberSince: string;
    verified: boolean;
    avatar?: string;
  };
  location: string;
  postedAt: Date;
  views: number;
  specifications?: Array<{ label: string; value: string }>;
}

interface ListingDetailProps {
  listingId: string;
  onBack: () => void;
  onStartConversation: (conversationId: string) => void;
  onViewProfile?: (userId: string) => void;
  onEditListing?: (listingId: string) => void;
  listingData?: ListingData;
}

export const ListingDetailPage = ({ listingId, onBack, onStartConversation, onViewProfile, onEditListing, listingData }: ListingDetailProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { createOrGetConversation } = useConversations();
  const { deleteListing, isDeleting } = useListingActions();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [imageViewerIndex, setImageViewerIndex] = useState(0);

  // Default fallback data if no listing data provided
  const defaultListing: ListingData = {
    id: listingId,
    title: "Listing Not Found",
    description: "This listing could not be loaded.",
    price: null,
    type: "sell",
    category: "unknown",
    condition: "used",
    images: [],
    owner: {
      id: "unknown",
      name: "Unknown User",
      block: "Unknown",
      room: "Unknown",
      rating: 0,
      totalRatings: 0,
      memberSince: "Unknown",
      verified: false
    },
    location: "Unknown",
    postedAt: new Date(),
    views: 0
  };

  const listing = listingData || defaultListing;

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
    return `₹${price.toLocaleString()}${type === "rent" ? "/day" : ""}`;
  };

  const handleStartConversation = async () => {
    if (!user) return;
    
    setIsCreatingConversation(true);
    try {
      const sellerId = listingData?.owner?.id;
      if (!sellerId) {
        toast({
          title: "Error",
          description: "Could not identify the listing owner",
          variant: "destructive"
        });
        return;
      }
      
      if (user.id === sellerId) {
        toast({
          title: "Cannot message yourself",
          description: "You cannot start a conversation with your own listing.",
          variant: "destructive"
        });
        return;
      }
      
      const conversationId = await createOrGetConversation(listing.id, sellerId);
      if (conversationId) {
        onStartConversation(conversationId);
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
    } finally {
      setIsCreatingConversation(false);
    }
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % listing.images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + listing.images.length) % listing.images.length);
  };

  const handleDelete = async () => {
    const success = await deleteListing(listing.id);
    if (success) {
      onBack();
    }
  };

  const handleImageClick = (index: number) => {
    setImageViewerIndex(index);
    setShowImageViewer(true);
  };

  const isOwner = user?.id === listing.owner.id;

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b p-2 md:p-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" className="h-8 w-8 md:h-10 md:w-10" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center space-x-1 md:space-x-2">
            {!isOwner && (
              <Button variant="ghost" size="icon" className="h-8 w-8 md:h-10 md:w-10" onClick={() => setIsFavorited(!isFavorited)}>
                <Heart className={`h-3 w-3 md:h-4 md:w-4 ${isFavorited ? "fill-red-500 text-red-500" : ""}`} />
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="icon"
              className="h-8 w-8 md:h-10 md:w-10"
              onClick={() => {
                const shareUrl = `${window.location.origin}?listing=${listing.id}`;
                navigator.clipboard.writeText(shareUrl);
                toast({
                  title: "Link copied!",
                  description: "Share link copied to clipboard"
                });
              }}
            >
              <Share2 className="h-3 w-3 md:h-4 md:w-4" />
            </Button>
            {isOwner && (
              <>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-8 w-8 md:h-10 md:w-10"
                  onClick={() => {
                    if (onEditListing) {
                      onEditListing(listing.id);
                    }
                  }}
                >
                  <Edit className="h-3 w-3 md:h-4 md:w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-8 w-8 md:h-10 md:w-10"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="h-3 w-3 md:h-4 md:w-4 text-destructive" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto p-2 md:p-4 max-w-4xl">
        <div className="grid lg:grid-cols-2 gap-3 md:gap-6">
          {/* Images */}
          <div className="space-y-2 md:space-y-4">
            <Card className="overflow-hidden">
              <div className="relative aspect-square bg-muted cursor-pointer" onClick={() => handleImageClick(currentImageIndex)}>
                <img
                  src={listing.images[currentImageIndex]}
                  alt={listing.title}
                  className="w-full h-full object-cover"
                />
                {listing.images.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-background/80"
                      onClick={prevImage}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-background/80"
                      onClick={nextImage}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </>
                )}
                <Badge className={`absolute top-3 left-3 ${getTypeColor(listing.type)}`}>
                  {listing.type.charAt(0).toUpperCase() + listing.type.slice(1)}
                </Badge>
              </div>
            </Card>
            
            {/* Image thumbnails */}
            {listing.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {listing.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setCurrentImageIndex(index);
                      handleImageClick(index);
                    }}
                    className={`flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 ${
                      index === currentImageIndex ? "border-primary" : "border-border"
                    }`}
                  >
                    <img src={image} alt={`View ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-3 md:space-y-6">
            {/* Title and Price */}
            <div>
              <h1 className="text-lg md:text-2xl font-bold mb-1 md:mb-2">{listing.title}</h1>
              <div className="flex items-center justify-between">
                <p className="text-xl md:text-3xl font-bold text-primary">
                  {formatPrice(listing.price, listing.type)}
                </p>
                <div className="flex items-center space-x-1 md:space-x-2 text-xs md:text-sm text-muted-foreground">
                  <Clock className="h-3 w-3 md:h-4 md:w-4" />
                  <span className="hidden md:inline">{listing.views} views</span>
                  <span className="md:hidden">{listing.views}</span>
                </div>
              </div>
            </div>

            {/* Owner Info */}
            <Card className="p-2 md:p-4 bg-card-gradient">
              <div className="flex items-center space-x-2 md:space-x-3">
                <Avatar className="h-10 w-10 md:h-12 md:w-12">
                  <AvatarImage src={listing.owner.avatar} alt={listing.owner.name} />
                  <AvatarFallback>{listing.owner.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center space-x-1 md:space-x-2">
                    <h3 className="font-semibold text-sm md:text-base">{listing.owner.name}</h3>
                    {listing.owner.verified && (
                      <Shield className="h-3 w-3 md:h-4 md:w-4 text-primary" />
                    )}
                  </div>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    {listing.owner.block} • {listing.owner.room}
                  </p>
                  <div className="flex items-center space-x-1 md:space-x-2 mt-1">
                    <div className="flex items-center space-x-0.5 md:space-x-1">
                      <Star className="h-2.5 w-2.5 md:h-3 md:w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs md:text-sm font-medium">{listing.owner.rating}</span>
                      <span className="text-[10px] md:text-xs text-muted-foreground">({listing.owner.totalRatings})</span>
                    </div>
                    <span className="text-[10px] md:text-xs text-muted-foreground hidden md:inline">• Member since {listing.owner.memberSince}</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Contact Buttons */}
            {!isOwner && (
              <div className="flex gap-1.5 md:gap-2">
                <Button 
                  className="flex-1 h-8 md:h-10 text-xs md:text-sm"
                  variant="community"
                  onClick={handleStartConversation}
                  disabled={isCreatingConversation}
                >
                  <MessageCircle className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                  <span className="hidden md:inline">{isCreatingConversation ? 'Starting...' : 'Chat with Owner'}</span>
                  <span className="md:hidden">Chat</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1 h-8 md:h-10 text-xs md:text-sm"
                  onClick={() => {
                    if (onViewProfile) {
                      onViewProfile(listing.owner.id);
                    }
                  }}
                >
                  <span className="hidden md:inline">View Profile</span>
                  <span className="md:hidden">Profile</span>
                </Button>
              </div>
            )}
            
            {isOwner && (
              <div className="flex gap-1.5 md:gap-2">
                <Button 
                  className="flex-1 h-8 md:h-10 text-xs md:text-sm" 
                  variant="outline"
                  onClick={() => {
                    if (onEditListing) {
                      onEditListing(listing.id);
                    }
                  }}
                >
                  <Edit className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                  <span className="hidden md:inline">Edit Listing</span>
                  <span className="md:hidden">Edit</span>
                </Button>
                <Button 
                  className="flex-1 h-8 md:h-10 text-xs md:text-sm" 
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={isDeleting}
                >
                  <Trash2 className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                  <span className="hidden md:inline">{isDeleting ? 'Deleting...' : 'Delete'}</span>
                  <span className="md:hidden">Del</span>
                </Button>
              </div>
            )}

            {/* Categories and Condition */}
            <div className="flex flex-wrap gap-1 md:gap-2">
              <Badge variant="outline" className="text-xs">{listing.category}</Badge>
              <Badge variant="outline" className="text-xs">{listing.condition}</Badge>
            </div>

            {/* Location and Date */}
            <div className="space-y-1 md:space-y-2 text-xs md:text-sm text-muted-foreground">
              <div className="flex items-center space-x-1 md:space-x-2">
                <MapPin className="h-3 w-3 md:h-4 md:w-4" />
                <span>{listing.location}</span>
              </div>
              <div className="flex items-center space-x-1 md:space-x-2">
                <Calendar className="h-3 w-3 md:h-4 md:w-4" />
                <span>Posted {listing.postedAt.toLocaleDateString()}</span>
              </div>
            </div>

            <Separator />

            {/* Specifications */}
            {listing.specifications && (
              <div>
                <h3 className="font-semibold mb-2 md:mb-3 text-sm md:text-base">Specifications</h3>
                <div className="space-y-1 md:space-y-2">
                  {listing.specifications.map((spec, index) => (
                    <div key={index} className="flex justify-between text-xs md:text-sm">
                      <span className="text-muted-foreground">{spec.label}</span>
                      <span className="font-medium">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Description */}
            <div>
              <h3 className="font-semibold mb-2 md:mb-3 text-sm md:text-base">Description</h3>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line select-text text-xs md:text-sm">
                {listing.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Listing</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this listing? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rating Dialog */}
      <RatingDialog
        isOpen={showRatingDialog}
        onClose={() => setShowRatingDialog(false)}
        ratedUserId={listing.owner.id}
        ratedUserName={listing.owner.name}
        listingId={listing.id}
        listingTitle={listing.title}
      />

      {/* Image Viewer */}
      <ImageViewer
        images={listing.images}
        initialIndex={imageViewerIndex}
        isOpen={showImageViewer}
        onClose={() => setShowImageViewer(false)}
      />
    </div>
  );
};