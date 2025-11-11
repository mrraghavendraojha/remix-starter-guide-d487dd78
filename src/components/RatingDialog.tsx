import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";

interface RatingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onRatingSubmitted?: () => void;
  ratedUserId: string;
  ratedUserName: string;
  listingId?: string;
  listingTitle?: string;
}

export const RatingDialog = ({
  isOpen,
  onClose,
  onRatingSubmitted,
  ratedUserId,
  ratedUserName,
  listingId,
  listingTitle
}: RatingDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [review, setReview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to submit a rating.",
        variant: "destructive"
      });
      return;
    }

    if (rating === 0) {
      toast({
        title: "Rating required",
        description: "Please select a rating.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Check if user has already rated this person
      let query = supabase
        .from('ratings')
        .select('id')
        .eq('rater_id', user.id)
        .eq('rated_user_id', ratedUserId);
      
      if (listingId) {
        query = query.eq('listing_id', listingId);
      } else {
        query = query.is('listing_id', null);
      }
      
      const { data: existingRating, error: checkError } = await query.maybeSingle();

      if (existingRating) {
        // Update existing rating
        const { error: updateError } = await supabase
          .from('ratings')
          .update({
            rating,
            review: review.trim() || null
          })
          .eq('id', existingRating.id);

        if (updateError) throw updateError;

        toast({
          title: "Rating updated!",
          description: "Your rating has been updated successfully."
        });
      } else {
        // Create new rating
        const { error: insertError } = await supabase
          .from('ratings')
          .insert({
            rater_id: user.id,
            rated_user_id: ratedUserId,
            listing_id: listingId || null,
            rating,
            review: review.trim() || null
          });

        if (insertError) throw insertError;

        toast({
          title: "Rating submitted!",
          description: "Thank you for your feedback."
        });
      }

      // Call the callback to refresh ratings
      if (onRatingSubmitted) {
        onRatingSubmitted();
      }

      onClose();
      setRating(0);
      setReview("");
    } catch (error: any) {
      toast({
        title: "Error submitting rating",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rate {ratedUserName}</DialogTitle>
          <DialogDescription>
            {listingTitle 
              ? `How was your experience with "${listingTitle}"?`
              : `Share your experience with ${ratedUserName}`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Star Rating */}
          <div className="flex flex-col items-center space-y-2">
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110 focus:outline-none"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= (hoveredRating || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-sm text-muted-foreground">
                {rating} out of 5 stars
              </p>
            )}
          </div>

          {/* Review Text */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Review (Optional)
            </label>
            <Textarea
              placeholder="Share your experience..."
              value={review}
              onChange={(e) => setReview(e.target.value)}
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {review.length}/500
            </p>
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={rating === 0 || isSubmitting}
            className="w-full"
            variant="community"
          >
            {isSubmitting ? "Submitting..." : "Submit Rating"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
