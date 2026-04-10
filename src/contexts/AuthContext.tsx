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
    console.log(`[PRODUCTION_AUTH] Step B: Fetching user profile from profiles table for ID: ${userId}`);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('[PRODUCTION_AUTH] Step B Failed: Error fetching profile:', error.message);
        return null;
      }
      
      if (!data) {
        console.error('[PRODUCTION_AUTH] Step B Failed: No profile data returned. Possible RLS issue.');
        return null;
      }
      
      return mapRow(data as Record<string, unknown>);
    } catch (err: any) {
      console.error('[PRODUCTION_AUTH] Step B Exception:', err?.message || err);
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
    let mounted = true;

    const initializeSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[PRODUCTION_AUTH] Initial getSession error:', error.message);
          return;
        }

        if (session?.user) {
          console.log('[PRODUCTION_AUTH] Found existing session on load. Fetching profile.');
          const profile = await fetchProfile(session.user.id);
          if (profile) {
            if (mounted) {
              setCurrentUser(profile);
              setSessionStart(profile.loginTime ?? null);
            }
          } else {
            console.error('[PRODUCTION_AUTH] Session found but profile missing/blocked by RLS. Triggering secure logout.');
            await supabase.auth.signOut();
            if (mounted) setCurrentUser(null);
          }
        }
      } catch (err) {
        console.error('[PRODUCTION_AUTH] Session bootstrap exception:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    initializeSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`[PRODUCTION_AUTH] Listener triggered -> Event: ${event}`);
      if (event === 'SIGNED_IN' && session?.user) {
        const profile = await fetchProfile(session.user.id);
        if (profile) {
          if (mounted) {
            setCurrentUser(profile);
            setSessionStart(profile.loginTime ?? null);
            setIsLoading(false);
          }
        } else {
          console.error('[PRODUCTION_AUTH] SIGNED_IN event triggered, but profile sync failed. Ensuring user is logged out.');
          await supabase.auth.signOut();
          if (mounted) {
            setCurrentUser(null);
            setIsLoading(false);
          }
        }
      } else if (event === 'SIGNED_OUT') {
        if (mounted) {
          setCurrentUser(null);
          setSessionStart(null);
          setIsLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  useEffect(() => {
    if (currentUser?.role === 'admin') fetchAllUsers();
  }, [currentUser, fetchAllUsers]);

  // ── Login ──
  const login = useCallback(async (identifier: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      let email = identifier.trim();

      console.log('[PRODUCTION_AUTH] Initiating Login sequence...');

      if (!email.includes('@')) {
        // Lookup by username OR student code
        const { data: profileData, error: lookupError } = await supabase
          .from('profiles')
          .select('email')
          .or(`username.eq.${email},student_code.eq.${email}`)
          .maybeSingle();

        if (lookupError) {
          console.error('[PRODUCTION_AUTH] Pre-login Profile lookup error:', lookupError.message);
          if (lookupError.message.includes('Failed to fetch') || lookupError.message.includes('FetchError')) {
            toast.error('Network Error: Could not connect to the database. Please check your internet connection.');
            return false;
          }
        }

        if (profileData?.email) {
          email = profileData.email as string;
        } else {
          email = `${email}@clinic.com`;
        }
      }

      console.log('[PRODUCTION_AUTH] Step A: Attempting Supabase Auth signInWithPassword.');
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        console.error('[PRODUCTION_AUTH] Step A Failed (Supabase Auth Error):', error.message);
        if (error.message.includes('Failed to fetch')) {
          toast.error('Network timeout: Unable to reach the server. Please check your connection or CORS settings.');
        } else if (error.message.includes('Invalid login credentials')) {
          toast.error('Invalid credentials: The username or password you entered is incorrect.');
        } else {
          toast.error('Login failed: ' + error.message);
        }
        return false;
      }

      if (data.user) {
        console.log('[PRODUCTION_AUTH] Step A Success. Auth established.');

        const now = new Date().toISOString();
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ is_active: true, session_start: now, last_seen: now })
          .eq('id', data.user.id);

        if (updateError) {
          console.error('[PRODUCTION_AUTH] Failed to update profile active status:', updateError.message);
        }

        const profile = await fetchProfile(data.user.id);
        
        // Defensive profile checking (RLS or incomplete setup)
        if (!profile) {
          console.error('[PRODUCTION_AUTH] Step B Failed. Profile data missing. Enacting defensive logout.');
          await supabase.auth.signOut();
          toast.error('Profile data missing: Your account may be improperly configured or blocked by security policies. Please contact an administrator.');
          return false;
        }

        console.log('[PRODUCTION_AUTH] Step B Success. Profile fetched safely.');
        setCurrentUser(profile);
        setSessionStart(now);
        return true;
      }
      return false;
    } catch (err: any) {
      console.error('[PRODUCTION_AUTH] Unexpected exception during login sequence:', err?.message || err);
      if (err?.message && err.message.includes('Failed to fetch')) {
        toast.error('Network connection failed. Please ensure you are connected to the internet.');
      } else {
        toast.error('An unexpected system error occurred during login. Please try again.');
      }
      return false;
    } finally {
      // Guaranteed State Resolution
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
  const register = useCallback(async (userData: Omit<User, 'id' | 'role'> & { password?: string }): Promise<boolean> => {
    try {
      const email = userData.email.trim().toLowerCase();
      const username = userData.username.trim().toLowerCase();

      console.log('[PRODUCTION_AUTH] Attempting to register user:', email);

      // Step 1: Create auth user via Supabase client (no edge function needed)
      const { data, error } = await supabase.auth.signUp({
        email,
        password: userData.password ?? 'TemporaryPassword123!',
        options: {
          data: {
            username,
            full_name: userData.fullName.trim(),
            student_code: userData.studentCode?.trim() || null,
          },
          // Do not require email confirmation for internal system
          emailRedirectTo: undefined,
        },
      });

      if (error) {
        console.error('[PRODUCTION_AUTH] Supabase auth signUp error:', error.message);
        if (error.message.includes('Failed to fetch')) {
          toast.error('Network Error: Could not connect to the server. Check your connection or CORS settings.');
        } else if (
          error.message.toLowerCase().includes('already registered') ||
          error.message.toLowerCase().includes('user already exists') ||
          error.status === 422
        ) {
          toast.error('An account with this email already exists. Please sign in instead.');
        } else {
          toast.error('Registration failed: ' + error.message);
        }
        return false;
      }

      const userId = data.user?.id;
      if (!userId) {
        toast.info('Account created! Check your email for a confirmation link, then sign in.');
        return true;
      }

      // Step 2: Upsert profile (trigger should handle this, but we do it explicitly
      // as a safety net in case the trigger doesn't fire)
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: userId,
        username,
        full_name: userData.fullName.trim(),
        email,
        student_code: userData.studentCode?.trim() || null,
        role: 'student',
        current_assignment: 'unassigned',
        is_active: false,
      }, { onConflict: 'id' });

      if (profileError && !profileError.message.includes('duplicate')) {
        console.warn('[PRODUCTION_AUTH] Profile upsert warning:', profileError.message);
      } else if (profileError?.message.includes('Failed to fetch')) {
        // Highly uncommon since signup just worked, but possible
        toast.error('Network Error generating profile. Your account was created but profile sync failed.');
      }

      return true;
    } catch (err: any) {
      console.error('[PRODUCTION_AUTH] Register network exception:', err?.message || err);
      if (err?.message && err.message.includes('Failed to fetch')) {
        toast.error('Network connection failed. Please ensure you are connected to the internet and try again.');
      } else {
        toast.error('Registration failed due to an unexpected error. Please check your connection.');
      }
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
