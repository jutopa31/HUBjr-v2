// Script to create users programmatically in Supabase
// Run this with: node create_user_script.js

const { createClient } = require('@supabase/supabase-js');

// Your Supabase project details
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseServiceKey = 'YOUR_SERVICE_ROLE_KEY'; // Service role key, not anon key

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createUser(email, password, metadata = {}) {
  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // This bypasses email verification
      user_metadata: {
        full_name: metadata.full_name || 'New User',
        role: metadata.role || 'resident',
        training_level: metadata.training_level || 'R1',
        ...metadata
      }
    });

    if (error) {
      console.error('Error creating user:', error);
      return null;
    }

    console.log('User created successfully:', data.user.email);
    return data.user;
  } catch (err) {
    console.error('Exception creating user:', err);
    return null;
  }
}

// Example usage - uncomment and modify as needed
async function main() {
  const newUser = await createUser(
    'test@example.com', // Change this email
    'password123',      // Change this password
    {
      full_name: 'Test Resident',
      role: 'resident',
      training_level: 'R2'
    }
  );

  if (newUser) {
    console.log('✅ User created with ID:', newUser.id);
  } else {
    console.log('❌ Failed to create user');
  }
}

// Uncomment to run:
// main();

module.exports = { createUser };