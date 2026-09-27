-- Migration 019: Scheduled user removal
-- Run in Supabase SQL Editor

-- Add columns to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "removalScheduledAt" TIMESTAMPTZ;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "removalRequestedBy" TEXT REFERENCES "User"(id) ON DELETE SET NULL;

-- Add notification types (run these separately if they fail in transaction)
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'USER_REMOVAL_SCHEDULED';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'USER_REMOVAL_CANCELLED';

-- Index for querying past-due removals efficiently
CREATE INDEX IF NOT EXISTS idx_user_removal_scheduled ON "User"("removalScheduledAt") WHERE "removalScheduledAt" IS NOT NULL;