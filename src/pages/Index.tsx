import { useState, lazy, Suspense } from "react";
import { Navigation } from "@/components/ui/navigation";
import { HomePage } from "@/components/HomePage";
import { AuthPage } from "@/components/AuthPage";
import { SettingsDialog } from "@/components/SettingsDialog";
import { useAuth } from "@/hooks/useAuth";
import { useListings } from "@/hooks/useListings";
import { useFavorites } from "@/hooks/useFavorites";
import { useCommunityStats } from "@/hooks/useCommunityStats";
import { useToast } from "@/hooks/use-toast";
import { useMessageNotifications } from "@/hooks/useMessageNotifications";

// Lazy load less critical pages for better initial load
const CreateListingPage = lazy(() => import("@/components/CreateListingPage").then(m => ({ default: m.CreateListingPage })));
const ListingDetailPage = lazy(() => import("@/components/ListingDetailPage").then(m => ({ default: m.ListingDetailPage })));
const MessagesLayout = lazy(() => import("@/components/MessagesLayout").then(m => ({ default: m.MessagesLayout })));
const UserProfilePage = lazy(() => import("@/components/UserProfilePage").then(m => ({ default: m.UserProfilePage })));
const FavoritesPage = lazy(() => import("@/components/FavoritesPage").then(m => ({ default: m.FavoritesPage })));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen bg-background flex flex-col items-center justify-center">
    <div className="text-center space-y-4">
      <div className="relative">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/20 border-t-primary mx-auto"></div>
        <div className="absolute inset-0 rounded-full animate-ping bg-primary/20"></div>
      </div>
      <p className="text-muted-foreground font-medium">Loading your content...</p>
    </div>
  </div>
);

