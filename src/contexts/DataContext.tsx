/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Patient, Clinic, SystemSettings, DEFAULT_VITAL_RANGES, DEFAULT_CLINICS, SwitchRequest, ResearchQuestion, CustomVitalField } from '@/lib/types';

interface DataContextType {
  patients: Patient[];
  clinics: Clinic[];
  settings: SystemSettings;
  switchRequests: SwitchRequest[];
  addPatient: (patient: Omit<Patient, 'id' | 'ticketNumber' | 'status'>) => Patient;
  updatePatient: (id: string, updates: Partial<Patient>) => void;
  deletePatient: (id: string) => void;
  getPatientByTicket: (ticket: string) => Patient | undefined;
  getPatientsByClinic: (clinicId: string) => Patient[];
  addClinic: (clinic: Omit<Clinic, 'id'>) => void;
  updateClinic: (id: string, updates: Partial<Clinic>) => void;
  deleteClinic: (id: string) => void;
  updateSettings: (updates: Partial<SystemSettings>) => void;
  getNextTicketNumber: () => string;
  getClinicStats: () => { clinicId: string; clinicName: string; waiting: number; examined: number; absent: number; total: number }[];
  addSwitchRequest: (req: Omit<SwitchRequest, 'id' | 'createdAt' | 'status'>) => void;
  updateSwitchRequest: (id: string, status: 'approved' | 'rejected') => void;
  getPendingSwitchRequests: (userId: string) => SwitchRequest[];
  // Research
  addResearchQuestion: (q: Omit<ResearchQuestion, 'id' | 'order'>) => void;
  updateResearchQuestion: (id: string, updates: Partial<ResearchQuestion>) => void;
  deleteResearchQuestion: (id: string) => void;
  reorderResearchQuestions: (ids: string[]) => void;
  saveResearchResponse: (patientId: string, responses: Record<string, unknown>, by: string) => void;
  // Custom vitals
  addCustomVitalField: (field: Omit<CustomVitalField, 'id'>) => void;
  updateCustomVitalField: (id: string, updates: Partial<CustomVitalField>) => void;
  deleteCustomVitalField: (id: string) => void;
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
  researchQuestions: [],
  registrationFields: [],
  customVitalFields: [],
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [patients, setPatients] = useState<Patient[]>(() => {
    const saved = localStorage.getItem('clinic_patients');
    return saved ? JSON.parse(saved) : [];
  });

  const [clinics, setClinics] = useState<Clinic[]>(() => {
    const saved = localStorage.getItem('clinic_clinics');
    return saved ? JSON.parse(saved) : DEFAULT_CLINICS;
  });

