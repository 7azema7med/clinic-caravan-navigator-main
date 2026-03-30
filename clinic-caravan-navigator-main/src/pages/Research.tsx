import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ScrollText, Search, Save, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Patient } from '@/lib/types';
import PageLayout from '@/components/PageLayout';

const Research: React.FC = () => {
  const { currentUser } = useAuth();
  const { settings, patients, saveResearchResponse, getPatientByTicket } = useData();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [responses, setResponses] = useState<Record<string, any>>({});

  const questions = (settings.researchQuestions || []).sort((a, b) => a.order - b.order);
  const referredPatients = patients.filter(p => p.referToResearch);
  const waitingResearch = referredPatients.filter(p => !p.researchCompleted);
  const completedResearch = referredPatients.filter(p => p.researchCompleted);

  const selectedPatient = selectedPatientId ? patients.find(p => p.id === selectedPatientId) : null;

  const handleSelectPatient = (p: Patient) => {
    setSelectedPatientId(p.id);
    setResponses(p.researchResponses || {});
  };

  const handleSearch = () => {
    if (!searchQuery) return;
    const p = getPatientByTicket(searchQuery);
    if (p) handleSelectPatient(p);
  };

  const handleSave = () => {
    if (!selectedPatientId || !currentUser) return;
    // Check required fields
    const missing = questions.filter(q => q.required && !responses[q.id]);
    if (missing.length > 0) {
      toast({ title: 'Error', description: `Please fill all required questions (${missing.length} remaining)`, variant: 'destructive' });
      return;
    }
    saveResearchResponse(selectedPatientId, responses, currentUser.fullName);
    toast({ title: 'Saved', description: 'Research questionnaire saved successfully' });
    setSelectedPatientId(null);
    setResponses({});
  };

  if (questions.length === 0) {
    return (
      <PageLayout title="Research Questionnaire">
        <Card className="glass-card max-w-2xl mx-auto">
          <CardContent className="p-12 text-center text-muted-foreground">
            <ScrollText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-semibold text-foreground mb-2">Research Questionnaire</p>
            <p>No questions have been configured yet. The admin (Hazem) can add questions from the Admin Panel → Research tab.</p>
          </CardContent>
        </Card>
      </PageLayout>
    );
  }

  const PatientItem = ({ p }: { p: Patient }) => (
    <button onClick={() => handleSelectPatient(p)}
      className={`w-full text-left p-3 rounded-lg border transition-all ${
        selectedPatientId === p.id ? 'bg-primary/10 border-primary ring-1 ring-primary' :
        p.researchCompleted ? 'bg-green-50 border-green-300 dark:bg-green-950/30 dark:border-green-700' :
        'bg-violet-50 border-violet-300 hover:bg-violet-100 dark:bg-violet-950/20 dark:border-violet-700'
      }`}>
      <div className="flex justify-between items-center">
        <span className="font-medium text-sm">{p.fullNameAr}</span>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">{p.ticketNumber}</Badge>
          {p.researchCompleted && <CheckCircle2 className="w-4 h-4 text-green-600" />}
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-1">{p.clinicName}</p>
    </button>
  );

  return (
    <PageLayout title="Research Questionnaire">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Patient list */}
        <div className="space-y-4">
          <Card className="glass-card">
            <CardHeader><CardTitle className="text-sm font-heading">Search Patient</CardTitle></CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Ticket or name" className="h-10" onKeyDown={e => e.key === 'Enter' && handleSearch()} />
                <Button size="icon" onClick={handleSearch}><Search className="w-4 h-4" /></Button>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-heading flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-violet-400"></span>
                Pending ({waitingResearch.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-48 overflow-y-auto space-y-1">
              {waitingResearch.map(p => <PatientItem key={p.id} p={p} />)}
              {waitingResearch.length === 0 && <p className="text-sm text-muted-foreground text-center py-3">No pending patients</p>}
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-heading flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500"></span>
                Completed ({completedResearch.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-48 overflow-y-auto space-y-1">
              {completedResearch.map(p => <PatientItem key={p.id} p={p} />)}
              {completedResearch.length === 0 && <p className="text-sm text-muted-foreground text-center py-3">No completed</p>}
            </CardContent>
          </Card>
        </div>

        {/* Right: Questionnaire */}
        <div className="lg:col-span-2">
          {selectedPatient ? (
            <Card className="glass-card animate-slide-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-heading">
                  <ScrollText className="w-5 h-5 text-violet-500" />
                  {selectedPatient.fullNameAr} — {selectedPatient.ticketNumber}
                  {selectedPatient.researchCompleted && <Badge className="bg-green-500 text-white ml-2">Completed</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-3 text-sm">
                  <p><span className="text-muted-foreground">Complaint:</span> {selectedPatient.mainComplaint}</p>
                  <p><span className="text-muted-foreground">Age:</span> {selectedPatient.age} • <span className="text-muted-foreground">Clinic:</span> {selectedPatient.clinicName}</p>
                </div>

                {questions.map((q, i) => (
                  <div key={q.id} className="space-y-2">
                    <Label className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground mr-1">{i + 1}.</span>
                      {q.question}
                      {q.questionAr && <span className="text-muted-foreground text-sm" dir="rtl"> / {q.questionAr}</span>}
                      {q.required && <span className="text-destructive">*</span>}
                    </Label>

                    {q.type === 'text' && (
                      <Input value={responses[q.id] || ''} onChange={e => setResponses(r => ({ ...r, [q.id]: e.target.value }))} className="h-10" />
                    )}
                    {q.type === 'textarea' && (
                      <Textarea value={responses[q.id] || ''} onChange={e => setResponses(r => ({ ...r, [q.id]: e.target.value }))} />
                    )}
                    {q.type === 'number' && (
                      <Input type="number" value={responses[q.id] || ''} onChange={e => setResponses(r => ({ ...r, [q.id]: e.target.value }))} className="h-10 max-w-32" />
                    )}
                    {q.type === 'boolean' && (
                      <div className="flex items-center gap-2">
                        <Switch checked={responses[q.id] === true} onCheckedChange={v => setResponses(r => ({ ...r, [q.id]: v }))} />
                        <span className="text-sm">{responses[q.id] ? 'Yes / نعم' : 'No / لا'}</span>
                      </div>
                    )}
                    {q.type === 'select' && q.options && (
                      <Select value={responses[q.id] || ''} onValueChange={v => setResponses(r => ({ ...r, [q.id]: v }))}>
                        <SelectTrigger className="h-10"><SelectValue placeholder="Select..." /></SelectTrigger>
                        <SelectContent>
                          {q.options.map(opt => (
                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {q.type === 'multiselect' && q.options && (
                      <div className="flex flex-wrap gap-2">
                        {q.options.map(opt => {
                          const selected = (responses[q.id] || []).includes(opt);
                          return (
                            <button key={opt} type="button"
                              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${selected ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted border-border hover:bg-primary/10'}`}
                              onClick={() => {
                                const current = responses[q.id] || [];
                                const next = selected ? current.filter((v: string) => v !== opt) : [...current, opt];
                                setResponses(r => ({ ...r, [q.id]: next }));
                              }}>
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}

                <div className="text-sm text-muted-foreground">Student: {currentUser?.fullName}</div>

                <Button onClick={handleSave} className="w-full h-11 font-semibold bg-violet-600 hover:bg-violet-700">
                  <Save className="w-4 h-4 mr-2" /> {selectedPatient.researchCompleted ? 'Update' : 'Save'} Research Data
                </Button>

                {selectedPatient.researchCompleted && selectedPatient.researchBy && (
                  <div className="border-t pt-3 text-xs text-muted-foreground">
                    Completed by {selectedPatient.researchBy} | {selectedPatient.researchAt}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="glass-card">
              <CardContent className="p-12 text-center text-muted-foreground">
                <ScrollText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Select a patient to fill out the research questionnaire</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default Research;
