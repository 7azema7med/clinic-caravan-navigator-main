import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserCog, Save, Key, UserIcon, ArrowRightLeft, Target } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { StudentAssignment, ASSIGNMENT_LABELS } from '@/lib/types';
import PageLayout from '@/components/PageLayout';

const ProfileSettings: React.FC = () => {
  const { currentUser, updateUser, setAssignment } = useAuth();
  const { clinics } = useData();
  const { toast } = useToast();

  const [personalForm, setPersonalForm] = useState({
    fullName: currentUser?.fullName || '',
    username: currentUser?.username || '',
    email: currentUser?.email || '',
    studentCode: currentUser?.studentCode || '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [assigmnentForm, setAssignmentForm] = useState({
    assignment: currentUser?.assignment || 'registration' as StudentAssignment,
    clinicId: currentUser?.assignedClinic || '',
  });

  if (!currentUser) return null;

  const activeClinics = clinics.filter(c => c.isActive);

  const handlePersonalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser(currentUser.id, personalForm);
    toast({ title: 'Success', description: 'Personal information updated successfully' });
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.currentPassword !== currentUser.password) {
      toast({ title: 'Error', description: 'Incorrect current password', variant: 'destructive' });
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({ title: 'Error', description: 'New passwords do not match', variant: 'destructive' });
      return;
    }
    if (passwordForm.newPassword.length < 4) {
      toast({ title: 'Error', description: 'Password must be at least 4 characters', variant: 'destructive' });
      return;
    }
    updateUser(currentUser.id, { password: passwordForm.newPassword });
    toast({ title: 'Success', description: 'Password updated successfully' });
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const handleAssignmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (assigmnentForm.assignment === 'clinic' && !assigmnentForm.clinicId) {
      toast({ title: 'Error', description: 'Please select a clinic', variant: 'destructive' });
      return;
    }
    setAssignment(assigmnentForm.assignment, assigmnentForm.assignment === 'clinic' ? assigmnentForm.clinicId : undefined);
    toast({ title: 'Success', description: `Position updated to ${ASSIGNMENT_LABELS[assigmnentForm.assignment]}` });
  };

  return (
    <PageLayout title="Profile Settings">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8 p-6 glass-card rounded-2xl">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20">
            <UserCog className="w-10 h-10 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold font-heading text-foreground">{currentUser.fullName}</h2>
            <p className="text-muted-foreground">{currentUser.role === 'admin' ? 'Administrator' : 'Student Account'}</p>
            <p className="text-sm font-medium mt-1 text-primary">
              Position: {ASSIGNMENT_LABELS[currentUser.assignment || ''] || 'Unassigned'}
              {currentUser.assignedClinic && ` — ${clinics.find(c => c.id === currentUser.assignedClinic)?.nameAr || ''}`}
            </p>
          </div>
        </div>

        <Tabs defaultValue="personal" className="space-y-6">
          <TabsList className="grid grid-cols-1 md:grid-cols-3 max-w-2xl h-auto">
            <TabsTrigger value="personal" className="py-2.5"><UserIcon className="w-4 h-4 mr-2" /> Personal Info</TabsTrigger>
            {currentUser.role !== 'admin' && (
              <TabsTrigger value="assignment" className="py-2.5"><Target className="w-4 h-4 mr-2" /> Change Position</TabsTrigger>
            )}
            <TabsTrigger value="security" className="py-2.5"><Key className="w-4 h-4 mr-2" /> Security</TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="animate-fade-in">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="font-heading">Personal Information</CardTitle>
                <CardDescription>Update your basic account details</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePersonalSubmit} className="space-y-4 max-w-2xl">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input id="fullName" value={personalForm.fullName} onChange={e => setPersonalForm(f => ({ ...f, fullName: e.target.value }))} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input id="username" value={personalForm.username} onChange={e => setPersonalForm(f => ({ ...f, username: e.target.value }))} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={personalForm.email} onChange={e => setPersonalForm(f => ({ ...f, email: e.target.value }))} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="studentCode">Student Code</Label>
                    <Input id="studentCode" value={personalForm.studentCode} onChange={e => setPersonalForm(f => ({ ...f, studentCode: e.target.value }))} />
                  </div>
                  <Button type="submit" className="mt-4"><Save className="w-4 h-4 mr-2" /> Save Changes</Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {currentUser.role !== 'admin' && (
            <TabsContent value="assignment" className="animate-fade-in">
              <Card className="glass-card border-l-4 border-l-primary">
                <CardHeader>
                  <CardTitle className="font-heading flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" /> Active Position
                  </CardTitle>
                  <CardDescription>Change the station you are currently working at.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAssignmentSubmit} className="space-y-4 max-w-md">
                    <div className="space-y-2">
                      <Label>Select Position</Label>
                      <Select value={assigmnentForm.assignment} onValueChange={(v: StudentAssignment) => setAssignmentForm(f => ({ ...f, assignment: v }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose position" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="registration">{ASSIGNMENT_LABELS.registration}</SelectItem>
                          <SelectItem value="vitals">{ASSIGNMENT_LABELS.vitals}</SelectItem>
                          <SelectItem value="clinic">{ASSIGNMENT_LABELS.clinic}</SelectItem>
                          <SelectItem value="research">{ASSIGNMENT_LABELS.research}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {assigmnentForm.assignment === 'clinic' && (
                      <div className="space-y-2 animate-fade-in">
                        <Label>Select Clinic</Label>
                        <Select value={assigmnentForm.clinicId} onValueChange={v => setAssignmentForm(f => ({ ...f, clinicId: v }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose clinic" />
                          </SelectTrigger>
                          <SelectContent>
                            {activeClinics.map(c => (
                              <SelectItem key={c.id} value={c.id}>{c.nameAr} - {c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <Button type="submit" className="mt-4" variant="secondary"><ArrowRightLeft className="w-4 h-4 mr-2" /> Update Position</Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          <TabsContent value="security" className="animate-fade-in">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="font-heading">Security</CardTitle>
                <CardDescription>Change your account password</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-sm">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input id="currentPassword" type="password" value={passwordForm.currentPassword} onChange={e => setPasswordForm(f => ({ ...f, currentPassword: e.target.value }))} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input id="newPassword" type="password" value={passwordForm.newPassword} onChange={e => setPasswordForm(f => ({ ...f, newPassword: e.target.value }))} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input id="confirmPassword" type="password" value={passwordForm.confirmPassword} onChange={e => setPasswordForm(f => ({ ...f, confirmPassword: e.target.value }))} required />
                  </div>
                  <Button type="submit" variant="default" className="mt-4"><Key className="w-4 h-4 mr-2" /> Change Password</Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
};

export default ProfileSettings;
