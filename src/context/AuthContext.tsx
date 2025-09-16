
"use client";

import type { User } from '@/types';
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (loginPayload: { phoneNumber: string }) => Promise<{ success: boolean; message?: string; user?: User | null }>;
  logout: () => void;
  updateUser: (updatedFields: Partial<Omit<User, 'id'>>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true); // Explicitly set loading to true at the start of the effect
    try {
      const storedUser = localStorage.getItem('farmConnectUser');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser) as User;
        setUser(parsedUser);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error("Failed to load user from localStorage. User session may be cleared or localStorage is unavailable.", error);
      // Optionally clear corrupted storage or handle error
      // localStorage.removeItem('farmConnectUser'); 
    } finally {
      setLoading(false); // Ensure loading is set to false in all cases
    }
  }, []);

  const login = async (loginPayload: { phoneNumber: string }): Promise<{ success: boolean; message?: string; user?: User | null }> => {
    let foundUser: User | null = null;
    try {
        const storedUserJson = localStorage.getItem('farmConnectUser');
        if (storedUserJson) {
            const potentialUser = JSON.parse(storedUserJson) as User;
            if (potentialUser.phoneNumber === loginPayload.phoneNumber) {
              foundUser = potentialUser;
            }
        }
    } catch (error) {
        console.error("LocalStorage error during login attempt:", error);
    }

    const userToSet: User = foundUser
      ? foundUser
      : {
          id: `user_${loginPayload.phoneNumber}_${Date.now()}`,
          phoneNumber: loginPayload.phoneNumber,
          role: null,
        };

    setUser(userToSet);
    setIsAuthenticated(true);
    try {
      localStorage.setItem('farmConnectUser', JSON.stringify(userToSet));
    } catch (error) {
      console.error("Failed to save user to localStorage during login", error);
      return { success: false, message: "Could not save session. Please ensure localStorage is enabled and not full." };
    }
    return { success: true, user: userToSet };
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    // localStorage.removeItem('farmConnectUser'); // Keep registration data
  };

  const updateUser = (updatedFields: Partial<Omit<User, 'id'>>) => {
    if (user) {
      const updatedUser = { ...user, ...updatedFields };

      if (
        updatedFields.fullAddress !== undefined ||
        updatedFields.pincode !== undefined ||
        updatedFields.stateAndDistrict !== undefined
      ) {
        // No longer need to explicitly undefined 'location' as it's removed from User type
      }
      
      setUser(updatedUser);
      try {
        localStorage.setItem('farmConnectUser', JSON.stringify(updatedUser));
      } catch (error) {
        console.error("Failed to update user in localStorage", error);
      }
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen"><p>Loading application...</p></div>;
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
