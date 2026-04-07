/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Patient, Clinic, SystemSettings, DEFAULT_VITAL_RANGES,
  SwitchRequest, ResearchQuestion, CustomVitalField,
  PatientStatus, VitalThreshold,
} from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface DataContextType {
  patients: Patient[];
  clinics: Clinic[];
  settings: SystemSettings;
  switchRequests: SwitchRequest[];
  addPatient: (patient: Omit<Patient, 'id' | 'ticketNumber' | 'status'>) => Promise<Patient | null>;
  updatePatient: (id: string, updates: Partial<Patient>) => Promise<void>;
  deletePatient: (id: string) => Promise<void>;
  getPatientByTicket: (ticket: string) => Patient | undefined;
  getPatientsByClinic: (clinicId: string) => Patient[];
  addClinic: (clinic: Omit<Clinic, 'id'>) => Promise<void>;
  updateClinic: (id: string, updates: Partial<Clinic>) => Promise<void>;
  deleteClinic: (id: string) => Promise<void>;
  updateSettings: (updates: Partial<SystemSettings>) => Promise<void>;
  uploadLogo: (file: File) => Promise<void>;
  updateVitalThreshold: (id: string, updates: Partial<VitalThreshold>) => Promise<void>;
  getNextTicketNumber: () => string;
  getClinicStats: () => { clinicId: string; clinicName: string; waiting: number; examined: number; absent: number; total: number }[];
  addSwitchRequest: (req: Omit<SwitchRequest, 'id' | 'createdAt' | 'status'>) => Promise<void>;
  updateSwitchRequest: (id: string, status: 'approved' | 'rejected') => Promise<void>;
  getPendingSwitchRequests: (userId: string) => SwitchRequest[];
  addResearchQuestion: (q: Omit<ResearchQuestion, 'id' | 'order'>) => Promise<void>;
  updateResearchQuestion: (id: string, updates: Partial<ResearchQuestion>) => Promise<void>;
  deleteResearchQuestion: (id: string) => Promise<void>;
  reorderResearchQuestions: (ids: string[]) => Promise<void>;
  saveResearchResponse: (patientId: string, responses: Record<string, unknown>, by: string) => Promise<void>;
  addCustomVitalField: (field: Omit<CustomVitalField, 'id'>) => Promise<void>;
  updateCustomVitalField: (id: string, updates: Partial<CustomVitalField>) => Promise<void>;
  deleteCustomVitalField: (id: string) => Promise<void>;
  vitalThresholds: VitalThreshold[];
  isLoading: boolean;
}

const DataContext = createContext<DataContextType | null>(null);

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
};

