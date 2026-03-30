import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { StudentAssignment, ASSIGNMENT_LABELS } from '@/lib/types';
import { ClipboardList, HeartPulse, FileText, ScrollText, Activity, CheckCircle2, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const POSITION_CARDS = [
  { key: 'registration' as StudentAssignment, icon: ClipboardList, title: 'Patient Registration', titleAr: 'تسجيل المرضى', desc: 'Register and manage incoming patients', color: 'from-blue-600 to-cyan-500' },
  { key: 'vitals' as StudentAssignment, icon: HeartPulse, title: 'Vital Signs', titleAr: 'العلامات الحيوية', desc: 'Record blood pressure, sugar, and pulse', color: 'from-rose-500 to-pink-500' },
  { key: 'clinic' as StudentAssignment, icon: FileText, title: 'Patient Report Clinic', titleAr: 'عيادة تقارير المرضى', desc: 'Examine patients and write reports', color: 'from-emerald-500 to-green-500' },
  { key: 'research' as StudentAssignment, icon: ScrollText, title: 'Research Questionnaire', titleAr: 'استبيان البحث', desc: 'Collect research data from patients', color: 'from-violet-500 to-purple-500' },
];

const PositionSelect: React.FC = () => {
  const { currentUser, setAssignment } = useAuth();
  const { clinics } = useData();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selected, setSelected] = useState<StudentAssignment | null>(null);
  const [selectedClinic, setSelectedClinic] = useState('');

  if (!currentUser) { navigate('/'); return null; }

  const activeClinics = clinics.filter(c => c.isActive);

  const handleConfirm = () => {
    if (!selected) {
      toast({ title: 'Error', description: 'Please select a position', variant: 'destructive' });
      return;
    }
    if (selected === 'clinic' && !selectedClinic) {
      toast({ title: 'Error', description: 'Please select a clinic', variant: 'destructive' });
      return;
    }
    setAssignment(selected, selected === 'clinic' ? selectedClinic : undefined);
    toast({ title: 'Position Set', description: `You are now assigned to ${ASSIGNMENT_LABELS[selected]}` });
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="app-header px-6 py-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-center gap-3">
          <Activity className="w-7 h-7 app-header-accent" />
          <div className="text-center">
            <h1 className="text-xl font-bold font-heading text-[hsl(var(--header-fg))]">Select Your Position</h1>
            <p className="text-xs text-[hsl(var(--header-muted))]">Welcome, {currentUser.fullName} — Choose where you'll be working today</p>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8 stagger-children">
          {POSITION_CARDS.map(pos => (
            <Card
              key={pos.key}
              onClick={() => setSelected(pos.key)}
              className={`glass-card cursor-pointer transition-all duration-300 group relative overflow-hidden ${
                selected === pos.key
                  ? 'ring-2 ring-primary shadow-xl scale-[1.02]'
                  : 'hover:shadow-xl hover:scale-[1.01]'
              }`}
            >
              {/* Gradient accent bar */}
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${pos.color} ${selected === pos.key ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'} transition-opacity`} />

              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${pos.color} text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <pos.icon className="w-7 h-7" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold font-heading text-foreground text-lg">{pos.title}</h3>
                      {selected === pos.key && <CheckCircle2 className="w-5 h-5 text-primary animate-scale-in" />}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5" dir="rtl">{pos.titleAr}</p>
                    <p className="text-sm text-muted-foreground mt-2">{pos.desc}</p>
                  </div>
                </div>

                {/* Clinic selector */}
                {pos.key === 'clinic' && selected === 'clinic' && (
                  <div className="mt-4 animate-fade-in" onClick={e => e.stopPropagation()}>
                    <Select value={selectedClinic} onValueChange={setSelectedClinic}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Select a clinic..." />
                      </SelectTrigger>
                      <SelectContent>
                        {activeClinics.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.nameAr} - {c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button
            size="lg"
            className="h-12 px-8 text-base font-semibold shadow-lg"
            onClick={handleConfirm}
            disabled={!selected || (selected === 'clinic' && !selectedClinic)}
          >
            Confirm & Continue
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <p className="text-xs text-muted-foreground mt-3">You can change your position later from Profile Settings</p>
        </div>
      </main>

      <div className="footer-credit">
        This system was programmed and developed by Hazem Ahmed © 2026
      </div>
    </div>
  );
};

export default PositionSelect;
