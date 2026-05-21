import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('studyverse_token');
      if (token) {
        try {
          const profile = await api.get('/auth/profile');
          setUser(profile);
        } catch (error) {
          console.error('Failed to load profile, logging out:', error);
          logout();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await api.post('/auth/login', { email, password });
      localStorage.setItem('studyverse_token', data.token);
      setUser({
        _id: data._id,
        name: data.name,
        email: data.email,
        xp: data.xp,
        level: data.level,
        streak: data.streak,
        badges: data.badges,
      });
      return data;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (name, email, password) => {
    setLoading(true);
    try {
      const data = await api.post('/auth/signup', { name, email, password });
      localStorage.setItem('studyverse_token', data.token);
      setUser({
        _id: data._id,
        name: data.name,
        email: data.email,
        xp: data.xp,
        level: data.level,
        streak: data.streak,
        badges: data.badges,
      });
      return data;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('studyverse_token');
    setUser(null);
  };

  const updateProfileState = (updates) => {
    setUser((prev) => {
      if (!prev) return null;
      return { ...prev, ...updates };
    });
  };

  const refreshProfile = async () => {
    try {
      const profile = await api.get('/auth/profile');
      setUser(profile);
      return profile;
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        logout,
        updateProfileState,
        refreshProfile,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
