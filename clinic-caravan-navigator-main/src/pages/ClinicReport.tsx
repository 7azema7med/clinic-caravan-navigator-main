import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Save, FileText, CheckCircle2, Download, UserX, AlertTriangle, Users, Trash2, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generatePrescriptionPDF, generateClinicReportPDF } from '@/lib/pdf';
import PageLayout from '@/components/PageLayout';

const ClinicReport: React.FC = () => {
  const { currentUser } = useAuth();
  const { getPatientsByClinic, updatePatient, deletePatient, clinics } = useData();
  const { toast } = useToast();
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [searchTicket, setSearchTicket] = useState('');
  const [form, setForm] = useState({ diagnosis: '', treatment: '', investigation: '', referral: false, referralNote: '', note: '' });

  const clinic = clinics.find(c => c.id === currentUser?.assignedClinic);
  const allPatients = currentUser?.assignedClinic ? getPatientsByClinic(currentUser.assignedClinic) : [];
  const waitingPatients = allPatients.filter(p => !p.examined && p.status !== 'absent');
  const examinedPatients = allPatients.filter(p => p.examined);
  const absentPatients = allPatients.filter(p => p.status === 'absent' && !p.examined);
  const selectedPatient = selectedPatientId ? allPatients.find(p => p.id === selectedPatientId) : null;

  const filteredWaiting = searchTicket
    ? waitingPatients.filter(p => p.ticketNumber.includes(searchTicket) || p.fullNameAr.includes(searchTicket))
    : waitingPatients;

  const handleSelectPatient = (id: string) => {
    const p = allPatients.find(pt => pt.id === id);
    setSelectedPatientId(id);
    if (p?.examined) {
      setForm({
        diagnosis: p.diagnosis || '',
        treatment: p.treatment || '',
        investigation: p.investigation || '',
        referral: p.referral || false,
        referralNote: p.referralNote || '',
        note: p.examNote || '',
      });
    } else {
      setForm({ diagnosis: '', treatment: '', investigation: '', referral: false, referralNote: '', note: '' });
    }
  };

  const handleSave = () => {
    if (!selectedPatientId) return;
    updatePatient(selectedPatientId, {
      diagnosis: form.diagnosis,
      treatment: form.treatment,
      investigation: form.investigation || undefined,
      referral: form.referral,
      referralNote: form.referralNote || undefined,
      examNote: form.note || undefined,
      doctorSignature: clinic?.doctorName || 'Doctor',
      examStudentSignature: currentUser?.fullName,
      examinedAt: new Date().toLocaleString('en-EG', { timeZone: 'Africa/Cairo' }),
      examined: true,
      status: 'examined' as any,
    });
    toast({ title: 'Saved', description: 'Examination completed successfully' });
    setSelectedPatientId(null);
    setForm({ diagnosis: '', treatment: '', investigation: '', referral: false, referralNote: '', note: '' });
  };

  const handleMarkAbsent = (id: string) => {
    updatePatient(id, { status: 'absent' as any });
    toast({ title: 'Marked Absent', description: 'Patient moved to absent list' });
    if (selectedPatientId === id) setSelectedPatientId(null);
  };

  const handleRestorePatient = (id: string) => {
    updatePatient(id, { status: 'waiting' as any });
    toast({ title: 'Restored', description: 'Patient moved back to waiting list' });
  };

  const handleDeletePatient = (id: string, ticket: string) => {
    if (confirm(`Delete patient ${ticket}?`)) {
      deletePatient(id);
      toast({ title: 'Deleted', description: `Patient ${ticket} deleted` });
      if (selectedPatientId === id) setSelectedPatientId(null);
    }
  };

  const handleDownloadReport = () => {
    if (clinic) {
      generateClinicReportPDF(clinic.nameAr + ' - ' + clinic.name, allPatients);
    }
  };

  return (
    <PageLayout title={clinic ? `${clinic.nameAr} - ${clinic.name} Clinic` : 'Clinic Report'}>
      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 stagger-children">
        <Card className="stat-card">
          <Users className="w-5 h-5 mx-auto mb-1 text-blue-500" />
          <p className="text-xl font-bold font-heading">{allPatients.length}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </Card>
        <Card className="stat-card border-yellow-300 dark:border-yellow-700">
          <AlertTriangle className="w-5 h-5 mx-auto mb-1 text-yellow-500" />
          <p className="text-xl font-bold font-heading text-yellow-600 dark:text-yellow-400">{waitingPatients.length}</p>
          <p className="text-xs text-muted-foreground">Waiting</p>
        </Card>
        <Card className="stat-card border-green-300 dark:border-green-700">
          <CheckCircle2 className="w-5 h-5 mx-auto mb-1 text-green-500" />
          <p className="text-xl font-bold font-heading text-green-600 dark:text-green-400">{examinedPatients.length}</p>
          <p className="text-xs text-muted-foreground">Examined</p>
        </Card>
        <Card className="stat-card border-red-300 dark:border-red-700">
          <UserX className="w-5 h-5 mx-auto mb-1 text-red-500" />
          <p className="text-xl font-bold font-heading text-red-600 dark:text-red-400">{absentPatients.length}</p>
          <p className="text-xs text-muted-foreground">Absent</p>
        </Card>
      </div>

      {clinic?.doctorName && (
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Doctor: <span className="font-semibold text-foreground">{clinic.doctorName}</span>
          </div>
          <Button variant="outline" size="sm" onClick={handleDownloadReport}>
            <Download className="w-4 h-4 mr-1" /> Download Report
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient lists */}
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input value={searchTicket} onChange={e => setSearchTicket(e.target.value)} placeholder="Search ticket/name..." className="h-9" />
            <Button size="icon" variant="outline"><Search className="w-4 h-4" /></Button>
          </div>

          <Tabs defaultValue="waiting" className="space-y-2">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="waiting" className="text-xs">Waiting ({waitingPatients.length})</TabsTrigger>
              <TabsTrigger value="examined" className="text-xs">Done ({examinedPatients.length})</TabsTrigger>
              <TabsTrigger value="absent" className="text-xs">Absent ({absentPatients.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="waiting">
              <Card className="glass-card">
                <CardContent className="max-h-[500px] overflow-y-auto space-y-1 p-3">
                  {filteredWaiting.map(p => (
                    <div key={p.id} className={`w-full text-left p-3 rounded-lg border transition-colors ${selectedPatientId === p.id ? 'bg-primary/10 border-primary' : 'bg-yellow-50 border-yellow-300 hover:bg-yellow-100 dark:bg-yellow-950/20 dark:border-yellow-700 dark:hover:bg-yellow-950/30'}`}>
                      <button className="w-full text-left" onClick={() => handleSelectPatient(p.id)}>
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-sm">{p.fullNameAr}</span>
                          <Badge variant="outline" className="text-xs">{p.ticketNumber}</Badge>
                        </div>
                        <p className="text-xs mt-1 opacity-70">{p.mainComplaint}</p>
                      </button>
                      <div className="mt-1 flex justify-end gap-1">
                        <Button size="sm" variant="ghost" className="text-xs text-red-500 h-6" onClick={() => handleMarkAbsent(p.id)}>
                          <UserX className="w-3 h-3 mr-1" /> Absent
                        </Button>
                        <Button size="sm" variant="ghost" className="text-xs text-destructive h-6" onClick={() => handleDeletePatient(p.id, p.ticketNumber)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {filteredWaiting.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No patients waiting</p>}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="examined">
              <Card className="glass-card">
                <CardContent className="max-h-[500px] overflow-y-auto space-y-1 p-3">
                  {examinedPatients.map(p => (
                    <div key={p.id} className={`w-full text-left p-3 rounded-lg border transition-colors cursor-pointer ${selectedPatientId === p.id ? 'bg-primary/10 border-primary' : 'bg-green-50 border-green-300 hover:bg-green-100 dark:bg-green-950/20 dark:border-green-700 dark:hover:bg-green-950/30'}`}>
                      <button className="w-full text-left" onClick={() => handleSelectPatient(p.id)}>
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-sm">{p.fullNameAr}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">{p.ticketNumber}</Badge>
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          </div>
                        </div>
                        <p className="text-xs mt-1 opacity-70">{p.diagnosis}</p>
                      </button>
                      <div className="mt-1 flex justify-end gap-1">
                        <Button size="sm" variant="ghost" className="text-xs text-primary h-6" onClick={() => generatePrescriptionPDF(p, clinic)}>
                          <Download className="w-3 h-3 mr-1" /> PDF
                        </Button>
                        <Button size="sm" variant="ghost" className="text-xs text-destructive h-6" onClick={() => handleDeletePatient(p.id, p.ticketNumber)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {examinedPatients.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No examined patients</p>}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="absent">
              <Card className="glass-card">
                <CardContent className="max-h-[500px] overflow-y-auto space-y-1 p-3">
                  {absentPatients.map(p => (
                    <div key={p.id} className="w-full text-left p-3 rounded-lg border bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-sm">{p.fullNameAr}</span>
                        <Badge variant="outline" className="text-xs">{p.ticketNumber}</Badge>
                      </div>
                      <p className="text-xs mt-1 opacity-70">{p.mainComplaint}</p>
                      <div className="mt-1 flex justify-end gap-1">
                        <Button size="sm" variant="ghost" className="text-xs text-green-600 h-6" onClick={() => handleRestorePatient(p.id)}>
                          Restore to Waiting
                        </Button>
                        <Button size="sm" variant="ghost" className="text-xs text-destructive h-6" onClick={() => handleDeletePatient(p.id, p.ticketNumber)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {absentPatients.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No absent patients</p>}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Patient details & exam form */}
        <div className="lg:col-span-2">
          {selectedPatient ? (
            <Card className="glass-card animate-slide-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-heading">
                  <FileText className="w-5 h-5 text-primary" />
                  {selectedPatient.fullNameAr} — {selectedPatient.ticketNumber}
                  {selectedPatient.examined && <Badge className="bg-green-500 text-white ml-2">Examined</Badge>}
                  {selectedPatient.status === 'absent' && <Badge variant="destructive" className="ml-2">Absent</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4 grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-muted-foreground">Complaint:</span> <span className="font-medium">{selectedPatient.mainComplaint}</span></div>
                  <div><span className="text-muted-foreground">Age:</span> <span className="font-medium">{selectedPatient.age}</span></div>
                  <div><span className="text-muted-foreground">Phone:</span> <span className="font-medium">{selectedPatient.phone || 'N/A'}</span></div>
                  <div><span className="text-muted-foreground">Registered:</span> <span className="font-medium">{selectedPatient.registeredAt}</span></div>
                  {selectedPatient.note && <div className="col-span-2"><span className="text-muted-foreground">Note:</span> <span className="font-medium">{selectedPatient.note}</span></div>}
                </div>

                {selectedPatient.vitalsCompleted && (
                  <div className="bg-accent/10 rounded-lg p-4 text-sm">
                    <h4 className="font-semibold mb-2 text-foreground">Vital Signs</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {selectedPatient.bloodPressureSystolic && <div>BP: {selectedPatient.bloodPressureSystolic}/{selectedPatient.bloodPressureDiastolic}</div>}
                      {selectedPatient.bloodSugar && <div>Sugar: {selectedPatient.bloodSugar} mg/dL</div>}
                      {selectedPatient.pulse && <div>Pulse: {selectedPatient.pulse} bpm</div>}
                    </div>
                    {selectedPatient.pastHistory && <div className="mt-2">Past History: {selectedPatient.pastHistory}</div>}
                  </div>
                )}

                <>
                  <div className="space-y-2">
                    <Label>Diagnosis / التشخيص *</Label>
                    <Textarea value={form.diagnosis} onChange={e => setForm(f => ({ ...f, diagnosis: e.target.value }))} placeholder="Enter diagnosis..." dir="rtl" />
                  </div>
                  <div className="space-y-2">
                    <Label>Treatment / العلاج *</Label>
                    <Textarea value={form.treatment} onChange={e => setForm(f => ({ ...f, treatment: e.target.value }))} placeholder="Enter treatment plan..." dir="rtl" />
                  </div>
                  <div className="space-y-2">
                    <Label>Investigation / Labs</Label>
                    <Textarea value={form.investigation} onChange={e => setForm(f => ({ ...f, investigation: e.target.value }))} placeholder="If applicable..." dir="rtl" />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Switch checked={form.referral} onCheckedChange={v => setForm(f => ({ ...f, referral: v }))} />
                      <Label>Referral</Label>
                    </div>
                    {form.referral && (
                      <Input value={form.referralNote} onChange={e => setForm(f => ({ ...f, referralNote: e.target.value }))} placeholder="Referral details" className="flex-1 h-9" />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Note</Label>
                    <Textarea value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder="Any additional notes..." />
                  </div>
                  <div className="text-sm text-muted-foreground flex justify-between">
                    <span>Doctor: {clinic?.doctorName || 'N/A'}</span>
                    <span>Student: {currentUser?.fullName}</span>
                  </div>
                  <div className="flex gap-3">
                    <Button onClick={handleSave} className="flex-1 h-11 font-semibold bg-green-600 hover:bg-green-700">
                      <Save className="w-4 h-4 mr-2" /> {selectedPatient.examined ? 'Update' : 'Save'} Examination
                    </Button>
                    {selectedPatient.examined && (
                      <Button variant="outline" onClick={() => generatePrescriptionPDF(selectedPatient, clinic)}>
                        <Download className="w-4 h-4 mr-1" /> PDF
                      </Button>
                    )}
                  </div>
                </>

                {selectedPatient.examined && (
                  <div className="border-t pt-3 text-xs text-muted-foreground">
                    Examined by Dr. {selectedPatient.doctorSignature} | Student: {selectedPatient.examStudentSignature} | {selectedPatient.examinedAt}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="glass-card">
              <CardContent className="p-12 text-center text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Select a patient from the waiting list to begin examination</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default ClinicReport;
