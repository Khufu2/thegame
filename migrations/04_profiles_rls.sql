-- RLS policies for profiles table
-- Enables RLS and creates policies so users can manage their own profile

-- Enable RLS on profiles
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;

-- PUBLIC SELECT: it's safer to expose a view with limited columns for public profiles.
-- Create a public view that exposes only non-sensitive fields (display_name, avatar_url, id)
CREATE OR REPLACE VIEW public.profile_public AS
SELECT id, display_name, avatar_url
FROM public.profiles;

-- Grant select on the view to the anon/public role (Supabase exposes the "authenticated" and anonymous roles via policies)
GRANT SELECT ON public.profile_public TO public;

-- Policy: allow authenticated user to SELECT their own profile (full row)
CREATE POLICY IF NOT EXISTS "profiles_select_self" ON public.profiles
  FOR SELECT USING (auth.uid()::uuid = id);

-- Policy: allow authenticated users to INSERT their own profile (id must match auth.uid())
CREATE POLICY IF NOT EXISTS "profiles_insert_owner_only" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid()::uuid = id);

-- Policy: allow authenticated users to UPDATE their own profile
CREATE POLICY IF NOT EXISTS "profiles_update_owner_only" ON public.profiles
  FOR UPDATE USING (auth.uid()::uuid = id) WITH CHECK (auth.uid()::uuid = id);

-- Policy: disallow DELETE via client (only service role / server should delete)
CREATE POLICY IF NOT EXISTS "profiles_delete_disallow" ON public.profiles
  FOR DELETE USING (false);

-- Note: the service_role key bypasses RLS, so use server-side `supabaseAdmin` for admin operations.