const DEFAULT_SETTINGS: SystemSettings = {
  registrationOpen: true,
  rotationTimeMinutes: 30,
  vitalRanges: DEFAULT_VITAL_RANGES,
  vitalThresholds: [],
  researchQuestions: [],
  registrationFields: [],
  customVitalFields: [],
  logoUrl: null,
  organizationName: 'Medical Caravan',
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [vitalThresholds, setVitalThresholds] = useState<VitalThreshold[]>([]);
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);
  const [switchRequests, setSwitchRequests] = useState<SwitchRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ── Data Mapping ──
  const mapDataToPatient = useCallback((p: Record<string, unknown>, v: Record<string, unknown> | null, e: Record<string, unknown> | null, r: Record<string, unknown>[]): Patient => {
    const clinicInfo = (p.clinics as Record<string, unknown>) || {};
    const patientName = (p.full_name_ar as string) || 'Unnamed Patient';
    const clinicNameAr = clinicInfo.name_ar as string | undefined;
    const clinicIsActive = clinicInfo.is_active as boolean | undefined;
    const clinicName = clinicNameAr
      ? (clinicIsActive !== false ? clinicNameAr : `[Unavailable] ${clinicNameAr}`)
      : 'Unknown Clinic';

    return {
      id: p.id as string,
      ticketNumber: String(p.ticket_number ?? 0).padStart(4, '0'),
      fullNameAr: patientName,
      age: (p.age as number) || 0,
      phone: p.phone as string | undefined,
      mainComplaint: (p.main_complaint as string) || '',
      clinicId: p.clinic_id as string,
      clinicName,
      note: p.note as string | undefined,
      referToVitals: !!(p.referred_to_vital_signs),
      referToResearch: !!(p.referred_to_research),
      registeredBy: ((p.profiles as Record<string, unknown>)?.username as string) || 'Unknown',
      registeredAt: (p.registration_time as string) || new Date().toISOString(),
      status: ((p.status as PatientStatus) in { waiting: 1, examined: 1, absent: 1 })
        ? (p.status as PatientStatus)
        : 'waiting',

      vitalsCompleted: !!v,
      bloodPressureSystolic: v?.bp_systolic as number | undefined,
      bloodPressureDiastolic: v?.bp_diastolic as number | undefined,
      bloodSugar: v?.blood_sugar as number | undefined,
      pulse: v?.pulse as number | undefined,
      temperature: v?.temperature as number | undefined,
      weight: v?.weight as number | undefined,
      height: v?.height as number | undefined,
      oxygenSaturation: v?.oxygen_saturation as number | undefined,
      pastHistory: v?.past_history as string | undefined,
      vitalsNote: v?.note as string | undefined,
      vitalsBy: v?.student_id as string | undefined,
      vitalsAt: v?.recorded_at as string | undefined,
      customVitals: (v?.custom_vitals as Record<string, string | number>) || {},

      examined: !!e,
      diagnosis: e?.diagnosis as string | undefined,
      treatment: e?.treatment as string | undefined,
      investigation: e?.investigation as string | undefined,
      referral: !!(e?.referral),
      referralNote: e?.referral_to as string | undefined,
      examNote: e?.doctor_note as string | undefined,
      doctorSignature: e?.doctor_signature as string | undefined,
      examStudentSignature: e?.student_signature as string | undefined,
      examinedAt: e?.examined_at as string | undefined,

      researchCompleted: Array.isArray(r) && r.length > 0,
      researchResponses: Array.isArray(r)
        ? r.reduce((acc, curr) => ({ ...acc, [curr.question_id as string]: curr.answer }), {})
        : {},
      researchBy: r?.[0]?.student_id as string | undefined,
      researchAt: r?.[0]?.answered_at as string | undefined,
    };
  }, []);

  // ── Fetch All Data ──
  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Clinics
      const { data: clinicsData } = await supabase
        .from('clinics').select('*').order('display_order');
      if (clinicsData) {
        setClinics(clinicsData.map(c => ({
          id: c.id as string,
          name: (c.name as string) || '',
          nameAr: (c.name_ar as string) || '',
          doctorName: (c.doctor_name as string) || '',
          isActive: c.is_active as boolean,
        })));
      }

      // 2. Patients (with joins)
      const { data: patientsData } = await supabase
        .from('patients')
        .select(`*, clinics(*), profiles(username), vital_signs(*), examinations(*), research_answers(*)`)
        .order('created_at', { ascending: false });

      if (patientsData) {
        const mapped = patientsData.map(p => {
          const row = p as Record<string, unknown>;
          const vs = Array.isArray(row.vital_signs) ? row.vital_signs[0] as Record<string, unknown> : null;
          const ex = Array.isArray(row.examinations) ? row.examinations[0] as Record<string, unknown> : null;
          const ra = Array.isArray(row.research_answers) ? row.research_answers as Record<string, unknown>[] : [];
          return mapDataToPatient(row, vs, ex, ra);
        });
        setPatients(mapped);
      }

      // 3. Vital thresholds
      const { data: thresholds } = await supabase
        .from('vital_signs_thresholds').select('*').order('metric');
      if (thresholds) setVitalThresholds(thresholds as VitalThreshold[]);

      // 4. Research questions
      const { data: questionsData } = await supabase
        .from('registration_questions')
        .select('*')
        .eq('section', 'research')
        .order('display_order');
      const researchQuestions: ResearchQuestion[] = (questionsData ?? []).map((q, idx) => ({
        id: q.id as string,
        question: (q.question_text as string) || '',
        questionAr: q.question_text_ar as string | undefined,
        type: (q.question_type as ResearchQuestion['type']) || 'text',
        options: Array.isArray(q.options) ? q.options as string[] : undefined,
        required: !!(q.is_required),
        order: (q.display_order as number) ?? idx,
      }));

      // 5. System settings (key-value rows)
      const { data: settingsData } = await supabase.from('system_settings').select('*');
      const mappedSettings: Partial<SystemSettings> = {};
      if (settingsData) {
        settingsData.forEach(s => {
          const key = s.key as string;
          const val = s.value as string;
          if (key === 'registration_open' || key === 'registration_enabled') {
            mappedSettings.registrationOpen = val === 'true';
          }
          if (key === 'rotation_time_minutes' || key === 'rotation_duration_minutes') {
            mappedSettings.rotationTimeMinutes = parseInt(val) || 30;
          }
          if (key === 'logo_url') {
            mappedSettings.logoUrl = val || null;
          }
          if (key === 'organization_name') {
            mappedSettings.organizationName = val || 'Medical Caravan';
          }
        });
      }

      setSettings(prev => ({
        ...prev,
        ...mappedSettings,
        researchQuestions,
      }));

      // 6. Switch requests
      const { data: swData } = await supabase
        .from('switch_requests').select('*').order('created_at', { ascending: false });
      if (swData) {
        setSwitchRequests(swData.map(r => ({
          id: r.id as string,
          requesterId: r.requester_id as string,
          requesterName: (r.requester_name as string) || 'Unknown',
          requesterAssignment: r.requester_assignment as SwitchRequest['requesterAssignment'],
          requesterClinic: r.requester_clinic as string | undefined,
          targetUserId: r.target_user_id as string,
          targetUserName: (r.target_user_name as string) || 'Unknown',
          targetAssignment: r.target_assignment as SwitchRequest['targetAssignment'],
          targetClinic: r.target_clinic as string | undefined,
          status: r.status as 'pending' | 'approved' | 'rejected',
          createdAt: r.created_at as string,
        })));
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      toast.error('Failed to load data. Check your connection.');
    } finally {
      setIsLoading(false);
    }
  }, [mapDataToPatient]);

  // ── Realtime Subscriptions ──
  useEffect(() => {
    fetchAllData();
    const channel = supabase.channel('db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, fetchAllData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vital_signs' }, fetchAllData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'examinations' }, fetchAllData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'switch_requests' }, fetchAllData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clinics' }, fetchAllData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vital_signs_thresholds' }, fetchAllData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'system_settings' }, fetchAllData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'registration_questions' }, fetchAllData)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchAllData]);

  // ── Logo Upload (Base64 stored in system_settings) ──
  const uploadLogo = useCallback(async (file: File) => {
    try {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Logo file must be smaller than 2 MB');
        return;
      }
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Upsert into system_settings
      await supabase.from('system_settings').upsert(
        { key: 'logo_url', value: base64 },
        { onConflict: 'key' }
      );
      setSettings(prev => ({ ...prev, logoUrl: base64 }));
      toast.success('Logo uploaded successfully');
    } catch (err) {
      console.error('Logo upload error:', err);
      toast.error('Failed to upload logo');
    }
  }, []);

  // ── Helpers ──
  const getNextTicketNumber = useCallback((): string => {
    const nextNum = patients.length + 1;
    return String(nextNum).padStart(4, '0');
  }, [patients]);

  // ── Patients CRUD ──
  const addPatient = useCallback(async (patientData: Omit<Patient, 'id' | 'ticketNumber' | 'status'>): Promise<Patient | null> => {
    const { data, error } = await supabase
      .from('patients')
      .insert({
        full_name_ar: patientData.fullNameAr,
        age: patientData.age,
        phone: patientData.phone,
        main_complaint: patientData.mainComplaint,
        clinic_id: patientData.clinicId,
        note: patientData.note,
        referred_to_vital_signs: patientData.referToVitals,
        referred_to_research: patientData.referToResearch,
        status: 'waiting',
      })
      .select('*, clinics(name_ar, is_active), profiles(username)')
      .single();

    if (error) { toast.error('Failed to add patient: ' + error.message); return null; }
    const patient = mapDataToPatient(data as Record<string, unknown>, null, null, []);
    setPatients(prev => [patient, ...prev]);
    return patient;
  }, [mapDataToPatient]);

  const updatePatient = useCallback(async (id: string, updates: Partial<Patient>) => {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.fullNameAr !== undefined) dbUpdates.full_name_ar = updates.fullNameAr;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.note !== undefined) dbUpdates.note = updates.note;
    if (updates.clinicId !== undefined) dbUpdates.clinic_id = updates.clinicId;

    if (Object.keys(dbUpdates).length > 0) {
      const { error } = await supabase.from('patients').update(dbUpdates).eq('id', id);
      if (error) { toast.error('Failed to update patient'); return; }
    }

    // Vitals upsert
    if (updates.vitalsCompleted || updates.bloodPressureSystolic !== undefined) {
      await supabase.from('vital_signs').upsert({
        patient_id: id,
        bp_systolic: updates.bloodPressureSystolic,
        bp_diastolic: updates.bloodPressureDiastolic,
        blood_sugar: updates.bloodSugar,
        pulse: updates.pulse,
        temperature: updates.temperature,
        weight: updates.weight,
        height: updates.height,
        oxygen_saturation: updates.oxygenSaturation,
        past_history: updates.pastHistory,
        note: updates.vitalsNote,
        student_id: updates.vitalsBy,
        recorded_at: new Date().toISOString(),
      }, { onConflict: 'patient_id' });
    }

    // Examination upsert
    if (updates.examined || updates.diagnosis !== undefined) {
      await supabase.from('examinations').upsert({
        patient_id: id,
        diagnosis: updates.diagnosis,
        treatment: updates.treatment,
        investigation: updates.investigation,
        referral: updates.referral,
        referral_to: updates.referralNote,
        doctor_note: updates.examNote,
        doctor_signature: updates.doctorSignature,
        student_signature: updates.examStudentSignature,
        examined_at: new Date().toISOString(),
      }, { onConflict: 'patient_id' });
    }

    fetchAllData();
  }, [fetchAllData]);

  const deletePatient = useCallback(async (id: string) => {
    const { error } = await supabase.from('patients').delete().eq('id', id);
    if (error) { toast.error('Failed to delete patient'); return; }
    setPatients(prev => prev.filter(p => p.id !== id));
  }, []);

  const getPatientByTicket = useCallback((ticket: string) =>
    patients.find(p => p.ticketNumber === ticket), [patients]);

  const getPatientsByClinic = useCallback((clinicId: string) =>
    patients
      .filter(p => p.clinicId === clinicId)
      .sort((a, b) => parseInt(a.ticketNumber) - parseInt(b.ticketNumber)),
    [patients]);

  // ── Clinics CRUD ──
  const addClinic = useCallback(async (clinicData: Omit<Clinic, 'id'>) => {
    const { error } = await supabase.from('clinics').insert({
      name: clinicData.name,
      name_ar: clinicData.nameAr,
      doctor_name: clinicData.doctorName,
      is_active: clinicData.isActive,
    });
    if (error) toast.error('Failed to add clinic');
    else fetchAllData();
  }, [fetchAllData]);

  const updateClinic = useCallback(async (id: string, updates: Partial<Clinic>) => {
    const { error } = await supabase.from('clinics').update({
      name: updates.name,
      name_ar: updates.nameAr,
      doctor_name: updates.doctorName,
      is_active: updates.isActive,
    }).eq('id', id);
    if (error) toast.error('Failed to update clinic');
    else fetchAllData();
  }, [fetchAllData]);

  const deleteClinic = useCallback(async (id: string) => {
    const { error } = await supabase.from('clinics').delete().eq('id', id);
    if (error) toast.error('Failed to delete clinic');
    else fetchAllData();
  }, [fetchAllData]);

  // ── Settings ──
  const updateSettings = useCallback(async (updates: Partial<SystemSettings>) => {
    try {
      const upserts: { key: string; value: string }[] = [];
      if (updates.registrationOpen !== undefined) {
        upserts.push({ key: 'registration_open', value: String(updates.registrationOpen) });
        upserts.push({ key: 'registration_enabled', value: String(updates.registrationOpen) });
      }
      if (updates.rotationTimeMinutes !== undefined) {
        upserts.push({ key: 'rotation_time_minutes', value: String(updates.rotationTimeMinutes) });
        upserts.push({ key: 'rotation_duration_minutes', value: String(updates.rotationTimeMinutes) });
      }
      if (updates.organizationName !== undefined) {
        upserts.push({ key: 'organization_name', value: updates.organizationName });
      }
      for (const row of upserts) {
        await supabase.from('system_settings').upsert(row, { onConflict: 'key' });
      }
      setSettings(prev => ({ ...prev, ...updates }));
      toast.success('Settings saved');
    } catch (err) {
      console.error('Settings update error:', err);
      toast.error('Failed to save settings');
    }
  }, []);

  const updateVitalThreshold = useCallback(async (id: string, updates: Partial<VitalThreshold>) => {
    const { error } = await supabase.from('vital_signs_thresholds').update({
      min_value: updates.min_value,
      max_value: updates.max_value,
      label_ar: updates.label_ar,
      color: updates.color,
    }).eq('id', id);
    if (error) { toast.error('Failed to update threshold'); return; }
    toast.success('Threshold updated');
    fetchAllData();
  }, [fetchAllData]);

  // ── Clinic Stats ──
  const getClinicStats = useCallback(() =>
    clinics.filter(c => c.isActive).map(clinic => {
      const cp = patients.filter(p => p.clinicId === clinic.id);
      return {
        clinicId: clinic.id,
        clinicName: `${clinic.nameAr} - ${clinic.name}`,
        waiting: cp.filter(p => !p.examined && p.status !== 'absent').length,
        examined: cp.filter(p => p.examined || p.status === 'examined').length,
        absent: cp.filter(p => p.status === 'absent').length,
        total: cp.length,
      };
    }), [clinics, patients]);

  // ── Switch Requests ──
  const addSwitchRequest = useCallback(async (reqData: Omit<SwitchRequest, 'id' | 'createdAt' | 'status'>) => {
    const { error } = await supabase.from('switch_requests').insert({
      requester_id: reqData.requesterId,
      requester_name: reqData.requesterName,
      requester_assignment: reqData.requesterAssignment,
      requester_clinic: reqData.requesterClinic,
      target_user_id: reqData.targetUserId,
      target_user_name: reqData.targetUserName,
      target_assignment: reqData.targetAssignment,
      target_clinic: reqData.targetClinic,
      status: 'pending',
    });
    if (error) toast.error('Failed to send switch request');
    else fetchAllData();
  }, [fetchAllData]);

  const updateSwitchRequest = useCallback(async (id: string, status: 'approved' | 'rejected') => {
    const { error } = await supabase.from('switch_requests').update({ status }).eq('id', id);
    if (error) toast.error('Failed to update request');
    else fetchAllData();
  }, [fetchAllData]);

  const getPendingSwitchRequests = useCallback((userId: string) =>
    switchRequests.filter(r => r.targetUserId === userId && r.status === 'pending'),
    [switchRequests]);

  // ── Research Questions ──
  const addResearchQuestion = useCallback(async (qData: Omit<ResearchQuestion, 'id' | 'order'>) => {
    const { data: maxRow } = await supabase
      .from('registration_questions')
      .select('display_order')
      .eq('section', 'research')
      .order('display_order', { ascending: false })
      .limit(1)
      .maybeSingle();
    const nextOrder = ((maxRow?.display_order as number) ?? 0) + 1;

    const { error } = await supabase.from('registration_questions').insert({
      question_text: qData.question,
      question_text_ar: qData.questionAr,
      question_type: qData.type,
      options: qData.options ?? null,
      is_required: qData.required,
      section: 'research',
      display_order: nextOrder,
    });
    if (error) toast.error('Failed to add question');
    else fetchAllData();
  }, [fetchAllData]);

  const updateResearchQuestion = useCallback(async (id: string, updates: Partial<ResearchQuestion>) => {
    const { error } = await supabase.from('registration_questions').update({
      question_text: updates.question,
      question_text_ar: updates.questionAr,
      question_type: updates.type,
      options: updates.options ?? null,
      is_required: updates.required,
    }).eq('id', id);
    if (error) toast.error('Failed to update question');
    else fetchAllData();
  }, [fetchAllData]);

  const deleteResearchQuestion = useCallback(async (id: string) => {
    const { error } = await supabase.from('registration_questions').delete().eq('id', id);
    if (error) toast.error('Failed to delete question');
    else fetchAllData();
  }, [fetchAllData]);

  const reorderResearchQuestions = useCallback(async (ids: string[]) => {
    for (let i = 0; i < ids.length; i++) {
      await supabase.from('registration_questions').update({ display_order: i + 1 }).eq('id', ids[i]);
    }
    fetchAllData();
  }, [fetchAllData]);

  const saveResearchResponse = useCallback(async (patientId: string, responses: Record<string, unknown>, _by: string) => {
    const answers = Object.entries(responses).map(([qId, val]) => ({
      patient_id: patientId,
      question_id: qId,
      answer: String(val),
    }));
    const { error } = await supabase.from('research_answers').insert(answers);
    if (error) { toast.error('Failed to save research responses'); return; }
    fetchAllData();
  }, [fetchAllData]);

  // ── Custom Vital Fields (stub — DB schema pending) ──
  const addCustomVitalField = useCallback(async (_fieldData: Omit<CustomVitalField, 'id'>) => {
    toast.info('Custom vital fields will be available in a future update.');
  }, []);
  const updateCustomVitalField = useCallback(async (_id: string, _updates: Partial<CustomVitalField>) => {
    toast.info('Custom vital fields will be available in a future update.');
  }, []);
  const deleteCustomVitalField = useCallback(async (_id: string) => {
    toast.info('Custom vital fields will be available in a future update.');
  }, []);

  return (
    <DataContext.Provider value={{
      patients, clinics, settings, switchRequests,
      addPatient, updatePatient, deletePatient,
      getPatientByTicket, getPatientsByClinic,
      addClinic, updateClinic, deleteClinic,
      updateSettings, uploadLogo, updateVitalThreshold,
      getNextTicketNumber, getClinicStats,
      addSwitchRequest, updateSwitchRequest, getPendingSwitchRequests,
      addResearchQuestion, updateResearchQuestion, deleteResearchQuestion,
      reorderResearchQuestions, saveResearchResponse,
      addCustomVitalField, updateCustomVitalField, deleteCustomVitalField,
      vitalThresholds, isLoading,
    }}>
      {children}
    </DataContext.Provider>
  );
};
