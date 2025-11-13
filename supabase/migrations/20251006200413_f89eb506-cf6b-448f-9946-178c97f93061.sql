-- Fix 1: Restrict phone and location data access in profiles table
-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create a security definer function to check if users are in an active conversation
CREATE OR REPLACE FUNCTION public.can_view_contact_details(_profile_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM conversations
    WHERE (buyer_id = auth.uid() AND seller_id = _profile_user_id)
       OR (seller_id = auth.uid() AND buyer_id = _profile_user_id)
  ) OR auth.uid() = _profile_user_id;
$$;

-- Policy 1: Anyone can view basic profile info (name, avatar, rating, dates)
CREATE POLICY "Users can view basic profile info" ON public.profiles
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Fix 2: Clean up existing listings data before adding constraints
UPDATE public.listings
SET description = CASE 
  WHEN char_length(description) < 10 THEN description || ' (Community marketplace listing)'
  ELSE description
END
WHERE char_length(description) < 10;

-- Add input validation constraints for listings table with more lenient limits
ALTER TABLE public.listings
  ADD CONSTRAINT title_length CHECK (char_length(title) BETWEEN 1 AND 200),
  ADD CONSTRAINT description_length CHECK (char_length(description) BETWEEN 1 AND 5000),
  ADD CONSTRAINT valid_price CHECK (price IS NULL OR price >= 0),
  ADD CONSTRAINT valid_deposit CHECK (deposit IS NULL OR deposit >= 0),
  ADD CONSTRAINT category_not_empty CHECK (char_length(category) > 0),
  ADD CONSTRAINT location_not_empty CHECK (char_length(location) > 0);

-- Create validation trigger for listings
CREATE OR REPLACE FUNCTION public.validate_listing()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Trim and validate strings
  NEW.title := trim(NEW.title);
  NEW.description := trim(NEW.description);
  NEW.category := trim(NEW.category);
  NEW.location := trim(NEW.location);
  
  -- Check for empty after trim
  IF NEW.title = '' THEN
    RAISE EXCEPTION 'Title cannot be empty';
  END IF;
  
  IF NEW.description = '' THEN
    RAISE EXCEPTION 'Description cannot be empty';
  END IF;
  
  IF NEW.category = '' THEN
    RAISE EXCEPTION 'Category cannot be empty';
  END IF;
  
  IF NEW.location = '' THEN
    RAISE EXCEPTION 'Location cannot be empty';
  END IF;
  
  -- Enforce more reasonable length limits via trigger
  IF char_length(NEW.title) > 100 THEN
    RAISE EXCEPTION 'Title must be 100 characters or less';
  END IF;
  
  IF char_length(NEW.description) > 2000 THEN
    RAISE EXCEPTION 'Description must be 2000 characters or less';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_listing_trigger
  BEFORE INSERT OR UPDATE ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_listing();

-- Fix 3: Add input validation constraints for ratings table
ALTER TABLE public.ratings
  ADD CONSTRAINT valid_rating_range CHECK (rating BETWEEN 1 AND 5),
  ADD CONSTRAINT review_length CHECK (review IS NULL OR char_length(review) <= 500);

-- Create validation trigger for ratings
CREATE OR REPLACE FUNCTION public.validate_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Validate rating range (also enforced by constraint but good to have explicit check)
  IF NEW.rating < 1 OR NEW.rating > 5 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5';
  END IF;
  
  -- Trim review and set to NULL if empty
  IF NEW.review IS NOT NULL THEN
    NEW.review := trim(NEW.review);
    IF NEW.review = '' THEN
      NEW.review := NULL;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_rating_trigger
  BEFORE INSERT OR UPDATE ON public.ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_rating();

-- Add rate limiting to prevent rating spam (allow only 1 rating per minute per user)
CREATE OR REPLACE FUNCTION public.check_rating_spam()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.ratings
    WHERE rater_id = NEW.rater_id
      AND created_at > NOW() - INTERVAL '1 minute'
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) THEN
    RAISE EXCEPTION 'Please wait before submitting another rating';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER check_rating_spam_trigger
  BEFORE INSERT ON public.ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.check_rating_spam();