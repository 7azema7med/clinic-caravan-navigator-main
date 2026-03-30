/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, ADMIN_USER, StudentAssignment } from '@/lib/types';

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  login: (identifier: string, password: string) => boolean;
  logout: () => void;
  register: (user: Omit<User, 'id' | 'role'>) => boolean;
  setAssignment: (assignment: StudentAssignment, clinicId?: string) => void;
  updateUser: (userId: string, updates: Partial<User>) => void;
  deleteUser: (userId: string) => void;
  getAllUsers: () => User[];
  sessionStart: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('clinic_users');
    const parsed = saved ? JSON.parse(saved) : [];
    if (!parsed.find((u: User) => u.id === ADMIN_USER.id)) {
      parsed.push(ADMIN_USER);
    }
    return parsed;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('clinic_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [sessionStart, setSessionStart] = useState<string | null>(() => {
    return localStorage.getItem('clinic_session_start');
  });

  useEffect(() => {
    localStorage.setItem('clinic_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('clinic_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('clinic_current_user');
    }
  }, [currentUser]);

  const login = useCallback((identifier: string, password: string): boolean => {
    const user = users.find(
      u => (u.username === identifier || u.email === identifier || u.studentCode === identifier) && u.password === password
    );
    if (user) {
      const now = new Date().toISOString();
      const updated = { ...user, loginTime: now, rotationStartTime: now, isActive: true };
      setCurrentUser(updated);
      setSessionStart(now);
      localStorage.setItem('clinic_session_start', now);
      setUsers(prev => prev.map(u => u.id === user.id ? updated : u));
      return true;
    }
    return false;
  }, [users]);

  const logout = useCallback(() => {
    if (currentUser) {
      setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, isActive: false } : u));
    }
    setCurrentUser(null);
    setSessionStart(null);
    localStorage.removeItem('clinic_current_user');
    localStorage.removeItem('clinic_session_start');
  }, [currentUser]);

  const register = useCallback((userData: Omit<User, 'id' | 'role'>): boolean => {
    const exists = users.some(u => u.username === userData.username || u.email === userData.email);
    if (exists) return false;
    const newUser: User = { ...userData, id: crypto.randomUUID(), role: 'student' };
    setUsers(prev => [...prev, newUser]);
    return true;
  }, [users]);

  const setAssignment = useCallback((assignment: StudentAssignment, clinicId?: string) => {
    if (!currentUser) return;
    const updated = { ...currentUser, assignment, assignedClinic: clinicId };
    setCurrentUser(updated);
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updated : u));
  }, [currentUser]);

  const updateUser = useCallback((userId: string, updates: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));
    if (currentUser?.id === userId) {
      setCurrentUser(prev => prev ? { ...prev, ...updates } : null);
    }
  }, [currentUser]);

  const deleteUser = useCallback((userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
  }, []);

  const getAllUsers = useCallback(() => users, [users]);

  return (
    <AuthContext.Provider value={{ currentUser, users, login, logout, register, setAssignment, updateUser, deleteUser, getAllUsers, sessionStart }}>
      {children}
    </AuthContext.Provider>
  );
};
