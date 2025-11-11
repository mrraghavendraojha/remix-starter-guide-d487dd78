-- Add hostel_name field to profiles table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'hostel_name'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN hostel_name text;
  END IF;
END $$;

-- Update the handle_new_user function to include hostel_name
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, name, block, room_number, phone, hostel_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'block', 'Not specified'),
    COALESCE(NEW.raw_user_meta_data->>'room_number', null),
    COALESCE(NEW.raw_user_meta_data->>'phone', null),
    COALESCE(NEW.raw_user_meta_data->>'hostel_name', null)
  );
  RETURN NEW;
END;
$function$;