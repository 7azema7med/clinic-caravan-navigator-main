import React, { useState, useRef } from 'react';
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
import {
  Shield, Users, Building2, Settings, Download, Plus, Trash2,
  GripVertical, FileSpreadsheet, ScrollText, FileText, ImagePlus,
  X, Loader2, UploadCloud,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Clinic, StudentAssignment, ASSIGNMENT_LABELS, ResearchQuestion, VitalThreshold } from '@/lib/types';
import { generateGlobalReportPDF, generateClinicReportPDF } from '@/lib/pdf';
import { exportPatientsCSV, exportClinicCSV, exportSummaryCSV } from '@/lib/excel';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import PageLayout from '@/components/PageLayout';

const AdminPanel: React.FC = () => {
  const { currentUser, users, updateUser, deleteUser } = useAuth();
  const {
    clinics, addClinic, updateClinic, deleteClinic,
    settings, updateSettings, uploadLogo,
    patients, getClinicStats,
    addResearchQuestion, deleteResearchQuestion,
    vitalThresholds, updateVitalThreshold,
  } = useData();
  const { toast } = useToast();

  const [newClinic, setNewClinic] = useState({ name: '', nameAr: '', doctorName: '' });
  const [newQuestion, setNewQuestion] = useState({
    question: '', questionAr: '', type: 'text' as ResearchQuestion['type'], required: false, options: '',
  });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoDragging, setLogoDragging] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

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

  // ── Handlers ──
  const handleAddClinic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClinic.name || !newClinic.nameAr) return;
    addClinic({ ...newClinic, isActive: true });
    setNewClinic({ name: '', nameAr: '', doctorName: '' });
    toast({ title: 'Clinic Added', description: 'New clinic created successfully.' });
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
    toast({ title: 'Question Added' });
  };

  const handleRoleChange = (userId: string, currentRole: string) => {
    if (userId === currentUser.id) return;
    const newRole = currentRole === 'admin' ? 'student' : 'admin';
    updateUser(userId, { role: newRole as 'student' | 'admin' });
    toast({ title: 'Role Updated', description: `Changed to ${newRole}` });
  };

  const handleDeleteUser = (userId: string, name: string) => {
    if (userId === currentUser.id) return;
    if (window.confirm(`Delete user "${name}"? This cannot be undone.`)) {
      deleteUser(userId);
      toast({ title: 'User Deleted' });
    }
  };

  // ── Logo Upload ──
  const processLogoFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please select an image file.', variant: 'destructive' });
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    setLogoPreview(previewUrl);
    setLogoUploading(true);
    try {
      await uploadLogo(file);
      toast({ title: '✓ Logo Uploaded', description: 'Logo will now appear on login page, header, and reports.' });
    } finally {
      setLogoUploading(false);
    }
  };

  const handleLogoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processLogoFile(file);
  };

  const handleLogoDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setLogoDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processLogoFile(file);
  };

  const handleRemoveLogo = async () => {
    setLogoPreview(null);
    await updateSettings({ logoUrl: null });
    toast({ title: 'Logo Removed' });
  };

  const currentLogo = logoPreview || settings.logoUrl;

  // ── Stats & Chart ──
  const stats = getClinicStats();
  const chartData = stats.map(s => ({
    name: s.clinicName.split('-')[0].trim(),
    'تم الكشف': s.examined,
    'انتظار': s.waiting,
    'غياب': s.absent,
  }));

  const globalDownload = () => {
    generateGlobalReportPDF(patients, stats, settings.logoUrl, settings.organizationName);
    exportPatientsCSV(patients, 'global_patients_data');
    exportSummaryCSV(stats);
  };

  return (
    <PageLayout title="Admin Control Panel">
      {/* Scrollable tabs — mobile-friendly */}
      <Tabs defaultValue="overview" className="space-y-6">
        <div className="overflow-x-auto pb-1 -mx-2 px-2">
          <TabsList className="flex w-max min-w-full gap-1 p-1 bg-muted/50 rounded-xl h-auto">
            {[
              { value: 'overview', icon: Shield, label: 'Overview' },
              { value: 'users', icon: Users, label: 'Users' },
              { value: 'clinics', icon: Building2, label: 'Clinics' },
              { value: 'research', icon: ScrollText, label: 'Research' },
              { value: 'reports', icon: Download, label: 'Reports' },
              { value: 'settings', icon: Settings, label: 'Settings' },
            ].map(({ value, icon: Icon, label }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="flex items-center gap-1.5 whitespace-nowrap px-3 py-2 text-sm"
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* ── Overview ── */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Registrations', value: patients.length, color: 'text-primary' },
              { label: 'Patients Examined', value: patients.filter(p => p.examined).length, color: 'text-green-500' },
              { label: 'Currently Waiting', value: patients.filter(p => !p.examined && p.status !== 'absent').length, color: 'text-yellow-500' },
              { label: 'Absent Patients', value: patients.filter(p => p.status === 'absent').length, color: 'text-destructive' },
            ].map(({ label, value, color }) => (
              <Card key={label} className="glass-card">
                <CardContent className="p-4 sm:p-6 text-center">
                  <p className={`text-3xl sm:text-4xl font-bold font-heading ${color}`}>{value}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-2">{label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="font-heading">Clinic Load Distribution</CardTitle>
            </CardHeader>
            <CardContent className="h-72 sm:h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 12, right: 16, left: 0, bottom: 5 }}>
                  <XAxis dataKey="name" fontSize={11} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis fontSize={11} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      color: 'hsl(var(--card-foreground))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="تم الكشف" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="انتظار" stackId="a" fill="#f59e0b" />
                  <Bar dataKey="غياب" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Users ── */}
        <TabsContent value="users">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="font-heading">User Management ({users.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Mobile: card list; Desktop: table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 rounded-tl-lg">Name</th>
                      <th className="px-4 py-3">Username</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Assignment</th>
                      <th className="px-4 py-3 text-right rounded-tr-lg">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-muted/50 transition-colors">
                        <td className="px-4 py-3 font-medium">
                          <div className="flex items-center gap-2">
                            {u.isActive && <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0" />}
                            <span>{u.fullName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{u.username}</td>
                        <td className="px-4 py-3">
                          <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>{u.role}</Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {ASSIGNMENT_LABELS[u.assignment ?? 'unassigned'] ?? 'Unassigned'}
                        </td>
                        <td className="px-4 py-3 text-right space-x-1">
                          <Button
                            variant="ghost" size="sm"
                            onClick={() => handleRoleChange(u.id, u.role)}
                            disabled={u.id === currentUser.id}
                          >
                            Toggle Role
                          </Button>
                          <Button
                            variant="ghost" size="sm"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteUser(u.id, u.fullName)}
                            disabled={u.id === currentUser.id}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile card list */}
              <div className="sm:hidden space-y-3">
                {users.map(u => (
                  <div key={u.id} className="p-3 rounded-lg bg-muted/30 border border-border/40">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {u.isActive && <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />}
                        <span className="font-semibold text-sm">{u.fullName}</span>
                      </div>
                      <Badge variant={u.role === 'admin' ? 'default' : 'secondary'} className="text-xs">{u.role}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      {u.username} • {ASSIGNMENT_LABELS[u.assignment ?? 'unassigned'] ?? 'Unassigned'}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline" size="sm" className="flex-1 text-xs h-8"
                        onClick={() => handleRoleChange(u.id, u.role)}
                        disabled={u.id === currentUser.id}
                      >
                        Toggle Role
                      </Button>
                      <Button
                        variant="outline" size="sm" className="text-destructive border-destructive/30 h-8"
                        onClick={() => handleDeleteUser(u.id, u.fullName)}
                        disabled={u.id === currentUser.id}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Clinics ── */}
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
                <Card key={c.id} className={`glass-card transition-opacity ${c.isActive ? '' : 'opacity-60'}`}>
                  <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-foreground">{c.nameAr} — {c.name}</h4>
                      <p className="text-sm text-muted-foreground">Doctor: {c.doctorName || 'Not assigned'}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <Switch checked={c.isActive} onCheckedChange={v => updateClinic(c.id, { isActive: v })} />
                      <span className="text-sm text-muted-foreground">{c.isActive ? 'Active' : 'Disabled'}</span>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => {
                        if (confirm(`Delete clinic "${c.name}"?`)) deleteClinic(c.id);
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

        {/* ── Research ── */}
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
                    <Select value={newQuestion.type} onValueChange={(v: ResearchQuestion['type']) => setNewQuestion(f => ({ ...f, type: v }))}>
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
                      <Input value={newQuestion.options} onChange={e => setNewQuestion(f => ({ ...f, options: e.target.value }))} placeholder="Option A, Option B" />
                    </div>
                  )}
                  <div className="flex items-center gap-2 pt-1">
                    <Switch checked={newQuestion.required} onCheckedChange={v => setNewQuestion(f => ({ ...f, required: v }))} />
                    <Label>Required Field</Label>
                  </div>
                  <Button type="submit" className="w-full bg-violet-600 hover:bg-violet-700"><Plus className="w-4 h-4 mr-2" /> Add Question</Button>
                </form>
              </CardContent>
            </Card>

            <div className="xl:col-span-2 space-y-3">
              <h3 className="font-heading font-semibold text-lg">Current Questionnaire ({settings.researchQuestions?.length ?? 0} questions)</h3>
              {(!settings.researchQuestions || settings.researchQuestions.length === 0) && (
                <div className="p-8 text-center text-muted-foreground border-2 border-dashed rounded-xl bg-muted/20">
                  No research questions yet. Use the form to build the questionnaire.
                </div>
              )}
              {(settings.researchQuestions ?? []).sort((a, b) => a.order - b.order).map((q, idx) => (
                <Card key={q.id} className="glass-card">
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className="p-2 text-muted-foreground"><GripVertical className="w-5 h-5" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">
                        {idx + 1}. {q.question}
                        {q.required && <span className="text-destructive ml-1">*</span>}
                        <Badge variant="outline" className="ml-2 text-[10px] uppercase font-mono">{q.type}</Badge>
                      </p>
                      {q.questionAr && <p className="text-sm text-muted-foreground mt-1" dir="rtl">{q.questionAr}</p>}
                      {['select', 'multiselect'].includes(q.type) && q.options && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {q.options.map(o => <Badge key={o} variant="secondary" className="text-xs">{o}</Badge>)}
                        </div>
                      )}
                    </div>
                    <Button variant="ghost" size="icon" className="text-destructive flex-shrink-0" onClick={() => deleteResearchQuestion(q.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* ── Reports ── */}
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
                  <Download className="w-4 h-4 mr-2" /> Full Archive (PDF + Excel)
                </Button>
                <Button variant="outline" className="w-full" onClick={() => exportPatientsCSV(patients, 'global_patients')}>
                  Excel Spreadsheet Only (CSV)
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <h3 className="font-heading font-semibold text-lg px-1">Per-Clinic Reports</h3>
              {clinics.filter(c => c.isActive).map(c => {
                const cp = patients.filter(p => p.clinicId === c.id);
                return (
                  <Card key={c.id} className="glass-card">
                    <CardContent className="p-4 flex items-center justify-between gap-3">
                      <div>
                        <h4 className="font-bold text-sm">{c.nameAr} — {c.name}</h4>
                        <p className="text-xs text-muted-foreground">{cp.length} patients</p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Button size="sm" variant="outline" onClick={() => generateClinicReportPDF(c.nameAr, cp, settings.logoUrl, settings.organizationName)} title="PDF Report">
                          <FileText className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => exportClinicCSV(c.nameAr, cp)} title="Excel Export">
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

        {/* ── Settings ── */}
        <TabsContent value="settings">
          <div className="space-y-6 max-w-4xl mx-auto">

            {/* Logo Upload Card */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="font-heading flex items-center gap-2">
                  <ImagePlus className="w-5 h-5 text-primary" /> Organisation Logo
                </CardTitle>
                <CardDescription>
                  Upload your logo to display it on the login page, site header, and all printed reports.
                  Accepted formats: PNG, JPG, SVG, WebP (max 2 MB).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row items-start gap-6">
                  {/* Preview */}
                  <div className="flex-shrink-0">
                    <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-border bg-muted/30 flex items-center justify-center overflow-hidden relative">
                      {currentLogo ? (
                        <>
                          <img src={currentLogo} alt="Logo preview" className="w-full h-full object-contain p-1" />
                          <button
                            type="button"
                            onClick={handleRemoveLogo}
                            className="absolute top-1 right-1 w-5 h-5 bg-destructive rounded-full flex items-center justify-center hover:bg-destructive/80 transition-colors"
                            aria-label="Remove logo"
                          >
                            <X className="w-3 h-3 text-white" />
                          </button>
                        </>
                      ) : (
                        <ImagePlus className="w-8 h-8 text-muted-foreground" />
                      )}
                      {logoUploading && (
                        <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                          <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        </div>
                      )}
                    </div>
                    {currentLogo && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1 text-center">✓ Active</p>
                    )}
                  </div>

                  {/* Drop zone */}
                  <div
                    className={`flex-1 border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                      logoDragging
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50 hover:bg-muted/30'
                    }`}
                    onClick={() => logoInputRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); setLogoDragging(true); }}
                    onDragLeave={() => setLogoDragging(false)}
                    onDrop={handleLogoDrop}
                  >
                    <UploadCloud className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">Click or drag & drop to upload</p>
                    <p className="text-xs text-muted-foreground mt-1">PNG, JPG, SVG, WebP — max 2 MB</p>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoFile}
                    />
                  </div>
                </div>

                {/* Organisation name */}
                <div className="mt-4 space-y-2">
                  <Label htmlFor="orgName">Organisation / Caravan Name</Label>
                  <Input
                    id="orgName"
                    value={settings.organizationName ?? ''}
                    onChange={e => updateSettings({ organizationName: e.target.value })}
                    placeholder="Medical Caravan"
                    className="max-w-sm"
                  />
                  <p className="text-xs text-muted-foreground">Shown on login page and report headers.</p>
                </div>
              </CardContent>
            </Card>

            {/* System Controls */}
            <Card className="glass-card">
              <CardHeader><CardTitle className="font-heading">System Controls</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg gap-4">
                  <div>
                    <h4 className="font-semibold text-foreground">Patient Registration</h4>
                    <p className="text-sm text-muted-foreground">Allow new patients to be registered at reception</p>
                  </div>
                  <Switch
                    checked={settings.registrationOpen}
                    onCheckedChange={v => updateSettings({ registrationOpen: v })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Rotation Timer (minutes per station)</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      value={settings.rotationTimeMinutes}
                      onChange={e => updateSettings({ rotationTimeMinutes: parseInt(e.target.value) || 30 })}
                      className="w-28"
                      min={1}
                      max={240}
                    />
                    <span className="text-sm text-muted-foreground">minutes</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Vital Thresholds */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="font-heading">Vital Signs Thresholds</CardTitle>
                <CardDescription>Configure normal and warning thresholds for vital metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {(['blood_pressure_systolic', 'blood_pressure_diastolic', 'blood_sugar', 'pulse'] as VitalThreshold['metric'][]).map(metric => {
                    const metricThresholds = vitalThresholds.filter(t => t.metric === metric);
                    const label = metric.replace(/_/g, ' ').toUpperCase();
                    return (
                      <div key={metric} className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">{label}</Badge>
                          <div className="h-px flex-1 bg-border/50" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                          {metricThresholds.map(t => (
                            <div key={t.id} className="p-3 border rounded-lg bg-card/50 hover:bg-card transition-colors space-y-2">
                              <div className="flex items-center justify-between">
                                <Badge style={{ backgroundColor: t.color }} className="text-white border-none text-[10px]">{t.level.toUpperCase()}</Badge>
                                <span className="text-[10px] text-muted-foreground" dir="rtl">{t.label_ar}</span>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                  <Label className="text-[10px]">Min</Label>
                                  <Input
                                    className="h-7 text-xs px-2"
                                    type="number"
                                    placeholder="—"
                                    value={t.min_value === null ? '' : t.min_value}
                                    onChange={e => updateVitalThreshold(t.id, { min_value: e.target.value === '' ? null : parseInt(e.target.value) })}
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-[10px]">Max</Label>
                                  <Input
                                    className="h-7 text-xs px-2"
                                    type="number"
                                    placeholder="—"
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
