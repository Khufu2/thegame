-- Allow admin users to insert into feeds
CREATE POLICY "Admins can insert feeds" 
ON public.feeds 
FOR INSERT 
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow admin users to update feeds
CREATE POLICY "Admins can update feeds" 
ON public.feeds 
FOR UPDATE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admin users to delete feeds
CREATE POLICY "Admins can delete feeds" 
ON public.feeds 
FOR DELETE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));