const Index = () => {
  // Check URL for listing parameter on mount
  const urlParams = new URLSearchParams(window.location.search);
  const sharedListingId = urlParams.get('listing');
  
  const [currentPage, setCurrentPage] = useState(sharedListingId ? "listing-detail" : "home");
  const [selectedListingId, setSelectedListingId] = useState<string | null>(sharedListingId);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [editingListingId, setEditingListingId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  
  // Navigation history stack
  const [navigationHistory, setNavigationHistory] = useState<{page: string, data?: any}[]>([
    { page: sharedListingId ? "listing-detail" : "home", data: sharedListingId ? { listingId: sharedListingId } : undefined }
  ]);
  
  const { user, loading: authLoading, isAuthenticated, signOut } = useAuth();
  const { listings, loading: listingsLoading, createListing, updateListing } = useListings();
  const { toggleFavorite, isFavorited } = useFavorites();
  const { stats: communityStats } = useCommunityStats();
  const { toast } = useToast();
  
  // Set up global message notifications
  useMessageNotifications({ currentConversationId: null });

  // Navigation helper functions
  const navigateTo = (page: string, data?: any) => {
    setCurrentPage(page);
    setNavigationHistory(prev => [...prev, { page, data }]);
  };

  const navigateBack = () => {
    if (navigationHistory.length > 1) {
      const newHistory = [...navigationHistory];
      newHistory.pop(); // Remove current page
      const previousPage = newHistory[newHistory.length - 1];
      
      setNavigationHistory(newHistory);
      setCurrentPage(previousPage.page);
      
      // Restore state from previous page
      if (previousPage.data?.listingId) {
        setSelectedListingId(previousPage.data.listingId);
      }
      if (previousPage.data?.userId) {
        setSelectedUserId(previousPage.data.userId);
      }
    } else {
      // Fallback to home if no history
      setCurrentPage("home");
      setNavigationHistory([{ page: "home" }]);
      setSelectedListingId(null);
      setSelectedUserId(null);
    }
  };

  const handleLogin = () => {
    // Authentication is handled by useAuth hook
    setCurrentPage("home");
    setNavigationHistory([{ page: "home" }]);
  };

  const handleShowAuth = () => {
    // Will show auth page when not authenticated
  };

  const handleLogout = async () => {
    await signOut();
    setCurrentPage("home");
    setNavigationHistory([{ page: "home" }]);
  };

  const handleCreateListing = () => {
    if (!isAuthenticated) {
      toast({
        title: "🔒 Login Required",
        description: "Please log in to create a listing and start sharing!",
        variant: "destructive",
        duration: 4000,
      });
      return;
    }
    navigateTo("create");
  };

  const handleBackFromCreate = () => {
    navigateBack();
  };

  const handleSubmitListing = async (listingData: any) => {
    // Check if we're editing or creating
    const isEditing = editingListingId && listingData.id;
    
    // Separate existing URLs from new base64 images
    const existingImageUrls: string[] = [];
    const imageFiles: File[] = [];
    
    if (listingData.images && listingData.images.length > 0) {
      for (const image of listingData.images) {
        // Check if it's a URL (existing image) or base64 (new image)
        if (image.startsWith('http')) {
          existingImageUrls.push(image);
        } else {
          try {
            const response = await fetch(image);
            const blob = await response.blob();
            const file = new File([blob], `image-${Date.now()}.jpg`, { type: 'image/jpeg' });
            imageFiles.push(file);
          } catch (error) {
            console.error('Error converting base64 to file:', error);
          }
        }
      }
    }

    let result;
    if (isEditing) {
      result = await updateListing(listingData.id, listingData, imageFiles, existingImageUrls);
    } else {
      const allImageFiles: File[] = [];
      // For create, convert all base64 to files
      if (listingData.images && listingData.images.length > 0) {
        for (const base64Image of listingData.images) {
          try {
            const response = await fetch(base64Image);
            const blob = await response.blob();
            const file = new File([blob], `image-${Date.now()}.jpg`, { type: 'image/jpeg' });
            allImageFiles.push(file);
          } catch (error) {
            console.error('Error converting base64 to file:', error);
          }
        }
      }
      result = await createListing(listingData, allImageFiles);
    }

    if (!result.error) {
      navigateBack();
      setEditingListingId(null);
    }
  };

  const handleViewListing = (listingId: string) => {
    setSelectedListingId(listingId);
    navigateTo("listing-detail", { listingId });
  };

  const handleViewProfile = (userId: string) => {
    setSelectedUserId(userId);
    navigateTo("profile-view", { userId });
  };

  const handleBackToMessages = () => {
    navigateBack();
  };

  const handleBackToHome = () => {
    navigateBack();
  };

  const handleFavorite = (listingId: string) => {
    toggleFavorite(listingId);
  };

  const handleEditListing = (listingId: string) => {
    setEditingListingId(listingId);
    navigateTo("edit", { listingId });
  };

  const handlePageChange = (page: string) => {
    // Handle navigation menu clicks
    if (page === currentPage) return;
    
    // Reset to fresh page without history for main nav items
    setCurrentPage(page);
    setNavigationHistory([{ page }]);
    
    // Clear selections when navigating via main nav
    if (page === "home") {
      setSelectedListingId(null);
      setSelectedUserId(null);
    }
  };

  // Show loading while checking authentication
  if (authLoading) {
    return <PageLoader />;
  }

  // Show auth page if not authenticated
  if (!isAuthenticated) {
    return (
      <AuthPage 
        onBack={() => {}} 
        onLogin={handleLogin}
      />
    );
  }

  if (currentPage === "create" || (currentPage === "edit" && editingListingId)) {
    const editingListing = editingListingId 
      ? listings.find(l => l.id === editingListingId)
      : undefined;

    return (
      <Suspense fallback={<PageLoader />}>
        <CreateListingPage 
          onBack={navigateBack}
          onSubmit={handleSubmitListing}
          editingListing={editingListing ? {
            id: editingListing.id,
            title: editingListing.title,
            description: editingListing.description,
            category: editingListing.category,
            condition: editingListing.condition,
            type: editingListing.type,
            price: editingListing.price,
            deposit: editingListing.deposit || null,
            location: editingListing.location,
            rentPeriod: editingListing.rentPeriod,
            availableFrom: editingListing.availableFrom,
            availableTo: editingListing.availableTo,
            images: editingListing.images
          } : undefined}
        />
      </Suspense>
    );
  }

  if (currentPage === "listing-detail" && selectedListingId) {
    const selectedListing = listings.find(listing => listing.id === selectedListingId);
    
    // Transform listing data to match ListingDetailPage interface
    const transformedListing = selectedListing ? {
      id: selectedListing.id,
      title: selectedListing.title,
      description: selectedListing.description,
      price: selectedListing.price,
      type: selectedListing.type,
      category: selectedListing.category,
      condition: selectedListing.condition,
      images: selectedListing.images,
      owner: {
        id: selectedListing.userId, // Map userId to owner.id
        name: selectedListing.owner.name,
        block: selectedListing.owner.block,
        room: 'N/A', // Add default room if not available
        rating: selectedListing.owner.rating,
        totalRatings: 0, // Add default if not available
        memberSince: selectedListing.postedAt.getFullYear().toString(),
        verified: false, // Add default
        avatar: undefined
      },
      location: selectedListing.location,
      postedAt: selectedListing.postedAt,
      views: 0, // Add default if not available
      specifications: undefined
    } : undefined;
    
    return (
      <Suspense fallback={<PageLoader />}>
        <ListingDetailPage 
          listingId={selectedListingId}
          onBack={handleBackToHome} 
          onStartConversation={(conversationId: string) => {
            // For now, navigate to messages page
            setCurrentPage("messages");
            setNavigationHistory([...navigationHistory, { page: "messages" }]);
          }}
          onViewProfile={handleViewProfile}
          onEditListing={handleEditListing}
          listingData={transformedListing}
        />
      </Suspense>
    );
  }


  if (currentPage === "profile-view" && selectedUserId) {
    const userListings = listings.filter(listing => listing.userId === selectedUserId);
    
    return (
      <Suspense fallback={<PageLoader />}>
        <UserProfilePage 
          userId={selectedUserId}
          onBack={handleBackToHome}
          isOwnProfile={selectedUserId === user?.id}
          userListings={userListings}
          onViewListing={handleViewListing}
          onStartConversation={(conversationId: string) => {
            setCurrentPage("messages");
            setNavigationHistory([...navigationHistory, { page: "messages" }]);
          }}
        />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {currentPage !== "messages" && (
        <Navigation 
          currentPage={currentPage} 
          onPageChange={handlePageChange}
          onOpenSettings={() => setShowSettings(true)}
        />
      )}
      
      <SettingsDialog 
        open={showSettings}
        onOpenChange={setShowSettings}
        onLogout={handleLogout}
      />
      
      <main className={currentPage === "messages" ? "" : "pb-20 md:pb-0"}>
        {currentPage === "home" && (
          <HomePage 
            isAuthenticated={isAuthenticated}
            onShowAuth={handleShowAuth}
            onCreateListing={handleCreateListing}
            onViewListing={handleViewListing}
            listings={listings}
            onListingCreated={() => {}} // Not needed with new structure
            communityStats={communityStats}
            onFavorite={handleFavorite}
            isFavorited={isFavorited}
          />
        )}
        
        {currentPage === "messages" && (
          <Suspense fallback={<PageLoader />}>
            <MessagesLayout 
              onBack={handleBackToHome}
            />
          </Suspense>
        )}
        
        {currentPage === "profile" && (
          <Suspense fallback={<PageLoader />}>
            <UserProfilePage 
              userId={user?.id || ""}
              onBack={handleBackToHome}
              isOwnProfile={true}
              userListings={listings.filter(listing => listing.userId === user?.id)}
              onViewListing={handleViewListing}
            />
          </Suspense>
        )}
        
        {currentPage === "favorites" && (
          <Suspense fallback={<PageLoader />}>
            <FavoritesPage 
              onBack={handleBackToHome}
              onViewListing={handleViewListing}
            />
          </Suspense>
        )}
      </main>
    </div>
  );
};

export default Index;