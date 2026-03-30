/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Patient, Clinic, SystemSettings, DEFAULT_VITAL_RANGES, SwitchRequest, ResearchQuestion, CustomVitalField, PatientStatus, VitalThreshold } from '@/lib/types';
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
  updateVitalThreshold: (id: string, updates: Partial<VitalThreshold>) => Promise<void>;
  getNextTicketNumber: () => string;
  getClinicStats: () => { clinicId: string; clinicName: string; waiting: number; examined: number; absent: number; total: number }[];
  addSwitchRequest: (req: Omit<SwitchRequest, 'id' | 'createdAt' | 'status'>) => Promise<void>;
  updateSwitchRequest: (id: string, status: 'approved' | 'rejected') => Promise<void>;
  getPendingSwitchRequests: (userId: string) => SwitchRequest[];
  // Research
  addResearchQuestion: (q: Omit<ResearchQuestion, 'id' | 'order'>) => Promise<void>;
  updateResearchQuestion: (id: string, updates: Partial<ResearchQuestion>) => Promise<void>;
  deleteResearchQuestion: (id: string) => Promise<void>;
  reorderResearchQuestions: (ids: string[]) => Promise<void>;
  saveResearchResponse: (patientId: string, responses: Record<string, unknown>, by: string) => Promise<void>;
  // Custom vitals
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
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [vitalThresholds, setVitalThresholds] = useState<VitalThreshold[]>([]);
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);
  const [switchRequests, setSwitchRequests] = useState<SwitchRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ── Data Mapping Helpers ──
  const mapDataToPatient = useCallback((p: any, v: any, e: any, r: any[]): Patient => {
    return {
      id: p.id,
      ticketNumber: String(p.ticket_number).padStart(4, '0'),
      fullNameAr: p.full_name_ar,
      age: p.age,
      phone: p.phone,
      mainComplaint: p.main_complaint,
      clinicId: p.clinic_id,
      clinicName: p.clinics ? (p.clinics.is_active ? p.clinics.name_ar : `[Unavailable] ${p.clinics.name_ar}`) : 'Unknown',
      note: p.note,
      referToVitals: p.referred_to_vital_signs,
      referToResearch: p.referred_to_research,
      registeredBy: p.profiles?.username || 'Unknown',
      registeredAt: p.registration_time,
      status: p.status as PatientStatus,
      
      // Vitals
      vitalsCompleted: !!v,
      bloodPressureSystolic: v?.bp_systolic,
      bloodPressureDiastolic: v?.bp_diastolic,
      bloodSugar: v?.blood_sugar,
      pulse: v?.pulse,
      temperature: v?.temperature,
      weight: v?.weight,
      height: v?.height,
      oxygenSaturation: v?.oxygen_saturation,
      pastHistory: v?.past_history,
      vitalsNote: v?.note,
      vitalsBy: v?.student_id,
      vitalsAt: v?.recorded_at,
      customVitals: v?.custom_vitals || {},

      // Examination
      examined: !!e,
      diagnosis: e?.diagnosis,
      treatment: e?.treatment,
      investigation: e?.investigation,
      referral: e?.referral || false,
      referralNote: e?.referral_to,
      examNote: e?.doctor_note,
      doctorSignature: e?.doctor_signature,
      examStudentSignature: e?.student_signature,
      examinedAt: e?.examined_at,

      // Research
      researchCompleted: r && r.length > 0,
      researchResponses: r?.reduce((acc, curr) => ({ ...acc, [curr.question_id]: curr.answer }), {}),
      researchBy: r?.[0]?.student_id,
      researchAt: r?.[0]?.answered_at,
    };
  }, []);

  // ── Data Fetchers ──
  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch Clinics
      const { data: clinicsData } = await supabase.from('clinics').select('*').order('display_order');
      if (clinicsData) {
        setClinics(clinicsData.map(c => ({
          id: c.id,
          name: c.name,
          nameAr: c.name_ar,
          doctorName: c.doctor_name || '',
          isActive: c.is_active,
        })));
      }

      // Fetch Patients with joined data
      const { data: patientsData } = await supabase
        .from('patients')
        .select(`
          *,
          clinics(*),
          profiles(username),
          vital_signs(*),
          examinations(*),
          research_answers(*)
        `)
        .order('created_at', { ascending: false });

      if (patientsData) {
        const mapped = patientsData.map(p => mapDataToPatient(p, p.vital_signs?.[0], p.examinations?.[0], p.research_answers));
        setPatients(mapped);
      }
      
      // Fetch Thresholds
      const { data: thresholds } = await supabase.from('vital_signs_thresholds').select('*').order('metric', { ascending: true });
      if (thresholds) {
        setVitalThresholds(thresholds);
      }

      // Fetch Settings
      const { data: settingsData } = await supabase.from('system_settings').select('*');
      if (settingsData) {
        const mappedSettings: Partial<SystemSettings> = {};
        settingsData.forEach(s => {
          if (s.key === 'registration_open') mappedSettings.registrationOpen = s.value === 'true';
          if (s.key === 'rotation_time_minutes') mappedSettings.rotationTimeMinutes = parseInt(s.value) || 30;
        });
        setSettings(prev => ({ ...prev, ...mappedSettings }));
      }

      // Fetch Switch Requests
      const { data: switchRequestsData } = await supabase.from('switch_requests').select('*').order('created_at', { ascending: false });
      if (switchRequestsData) {
        setSwitchRequests(switchRequestsData.map(r => ({
          id: r.id,
          requesterId: r.requester_id,
          requesterName: r.requester_name || 'User',
          requesterAssignment: r.requester_assignment,
          requesterClinic: r.requester_clinic,
          targetUserId: r.target_user_id,
          targetUserName: r.target_user_name || 'User',
          targetAssignment: r.target_assignment,
          targetClinic: r.target_clinic,
          status: r.status as 'pending' | 'approved' | 'rejected',
          createdAt: r.created_at,
        })));
      }

    } catch (err) {
      console.error('Error fetching data:', err);
      toast.error('Failed to load real-time data');
    } finally {
      setIsLoading(false);
    }
  }, [mapDataToPatient]);

  useEffect(() => {
    fetchAllData();

    // Subscribe to Real-time Changes
    const patientsChannel = supabase.channel('table-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, () => fetchAllData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vital_signs' }, () => fetchAllData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'examinations' }, () => fetchAllData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'switch_requests' }, () => fetchAllData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clinics' }, () => fetchAllData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vital_signs_thresholds' }, () => fetchAllData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'system_settings' }, () => fetchAllData())
      .subscribe();

    return () => {
      supabase.removeChannel(patientsChannel);
    };
  }, [fetchAllData]);

  const getNextTicketNumber = useCallback((): string => {
    const nextNum = patients.length + 1;
    return String(nextNum).padStart(4, '0');
  }, [patients]);

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
      .select(`*, clinics(name_ar), profiles(username)`)
      .single();

    if (error) {
      toast.error('Failed to add patient: ' + error.message);
      return null;
    }

    const patient = mapDataToPatient(data, null, null, []);
    setPatients(prev => [patient, ...prev]);
    return patient;
  }, [mapDataToPatient]);

  const updatePatient = useCallback(async (id: string, updates: Partial<Patient>) => {
    const dbUpdates: any = {};
    if (updates.fullNameAr) dbUpdates.full_name_ar = updates.fullNameAr;
    if (updates.status) dbUpdates.status = updates.status;
    if (updates.note !== undefined) dbUpdates.note = updates.note;
    if (updates.clinicId) dbUpdates.clinic_id = updates.clinicId;

    const { error } = await supabase.from('patients').update(dbUpdates).eq('id', id);
    if (error) {
      toast.error('Failed to update patient');
      return;
    }
    
    // Check if we need to update vitals or examinations as well
    if (updates.vitalsCompleted || updates.bloodPressureSystolic !== undefined) {
      const { error: vError } = await supabase.from('vital_signs').upsert({
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
      if (vError) console.error('Vitals update error:', vError);
    }

    if (updates.examined || updates.diagnosis !== undefined) {
      const { error: eError } = await supabase.from('examinations').upsert({
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
      if (eError) console.error('Examination update error:', eError);
    }

    fetchAllData();
  }, [fetchAllData]);

  const deletePatient = useCallback(async (id: string) => {
    const { error } = await supabase.from('patients').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete patient');
      return;
    }
    setPatients(prev => prev.filter(p => p.id !== id));
  }, []);

  const getPatientByTicket = useCallback((ticket: string) => {
    return patients.find(p => p.ticketNumber === ticket);
  }, [patients]);

  const getPatientsByClinic = useCallback((clinicId: string) => {
    return patients.filter(p => p.clinicId === clinicId).sort((a, b) => {
      return parseInt(a.ticketNumber) - parseInt(b.ticketNumber);
    });
  }, [patients]);

  const addClinic = useCallback(async (clinicData: Omit<Clinic, 'id'>) => {
    const { error } = await supabase.from('clinics').insert({
      name: clinicData.name,
      name_ar: clinicData.nameAr,
      is_active: clinicData.isActive,
    });
    if (error) toast.error('Failed to add clinic');
    fetchAllData();
  }, [fetchAllData]);

  const updateClinic = useCallback(async (id: string, updates: Partial<Clinic>) => {
    const { error } = await supabase.from('clinics').update({
      name: updates.name,
      name_ar: updates.nameAr,
      is_active: updates.isActive,
    }).eq('id', id);
    if (error) toast.error('Failed to update clinic');
    fetchAllData();
  }, [fetchAllData]);

  const deleteClinic = useCallback(async (id: string) => {
    const { error } = await supabase.from('clinics').delete().eq('id', id);
    if (error) toast.error('Failed to delete clinic');
    fetchAllData();
  }, [fetchAllData]);

  const updateSettings = useCallback(async (updates: Partial<SystemSettings>) => {
    if (updates.registrationOpen !== undefined) {
      await supabase.from('system_settings').update({ value: updates.registrationOpen.toString() }).eq('key', 'registration_open');
    }
    if (updates.rotationTimeMinutes !== undefined) {
      await supabase.from('system_settings').update({ value: updates.rotationTimeMinutes.toString() }).eq('key', 'rotation_time_minutes');
    }
    setSettings(prev => ({ ...prev, ...updates }));
    toast.success('Settings synchronized');
  }, []);

  const updateVitalThreshold = useCallback(async (id: string, updates: Partial<VitalThreshold>) => {
    const { error } = await supabase.from('vital_signs_thresholds').update({
      min_value: updates.min_value,
      max_value: updates.max_value,
      label_ar: updates.label_ar,
      color: updates.color
    }).eq('id', id);
    
    if (error) {
      toast.error('Failed to update threshold');
      return;
    }
    toast.success('Threshold updated');
    fetchAllData();
  }, [fetchAllData]);

  const getClinicStats = useCallback(() => {
    return clinics.filter(c => c.isActive).map(clinic => {
      const clinicPatients = patients.filter(p => p.clinicId === clinic.id);
      return {
        clinicId: clinic.id,
        clinicName: `${clinic.nameAr} - ${clinic.name}`,
        waiting: clinicPatients.filter(p => p.status === 'waiting' || (p.status as string) === 'in_vital_signs').length,
        examined: clinicPatients.filter(p => p.examined || p.status === 'examined' || (p.status as string) === 'completed').length,
        absent: clinicPatients.filter(p => p.status === 'absent').length,
        total: clinicPatients.length,
      };
    });
  }, [clinics, patients]);

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
    fetchAllData();
  }, [fetchAllData]);

  const updateSwitchRequest = useCallback(async (id: string, status: 'approved' | 'rejected') => {
    const { error } = await supabase.from('switch_requests').update({ status }).eq('id', id);
    if (error) toast.error('Failed to update request');
    fetchAllData();
  }, [fetchAllData]);

  const getPendingSwitchRequests = useCallback((userId: string) => {
    return switchRequests.filter(r => r.targetUserId === userId && r.status === 'pending');
  }, [switchRequests]);

  // ── Research Questions ──
  const addResearchQuestion = useCallback(async (qData: Omit<ResearchQuestion, 'id' | 'order'>) => {
    const { error } = await supabase.from('registration_questions').insert({
      question_text: qData.question,
      question_text_ar: qData.questionAr,
      question_type: qData.type,
      options: qData.options,
      is_required: qData.required,
      section: 'research'
    });
    if (error) toast.error('Failed to add question');
    fetchAllData();
  }, [fetchAllData]);

  const updateResearchQuestion = useCallback(async (id: string, updates: Partial<ResearchQuestion>) => {
    const { error } = await supabase.from('registration_questions').update({
      question_text: updates.question,
      question_text_ar: updates.questionAr,
      question_type: updates.type,
      options: updates.options,
      is_required: updates.required,
    }).eq('id', id);
    if (error) toast.error('Failed to update question');
    fetchAllData();
  }, [fetchAllData]);

  const deleteResearchQuestion = useCallback(async (id: string) => {
    const { error } = await supabase.from('registration_questions').delete().eq('id', id);
    if (error) toast.error('Failed to delete question');
    fetchAllData();
  }, [fetchAllData]);

  const reorderResearchQuestions = useCallback(async (ids: string[]) => {
    // Implement reordering if needed
    console.log('Reorder research questions:', ids);
  }, []);

  const saveResearchResponse = useCallback(async (patientId: string, responses: Record<string, unknown>, _by: string) => {
    const answers = Object.entries(responses).map(([qId, val]) => ({
      patient_id: patientId,
      question_id: qId,
      answer: String(val),
    }));

    const { error } = await supabase.from('research_answers').insert(answers);
    if (error) {
      toast.error('Failed to save research responses');
      return;
    }
    fetchAllData();
  }, [fetchAllData]);

  // ── Custom Vital Fields ──
  const addCustomVitalField = useCallback(async (_fieldData: Omit<CustomVitalField, 'id'>) => {
    toast.info('Custom vitals sync not yet implemented');
  }, []);

  const updateCustomVitalField = useCallback(async (_id: string, _updates: Partial<CustomVitalField>) => {
    toast.info('Custom vitals sync not yet implemented');
  }, []);

  const deleteCustomVitalField = useCallback(async (_id: string) => {
    toast.info('Custom vitals sync not yet implemented');
  }, []);

  return (
    <DataContext.Provider value={{
      patients, clinics, settings, switchRequests,
      addPatient, updatePatient, deletePatient,
      getPatientByTicket, getPatientsByClinic,
      addClinic, updateClinic, deleteClinic,
      updateSettings, updateVitalThreshold, getNextTicketNumber, getClinicStats,
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
