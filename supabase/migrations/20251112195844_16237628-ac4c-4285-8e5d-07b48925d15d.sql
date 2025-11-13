-- Create blocked_users table
CREATE TABLE IF NOT EXISTS public.blocked_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  blocked_user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, blocked_user_id)
);

-- Enable RLS
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own blocked users
CREATE POLICY "Users can view their own blocked users"
  ON public.blocked_users
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can block other users
CREATE POLICY "Users can block other users"
  ON public.blocked_users
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can unblock users they blocked
CREATE POLICY "Users can unblock users"
  ON public.blocked_users
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_blocked_users_user_id ON public.blocked_users(user_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked_user_id ON public.blocked_users(blocked_user_id);