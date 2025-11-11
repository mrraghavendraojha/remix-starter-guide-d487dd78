-- Drop existing foreign keys if they exist
ALTER TABLE public.conversations DROP CONSTRAINT IF EXISTS conversations_buyer_id_fkey;
ALTER TABLE public.conversations DROP CONSTRAINT IF EXISTS conversations_seller_id_fkey;
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;

-- Recreate foreign keys properly
ALTER TABLE public.conversations 
ADD CONSTRAINT conversations_buyer_id_fkey 
FOREIGN KEY (buyer_id) 
REFERENCES public.profiles(user_id) 
ON DELETE CASCADE;

ALTER TABLE public.conversations 
ADD CONSTRAINT conversations_seller_id_fkey 
FOREIGN KEY (seller_id) 
REFERENCES public.profiles(user_id) 
ON DELETE CASCADE;

ALTER TABLE public.messages
ADD CONSTRAINT messages_sender_id_fkey
FOREIGN KEY (sender_id)
REFERENCES public.profiles(user_id)
ON DELETE CASCADE;