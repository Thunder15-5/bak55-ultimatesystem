-- Remove brand role from admin account
DELETE FROM user_roles 
WHERE user_id = 'b2a31558-e58a-466f-99b8-7ba636bcf6be' 
AND role = 'brand';

-- Remove brand profile if exists
DELETE FROM brand_profiles 
WHERE user_id = 'b2a31558-e58a-466f-99b8-7ba636bcf6be';