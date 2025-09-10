import React from 'react';
import { useAuthContext } from './AuthProvider';

export function AuthDebug() {
  const { user, loading, error, mfaFactors, hasMFA } = useAuthContext();

  return (
    <div className="fixed top-4 right-4 bg-white p-4 rounded-lg shadow-lg border z-50 max-w-sm">
      <h3 className="font-bold text-sm mb-2">Auth Debug</h3>
      <div className="text-xs space-y-1">
        <div>Loading: {loading ? 'Yes' : 'No'}</div>
        <div>User: {user ? `${user.email}` : 'None'}</div>
        <div>Error: {error || 'None'}</div>
        <div>MFA Factors: {mfaFactors.length}</div>
        <div>Has MFA: {hasMFA ? 'Yes' : 'No'}</div>
        <div>AuthProvider: Active</div>
      </div>
    </div>
  );
}