import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, Loader2 } from 'lucide-react';

/**
 * Route guard requiring authenticated user session.
 */
export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[300px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200 max-w-md mx-auto my-12">
        <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-900 mb-2">Authentication Required</h3>
        <p className="text-sm text-slate-600 mb-4">Please sign in to access this page.</p>
      </div>
    );
  }

  return children;
};

/**
 * Route guard requiring specific RBAC roles (e.g. 'admin', 'seller').
 */
export const RoleRoute = ({ allowedRoles = [], children }) => {
  const { role, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[300px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !allowedRoles.includes(role)) {
    return (
      <div className="p-8 text-center bg-rose-50 rounded-xl border border-rose-200 max-w-md mx-auto my-12">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-rose-900 mb-2">Access Denied (403 Forbidden)</h3>
        <p className="text-sm text-rose-700 mb-4">
          This portal requires one of the following roles: <strong>{allowedRoles.join(', ')}</strong>.
          Your current role is <strong>{role || 'Guest'}</strong>.
        </p>
      </div>
    );
  }

  return children;
};
