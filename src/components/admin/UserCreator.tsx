import React, { useState } from 'react';
import { User, UserPlus, Mail, Lock, Users } from 'lucide-react';
import { supabase } from '../../utils/supabase';

interface UserCreatorProps {
  onUserCreated?: (user: any) => void;
}

const UserCreator: React.FC<UserCreatorProps> = ({ onUserCreated }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'resident',
    training_level: 'R1'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // Method 1: Try admin.createUser if you have service role key
      const { data, error } = await supabase.auth.admin.createUser({
        email: formData.email,
        password: formData.password,
        email_confirm: true, // Skip email verification
        user_metadata: {
          full_name: formData.full_name,
          role: formData.role,
          training_level: formData.training_level
        }
      });

      if (error) {
        // Method 2: Fallback to regular signup if admin doesn't work
        const { data: signupData, error: signupError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.full_name,
              role: formData.role,
              training_level: formData.training_level
            }
          }
        });

        if (signupError) throw signupError;

        setMessage({
          type: 'success',
          text: `User created! Email verification may be required. User ID: ${signupData.user?.id}`
        });
        onUserCreated?.(signupData.user);
      } else {
        setMessage({
          type: 'success',
          text: `User created successfully! User ID: ${data.user.id}`
        });
        onUserCreated?.(data.user);
      }

      // Reset form
      setFormData({
        email: '',
        password: '',
        full_name: '',
        role: 'resident',
        training_level: 'R1'
      });

    } catch (err) {
      console.error('Error creating user:', err);
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to create user'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center mb-6">
        <UserPlus className="h-6 w-6 text-blue-600 mr-2" />
        <h2 className="text-xl font-semibold text-gray-900">Create New User</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Mail className="h-4 w-4 inline mr-1" />
            Email
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Lock className="h-4 w-4 inline mr-1" />
            Password
          </label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
            minLength={6}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <User className="h-4 w-4 inline mr-1" />
            Full Name
          </label>
          <input
            type="text"
            value={formData.full_name}
            onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Users className="h-4 w-4 inline mr-1" />
            Role
          </label>
          <select
            value={formData.role}
            onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="resident">Resident</option>
            <option value="attending">Attending</option>
            <option value="intern">Intern</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Training Level</label>
          <select
            value={formData.training_level}
            onChange={(e) => setFormData(prev => ({ ...prev, training_level: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="R1">R1</option>
            <option value="R2">R2</option>
            <option value="R3">R3</option>
            <option value="R4">R4</option>
            <option value="R5">R5</option>
            <option value="Fellow">Fellow</option>
            <option value="Attending">Attending</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <>
              <UserPlus className="h-4 w-4 mr-2" />
              Create User
            </>
          )}
        </button>
      </form>

      {message && (
        <div className={`mt-4 p-3 rounded-lg ${
          message.type === 'success'
            ? 'bg-green-50 text-gray-800 border border-green-200'
            : 'bg-red-50 text-gray-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}
    </div>
  );
};

export default UserCreator;
