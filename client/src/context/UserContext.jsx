import React, { createContext, useState, useEffect, useCallback } from 'react';
import { getCurrentUser, login as apiLogin, logout as apiLogout } from '../services/api';

export const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkUserSession = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getCurrentUser();
      setUser(data);
    } catch (error) {
      console.error('No active session or could not fetch user', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkUserSession();
  }, [checkUserSession]);

  const login = useCallback(async (credentials) => {
    try {
      const { data } = await apiLogin(credentials);
      setUser(data.user); // The API now returns a user object
      return data;
    } catch (error) {
      console.error('Login failed', error);
      throw error; // Re-throw to be handled by the login form
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
      setUser(null);
    } catch (error) {
      console.error('Logout failed', error);
    }
  }, []);

  const contextValue = {
    user,
    setUser, // Keep setUser for direct manipulation if needed, e.g., profile update
    loading,
    login,
    logout,
    checkUserSession // Expose to allow manual re-check
  };

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};