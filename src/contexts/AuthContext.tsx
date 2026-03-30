/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, StudentAssignment } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  login: (identifier: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  register: (user: Omit<User, 'id' | 'role' | 'password'> & { password?: string }) => Promise<boolean>;
  setAssignment: (assignment: StudentAssignment, clinicId?: string) => Promise<void>;
  updateUser: (userId: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  getAllUsers: () => User[];
  sessionStart: string | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [sessionStart, setSessionStart] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Sync profile data from Supabase 'profiles' table
  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    if (data) {
      const mappedUser: User = {
        id: data.id,
        username: data.username,
        email: data.email,
        fullName: data.full_name,
        studentCode: data.student_code,
        role: (data.role as 'admin' | 'student') || 'student',
        assignment: (data.current_assignment as StudentAssignment) || 'unassigned',
        assignedClinic: data.assigned_clinic_id,
        isActive: data.is_active,
        loginTime: data.session_start,
      };
      return mappedUser;
    }
    return null;
  }, []);

  const fetchAllUsers = useCallback(async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*');

    if (error) {
      console.error('Error fetching users:', error);
      return;
    }

    if (data) {
      const mappedUsers: User[] = data.map(u => ({
        id: u.id,
        username: u.username,
        email: u.email,
        fullName: u.full_name,
        studentCode: u.student_code,
        role: u.role as 'admin' | 'student',
        assignment: u.current_assignment as StudentAssignment,
        assignedClinic: u.assigned_clinic_id,
        isActive: u.is_active,
        loginTime: u.session_start,
      }));
      setUsers(mappedUsers);
    }
  }, []);

  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        setCurrentUser(profile);
        setSessionStart(profile?.loginTime || null);
      }
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const profile = await fetchProfile(session.user.id);
        setCurrentUser(profile);
        setSessionStart(profile?.loginTime || null);
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setSessionStart(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      fetchAllUsers();
    }
  }, [currentUser, fetchAllUsers]);

  const login = useCallback(async (identifier: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const isEmail = identifier.includes('@');
      const { data, error } = await supabase.auth.signInWithPassword({
        email: isEmail ? identifier : `${identifier}@clinic.com`,
        password,
      });

      if (error) {
        toast.error('Login failed: ' + error.message);
        return false;
      }

      if (data.user) {
        const now = new Date().toISOString();
        await supabase.from('profiles').update({ 
          is_active: true, 
          session_start: now,
          last_seen: now 
        }).eq('id', data.user.id);
        
        const profile = await fetchProfile(data.user.id);
        setCurrentUser(profile);
        setSessionStart(now);
        return true;
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [fetchProfile]);

  const logout = useCallback(async () => {
    if (currentUser) {
      await supabase.from('profiles').update({ is_active: false }).eq('id', currentUser.id);
    }
    await supabase.auth.signOut();
  }, [currentUser]);

  const register = useCallback(async (userData: Omit<User, 'id' | 'role' | 'password'> & { password?: string }): Promise<boolean> => {
    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password || 'TemporaryPassword123!',
      options: {
        data: {
          full_name: userData.fullName,
          username: userData.username,
        }
      }
    });

    if (error) {
      toast.error('Registration failed: ' + error.message);
      return false;
    }

    if (data.user) {
      // Profile is typically created via a DB trigger, but manually just in case
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        username: userData.username,
        full_name: userData.fullName,
        email: userData.email,
        student_code: userData.studentCode,
        role: 'student',
        current_assignment: 'unassigned'
      });

      if (profileError && profileError.code !== '23505') { // Ignore unique constraint if trigger already fired
        console.error('Error creating profile:', profileError);
      }
      return true;
    }
    return false;
  }, []);

  const setAssignment = useCallback(async (assignment: StudentAssignment, clinicId?: string) => {
    if (!currentUser) return;
    
    const { error } = await supabase
      .from('profiles')
      .update({ 
        current_assignment: assignment, 
        assigned_clinic_id: clinicId 
      })
      .eq('id', currentUser.id);

    if (error) {
      toast.error('Failed to update assignment');
      return;
    }

    const updated = await fetchProfile(currentUser.id);
    setCurrentUser(updated);
  }, [currentUser, fetchProfile]);

  const updateUser = useCallback(async (userId: string, updates: Partial<User>) => {
    const dbUpdates: any = {};
    if (updates.fullName) dbUpdates.full_name = updates.fullName;
    if (updates.assignment) dbUpdates.current_assignment = updates.assignment;
    if (updates.assignedClinic !== undefined) dbUpdates.assigned_clinic_id = updates.assignedClinic;
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;

    const { error } = await supabase
      .from('profiles')
      .update(dbUpdates)
      .eq('id', userId);

    if (error) {
      toast.error('Failed to update user');
      return;
    }

    if (currentUser?.id === userId) {
      const updated = await fetchProfile(userId);
      setCurrentUser(updated);
    }
    fetchAllUsers();
  }, [currentUser, fetchAllUsers, fetchProfile]);

  const deleteUser = useCallback(async (userId: string) => {
    const { error } = await supabase.from('profiles').delete().eq('id', userId);
    if (error) {
      toast.error('Failed to delete profile');
      return;
    }
    fetchAllUsers();
  }, [fetchAllUsers]);

  const getAllUsers = useCallback(() => users, [users]);

  return (
    <AuthContext.Provider value={{ currentUser, users, login, logout, register, setAssignment, updateUser, deleteUser, getAllUsers, sessionStart, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
