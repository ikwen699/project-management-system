-- 014: Super Admin role

-- Create system role enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'system_role') THEN
    CREATE TYPE system_role AS ENUM ('USER', 'SUPER_ADMIN');
  END IF;
END $$;

-- Add role column to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS role system_role DEFAULT 'USER';

-- Promote your account to SUPER_ADMIN
UPDATE "User" SET role = 'SUPER_ADMIN' WHERE email = 'deochannel08@gmail.com';
