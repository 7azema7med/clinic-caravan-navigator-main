import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Shield, Users, Building2, Settings, Download, Plus, Edit, Trash2, GripVertical, FileSpreadsheet, ScrollText, FileText, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Clinic, StudentAssignment, ASSIGNMENT_LABELS, ResearchQuestion, VitalThreshold } from '@/lib/types';
import { generateGlobalReportPDF, generateClinicReportPDF } from '@/lib/pdf';
import { exportPatientsCSV, exportClinicCSV, exportSummaryCSV } from '@/lib/excel';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, Cell } from 'recharts';
import PageLayout from '@/components/PageLayout';

const AdminPanel: React.FC = () => {
  const { currentUser, users, updateUser, deleteUser, setAssignment } = useAuth();
  const { clinics, addClinic, updateClinic, deleteClinic, settings, updateSettings, patients, getClinicStats, addResearchQuestion, updateResearchQuestion, deleteResearchQuestion, reorderResearchQuestions, vitalThresholds, updateVitalThreshold } = useData();
  const { toast } = useToast();
  
  const [newClinic, setNewClinic] = useState({ name: '', nameAr: '', doctorName: '' });
  const [newQuestion, setNewQuestion] = useState({ question: '', questionAr: '', type: 'text' as ResearchQuestion['type'], required: false, options: '' });

  if (currentUser?.role !== 'admin') {
    return (
      <PageLayout title="Access Denied">
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <Shield className="w-16 h-16 text-destructive mb-4" />
          <h2 className="text-2xl font-bold font-heading">Admin Access Required</h2>
          <p className="text-muted-foreground mt-2">You do not have permission to view this page.</p>
        </div>
      </PageLayout>
    );
  }

  const handleAddClinic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClinic.name || !newClinic.nameAr) return;
    addClinic({ ...newClinic, isActive: true });
    setNewClinic({ name: '', nameAr: '', doctorName: '' });
    toast({ title: 'Success', description: 'Clinic added successfully' });
  };

  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.question) return;
    const options = ['select', 'multiselect'].includes(newQuestion.type) 
      ? newQuestion.options.split(',').map(o => o.trim()).filter(Boolean) 
      : undefined;
      
    addResearchQuestion({
      question: newQuestion.question,
      questionAr: newQuestion.questionAr,
      type: newQuestion.type,
      required: newQuestion.required,
      options,
    });
    setNewQuestion({ question: '', questionAr: '', type: 'text', required: false, options: '' });
    toast({ title: 'Added', description: 'Research question added' });
  };

  const handleRoleChange = (userId: string, currentRole: string) => {
    if (userId === currentUser.id) return;
    const newRole = currentRole === 'admin' ? 'student' : 'admin';
    updateUser(userId, { role: newRole as "student" | "admin" });
    toast({ title: 'Updated', description: `User role changed to ${newRole}` });
  };

  const handleDeleteUser = (userId: string, name: string) => {
    if (userId === currentUser.id) return;
    if (window.confirm(`Are you sure you want to delete user ${name}?`)) {
      deleteUser(userId);
      toast({ title: 'Deleted', description: 'User deleted successfully' });
    }
  };

  const stats = getClinicStats();
  const chartData = stats.map(s => ({
    name: s.clinicName.split('-')[0].trim(),
    الانتظار: s.waiting,
    'تم الكشف': s.examined,
    الغياب: s.absent
  }));

  const globalDownload = () => {
    generateGlobalReportPDF(patients, stats);
    exportPatientsCSV(patients, 'global_patients_data');
    exportSummaryCSV(stats);
  };

  return (
    <PageLayout title="Admin Control Panel">
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid grid-cols-2 lg:grid-cols-6 h-auto max-w-4xl mx-auto gap-2 p-1 bg-muted/50 rounded-xl">
          <TabsTrigger value="overview" className="flex items-center gap-2"><Shield className="w-4 h-4" /> Overview</TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2"><Users className="w-4 h-4" /> Users</TabsTrigger>
          <TabsTrigger value="clinics" className="flex items-center gap-2"><Building2 className="w-4 h-4" /> Clinics</TabsTrigger>
          <TabsTrigger value="research" className="flex items-center gap-2"><ScrollText className="w-4 h-4" /> Research</TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2"><Download className="w-4 h-4" /> Reports</TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2"><Settings className="w-4 h-4" /> Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="glass-card">
              <CardContent className="p-6 text-center">
                <p className="text-4xl font-bold font-heading text-primary">{patients.length}</p>
                <p className="text-sm text-muted-foreground mt-2">Total Registrations</p>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="p-6 text-center">
                <p className="text-4xl font-bold font-heading text-green-500">{patients.filter(p => p.examined).length}</p>
                <p className="text-sm text-muted-foreground mt-2">Patients Examined</p>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="p-6 text-center">
                <p className="text-4xl font-bold font-heading text-yellow-500">{patients.filter(p => p.status === 'waiting' || (!p.examined && p.status !== 'absent')).length}</p>
                <p className="text-sm text-muted-foreground mt-2">Currently Waiting</p>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="p-6 text-center">
                <p className="text-4xl font-bold font-heading text-destructive">{patients.filter(p => p.status === 'absent').length}</p>
                <p className="text-sm text-muted-foreground mt-2">Absent Patients</p>
              </CardContent>
            </Card>
          </div>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="font-heading">Clinic Load Distribution</CardTitle>
            </CardHeader>
            <CardContent className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--card-foreground))', borderRadius: '8px' }} />
                  <Legend />
                  <Bar dataKey="تم الكشف" stackId="a" fill="#10b981" />
                  <Bar dataKey="الانتظار" stackId="a" fill="#f59e0b" />
                  <Bar dataKey="الغياب" stackId="a" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="font-heading">User Management ({users.length})</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg">Name</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Assignment</th>
                    <th className="px-4 py-3 text-right rounded-tr-lg">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 font-medium flex items-center gap-2">
                        {u.isActive && <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>}
                        {u.fullName}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>{u.role}</Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {ASSIGNMENT_LABELS[u.assignment || '']} {u.assignedClinic && `- Clinic`}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleRoleChange(u.id, u.role)} disabled={u.id === currentUser.id}>
                          Toggle Role
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => handleDeleteUser(u.id, u.fullName)} disabled={u.id === currentUser.id}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clinics">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="glass-card">
              <CardHeader><CardTitle className="font-heading text-base">Add New Clinic</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleAddClinic} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Arabic Name *</Label>
                    <Input value={newClinic.nameAr} onChange={e => setNewClinic(f => ({ ...f, nameAr: e.target.value }))} placeholder="أطفال" dir="rtl" required />
                  </div>
                  <div className="space-y-2">
                    <Label>English Name *</Label>
                    <Input value={newClinic.name} onChange={e => setNewClinic(f => ({ ...f, name: e.target.value }))} placeholder="Pediatrics" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Doctor Name</Label>
                    <Input value={newClinic.doctorName} onChange={e => setNewClinic(f => ({ ...f, doctorName: e.target.value }))} placeholder="د. أحمد" dir="rtl" />
                  </div>
                  <Button type="submit" className="w-full"><Plus className="w-4 h-4 mr-2" /> Add Clinic</Button>
                </form>
              </CardContent>
            </Card>

            <div className="lg:col-span-2 space-y-3">
              {clinics.map(c => (
                <Card key={c.id} className={`glass-card transition-colors ${c.isActive ? '' : 'opacity-60 bg-muted'}`}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-foreground">{c.nameAr} - {c.name}</h4>
                      <p className="text-sm text-muted-foreground">Doctor: {c.doctorName || 'Not assigned'}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Switch checked={c.isActive} onCheckedChange={v => updateClinic(c.id, { isActive: v })} />
                        <span className="text-sm text-muted-foreground">{c.isActive ? 'Active' : 'Disabled'}</span>
                      </div>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => {
                        if (confirm(`Delete clinic ${c.name}?`)) deleteClinic(c.id);
                      }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="research">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <Card className="glass-card xl:col-span-1">
              <CardHeader><CardTitle className="font-heading text-base">Add Research Question</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleAddQuestion} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Question (English) *</Label>
                    <Input value={newQuestion.question} onChange={e => setNewQuestion(f => ({ ...f, question: e.target.value }))} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Question (Arabic)</Label>
                    <Input value={newQuestion.questionAr} onChange={e => setNewQuestion(f => ({ ...f, questionAr: e.target.value }))} dir="rtl" />
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={newQuestion.type} onValueChange={(v: "text" | "textarea" | "number" | "boolean" | "select" | "multiselect") => setNewQuestion(f => ({ ...f, type: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Short Text</SelectItem>
                        <SelectItem value="textarea">Long Text</SelectItem>
                        <SelectItem value="number">Number</SelectItem>
                        <SelectItem value="boolean">Yes/No</SelectItem>
                        <SelectItem value="select">Dropdown (Single)</SelectItem>
                        <SelectItem value="multiselect">Checkboxes (Multi)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {['select', 'multiselect'].includes(newQuestion.type) && (
                    <div className="space-y-2">
                      <Label>Options (comma separated)</Label>
                      <Input value={newQuestion.options} onChange={e => setNewQuestion(f => ({ ...f, options: e.target.value }))} placeholder="Apple, Banana, Orange" />
                    </div>
                  )}
                  <div className="flex items-center gap-2 pt-2">
                    <Switch checked={newQuestion.required} onCheckedChange={v => setNewQuestion(f => ({ ...f, required: v }))} />
                    <Label>Required Field</Label>
                  </div>
                  <Button type="submit" className="w-full bg-violet-600 hover:bg-violet-700"><Plus className="w-4 h-4 mr-2" /> Add Question</Button>
                </form>
              </CardContent>
            </Card>

            <div className="xl:col-span-2 space-y-3">
              <h3 className="font-heading font-semibold text-lg">Current Questionnaire</h3>
              {(!settings.researchQuestions || settings.researchQuestions.length === 0) && (
                <div className="p-8 text-center text-muted-foreground border-2 border-dashed rounded-lg bg-muted/20">
                  No research questions added yet. Use the form to build the questionnaire.
                </div>
              )}
              {(settings.researchQuestions || []).sort((a, b) => a.order - b.order).map((q, idx) => (
                <Card key={q.id} className="glass-card">
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className="p-2 cursor-grab text-muted-foreground hover:text-foreground"><GripVertical className="w-5 h-5" /></div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">
                        {idx + 1}. {q.question}
                        {q.required && <span className="text-destructive ml-1">*</span>}
                        <Badge variant="outline" className="ml-2 text-[10px] uppercase font-mono">{q.type}</Badge>
                      </p>
                      {q.questionAr && <p className="text-sm text-muted-foreground mt-1" dir="rtl">{q.questionAr}</p>}
                      {['select', 'multiselect'].includes(q.type) && q.options && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {q.options.map(o => <Badge key={o} variant="secondary" className="text-xs bg-muted/50">{o}</Badge>)}
                        </div>
                      )}
                    </div>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteResearchQuestion(q.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="reports">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <Card className="glass-card bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-500/20">
              <CardHeader className="text-center">
                <FileSpreadsheet className="w-12 h-12 text-blue-500 mx-auto mb-2" />
                <CardTitle className="font-heading text-xl">Global Data Export</CardTitle>
                <CardDescription>Download all caravan data combined</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                 <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={globalDownload}>
                   <Download className="w-4 h-4 mr-2" /> Download Full Archive (PDF + Excel)
                 </Button>
                 <Button variant="outline" className="w-full" onClick={() => exportPatientsCSV(patients, 'global_patients')}>
                   Download Excel Spreadsheet Only (CSV)
                 </Button>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <h3 className="font-heading font-semibold text-lg px-2">Per-Clinic Reports</h3>
              {clinics.filter(c => c.isActive).map(c => {
                const clinicPatients = patients.filter(p => p.clinicId === c.id);
                return (
                  <Card key={c.id} className="glass-card">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-sm">{c.nameAr} - {c.name}</h4>
                        <p className="text-xs text-muted-foreground">{clinicPatients.length} patients</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => generateClinicReportPDF(c.nameAr, clinicPatients)} title="PDF">
                           <FileText className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => exportClinicCSV(c.nameAr, clinicPatients)} title="Excel">
                           <FileSpreadsheet className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <div className="space-y-6 max-w-4xl mx-auto">
            <Card className="glass-card">
              <CardHeader><CardTitle className="font-heading">System Status & Controls</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                  <div>
                    <h4 className="font-semibold text-foreground">Patient Registration</h4>
                    <p className="text-sm text-muted-foreground">Allow new patients to be registered at the reception</p>
                  </div>
                  <Switch 
                    checked={settings.registrationOpen} 
                    onCheckedChange={v => updateSettings({ registrationOpen: v })} 
                  />
                </div>

                <div className="space-y-3">
                  <Label>Rotation Timer (Minutes per station)</Label>
                  <div className="flex items-center gap-4">
                    <Input 
                      type="number" 
                      value={settings.rotationTimeMinutes} 
                      onChange={e => updateSettings({ rotationTimeMinutes: parseInt(e.target.value) || 30 })} 
                      className="w-32" 
                      min={1} 
                    />
                    <span className="text-sm text-muted-foreground">minutes</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Changes to this timer will take effect for users on their next login or position switch.</p>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="font-heading">Vital Signs Data Ranges</CardTitle>
                <CardDescription>Configure the normal and threshold values for vital metrics (Arabic labels will be used in reports)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {['blood_pressure_systolic', 'blood_pressure_diastolic', 'blood_sugar', 'pulse'].map(metric => {
                    const metricThresholds = vitalThresholds.filter(t => t.metric === metric);
                    const label = metric.replace(/_/g, ' ').toUpperCase();
                    
                    return (
                      <div key={metric} className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">{label}</Badge>
                          <div className="h-px flex-1 bg-border/50"></div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          {metricThresholds.map(t => (
                            <div key={t.id} className="p-3 border rounded-lg bg-card/50 hover:bg-card transition-colors space-y-3">
                              <div className="flex items-center justify-between">
                                <Badge style={{ backgroundColor: t.color }} className="text-white border-none">{t.level.toUpperCase()}</Badge>
                                <span className="text-[10px] text-muted-foreground" dir="rtl">{t.label_ar}</span>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                  <Label className="text-[10px]">Min</Label>
                                  <Input 
                                    className="h-8 text-xs px-2"
                                    type="number" 
                                    placeholder="None"
                                    value={t.min_value === null ? '' : t.min_value} 
                                    onChange={e => updateVitalThreshold(t.id, { min_value: e.target.value === '' ? null : parseInt(e.target.value) })}
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-[10px]">Max</Label>
                                  <Input 
                                    className="h-8 text-xs px-2"
                                    type="number" 
                                    placeholder="None"
                                    value={t.max_value === null ? '' : t.max_value} 
                                    onChange={e => updateVitalThreshold(t.id, { max_value: e.target.value === '' ? null : parseInt(e.target.value) })}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
      </Tabs>
    </PageLayout>
  );
};

export default AdminPanel;
