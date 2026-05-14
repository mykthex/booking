-- Add unique constraint to email column
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_email_unique ON "user" ("email");