  const [settings, setSettings] = useState<SystemSettings>(() => {
    const saved = localStorage.getItem('clinic_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Ensure new fields exist with defaults
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
    return DEFAULT_SETTINGS;
  });

  const [switchRequests, setSwitchRequests] = useState<SwitchRequest[]>(() => {
    const saved = localStorage.getItem('clinic_switch_requests');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => { localStorage.setItem('clinic_patients', JSON.stringify(patients)); }, [patients]);
  useEffect(() => { localStorage.setItem('clinic_clinics', JSON.stringify(clinics)); }, [clinics]);
  useEffect(() => { localStorage.setItem('clinic_settings', JSON.stringify(settings)); }, [settings]);
  useEffect(() => { localStorage.setItem('clinic_switch_requests', JSON.stringify(switchRequests)); }, [switchRequests]);

  const getNextTicketNumber = useCallback((): string => {
    const nextNum = patients.length + 1;
    return String(nextNum).padStart(4, '0');
  }, [patients]);

  const addPatient = useCallback((patientData: Omit<Patient, 'id' | 'ticketNumber' | 'status'>): Patient => {
    const ticket = getNextTicketNumber();
    const patient: Patient = { ...patientData, id: crypto.randomUUID(), ticketNumber: ticket, status: 'waiting' };
    setPatients(prev => [...prev, patient]);
    return patient;
  }, [getNextTicketNumber]);

  const updatePatient = useCallback((id: string, updates: Partial<Patient>) => {
    setPatients(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, []);

  const deletePatient = useCallback((id: string) => {
    setPatients(prev => prev.filter(p => p.id !== id));
  }, []);

  const getPatientByTicket = useCallback((ticket: string) => {
    return patients.find(p => p.ticketNumber === ticket);
  }, [patients]);

  const getPatientsByClinic = useCallback((clinicId: string) => {
    return patients.filter(p => p.clinicId === clinicId).sort((a, b) => {
      const ticketA = parseInt(a.ticketNumber);
      const ticketB = parseInt(b.ticketNumber);
      return ticketA - ticketB;
    });
  }, [patients]);

  const addClinic = useCallback((clinicData: Omit<Clinic, 'id'>) => {
    setClinics(prev => [...prev, { ...clinicData, id: crypto.randomUUID() }]);
  }, []);

  const updateClinic = useCallback((id: string, updates: Partial<Clinic>) => {
    setClinics(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  }, []);

  const deleteClinic = useCallback((id: string) => {
    setClinics(prev => prev.filter(c => c.id !== id));
  }, []);

  const updateSettings = useCallback((updates: Partial<SystemSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  const getClinicStats = useCallback(() => {
    return clinics.filter(c => c.isActive).map(clinic => {
      const clinicPatients = patients.filter(p => p.clinicId === clinic.id);
      return {
        clinicId: clinic.id,
        clinicName: `${clinic.nameAr} - ${clinic.name}`,
        waiting: clinicPatients.filter(p => !p.examined && p.status !== 'absent').length,
        examined: clinicPatients.filter(p => p.examined).length,
        absent: clinicPatients.filter(p => p.status === 'absent').length,
        total: clinicPatients.length,
      };
    });
  }, [clinics, patients]);

  const addSwitchRequest = useCallback((reqData: Omit<SwitchRequest, 'id' | 'createdAt' | 'status'>) => {
    const req: SwitchRequest = {
      ...reqData,
      id: crypto.randomUUID(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    setSwitchRequests(prev => [...prev, req]);
  }, []);

  const updateSwitchRequest = useCallback((id: string, status: 'approved' | 'rejected') => {
    setSwitchRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  }, []);

  const getPendingSwitchRequests = useCallback((userId: string) => {
    return switchRequests.filter(r => r.targetUserId === userId && r.status === 'pending');
  }, [switchRequests]);

  // ── Research Questions ──
  const addResearchQuestion = useCallback((qData: Omit<ResearchQuestion, 'id' | 'order'>) => {
    setSettings(prev => {
      const questions = [...(prev.researchQuestions || [])];
      const q: ResearchQuestion = { ...qData, id: crypto.randomUUID(), order: questions.length };
      return { ...prev, researchQuestions: [...questions, q] };
    });
  }, []);

  const updateResearchQuestion = useCallback((id: string, updates: Partial<ResearchQuestion>) => {
    setSettings(prev => ({
      ...prev,
      researchQuestions: (prev.researchQuestions || []).map(q => q.id === id ? { ...q, ...updates } : q),
    }));
  }, []);

  const deleteResearchQuestion = useCallback((id: string) => {
    setSettings(prev => ({
      ...prev,
      researchQuestions: (prev.researchQuestions || []).filter(q => q.id !== id).map((q, i) => ({ ...q, order: i })),
    }));
  }, []);

  const reorderResearchQuestions = useCallback((ids: string[]) => {
    setSettings(prev => {
      const questions = prev.researchQuestions || [];
      const reordered = ids.map((id, i) => {
        const q = questions.find(q => q.id === id);
        return q ? { ...q, order: i } : null;
      }).filter(Boolean) as ResearchQuestion[];
      return { ...prev, researchQuestions: reordered };
    });
  }, []);

  const saveResearchResponse = useCallback((patientId: string, responses: Record<string, unknown>, by: string) => {
    setPatients(prev => prev.map(p =>
      p.id === patientId ? {
        ...p,
        researchCompleted: true,
        researchResponses: responses,
        researchBy: by,
        researchAt: new Date().toLocaleString('en-EG', { timeZone: 'Africa/Cairo' }),
      } : p
    ));
  }, []);

  // ── Custom Vital Fields ──
  const addCustomVitalField = useCallback((fieldData: Omit<CustomVitalField, 'id'>) => {
    setSettings(prev => ({
      ...prev,
      customVitalFields: [...(prev.customVitalFields || []), { ...fieldData, id: crypto.randomUUID() }],
    }));
  }, []);

  const updateCustomVitalField = useCallback((id: string, updates: Partial<CustomVitalField>) => {
    setSettings(prev => ({
      ...prev,
      customVitalFields: (prev.customVitalFields || []).map(f => f.id === id ? { ...f, ...updates } : f),
    }));
  }, []);

  const deleteCustomVitalField = useCallback((id: string) => {
    setSettings(prev => ({
      ...prev,
      customVitalFields: (prev.customVitalFields || []).filter(f => f.id !== id),
    }));
  }, []);

  return (
    <DataContext.Provider value={{
      patients, clinics, settings, switchRequests,
      addPatient, updatePatient, deletePatient,
      getPatientByTicket, getPatientsByClinic,
      addClinic, updateClinic, deleteClinic,
      updateSettings, getNextTicketNumber, getClinicStats,
      addSwitchRequest, updateSwitchRequest, getPendingSwitchRequests,
      addResearchQuestion, updateResearchQuestion, deleteResearchQuestion,
      reorderResearchQuestions, saveResearchResponse,
      addCustomVitalField, updateCustomVitalField, deleteCustomVitalField,
    }}>
      {children}
    </DataContext.Provider>
  );
};
