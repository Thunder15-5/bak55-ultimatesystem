
-- Drop the existing insert policy for competitions
DROP POLICY IF EXISTS "Brands can create competitions" ON public.competitions;

-- Create new policy that allows admins, brands, and producers to create competitions
CREATE POLICY "Admins brands and producers can create competitions" 
ON public.competitions 
FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'brand'::app_role) OR 
  has_role(auth.uid(), 'producer'::app_role)
);

-- Also update the competition_stages policy to include producers
DROP POLICY IF EXISTS "Admins and brands can manage stages" ON public.competition_stages;

CREATE POLICY "Admins brands and producers can manage stages" 
ON public.competition_stages 
FOR ALL 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'brand'::app_role) OR 
  has_role(auth.uid(), 'producer'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'brand'::app_role) OR 
  has_role(auth.uid(), 'producer'::app_role)
);

-- Update the competition update policy to include producers who created the competition
DROP POLICY IF EXISTS "Competition creators can update own competitions" ON public.competitions;

CREATE POLICY "Competition creators can update own competitions" 
ON public.competitions 
FOR UPDATE 
USING (
  auth.uid() = created_by OR 
  has_role(auth.uid(), 'admin'::app_role)
);
