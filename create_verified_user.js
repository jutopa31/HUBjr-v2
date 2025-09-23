// Create a verified user using Supabase Admin API
// You need your SERVICE_ROLE key (not anon key) for this

const { createClient } = require('@supabase/supabase-js');

// Get these from your Supabase project settings
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SERVICE_ROLE_KEY = 'YOUR_SERVICE_ROLE_KEY'; // NOT the anon key!

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createVerifiedUser(email, password, userData = {}) {
  try {
    console.log('Creating user:', email);

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // This bypasses email verification!
      user_metadata: {
        full_name: userData.full_name || 'New User',
        role: userData.role || 'resident',
        training_level: userData.training_level || 'R1',
        ...userData
      }
    });

    if (error) {
      console.error('❌ Error:', error.message);
      return false;
    }

    console.log('✅ User created successfully!');
    console.log('📧 Email:', data.user.email);
    console.log('🆔 ID:', data.user.id);
    console.log('✔️ Confirmed:', data.user.email_confirmed_at ? 'YES' : 'NO');

    return data.user;
  } catch (err) {
    console.error('❌ Exception:', err.message);
    return false;
  }
}

// Example usage - modify the email and password
async function main() {
  const newUser = await createVerifiedUser(
    'test@example.com',     // ← Change this email
    'password123',          // ← Change this password
    {
      full_name: 'Test User',
      role: 'resident',
      training_level: 'R2'
    }
  );

  if (newUser) {
    console.log('\n🎉 SUCCESS! User is ready to login.');
  } else {
    console.log('\n💥 FAILED! Check your SERVICE_ROLE_KEY.');
  }
}

// TO RUN THIS:
// 1. Replace YOUR_SUPABASE_URL and YOUR_SERVICE_ROLE_KEY above
// 2. Change the email/password in main()
// 3. Run: node create_verified_user.js

// Uncomment to run:
// main();

module.exports = { createVerifiedUser };