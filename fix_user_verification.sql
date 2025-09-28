-- Fix user email verification in Supabase
-- This works with newer versions that have generated columns

-- Method 1: Update only email_confirmed_at (confirmed_at will auto-update)
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'user@example.com' -- Replace with actual email
AND email_confirmed_at IS NULL;

-- Method 2: If you need to verify multiple users at once
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- Method 3: Check which users need verification
SELECT id, email, email_confirmed_at, created_at
FROM auth.users
WHERE email_confirmed_at IS NULL
ORDER BY created_at DESC;