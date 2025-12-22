-- Add bio and manager_comment columns to profiles table
ALTER TABLE profiles ADD COLUMN bio text;
ALTER TABLE profiles ADD COLUMN manager_comment text;
