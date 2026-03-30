import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { StudentAssignment, ASSIGNMENT_LABELS, User } from '@/lib/types';
import { ClipboardList, HeartPulse, FileText, ScrollText, LogOut, Timer, Shield, Users, Activity, Bell, ArrowRightLeft, UserCog, AlertTriangle, ArrowRight, Moon, Sun, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/ThemeProvider';

const SECTION_CONFIG: Record<StudentAssignment, { icon: React.ElementType; color: string; route: string }> = {
  registration: { icon: ClipboardList, color: 'from-blue-600 to-cyan-500', route: '/registration' },
  vitals: { icon: HeartPulse, color: 'from-rose-500 to-pink-500', route: '/vitals' },
  clinic: { icon: FileText, color: 'from-emerald-500 to-green-500', route: '/clinic-report' },
  research: { icon: ScrollText, color: 'from-violet-500 to-purple-500', route: '/research' },
};

const Dashboard: React.FC = () => {
  const { currentUser, logout, setAssignment, users, updateUser } = useAuth();
  const { clinics, getClinicStats, settings, addSwitchRequest, getPendingSwitchRequests, updateSwitchRequest, switchRequests } = useData();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedClinic, setSelectedClinic] = useState('');
  const [elapsed, setElapsed] = useState('00:00:00');
  const [remainingMs, setRemainingMs] = useState<number>(0);
  const [isSessionEnded, setIsSessionEnded] = useState(false);
  const [dismissedAlert, setDismissedAlert] = useState(false);
  const [switchDialog, setSwitchDialog] = useState(false);
  const [notifDialog, setNotifDialog] = useState(false);

  useEffect(() => {
    if (!currentUser) { navigate('/'); return; }
    const start = currentUser.rotationStartTime
      ? new Date(currentUser.rotationStartTime).getTime()
      : (currentUser.loginTime ? new Date(currentUser.loginTime).getTime() : Date.now());
    const rotationMs = settings.rotationTimeMinutes * 60 * 1000;
    const interval = setInterval(() => {
      const diff = Date.now() - start;
      const h = String(Math.floor(diff / 3600000)).padStart(2, '0');
      const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
      const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
      setElapsed(`${h}:${m}:${s}`);
      const remaining = rotationMs - diff;
      setRemainingMs(remaining);
      setIsSessionEnded(remaining <= 0);
    }, 1000);
    return () => clearInterval(interval);
  }, [currentUser, navigate, settings.rotationTimeMinutes]);

  if (!currentUser) return null;

  const stats = getClinicStats();
  const totalPatients = stats.reduce((sum, s) => sum + s.total, 0);
  const totalWaiting = stats.reduce((sum, s) => sum + s.waiting, 0);
  const totalExamined = stats.reduce((sum, s) => sum + s.examined, 0);
  const totalAbsent = stats.reduce((sum, s) => sum + s.absent, 0);
  const pendingRequests = getPendingSwitchRequests(currentUser.id);
  const allActiveStudents = users.filter(u => u.role === 'student' && u.isActive && u.id !== currentUser.id);
  const isAdmin = currentUser.role === 'admin';

  const handleGoTo = (assignment: StudentAssignment, clinicId?: string) => {
    if (assignment === 'clinic' && !clinicId) return;
    setAssignment(assignment, clinicId);
    navigate(SECTION_CONFIG[assignment].route);
  };

  const handleSendSwitch = (targetUser: User) => {
    addSwitchRequest({
      requesterId: currentUser.id,
      requesterName: currentUser.fullName,
      requesterAssignment: currentUser.assignment || 'registration',
      requesterClinic: currentUser.assignedClinic,
      targetUserId: targetUser.id,
      targetUserName: targetUser.fullName,
      targetAssignment: targetUser.assignment || 'registration',
      targetClinic: targetUser.assignedClinic,
    });
    toast({ title: 'Request Sent', description: `Switch request sent to ${targetUser.fullName}` });
    setSwitchDialog(false);
  };

  const handleApproveSwitch = (reqId: string) => {
    const req = switchRequests.find(r => r.id === reqId);
    if (!req) return;
    const now = new Date().toISOString();
    updateUser(req.requesterId, {
      assignment: req.targetAssignment,
      assignedClinic: req.targetClinic,
      rotationStartTime: now,
    });
    updateUser(req.targetUserId, {
      assignment: req.requesterAssignment,
      assignedClinic: req.requesterClinic,
      rotationStartTime: now,
    });
    updateSwitchRequest(reqId, 'approved');
    toast({ title: 'Switch Approved', description: `You and ${req.requesterName} swapped positions` });
    setNotifDialog(false);
  };

  const handleRejectSwitch = (reqId: string) => {
    updateSwitchRequest(reqId, 'rejected');
    toast({ title: 'Rejected', description: 'Switch request rejected' });
  };

  const formatRemaining = () => {
    if (remainingMs <= 0) return 'Session Ended';
    const m = Math.floor(remainingMs / 60000);
    const s = Math.floor((remainingMs % 60000) / 1000);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')} remaining`;
  };

  const activeClinics = clinics.filter(c => c.isActive);

  const currentAssignment = currentUser.assignment;
  const currentClinicName = currentUser.assignedClinic
    ? clinics.find(c => c.id === currentUser.assignedClinic)?.nameAr || ''
    : '';

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* ─ Rotation Banner ─ */}
      {isSessionEnded && !dismissedAlert && (
        <div className="rotation-banner text-white px-4 py-2.5">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-3">
            <AlertTriangle className="w-5 h-5 animate-pulse" />
            <span className="font-semibold text-sm">Rotation time ended! Please switch positions.</span>
            <Button size="sm" variant="secondary" className="ml-2 h-7 text-xs" onClick={() => setSwitchDialog(true)}>
              <ArrowRightLeft className="w-3 h-3 mr-1" /> Request Switch
            </Button>
            <Button size="sm" variant="ghost" className="ml-1 h-7 text-xs text-white/60 hover:text-white hover:bg-white/10" onClick={() => setDismissedAlert(true)}>
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
      )}

      {/* ─ Header ─ */}
      <header className="app-header px-6 py-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="w-7 h-7 app-header-accent" />
            <div>
              <h1 className="text-xl font-bold font-heading text-[hsl(var(--header-fg))]">Medical Caravan System</h1>
              <p className="text-xs text-[hsl(var(--header-muted))]">Welcome, {currentUser.fullName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono ${isSessionEnded ? 'bg-red-500/20 text-red-300' : 'bg-white/10 text-[hsl(var(--header-muted))]'}`}>
              <Timer className="w-3.5 h-3.5" />
              <span>{elapsed}</span>
              <span className="opacity-40">|</span>
              <span className={isSessionEnded ? 'text-red-300 font-semibold' : ''}>{formatRemaining()}</span>
            </div>

            <Button variant="ghost" size="icon" className="relative text-[hsl(var(--header-fg))] hover:bg-white/10" onClick={() => setNotifDialog(true)}>
              <Bell className="w-5 h-5" />
              {pendingRequests.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white font-bold animate-pulse">
                  {pendingRequests.length}
                </span>
              )}
            </Button>

            <ThemeToggle variant="header" />

            <Button variant="ghost" size="icon" className="text-[hsl(var(--header-fg))] hover:bg-white/10" onClick={() => navigate('/profile')}>
              <UserCog className="w-5 h-5" />
            </Button>

            {isAdmin && (
              <Button variant="ghost" size="sm" onClick={() => navigate('/admin')} className="text-[hsl(var(--header-fg))] hover:bg-white/10 text-xs">
                <Shield className="w-4 h-4 mr-1" /> Admin
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => { logout(); navigate('/'); }} className="text-[hsl(var(--header-fg))] hover:bg-white/10 text-xs">
              <LogOut className="w-4 h-4 mr-1" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 animate-fade-in">
        {/* ─ Stats ─ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 stagger-children">
          <Card className="stat-card">
            <Users className="w-6 h-6 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold font-heading text-foreground">{totalPatients}</p>
            <p className="text-xs text-muted-foreground">Total Patients</p>
          </Card>
          <Card className="stat-card">
            <Activity className="w-6 h-6 mx-auto mb-1 text-yellow-500" />
            <p className="text-2xl font-bold font-heading text-yellow-600 dark:text-yellow-400">{totalWaiting}</p>
            <p className="text-xs text-muted-foreground">Waiting</p>
          </Card>
          <Card className="stat-card">
            <HeartPulse className="w-6 h-6 mx-auto mb-1 text-green-500" />
            <p className="text-2xl font-bold font-heading text-green-600 dark:text-green-400">{totalExamined}</p>
            <p className="text-xs text-muted-foreground">Examined</p>
          </Card>
          <Card className="stat-card">
            <FileText className="w-6 h-6 mx-auto mb-1 text-accent" />
            <p className="text-2xl font-bold font-heading text-foreground">{activeClinics.length}</p>
            <p className="text-xs text-muted-foreground">Active Clinics</p>
          </Card>
        </div>

        {/* ─ Your Station (non-admin) ─ */}
        {currentAssignment && !isAdmin && (
          <div className="mb-8">
            <h2 className="text-lg font-bold font-heading mb-4 text-foreground">Your Current Station</h2>
            <Card className="glass-card glow-border overflow-hidden">
              <div className={`h-1.5 bg-gradient-to-r ${SECTION_CONFIG[currentAssignment]?.color || 'from-primary to-accent'}`} />
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {(() => {
                      const Icon = SECTION_CONFIG[currentAssignment]?.icon || Activity;
                      const color = SECTION_CONFIG[currentAssignment]?.color || 'from-primary to-accent';
                      return (
                        <div className={`p-4 rounded-xl bg-gradient-to-br ${color} text-white shadow-lg`}>
                          <Icon className="w-8 h-8" />
                        </div>
                      );
                    })()}
                    <div>
                      <h3 className="text-xl font-bold font-heading text-foreground">
                        {ASSIGNMENT_LABELS[currentAssignment] || currentAssignment}
                      </h3>
                      {currentClinicName && (
                        <p className="text-sm text-muted-foreground mt-0.5" dir="rtl">{currentClinicName}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant={isSessionEnded ? 'destructive' : 'secondary'} className="text-xs">
                          {isSessionEnded ? '⏰ Rotation Ended' : `⏱ ${formatRemaining()}`}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setSwitchDialog(true)}>
                      <ArrowRightLeft className="w-4 h-4 mr-1" /> Switch
                    </Button>
                    <Button size="lg" onClick={() => navigate(SECTION_CONFIG[currentAssignment]?.route || '/dashboard')} className="shadow-lg">
                      Go to Station <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ─ All Stations (Admin Only) ─ */}
        {isAdmin && (
          <>
            <h2 className="text-lg font-bold font-heading mb-4 text-foreground">All Stations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 stagger-children">
              {(Object.keys(SECTION_CONFIG) as StudentAssignment[]).map(key => {
                const cfg = SECTION_CONFIG[key];
                const Icon = cfg.icon;
                return (
                  <Card key={key} className="glass-card card-hover group overflow-hidden">
                    <div className={`h-1 bg-gradient-to-r ${cfg.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl bg-gradient-to-br ${cfg.color} text-white shadow-lg group-hover:scale-110 transition-transform`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold font-heading text-foreground">{ASSIGNMENT_LABELS[key]}</h3>
                          {key === 'clinic' && (
                            <Select value={selectedClinic} onValueChange={setSelectedClinic}>
                              <SelectTrigger className="mt-2 h-9">
                                <SelectValue placeholder="Select a clinic" />
                              </SelectTrigger>
                              <SelectContent>
                                {activeClinics.map(c => (
                                  <SelectItem key={c.id} value={c.id}>{c.nameAr} - {c.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                          <Button size="sm" className="mt-3" onClick={() => handleGoTo(key, key === 'clinic' ? selectedClinic : undefined)} disabled={key === 'clinic' && !selectedClinic}>
                            Go to {ASSIGNMENT_LABELS[key]}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}

        {/* ─ Active Users ─ */}
        {allActiveStudents.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold font-heading mb-4 text-foreground flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" /> Active Students ({allActiveStudents.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 stagger-children">
              {allActiveStudents.map(u => {
                const userStart = u.rotationStartTime ? new Date(u.rotationStartTime).getTime() : (u.loginTime ? new Date(u.loginTime).getTime() : Date.now());
                const userRemainingMs = (settings.rotationTimeMinutes * 60 * 1000) - (Date.now() - userStart);
                const userEnded = userRemainingMs <= 0;
                return (
                  <Card key={u.id} className="glass-card">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm text-foreground">{u.fullName}</p>
                          <p className="text-xs text-muted-foreground">
                            {ASSIGNMENT_LABELS[u.assignment || ''] || 'Unassigned'}
                            {u.assignedClinic && ` — ${clinics.find(c => c.id === u.assignedClinic)?.nameAr || ''}`}
                          </p>
                        </div>
                        <Badge variant={userEnded ? 'destructive' : 'secondary'} className="text-[10px]">
                          {userEnded ? '⏰ Ended' : `${Math.floor(userRemainingMs / 60000)}m left`}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* ─ Clinic Overview ─ */}
        <h2 className="text-lg font-bold font-heading mb-4 text-foreground">Clinic Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 stagger-children">
          {stats.map(s => (
            <Card key={s.clinicId} className="glass-card">
              <CardContent className="p-4">
                <h4 className="font-semibold text-sm text-foreground mb-2">{s.clinicName}</h4>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs border-yellow-400 text-yellow-600 dark:text-yellow-400">Waiting: {s.waiting}</Badge>
                  <Badge variant="outline" className="text-xs border-green-400 text-green-600 dark:text-green-400">Done: {s.examined}</Badge>
                  <Badge variant="outline" className="text-xs border-red-400 text-red-500 dark:text-red-400">Absent: {s.absent}</Badge>
                  <Badge variant="secondary" className="text-xs">Total: {s.total}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      <div className="footer-credit">
        This system was programmed and developed by Hazem Ahmed © 2026
      </div>

      {/* ─ Switch Request Dialog ─ */}
      <Dialog open={switchDialog} onOpenChange={setSwitchDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5" /> Request Position Switch
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {allActiveStudents.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No other active students</p>}
            {allActiveStudents.map(u => {
              const userStart = u.rotationStartTime ? new Date(u.rotationStartTime).getTime() : (u.loginTime ? new Date(u.loginTime).getTime() : Date.now());
              const userRemainingMs = (settings.rotationTimeMinutes * 60 * 1000) - (Date.now() - userStart);
              const userEnded = userRemainingMs <= 0;
              return (
                <div key={u.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{u.fullName}</p>
                    <p className="text-xs text-muted-foreground">
                      {ASSIGNMENT_LABELS[u.assignment || ''] || 'Unassigned'}
                      {u.assignedClinic && ` — ${clinics.find(c => c.id === u.assignedClinic)?.nameAr || ''}`}
                    </p>
                    <Badge variant={userEnded ? 'destructive' : 'outline'} className="text-[10px] mt-1">
                      {userEnded ? '⏰ Ended' : `${Math.floor(Math.max(0, userRemainingMs) / 60000)}m remaining`}
                    </Badge>
                  </div>
                  <Button size="sm" onClick={() => handleSendSwitch(u)}>
                    <ArrowRightLeft className="w-3 h-3 mr-1" /> Switch
                  </Button>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* ─ Notifications Dialog ─ */}
      <Dialog open={notifDialog} onOpenChange={setNotifDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" /> Switch Requests
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {pendingRequests.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No pending requests</p>}
            {pendingRequests.map(r => (
              <div key={r.id} className="p-3 bg-muted/50 rounded-lg space-y-2">
                <p className="text-sm"><strong>{r.requesterName}</strong> wants to switch positions with you.</p>
                <p className="text-xs text-muted-foreground">
                  They are at: <strong>{ASSIGNMENT_LABELS[r.requesterAssignment]}</strong>
                  {r.requesterClinic && ` — ${clinics.find(c => c.id === r.requesterClinic)?.nameAr || ''}`}
                </p>
                <div className="flex gap-2">
                  <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleApproveSwitch(r.id)}>Approve</Button>
                  <Button size="sm" variant="destructive" onClick={() => handleRejectSwitch(r.id)}>Reject</Button>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
