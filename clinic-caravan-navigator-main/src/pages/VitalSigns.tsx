import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Save, HeartPulse } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { VitalRanges, Patient } from '@/lib/types';
import PageLayout from '@/components/PageLayout';

const getBPStatus = (sys: number, dia: number, ranges: VitalRanges) => {
  if (sys > ranges.bp.emergencySys || dia > ranges.bp.emergencyDia) return { label: '🚨 Emergency', className: 'text-red-600 font-bold' };
  if (sys >= ranges.bp.veryHighSysMin || dia >= ranges.bp.veryHighDiaMin) return { label: '🔴 Very High', className: 'text-red-500 font-bold' };
  if ((sys >= ranges.bp.highSysMin && sys <= ranges.bp.highSysMax) || (dia >= ranges.bp.highDiaMin && dia <= ranges.bp.highDiaMax)) return { label: '🟠 High', className: 'text-orange-500 font-bold' };
  if (sys >= ranges.bp.elevatedSysMin && sys <= ranges.bp.elevatedSysMax && dia < ranges.bp.normalDiaMax) return { label: '🟡 Elevated', className: 'text-yellow-600 font-bold' };
  if (sys < ranges.bp.normalSysMax && dia < ranges.bp.normalDiaMax) return { label: '🟢 Normal', className: 'text-green-600 font-bold' };
  return { label: '🟡 Elevated', className: 'text-yellow-600 font-bold' };
};

const getSugarStatus = (val: number, ranges: VitalRanges) => {
  if (val < ranges.sugar.low) return { label: '🔵 Low', className: 'text-blue-500 font-bold' };
  if (val <= ranges.sugar.normalMax) return { label: '🟢 Normal', className: 'text-green-600 font-bold' };
  if (val <= ranges.sugar.highMax) return { label: '🟡 High', className: 'text-yellow-600 font-bold' };
  return { label: '🔴 Very High', className: 'text-red-500 font-bold' };
};

const getPulseStatus = (val: number, ranges: VitalRanges) => {
  if (val < ranges.pulse.low) return { label: '🔵 Low', className: 'text-blue-500 font-bold' };
  if (val <= ranges.pulse.normalMax) return { label: '🟢 Normal', className: 'text-green-600 font-bold' };
  if (val <= ranges.pulse.highMax) return { label: '🟡 High', className: 'text-yellow-600 font-bold' };
  return { label: '🔴 Very High', className: 'text-red-500 font-bold' };
};

