-- Add foreign key constraint to link blocked_user_id to profiles
ALTER TABLE public.blocked_users
ADD CONSTRAINT blocked_users_blocked_user_id_fkey 
FOREIGN KEY (blocked_user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- Also add foreign key for user_id to ensure data integrity
ALTER TABLE public.blocked_users
ADD CONSTRAINT blocked_users_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;