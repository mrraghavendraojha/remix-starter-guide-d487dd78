-- First, let's ensure the listings user_id references profiles correctly
-- Drop any existing constraint
ALTER TABLE public.listings DROP CONSTRAINT IF EXISTS listings_user_id_fkey;

-- Add the foreign key constraint
ALTER TABLE public.listings 
ADD CONSTRAINT listings_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(user_id) 
ON DELETE CASCADE;

-- Verify the trigger exists for creating profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, block, room_number, phone, hostel_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'block', 'Not specified'),
    COALESCE(NEW.raw_user_meta_data->>'room_number', NULL),
    COALESCE(NEW.raw_user_meta_data->>'phone', NULL),
    COALESCE(NEW.raw_user_meta_data->>'hostel_name', 'Unknown Hostel')
  );
  RETURN NEW;
END;
$$;

-- Recreate the trigger if it doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();