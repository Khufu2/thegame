-- Grant permissions to service_role for admin operations
-- This ensures the server can perform admin operations while RLS is enabled

-- Grant SELECT, INSERT, UPDATE on profiles to service_role
GRANT SELECT, INSERT, UPDATE ON public.profiles TO service_role;

-- Grant SELECT, INSERT, UPDATE, DELETE on bets to service_role
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bets TO service_role;

-- Grant SELECT, INSERT, UPDATE on matches to service_role
GRANT SELECT, INSERT, UPDATE ON public.matches TO service_role;

-- Grant SELECT on sequences for insert/update to work properly
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Grant EXECUTE on all functions/procedures to service_role
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL PROCEDURES IN SCHEMA public TO service_role;
