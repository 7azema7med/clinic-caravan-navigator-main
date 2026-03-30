import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, Ticket, Search, Edit, Trash2, FileDown, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Patient, COMPLAINT_CATEGORIES, COMMON_COMPLAINTS } from '@/lib/types';
import { generatePrescriptionPDF } from '@/lib/pdf';
import PageLayout from '@/components/PageLayout';

const PatientRegistration: React.FC = () => {
  const { currentUser } = useAuth();
  const { clinics, addPatient, updatePatient, deletePatient, settings, getNextTicketNumber, patients } = useData();
  const { toast } = useToast();
  const [complaintSuggestions, setComplaintSuggestions] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [editDialog, setEditDialog] = useState(false);
  const [complaintCategory, setComplaintCategory] = useState<string>(Object.keys(COMPLAINT_CATEGORIES)[0]);

  const [form, setForm] = useState({
    mainComplaint: '',
    clinicId: '',
    fullNameAr: '',
    age: '',
    phone: '',
    note: '',
    referToVitals: false,
    referToResearch: false,
  });

  const activeClinics = clinics.filter(c => c.isActive);

  const update = (key: string, value: string | boolean) => {
    setForm(prev => ({ ...prev, [key]: value }));
    if (key === 'mainComplaint' && typeof value === 'string') {
      if (value.length > 0) {
        setComplaintSuggestions(COMMON_COMPLAINTS.filter(c => c.includes(value)).slice(0, 10));
      } else {
        setComplaintSuggestions([]);
      }
    }
  };

  const filteredPatients = patients.filter(p => {
    if (!searchQuery) return true;
    return p.ticketNumber.includes(searchQuery) || p.fullNameAr.includes(searchQuery);
  });

  if (!settings.registrationOpen && currentUser?.role !== 'admin') {
    return (
      <PageLayout title="Patient Registration">
        <Card className="glass-card max-w-lg mx-auto">
          <CardContent className="p-8 text-center">
            <p className="text-lg font-semibold text-destructive">Registration is currently closed</p>
            <p className="text-muted-foreground mt-2">The admin has paused patient registration.</p>
          </CardContent>
        </Card>
      </PageLayout>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clinicId || !form.fullNameAr || !form.mainComplaint || !form.age) {
      toast({ title: 'Error', description: 'Please fill all required fields', variant: 'destructive' });
      return;
    }
    const clinic = activeClinics.find(c => c.id === form.clinicId);
    const now = new Date();
    const egyptTime = now.toLocaleString('en-EG', { timeZone: 'Africa/Cairo' });

    const patient = addPatient({
      mainComplaint: form.mainComplaint,
      clinicId: form.clinicId,
      clinicName: clinic ? `${clinic.nameAr} - ${clinic.name}` : '',
      fullNameAr: form.fullNameAr,
      age: parseInt(form.age),
      phone: form.phone || undefined,
      note: form.note || undefined,
      referToVitals: form.referToVitals,
      referToResearch: form.referToResearch,
      registeredBy: currentUser?.fullName || '',
      registeredAt: egyptTime,
      vitalsCompleted: false,
      examined: false,
      referral: false,
    });

    // Non-blocking toast instead of a dialog — keeps registration fast
    toast({
      title: `✅ Registered — Ticket #${patient.ticketNumber}`,
      description: `${patient.fullNameAr} → ${patient.clinicName}`,
    });
    setForm({ mainComplaint: '', clinicId: '', fullNameAr: '', age: '', phone: '', note: '', referToVitals: false, referToResearch: false });
    setComplaintSuggestions([]);
  };

  const handleEditPatient = (patient: Patient) => {
    setEditingPatient({ ...patient });
    setEditDialog(true);
  };

  const handleSaveEdit = () => {
    if (!editingPatient) return;
    const clinic = clinics.find(c => c.id === editingPatient.clinicId);
    updatePatient(editingPatient.id, {
      fullNameAr: editingPatient.fullNameAr,
      age: editingPatient.age,
      phone: editingPatient.phone,
      mainComplaint: editingPatient.mainComplaint,
      note: editingPatient.note,
      clinicId: editingPatient.clinicId,
      clinicName: clinic ? `${clinic.nameAr} - ${clinic.name}` : editingPatient.clinicName,
      referToVitals: editingPatient.referToVitals,
      referToResearch: editingPatient.referToResearch,
    });
    toast({ title: 'Updated', description: `Patient ${editingPatient.ticketNumber} updated` });
    setEditDialog(false);
    setEditingPatient(null);
  };

  const handleDeletePatient = (id: string, ticket: string) => {
    if (confirm(`Delete patient ${ticket}?`)) {
      deletePatient(id);
      toast({ title: 'Deleted', description: `Patient ${ticket} deleted` });
    }
  };

  const categoryKeys = Object.keys(COMPLAINT_CATEGORIES);

  return (
    <PageLayout title="Patient Registration">
      <Tabs defaultValue="register" className="space-y-4">
        <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto">
          <TabsTrigger value="register" className="h-11 text-sm"><Plus className="w-4 h-4 mr-1.5" /> New Patient</TabsTrigger>
          <TabsTrigger value="list" className="h-11 text-sm"><Search className="w-4 h-4 mr-1.5" /> All Patients ({patients.length})</TabsTrigger>
        </TabsList>

        {/* ─ New Patient Form ─ */}
        <TabsContent value="register">
          <Card className="glass-card max-w-2xl mx-auto">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 font-heading text-lg">
                <Ticket className="w-5 h-5 text-primary" />
                New Patient — Ticket: <span className="text-primary font-bold">{getNextTicketNumber()}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Complaint with categories */}
                <div className="space-y-2 relative">
                  <Label className="text-sm font-medium">Main Complaint / الشكوى الرئيسية *</Label>
                  <Input value={form.mainComplaint} onChange={e => update('mainComplaint', e.target.value)} placeholder="اكتب الشكوى الرئيسية" className="h-12 text-right text-base" dir="rtl" required />
                  {complaintSuggestions.length > 0 && (
                    <div className="absolute z-20 w-full bg-card border rounded-lg shadow-lg mt-1 max-h-40 overflow-y-auto">
                      {complaintSuggestions.map((s, i) => (
                        <button key={i} type="button" className="w-full text-right px-4 py-3 hover:bg-muted text-sm transition-colors active:bg-primary/10" dir="rtl"
                          onClick={() => { update('mainComplaint', s); setComplaintSuggestions([]); }}>
                          {s}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Category tabs for quick complaints */}
                  <div className="mt-2">
                    <div className="flex gap-1.5 flex-wrap mb-2">
                      {categoryKeys.map(cat => (
                        <button key={cat} type="button"
                          className={`text-[11px] px-2.5 py-1 rounded-full transition-colors ${complaintCategory === cat ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted text-muted-foreground hover:bg-primary/10'}`}
                          onClick={() => setComplaintCategory(cat)}>
                          {cat.split(' / ')[0]}
                        </button>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(COMPLAINT_CATEGORIES[complaintCategory] || []).map((c, i) => (
                        <button key={i} type="button" className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors active:scale-95"
                          onClick={() => update('mainComplaint', c)}>{c}</button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Two-column responsive grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Clinic / العيادة *</Label>
                    <Select value={form.clinicId} onValueChange={v => update('clinicId', v)}>
                      <SelectTrigger className="h-12 text-base"><SelectValue placeholder="Select clinic" /></SelectTrigger>
                      <SelectContent>
                        {activeClinics.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.nameAr} - {c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Patient Full Name (Arabic) *</Label>
                    <Input value={form.fullNameAr} onChange={e => update('fullNameAr', e.target.value)} placeholder="الاسم الرباعي" className="h-12 text-right text-base" dir="rtl" required />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Age / العمر *</Label>
                    <Input type="number" min={0} max={150} value={form.age} onChange={e => update('age', e.target.value)} required className="h-12 text-base" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Phone / الهاتف</Label>
                    <Input value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="Optional" className="h-12 text-base" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Note / ملاحظة</Label>
                  <Textarea value={form.note} onChange={e => update('note', e.target.value)} placeholder="Any additional notes..." className="text-right min-h-[80px]" dir="rtl" />
                </div>

                <div className="flex flex-wrap items-center gap-x-8 gap-y-3 py-1">
                  <div className="flex items-center gap-3">
                    <Switch checked={form.referToVitals} onCheckedChange={v => update('referToVitals', v)} />
                    <Label className="text-sm">Refer to Vital Signs</Label>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch checked={form.referToResearch} onCheckedChange={v => update('referToResearch', v)} />
                    <Label className="text-sm">Refer to Research</Label>
                  </div>
                </div>

                <div className="pt-1 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Student: {currentUser?.fullName}</span>
                  <span>{new Date().toLocaleString('en-EG', { timeZone: 'Africa/Cairo' })}</span>
                </div>

                <Button type="submit" className="w-full h-14 text-base font-semibold active:scale-[0.98] transition-transform">
                  <Save className="w-5 h-5 mr-2" /> Register Patient
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─ Patient List ─ */}
        <TabsContent value="list">
          <div className="space-y-4">
            <div className="flex gap-2 max-w-md">
              <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search by ticket number or name..." className="h-11" />
              <Button size="icon" variant="outline" className="h-11 w-11"><Search className="w-4 h-4" /></Button>
            </div>

            <div className="space-y-2 stagger-children">
              {filteredPatients.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No patients found</p>
              )}
              {filteredPatients.map(p => (
                <Card key={p.id} className={`glass-card transition-all ${p.examined ? 'border-l-4 border-l-green-500' : p.status === 'absent' ? 'border-l-4 border-l-red-400 opacity-70' : 'border-l-4 border-l-yellow-400'}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="text-center min-w-[52px]">
                          <p className="text-[10px] text-muted-foreground">Ticket</p>
                          <p className="text-base font-bold font-heading text-primary">{p.ticketNumber}</p>
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate" dir="rtl">{p.fullNameAr}</p>
                          <p className="text-xs text-muted-foreground">{p.clinicName} • Age: {p.age}</p>
                          <p className="text-xs text-muted-foreground truncate" dir="rtl">الشكوى: {p.mainComplaint}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <Badge variant={p.examined ? 'default' : p.status === 'absent' ? 'destructive' : 'secondary'}
                          className={`text-[10px] ${p.examined ? 'bg-green-500 text-white' : ''}`}>
                          {p.examined ? '✅ Done' : p.status === 'absent' ? '❌ Absent' : '⏳ Wait'}
                        </Badge>
                        {p.examined && (
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => generatePrescriptionPDF(p, null)}>
                            <FileDown className="w-3.5 h-3.5 text-primary" />
                          </Button>
                        )}
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEditPatient(p)}>
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDeletePatient(p.id, p.ticketNumber)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* ─ Edit Dialog ─ */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Patient — {editingPatient?.ticketNumber}</DialogTitle>
          </DialogHeader>
          {editingPatient && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Full Name</Label>
                <Input value={editingPatient.fullNameAr} onChange={e => setEditingPatient(prev => prev ? { ...prev, fullNameAr: e.target.value } : null)} dir="rtl" className="h-11" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Age</Label>
                  <Input type="number" value={editingPatient.age} onChange={e => setEditingPatient(prev => prev ? { ...prev, age: parseInt(e.target.value) || 0 } : null)} className="h-11" />
                </div>
                <div className="space-y-1.5">
                  <Label>Phone</Label>
                  <Input value={editingPatient.phone || ''} onChange={e => setEditingPatient(prev => prev ? { ...prev, phone: e.target.value } : null)} className="h-11" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Main Complaint</Label>
                <Input value={editingPatient.mainComplaint} onChange={e => setEditingPatient(prev => prev ? { ...prev, mainComplaint: e.target.value } : null)} dir="rtl" className="h-11" />
              </div>
              <div className="space-y-1.5">
                <Label>Clinic</Label>
                <Select value={editingPatient.clinicId} onValueChange={v => {
                  const c = clinics.find(cl => cl.id === v);
                  setEditingPatient(prev => prev ? { ...prev, clinicId: v, clinicName: c ? `${c.nameAr} - ${c.name}` : '' } : null);
                }}>
                  <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {activeClinics.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.nameAr} - {c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Note</Label>
                <Textarea value={editingPatient.note || ''} onChange={e => setEditingPatient(prev => prev ? { ...prev, note: e.target.value } : null)} dir="rtl" />
              </div>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 py-1">
                <div className="flex items-center gap-2">
                  <Switch checked={editingPatient.referToVitals} onCheckedChange={v => setEditingPatient(prev => prev ? { ...prev, referToVitals: v } : null)} />
                  <Label className="text-sm">Refer to Vitals</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={editingPatient.referToResearch} onCheckedChange={v => setEditingPatient(prev => prev ? { ...prev, referToResearch: v } : null)} />
                  <Label className="text-sm">Refer to Research</Label>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={handleSaveEdit} className="w-full h-11">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
};

export default PatientRegistration;
