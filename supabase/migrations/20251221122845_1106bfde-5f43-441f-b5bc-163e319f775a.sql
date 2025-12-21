-- Add admin role for user frankmalo38@gmail.com
INSERT INTO public.user_roles (user_id, role) 
VALUES ('1d0c0476-85b0-4eb0-8107-1a9744dc239d', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;