const VitalSigns: React.FC = () => {
  const { currentUser } = useAuth();
  const { getPatientByTicket, updatePatient, settings, patients } = useData();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [form, setForm] = useState({ systolic: '', diastolic: '', sugar: '', pulse: '', temperature: '', weight: '', height: '', oxygenSaturation: '', pastHistory: '', note: '' });

  const referredPatients = patients.filter(p => p.referToVitals);
  const waitingVitals = referredPatients.filter(p => !p.vitalsCompleted);
  const completedVitals = referredPatients.filter(p => p.vitalsCompleted);

  const searchedPatients = searchQuery
    ? patients.filter(p => p.ticketNumber.includes(searchQuery) || p.fullNameAr.includes(searchQuery))
    : null;

  const selectedPatient = selectedPatientId ? patients.find(p => p.id === selectedPatientId) : null;

  const handleSelectPatient = (p: Patient) => {
    setSelectedPatientId(p.id);
    setForm({
      systolic: p.bloodPressureSystolic?.toString() || '',
      diastolic: p.bloodPressureDiastolic?.toString() || '',
      sugar: p.bloodSugar?.toString() || '',
      pulse: p.pulse?.toString() || '',
      temperature: p.temperature?.toString() || '',
      weight: p.weight?.toString() || '',
      height: p.height?.toString() || '',
      oxygenSaturation: p.oxygenSaturation?.toString() || '',
      pastHistory: p.pastHistory || '',
      note: p.vitalsNote || '',
    });
  };

  const handleSearch = () => {
    if (!searchQuery) return;
    const p = getPatientByTicket(searchQuery);
    if (p) handleSelectPatient(p);
  };

  const handleSave = () => {
    if (!selectedPatientId) return;
    updatePatient(selectedPatientId, {
      bloodPressureSystolic: form.systolic ? parseInt(form.systolic) : undefined,
      bloodPressureDiastolic: form.diastolic ? parseInt(form.diastolic) : undefined,
      bloodSugar: form.sugar ? parseInt(form.sugar) : undefined,
      pulse: form.pulse ? parseInt(form.pulse) : undefined,
      temperature: form.temperature ? parseFloat(form.temperature) : undefined,
      weight: form.weight ? parseFloat(form.weight) : undefined,
      height: form.height ? parseFloat(form.height) : undefined,
      oxygenSaturation: form.oxygenSaturation ? parseInt(form.oxygenSaturation) : undefined,
      pastHistory: form.pastHistory || undefined,
      vitalsNote: form.note || undefined,
      vitalsBy: currentUser?.fullName,
      vitalsAt: new Date().toLocaleString('en-EG', { timeZone: 'Africa/Cairo' }),
      vitalsCompleted: true,
    });
    toast({ title: 'Saved', description: 'Vital signs recorded successfully' });
    setSelectedPatientId(null);
    setSearchQuery('');
    setForm({ systolic: '', diastolic: '', sugar: '', pulse: '', temperature: '', weight: '', height: '', oxygenSaturation: '', pastHistory: '', note: '' });
  };

  const ranges = settings.vitalRanges;
  const bpStatus = form.systolic && form.diastolic ? getBPStatus(parseInt(form.systolic), parseInt(form.diastolic), ranges) : null;
  const sugarStatus = form.sugar ? getSugarStatus(parseInt(form.sugar), ranges) : null;
  const pulseStatus = form.pulse ? getPulseStatus(parseInt(form.pulse), ranges) : null;

  const customFields = settings.customVitalFields || [];

  const PatientListItem = ({ p }: { p: Patient }) => (
    <button key={p.id} onClick={() => handleSelectPatient(p)}
      className={`w-full text-left p-3 rounded-lg border transition-all ${
        selectedPatientId === p.id ? 'bg-primary/10 border-primary ring-1 ring-primary' :
        p.vitalsCompleted ? 'bg-green-50 border-green-300 hover:bg-green-100 dark:bg-green-950/30 dark:border-green-700' :
        'bg-yellow-50 border-yellow-300 hover:bg-yellow-100 dark:bg-yellow-950/30 dark:border-yellow-700'
      }`}>
      <div className="flex justify-between items-center">
        <span className="font-medium text-sm text-foreground">{p.fullNameAr}</span>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">{p.ticketNumber}</Badge>
          {p.vitalsCompleted && <span className="text-green-600 text-xs">✅</span>}
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-1">{p.clinicName} • {p.mainComplaint}</p>
    </button>
  );

  return (
    <PageLayout title="Vital Signs Data">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: search & patient lists */}
        <div className="space-y-4">
          <Card className="glass-card">
            <CardHeader><CardTitle className="text-sm font-heading">Search Patient</CardTitle></CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Ticket number or name" className="h-10" onKeyDown={e => e.key === 'Enter' && handleSearch()} />
                <Button size="icon" onClick={handleSearch}><Search className="w-4 h-4" /></Button>
              </div>
              {searchedPatients && searchedPatients.length > 0 && (
                <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                  {searchedPatients.map(p => <PatientListItem key={p.id} p={p} />)}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-heading flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
                Waiting ({waitingVitals.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-48 overflow-y-auto space-y-1">
              {waitingVitals.map(p => <PatientListItem key={p.id} p={p} />)}
              {waitingVitals.length === 0 && <p className="text-sm text-muted-foreground text-center py-3">No patients waiting</p>}
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-heading flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500"></span>
                Completed ({completedVitals.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-48 overflow-y-auto space-y-1">
              {completedVitals.map(p => <PatientListItem key={p.id} p={p} />)}
              {completedVitals.length === 0 && <p className="text-sm text-muted-foreground text-center py-3">No completed vitals</p>}
            </CardContent>
          </Card>
        </div>

        {/* Right: form */}
        <div className="lg:col-span-2">
          {selectedPatient ? (
            <Card className="glass-card animate-slide-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-heading">
                  <HeartPulse className="w-5 h-5 text-accent" />
                  {selectedPatient.fullNameAr} — {selectedPatient.ticketNumber}
                  {selectedPatient.vitalsCompleted && <Badge className="bg-green-500 text-white ml-2">Completed</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-3 text-sm">
                  <p><span className="text-muted-foreground">Complaint:</span> {selectedPatient.mainComplaint}</p>
                  <p><span className="text-muted-foreground">Clinic:</span> {selectedPatient.clinicName}</p>
                  <p><span className="text-muted-foreground">Age:</span> {selectedPatient.age}</p>
                </div>

                {/* Core vitals */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Blood Pressure (Systolic)</Label>
                    <Input type="number" value={form.systolic} onChange={e => setForm(f => ({ ...f, systolic: e.target.value }))} placeholder="e.g. 120" className="h-10" />
                  </div>
                  <div className="space-y-2">
                    <Label>Blood Pressure (Diastolic)</Label>
                    <Input type="number" value={form.diastolic} onChange={e => setForm(f => ({ ...f, diastolic: e.target.value }))} placeholder="e.g. 80" className="h-10" />
                  </div>
                  <div className="flex items-end">
                    {bpStatus && <p className={`text-lg ${bpStatus.className}`}>{bpStatus.label}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Random Blood Sugar (mg/dL)</Label>
                    <Input type="number" value={form.sugar} onChange={e => setForm(f => ({ ...f, sugar: e.target.value }))} placeholder="e.g. 100" className="h-10" />
                  </div>
                  <div className="flex items-end">
                    {sugarStatus && <p className={`text-lg ${sugarStatus.className}`}>{sugarStatus.label}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Pulse (bpm)</Label>
                    <Input type="number" value={form.pulse} onChange={e => setForm(f => ({ ...f, pulse: e.target.value }))} placeholder="e.g. 72" className="h-10" />
                  </div>
                  <div className="flex items-end">
                    {pulseStatus && <p className={`text-lg ${pulseStatus.className}`}>{pulseStatus.label}</p>}
                  </div>
                </div>

                {/* Additional vitals */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Temperature (°C)</Label>
                    <Input type="number" step="0.1" value={form.temperature} onChange={e => setForm(f => ({ ...f, temperature: e.target.value }))} placeholder="e.g. 37" className="h-10" />
                  </div>
                  <div className="space-y-2">
                    <Label>Weight (kg)</Label>
                    <Input type="number" step="0.1" value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} placeholder="e.g. 70" className="h-10" />
                  </div>
                  <div className="space-y-2">
                    <Label>Height (cm)</Label>
                    <Input type="number" value={form.height} onChange={e => setForm(f => ({ ...f, height: e.target.value }))} placeholder="e.g. 170" className="h-10" />
                  </div>
                  <div className="space-y-2">
                    <Label>O₂ Saturation (%)</Label>
                    <Input type="number" value={form.oxygenSaturation} onChange={e => setForm(f => ({ ...f, oxygenSaturation: e.target.value }))} placeholder="e.g. 98" className="h-10" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Past History</Label>
                  <Textarea value={form.pastHistory} onChange={e => setForm(f => ({ ...f, pastHistory: e.target.value }))} placeholder="Previous medical history..." dir="rtl" />
                </div>

                <div className="space-y-2">
                  <Label>Note</Label>
                  <Textarea value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder="Additional notes..." dir="rtl" />
                </div>

                <div className="text-sm text-muted-foreground">Student: {currentUser?.fullName}</div>

                <Button onClick={handleSave} className="w-full h-11 font-semibold">
                  <Save className="w-4 h-4 mr-2" /> {selectedPatient.vitalsCompleted ? 'Update' : 'Save'} Vital Signs
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="glass-card">
              <CardContent className="p-12 text-center text-muted-foreground">
                <HeartPulse className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Select a patient from the list or search by ticket number</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default VitalSigns;
