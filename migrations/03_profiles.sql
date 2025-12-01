-- Create a profiles table that mirrors auth.users and a trigger to auto-create profiles on sign-up
-- This keeps auth.user IDs authoritative and avoids mismatched UUIDs.

-- Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY,
  email text,
  phone text,
  display_name text,
  avatar_url text,
  bio text,
  preferences jsonb DEFAULT '{}'::jsonb,
  balance numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Ensure id references the auth.users table
-- Note: auth.users is a system table managed by Supabase Auth
ALTER TABLE IF EXISTS public.profiles
  ADD CONSTRAINT fk_profiles_auth_users
    FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Trigger function: insert profile when a new auth.user is created
CREATE OR REPLACE FUNCTION public.handle_auth_user_created()
RETURNS trigger AS $$
BEGIN
  -- Insert a profile row if none exists for this user
  INSERT INTO public.profiles (id, email, created_at)
  VALUES (NEW.id, NEW.email, now())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users AFTER INSERT
DROP TRIGGER IF EXISTS auth_user_created ON auth.users;
CREATE TRIGGER auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_auth_user_created();

-- Optional: trigger to cleanup profile on auth.user deletion
CREATE OR REPLACE FUNCTION public.handle_auth_user_deleted()
RETURNS trigger AS $$
BEGIN
  DELETE FROM public.profiles WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS auth_user_deleted ON auth.users;
CREATE TRIGGER auth_user_deleted
  AFTER DELETE ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_auth_user_deleted();
