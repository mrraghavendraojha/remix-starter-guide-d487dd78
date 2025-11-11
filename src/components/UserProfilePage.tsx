import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PasswordConfirmDialog } from "@/components/PasswordConfirmDialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useUserRatings } from "@/hooks/useUserRatings";
import { useConversations } from "@/hooks/useConversations";
import { RatingDialog } from "@/components/RatingDialog";
import { ArrowLeft, Edit, Star, MapPin, Calendar, MessageCircle, Settings, Phone, Mail, LogOut, Trash2, Camera } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { ListingCard } from "./ListingCard";

interface UserProfilePageProps {
  userId: string;
  onBack: () => void;
  isOwnProfile: boolean;
  userListings?: any[];
  onViewListing?: (listingId: string) => void;
}

interface UserProfile {
  id: string;
  name: string;
  avatar?: string;
  email: string;
  phone: string;
  block: string;
  room: string;
  joinedAt: Date;
  rating: number;
  totalRatings: number;
  completedTransactions: number;
  bio?: string;
  isVerified: boolean;
}

export const UserProfilePage = ({ userId, onBack, isOwnProfile, userListings = [], onViewListing }: UserProfilePageProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signOut, user } = useAuth();
  const { ratings, loading: ratingsLoading, refetch: refetchRatings } = useUserRatings(userId);
  const { createOrGetConversation } = useConversations();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [userProfile, setUserProfile] = useState<UserProfile>({
    id: userId,
    name: "Loading...",
    email: "",
    phone: "",
    block: "",
    room: "",
    joinedAt: new Date(),
    rating: 0,
    totalRatings: 0,
    completedTransactions: 0,
    bio: "",
    isVerified: false
  });

  // Fetch user profile from Supabase
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        
          // Fetch profile data
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
          throw profileError;
        }

        if (profile) {
          // Fetch auth user email if this is own profile
          let userEmail = "";
          if (isOwnProfile) {
            const { data: { user } } = await supabase.auth.getUser();
            userEmail = user?.email || "";
          }

          setUserProfile({
            id: profile.id,
            name: profile.name || "User",
            avatar: profile.avatar_url || undefined,
            email: userEmail,
            phone: profile.phone || "",
            block: profile.block || "",
            room: profile.room_number || "",
            joinedAt: new Date(profile.created_at),
            rating: Number(profile.rating) || 0,
            totalRatings: profile.total_ratings || 0,
            completedTransactions: 0,
            bio: profile.hostel_name || "",
            isVerified: false
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast({
          title: "Error",
          description: "Failed to load profile",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchProfile();
    }
  }, [userId, isOwnProfile, toast]);

  const [editForm, setEditForm] = useState({
    name: userProfile.name,
    bio: userProfile.bio || "",
    block: userProfile.block,
    room: userProfile.room
  });

  // Update edit form when profile loads
  useEffect(() => {
    setEditForm({
      name: userProfile.name,
      bio: userProfile.bio || "",
      block: userProfile.block,
      room: userProfile.room
    });
  }, [userProfile]);

  const handleSaveProfile = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: editForm.name,
          block: editForm.block,
          room_number: editForm.room
        })
        .eq('user_id', userId);

      if (error) throw error;

      setUserProfile(prev => ({
        ...prev,
        name: editForm.name,
        bio: editForm.bio,
        block: editForm.block,
        room: editForm.room
      }));
      
      setIsEditing(false);
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully."
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      });
    }
  };

  const handleLogout = async () => {
    await signOut();
    toast({
      title: "Logged out",
      description: "You have been logged out successfully."
    });
    onBack();
  };

  const handleDeleteAccount = async (password: string) => {
    try {
      // First verify the password by attempting to reauthenticate
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.email) {
        throw new Error('No email found for user');
      }

      // Attempt to sign in with the provided password to verify it
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: password
      });

      if (signInError) {
        throw new Error('Invalid password. Please try again.');
      }

      // Password is correct, proceed with deletion
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      const { error } = await supabase.functions.invoke('delete-user', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      
      // Sign out
      await signOut();
      
      toast({
        title: "Account Deleted",
        description: "Your account has been permanently deleted."
      });
      
      onBack();
    } catch (error: any) {
      console.error('Error deleting account:', error);
      throw error; // Re-throw to be caught by PasswordConfirmDialog
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive"
      });
      return;
    }

    try {
      setUploadingAvatar(true);

      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Delete old avatar if exists
      if (userProfile.avatar) {
        const oldPath = userProfile.avatar.split('/avatars/')[1];
        if (oldPath) {
          await supabase.storage.from('avatars').remove([oldPath]);
        }
      }

      // Upload new avatar with user ID in path for RLS
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { data, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { 
          upsert: true,
          contentType: file.type 
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(uploadError.message || 'Failed to upload file');
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Profile update error:', updateError);
        throw new Error(updateError.message || 'Failed to update profile');
      }

      setUserProfile(prev => ({ ...prev, avatar: publicUrl }));

      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated successfully"
      });
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload avatar. Please ensure the storage bucket is configured correctly.",
        variant: "destructive"
      });
    } finally {
      setUploadingAvatar(false);
      // Reset file input
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border p-2 md:p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 md:space-x-3">
            <Button variant="ghost" size="icon" className="h-8 w-8 md:h-10 md:w-10" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
            <h1 className="text-lg md:text-2xl font-bold text-foreground">
              {isOwnProfile ? "My Profile" : "Profile"}
            </h1>
          </div>
          
          {isOwnProfile && (
            <div className="flex flex-row gap-1 md:gap-2">
              <Dialog open={isEditing} onOpenChange={setIsEditing}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 md:h-9 text-xs md:text-sm">
                    <Edit className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                    <span className="hidden md:inline">Edit</span>
                  </Button>
                </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Profile</DialogTitle>
                  <p className="text-sm text-muted-foreground">Update your profile information</p>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      value={editForm.name}
                      onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Bio</Label>
                    <Input
                      value={editForm.bio}
                      onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                      placeholder="Tell others about yourself..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Block</Label>
                      <Input
                        value={editForm.block}
                        onChange={(e) => setEditForm(prev => ({ ...prev, block: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Room</Label>
                      <Input
                        value={editForm.room}
                        onChange={(e) => setEditForm(prev => ({ ...prev, room: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="flex space-x-2 pt-4">
                    <Button onClick={handleSaveProfile} className="flex-1">
                      Save Changes
                    </Button>
                    <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1">
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Button 
              variant="outline" 
              size="sm"
              className="h-7 md:h-9 text-xs md:text-sm"
              onClick={handleLogout}
            >
              <LogOut className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
              <span className="hidden md:inline">Logout</span>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="h-7 md:h-9 text-xs md:text-sm">
                  <Trash2 className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                  <span className="hidden md:inline">Delete Account</span>
                  <span className="md:hidden">Delete</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your account
                    and remove all your data including listings, messages, and reviews from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => setShowPasswordConfirm(true)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Continue
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            </div>
          )}
        </div>
      </div>

      <div className="p-2 md:p-4 max-w-4xl mx-auto">
        {/* Profile Header */}
        <Card className="mb-3 md:mb-6 bg-card-gradient">
          <CardContent className="p-3 md:p-6">
            <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
              {/* Avatar */}
              <div className="relative">
                <Avatar className="h-24 w-24 border-4 border-border">
                  <AvatarImage src={userProfile.avatar} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    {userProfile.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                {isOwnProfile && (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingAvatar}
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  </>
                )}
                {userProfile.isVerified && !isOwnProfile && (
                  <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-1">
                    <Settings className="h-3 w-3" />
                  </div>
                )}
              </div>

              {/* Profile Info */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center md:space-x-3 mb-2">
                  <h2 className="text-2xl font-bold text-card-foreground">{userProfile.name}</h2>
                  {userProfile.isVerified && (
                    <Badge className="bg-secondary text-secondary-foreground">Verified</Badge>
                  )}
                </div>
                
                <div className="flex items-center justify-center md:justify-start space-x-4 mb-3 text-sm text-muted-foreground">
                  {/* Only show location if available (privacy-protected) */}
                  {userProfile.block && (
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-4 w-4" />
                      <span>{userProfile.block}{userProfile.room ? `, Room ${userProfile.room}` : ''}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>Joined {userProfile.joinedAt.toLocaleDateString()}</span>
                  </div>
                </div>

                {userProfile.bio && (
                  <p className="text-muted-foreground mb-4 select-text">{userProfile.bio}</p>
                )}

                {/* User Information (for own profile) */}
                {isOwnProfile && (
                  <Card className="mb-4 bg-muted/30">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center space-x-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Email:</span>
                        <span className="text-foreground font-medium">{userProfile.email || 'Not set'}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Phone:</span>
                        <span className="text-foreground font-medium">{userProfile.phone || 'Not set'}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Hostel/Society:</span>
                        <span className="text-foreground font-medium">{userProfile.bio || 'Not set'}</span>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Stats */}
                <div className="flex items-center justify-center md:justify-start space-x-6 mb-4">
                  <div className="text-center">
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold text-card-foreground">{userProfile.rating}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">({userProfile.totalRatings} reviews)</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-card-foreground">{userProfile.completedTransactions}</p>
                    <p className="text-xs text-muted-foreground">Transactions</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-card-foreground">{userListings.length}</p>
                    <p className="text-xs text-muted-foreground">Active Listings</p>
                  </div>
                </div>

                {/* Contact Buttons - only show if phone is available (privacy-protected) */}
                {!isOwnProfile && (
                  <div className="space-y-2">
                    <div className="flex space-x-2">
                      <Button 
                        variant="community" 
                        className="flex-1"
                        onClick={async () => {
                          // Find a listing by this user to create conversation
                          if (userListings.length === 0) {
                            toast({
                              title: "No listings available",
                              description: "This user has no active listings to start a conversation about.",
                              variant: "destructive"
                            });
                            return;
                          }
                          const conversationId = await createOrGetConversation(
                            userListings[0].id,
                            userId
                          );
                          if (conversationId) {
                            navigate(`/messages/${conversationId}`);
                          }
                        }}
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Message
                      </Button>
                      {userProfile.phone && (
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => window.location.href = `tel:${userProfile.phone}`}
                        >
                          <Phone className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setShowRatingDialog(true)}
                    >
                      <Star className="h-4 w-4 mr-2" />
                      Rate User
                    </Button>
                    {!userProfile.phone && (
                      <p className="text-xs text-muted-foreground text-center">
                        Contact info visible after starting a conversation
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Tabs */}
        <Tabs defaultValue="listings" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="listings">Listings</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="listings" className="space-y-4">
            {userListings.length > 0 ? (
              <div className="container mx-auto">
                <div className="grid gap-1.5 grid-cols-2 md:gap-4 md:grid-cols-3">
                  {userListings.map((listing) => (
                    <ListingCard
                      key={listing.id}
                      listing={listing}
                      onViewDetails={onViewListing}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-2">No listings yet</p>
                {isOwnProfile && (
                  <p className="text-sm text-muted-foreground">
                    Start by creating your first listing!
                  </p>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="reviews" className="space-y-4">
            {ratingsLoading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading reviews...</p>
              </div>
            ) : ratings.length > 0 ? (
              <div className="space-y-4">
                {ratings.map((rating) => (
                  <Card key={rating.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold">{rating.rater_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {rating.listing_title}
                          </p>
                        </div>
                        <div className="flex items-center space-x-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < rating.rating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-muted-foreground"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      {rating.review && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {rating.review}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(rating.created_at).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-2">No reviews yet</p>
                <p className="text-sm text-muted-foreground">
                  Reviews will appear here after completing transactions
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-2">No activity yet</p>
              <p className="text-sm text-muted-foreground">
                Activity will be tracked as you use the app
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Password Confirmation Dialog */}
      <PasswordConfirmDialog
        isOpen={showPasswordConfirm}
        onClose={() => setShowPasswordConfirm(false)}
        onConfirm={handleDeleteAccount}
        title="Confirm Account Deletion"
        description="Please enter your password to permanently delete your account. This action cannot be undone."
        confirmButtonText="Delete Account"
      />

      {/* Rating Dialog */}
      {!isOwnProfile && (
        <RatingDialog
          isOpen={showRatingDialog}
          onClose={() => setShowRatingDialog(false)}
          onRatingSubmitted={refetchRatings}
          ratedUserId={userId}
          ratedUserName={userProfile.name}
        />
      )}
    </div>
  );
};