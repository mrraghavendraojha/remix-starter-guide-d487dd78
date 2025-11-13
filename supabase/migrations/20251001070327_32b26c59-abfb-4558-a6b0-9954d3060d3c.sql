-- Drop the existing foreign key if it points to the wrong table
ALTER TABLE public.listings DROP CONSTRAINT IF EXISTS listings_user_id_fkey;

-- Recreate the foreign key to point to profiles.user_id
ALTER TABLE public.listings 
ADD CONSTRAINT listings_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(user_id) 
ON DELETE CASCADE;