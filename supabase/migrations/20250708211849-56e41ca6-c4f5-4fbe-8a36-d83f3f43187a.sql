
-- Add foreign key constraint to link orders.user_id to profiles.id
-- First, let's make sure all existing orders have corresponding profiles
INSERT INTO public.profiles (id, name, avatar)
SELECT DISTINCT u.id, 
       COALESCE(u.raw_user_meta_data ->> 'name', 'Unknown User') as name,
       u.raw_user_meta_data ->> 'avatar' as avatar
FROM auth.users u
WHERE u.id IN (SELECT DISTINCT user_id FROM public.orders)
  AND u.id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- Now add the foreign key constraint
ALTER TABLE public.orders 
ADD CONSTRAINT orders_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
