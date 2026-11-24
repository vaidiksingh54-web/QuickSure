import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { supabase, isMockAuth } from '../config/supabase';
import { STORAGE_KEYS } from '../config/constants';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [seller, setSeller] = useState(null);
  const [token, setToken] = useState(localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize session and fetch profile
  useEffect(() => {
    initAuth();
  }, []);

  const initAuth = async () => {
    try {
      setLoading(true);
      const savedToken = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);

      if (savedToken) {
        setToken(savedToken);
        await fetchUserProfile(savedToken);
      } else if (!isMockAuth) {
        // Check active Supabase session
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          saveSessionToken(session.access_token);
          await fetchUserProfile(session.access_token);
        }
      }
    } catch (err) {
      console.warn('Initial session check error:', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const saveSessionToken = (accessToken) => {
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, accessToken);
    setToken(accessToken);
  };

  const fetchUserProfile = async (authToken) => {
    try {
      const response = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (response.success && response.data) {
        setProfile(response.data.profile);
        setUser(response.data.profile);
        setSeller(response.data.seller || null);
      }
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
      logout();
    }
  };

  // Demo Persona Quick-Login for instant testing in development
  const loginAsDemoPersona = async (role = 'customer') => {
    setLoading(true);
    setError(null);
    try {
      const mockTokens = {
        customer: 'mock-customer-token',
        seller: 'mock-seller-token',
        admin: 'mock-admin-token',
      };
      const demoToken = mockTokens[role] || mockTokens.customer;
      saveSessionToken(demoToken);
      await fetchUserProfile(demoToken);
    } catch (err) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  // Standard Email/Password Login
  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      if (isMockAuth) {
        // Fallback demo login when live Supabase credentials are placeholder
        await loginAsDemoPersona(email.includes('admin') ? 'admin' : email.includes('seller') ? 'seller' : 'customer');
        return;
      }

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      if (data.session?.access_token) {
        saveSessionToken(data.session.access_token);
        await fetchUserProfile(data.session.access_token);
      }
    } catch (err) {
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Standard Email/Password Registration
  const register = async (email, password, fullName) => {
    setLoading(true);
    setError(null);
    try {
      if (isMockAuth) {
        await loginAsDemoPersona('customer');
        return;
      }

      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      });

      if (authError) throw authError;

      if (data.session?.access_token) {
        saveSessionToken(data.session.access_token);
        await fetchUserProfile(data.session.access_token);
      }
    } catch (err) {
      setError(err.message || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update Profile
  const updateProfile = async (updates) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.put('/auth/profile', updates);
      if (res.success && res.data?.profile) {
        setProfile(res.data.profile);
        setUser(res.data.profile);
      }
      return res;
    } catch (err) {
      setError(err.message || 'Failed to update profile');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    localStorage.removeItem('quicksure_auth_token');
    setToken(null);
    setUser(null);
    setProfile(null);
    setSeller(null);
    if (!isMockAuth) {
      await supabase.auth.signOut().catch(() => {});
    }
  };

  const value = {
    user,
    profile,
    seller,
    token,
    role: profile?.role || null,
    isAuthenticated: !!token && !!profile,
    isCustomer: profile?.role === 'customer',
    isSeller: profile?.role === 'seller',
    isAdmin: profile?.role === 'admin',
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    loginAsDemoPersona,
    refreshProfile: () => token && fetchUserProfile(token),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
