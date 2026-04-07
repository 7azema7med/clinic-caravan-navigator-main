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
  register: (user: Omit<User, 'id' | 'role'> & { password?: string }) => Promise<boolean>;
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

const mapRow = (data: Record<string, unknown>): User => ({
  id: data.id as string,
  username: (data.username as string) ?? '',
  email: (data.email as string) ?? '',
  fullName: (data.full_name as string) ?? '',
  studentCode: data.student_code as string | undefined,
  role: ((data.role as string) === 'admin' ? 'admin' : 'student'),
  assignment: (data.current_assignment as StudentAssignment) ?? undefined,
  assignedClinic: data.assigned_clinic_id as string | undefined,
  isActive: data.is_active as boolean | undefined,
  loginTime: data.session_start as string | undefined,
  rotationStartTime: data.rotation_start_time as string | undefined,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [sessionStart, setSessionStart] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string): Promise<User | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (error || !data) return null;
      return mapRow(data as Record<string, unknown>);
    } catch {
      return null;
    }
  }, []);

  const fetchAllUsers = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('profiles').select('*');
      if (error || !data) return;
      setUsers(data.map(u => mapRow(u as Record<string, unknown>)));
    } catch {
      // silently fail — non-critical
    }
  }, []);

  // ── Session Bootstrap ──
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        setCurrentUser(profile);
        setSessionStart(profile?.loginTime ?? null);
      }
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const profile = await fetchProfile(session.user.id);
        setCurrentUser(profile);
        setSessionStart(profile?.loginTime ?? null);
        setIsLoading(false);
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setSessionStart(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  useEffect(() => {
    if (currentUser?.role === 'admin') fetchAllUsers();
  }, [currentUser, fetchAllUsers]);

  // ── Login ──
  const login = useCallback(async (identifier: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      let email = identifier.trim();

      if (!email.includes('@')) {
        // Lookup by username OR student code
        const { data: profileData } = await supabase
          .from('profiles')
          .select('email')
          .or(`username.eq.${email},student_code.eq.${email}`)
          .maybeSingle();

        if (profileData?.email) {
          email = profileData.email as string;
        } else {
          email = `${email}@clinic.com`;
        }
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        toast.error('Login failed: ' + error.message);
        return false;
      }

      if (data.user) {
        const now = new Date().toISOString();
        await supabase
          .from('profiles')
          .update({ is_active: true, session_start: now, last_seen: now })
          .eq('id', data.user.id);

        const profile = await fetchProfile(data.user.id);
        setCurrentUser(profile);
        setSessionStart(now);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Login error:', err);
      toast.error('Login failed. Please check your connection.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [fetchProfile]);

  // ── Logout ──
  const logout = useCallback(async () => {
    try {
      if (currentUser) {
        await supabase.from('profiles').update({ is_active: false }).eq('id', currentUser.id);
      }
      await supabase.auth.signOut();
      setCurrentUser(null);
      setUsers([]);
    } catch (err) {
      console.error('Logout error:', err);
    }
  }, [currentUser]);

  // ── Register ──
  // Uses an Edge Function with the service role key so email confirmation
  // is bypassed entirely — accounts are active immediately.
  const register = useCallback(async (userData: Omit<User, 'id' | 'role'> & { password?: string }): Promise<boolean> => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

      const res = await fetch(`${supabaseUrl}/functions/v1/create-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
        },
        body: JSON.stringify({
          email: userData.email,
          password: userData.password ?? 'TemporaryPassword123!',
          username: userData.username,
          fullName: userData.fullName,
          studentCode: userData.studentCode ?? null,
        }),
      });

      const result = await res.json() as { success?: boolean; error?: string; userId?: string };

      if (!res.ok || result.error) {
        const msg = result.error ?? 'Registration failed';
        toast.error(msg.includes('already registered') || msg.includes('already exists')
          ? 'An account with this email already exists.'
          : 'Registration failed: ' + msg
        );
        return false;
      }

      return true;
    } catch (err) {
      console.error('Register error:', err);
      // "Failed to fetch" usually means no internet or a CORS issue
      toast.error('Could not connect to the server. Check your internet connection and try again.');
      return false;
    }
  }, []);

  // ── Set Assignment ──
  const setAssignment = useCallback(async (assignment: StudentAssignment, clinicId?: string) => {
    if (!currentUser) return;
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('profiles')
      .update({
        current_assignment: assignment,
        assigned_clinic_id: clinicId ?? null,
        rotation_start_time: now,
      })
      .eq('id', currentUser.id);

    if (error) { toast.error('Failed to update assignment'); return; }
    const updated = await fetchProfile(currentUser.id);
    setCurrentUser(updated);
  }, [currentUser, fetchProfile]);

  // ── Update User ──
  const updateUser = useCallback(async (userId: string, updates: Partial<User>) => {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.fullName !== undefined) dbUpdates.full_name = updates.fullName;
    if (updates.role !== undefined) dbUpdates.role = updates.role;
    if (updates.assignment !== undefined) dbUpdates.current_assignment = updates.assignment;
    if (updates.assignedClinic !== undefined) dbUpdates.assigned_clinic_id = updates.assignedClinic;
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
    if (updates.rotationStartTime !== undefined) dbUpdates.rotation_start_time = updates.rotationStartTime;

    if (Object.keys(dbUpdates).length === 0) return;

    const { error } = await supabase.from('profiles').update(dbUpdates).eq('id', userId);
    if (error) { toast.error('Failed to update user'); return; }

    if (currentUser?.id === userId) {
      const updated = await fetchProfile(userId);
      setCurrentUser(updated);
    }
    fetchAllUsers();
  }, [currentUser, fetchAllUsers, fetchProfile]);

  // ── Delete User ──
  const deleteUser = useCallback(async (userId: string) => {
    const { error } = await supabase.from('profiles').delete().eq('id', userId);
    if (error) { toast.error('Failed to delete user'); return; }
    setUsers(prev => prev.filter(u => u.id !== userId));
  }, []);

  const getAllUsers = useCallback(() => users, [users]);

  return (
    <AuthContext.Provider value={{
      currentUser, users, login, logout, register,
      setAssignment, updateUser, deleteUser, getAllUsers,
      sessionStart, isLoading,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
