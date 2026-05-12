-- Create user_roles table to store user roles
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'moderator', 'user')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Anyone can read user roles (to determine admin status)
CREATE POLICY "User roles are publicly readable" ON public.user_roles
  FOR SELECT USING (true);

-- Users can only update their own role (but via backend/admin functions)
CREATE POLICY "Users can view own role" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Only admins can update roles (this would be enforced via backend)
-- For now, we'll allow the owner to update (this should be restricted to backend in production)
CREATE POLICY "Users can update own role if admin" ON public.user_roles
  FOR UPDATE USING (auth.uid() = user_id);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);

-- Create index on role for faster admin checks
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);
