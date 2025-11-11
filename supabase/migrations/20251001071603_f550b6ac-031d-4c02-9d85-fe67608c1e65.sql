-- Create profiles for users who don't have one
INSERT INTO public.profiles (user_id, name, block, hostel_name)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'name', 'User') as name,
  COALESCE(u.raw_user_meta_data->>'block', 'Not specified') as block,
  COALESCE(u.raw_user_meta_data->>'hostel_name', 'Unknown Hostel') as hostel_name
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
WHERE p.user_id IS NULL;

-- Verify all users now have profiles
DO $$
DECLARE
  user_count INTEGER;
  profile_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count FROM auth.users;
  SELECT COUNT(*) INTO profile_count FROM public.profiles;
  
  IF user_count != profile_count THEN
    RAISE EXCEPTION 'Mismatch: % users but % profiles', user_count, profile_count;
  END IF;
  
  RAISE NOTICE 'Success: All % users have profiles', user_count;
END $$;