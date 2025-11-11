-- Fix function search paths for security
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, block)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'block', 'Not specified')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix update profile rating function
CREATE OR REPLACE FUNCTION public.update_profile_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles 
  SET 
    rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM public.ratings 
      WHERE rated_user_id = COALESCE(NEW.rated_user_id, OLD.rated_user_id)
    ),
    total_ratings = (
      SELECT COUNT(*)
      FROM public.ratings 
      WHERE rated_user_id = COALESCE(NEW.rated_user_id, OLD.rated_user_id)
    )
  WHERE user_id = COALESCE(NEW.rated_user_id, OLD.rated_user_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;