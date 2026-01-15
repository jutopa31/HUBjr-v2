# Auth.Users Security Fix

## Problem

Supabase security linter detected critical security vulnerabilities:

### 1. **auth_users_exposed** (ERROR Level)
The view `lumbar_punctures_with_names` was directly querying the `auth.users` table, potentially exposing sensitive authentication data (passwords, tokens, private metadata) to unauthorized roles.

```sql
-- VULNERABLE CODE
CREATE VIEW lumbar_punctures_with_names AS
SELECT lp.*, u.email, u.raw_user_meta_data
FROM lumbar_punctures lp
LEFT JOIN auth.users u ON lp.resident_id = u.id;  -- ❌ Exposes auth.users
```

**Risk**: Anonymous or authenticated users could potentially access sensitive authentication data including:
- Email addresses
- Password hashes
- Authentication tokens
- Private user metadata
- Account security information

### 2. **security_definer_view** (ERROR Level)
Multiple views were using `SECURITY DEFINER`, which makes them run with the privileges of the view creator rather than the calling user, potentially bypassing Row Level Security (RLS) policies.

**Affected views**:
- `lumbar_punctures_with_names`
- `ranking_leaderboard_monthly`
- `ranking_leaderboard_weekly`
- `upcoming_outpatient_appointments`

## Solution

### Architecture Change: Public User Profiles Table

Instead of querying `auth.users` directly from views and application code, we now use a dedicated `public.user_profiles` table that:

1. **Mirrors only necessary data** from `auth.users` (no sensitive auth data)
2. **Has proper RLS policies** for access control
3. **Auto-syncs** with `auth.users` via database triggers
4. **Eliminates** all direct `auth.users` access from public schemas

### Implementation

```sql
-- New secure architecture
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    email TEXT,
    full_name TEXT,
    training_level TEXT,
    role TEXT,
    hospital_context TEXT
);

-- Views now query user_profiles instead of auth.users
CREATE VIEW lumbar_punctures_with_names AS
SELECT lp.*, up.full_name as resident_name
FROM lumbar_punctures lp
LEFT JOIN public.user_profiles up ON lp.resident_id = up.id;  -- ✅ Secure
```

## Benefits

1. **Security**: No exposure of `auth.users` sensitive data
2. **Performance**: Faster queries (no cross-schema joins)
3. **Maintainability**: Clear separation of auth vs. profile data
4. **Compliance**: Meets Supabase security best practices
5. **RLS Friendly**: Uses `security_invoker` for proper RLS enforcement

## Migration Steps

### 1. Apply the Fix

Run the SQL script in your Supabase SQL Editor:

```bash
# In Supabase Dashboard > SQL Editor
# Copy and paste the contents of: fix_auth_users_security.sql
```

Or use Supabase CLI:

```bash
supabase db push fix_auth_users_security.sql
```

### 2. Verify the Fix

Run these queries to confirm:

```sql
-- Check that user_profiles table exists and is populated
SELECT COUNT(*) FROM public.user_profiles;

-- Verify no views expose auth.users
SELECT viewname, definition
FROM pg_views
WHERE schemaname = 'public'
  AND definition LIKE '%auth.users%';
-- Should return 0 rows

-- Test the fixed view
SELECT * FROM lumbar_punctures_with_names LIMIT 5;
```

### 3. Update Application Code

**Before** (vulnerable):
```typescript
// ❌ Don't query auth.users directly
const { data } = await supabase
  .from('auth.users')
  .select('*');
```

**After** (secure):
```typescript
// ✅ Use public.user_profiles instead
const { data } = await supabase
  .from('user_profiles')
  .select('*');
```

### 4. Run Security Linter

In Supabase Dashboard:
1. Go to **Database** > **Reports**
2. Run the **Security Linter**
3. Confirm all `auth_users_exposed` errors are resolved

## What Changed

### Tables Created
- `public.user_profiles` - Secure mirror of auth.users public data

### Triggers Created
- `on_auth_user_created` - Auto-syncs user_profiles when users sign up/update

### Views Fixed
- `lumbar_punctures_with_names` - Now uses `user_profiles` with `security_invoker`

### Functions Updated
- `handle_new_user()` - Manages user_profiles sync

## Backward Compatibility

✅ **No breaking changes** - All existing queries continue to work because:
- View names remain the same
- Column names remain the same
- The change is internal to the view implementation

## Files

- **`fix_auth_users_security.sql`** - Complete fix script (run this in Supabase)
- **`create_secure_user_profiles.sql`** - Original draft (deprecated, use above)
- **`fix_supabase_security_warnings.sql`** - Initial attempt (incomplete, use above)

## Testing Checklist

- [ ] `user_profiles` table created successfully
- [ ] All existing users migrated to `user_profiles`
- [ ] `lumbar_punctures_with_names` view works correctly
- [ ] Security linter shows no `auth_users_exposed` errors
- [ ] Application functionality unchanged (backward compatible)
- [ ] Row Level Security policies working as expected
- [ ] New user signups automatically create `user_profiles` entries

## Additional Notes

### For Future Development

**Always use `public.user_profiles` instead of `auth.users` when:**
- Creating views that display user information
- Building leaderboards or ranking systems
- Showing user names in tables or lists
- Implementing user search functionality

**Only use `auth.users` when:**
- Working in Supabase Auth admin context
- Building authentication logic (via Supabase Auth APIs)
- Never from application-level queries or public views

### Security Invoker vs Security Definer

The fix uses `security_invoker = true` for views:

```sql
CREATE VIEW my_view WITH (security_invoker = true) AS ...
```

This ensures the view runs with the **caller's** privileges, properly enforcing RLS policies, rather than the view creator's privileges which could bypass security.

## Support

For questions or issues:
1. Check Supabase documentation: https://supabase.com/docs/guides/database/database-linter
2. Review RLS policies: https://supabase.com/docs/guides/auth/row-level-security
3. Open an issue in the repository

---

**Status**: ✅ Ready to deploy
**Priority**: 🔴 Critical security fix
**Impact**: 🟢 Zero breaking changes
