import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Activity, Timer, AlertTriangle } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeProvider';
import Header from '@/components/Header';

const PageLayout: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
  const { currentUser } = useAuth();
  const { settings } = useData();
  const navigate = useNavigate();
  const [remainingMs, setRemainingMs] = useState<number>(0);
  const [isSessionEnded, setIsSessionEnded] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!currentUser?.rotationStartTime) return;
    const start = new Date(currentUser.rotationStartTime).getTime();
    const rotationMs = settings.rotationTimeMinutes * 60 * 1000;
    const update = () => {
      const remaining = rotationMs - (Date.now() - start);
      setRemainingMs(remaining);
      setIsSessionEnded(remaining <= 0);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [currentUser?.rotationStartTime, settings.rotationTimeMinutes]);

  const formatRemaining = () => {
    if (remainingMs <= 0) return 'Ended';
    const m = Math.floor(remainingMs / 60000);
    const s = Math.floor((remainingMs % 60000) / 1000);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Rotation Alert Banner */}
      {isSessionEnded && !dismissed && (
        <div className="rotation-banner text-white px-4 py-2 text-center">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 flex-wrap">
            <AlertTriangle className="w-4 h-4 animate-pulse flex-shrink-0" />
            <span className="font-semibold text-sm">Rotation time ended! Go to Dashboard to switch.</span>
            <Button
              size="sm" variant="secondary"
              className="h-7 text-xs"
              onClick={() => navigate('/dashboard')}
            >
              Dashboard
            </Button>
            <Button
              size="sm" variant="ghost"
              className="h-7 text-xs text-white/70 hover:text-white"
              onClick={() => setDismissed(true)}
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}

      <Header
        variant="page"
        title={title}
        isSessionEnded={isSessionEnded}
        remainingText={formatRemaining()}
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-4 sm:py-6 animate-fade-in">
        {children}
      </main>

      <div className="footer-credit">
        This system was programmed and developed by Hazem Ahmed © 2026
      </div>
    </div>
  );
};

export default PageLayout;
