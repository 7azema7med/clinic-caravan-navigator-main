import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeProvider';
import { Activity, Bell, UserCog, Shield, LogOut, ArrowLeft, Timer, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface HeaderProps {
  variant?: 'dashboard' | 'page';
  title?: string;
  elapsed?: string;
  remainingText?: string;
  isSessionEnded?: boolean;
  onNotificationsClick?: () => void;
  pendingRequestsCount?: number;
}

const Header: React.FC<HeaderProps> = ({ 
  variant = 'page', 
  title, 
  elapsed,
  remainingText,
  isSessionEnded = false,
  onNotificationsClick, 
  pendingRequestsCount = 0 
}) => {
  const { currentUser, logout } = useAuth();
  const { settings } = useData();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAdmin = currentUser?.role === 'admin';

  // Desktop Toolbar
  const DesktopToolbar = () => (
    <div className="hidden md:flex items-center gap-2 flex-shrink-0">
      {currentUser && remainingText && (
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono shrink-0 ${isSessionEnded ? 'bg-red-500/20 text-red-300' : 'bg-white/10 text-[hsl(var(--header-muted))]'}`}>
          <Timer className="w-3.5 h-3.5 shrink-0" />
          {variant === 'dashboard' && elapsed ? (
            <>
              <span>{elapsed}</span>
              <span className="opacity-40">|</span>
              <span className={isSessionEnded ? 'text-red-300 font-semibold' : ''}>{remainingText}</span>
            </>
          ) : (
            <span className={isSessionEnded ? 'text-red-300 font-semibold' : ''}>{remainingText}</span>
          )}
        </div>
      )}

      {variant === 'dashboard' && (
        <Button variant="ghost" size="icon" className="relative shrink-0 text-[hsl(var(--header-fg))] hover:bg-white/10 min-w-[44px] min-h-[44px] p-2 transition-transform active:scale-95" onClick={onNotificationsClick}>
          <Bell className="w-5 h-5 shrink-0" />
          {pendingRequestsCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white font-bold animate-pulse">
              {pendingRequestsCount}
            </span>
          )}
        </Button>
      )}

      <ThemeToggle variant="header" />

      {variant === 'dashboard' ? (
        <>
          <Button variant="ghost" size="icon" className="shrink-0 text-[hsl(var(--header-fg))] hover:bg-white/10 min-w-[44px] min-h-[44px] p-2 transition-transform active:scale-95" onClick={() => navigate('/profile')}>
            <UserCog className="w-5 h-5 shrink-0" />
          </Button>

          {isAdmin && (
            <Button variant="ghost" size="sm" onClick={() => navigate('/admin')} className="shrink-0 text-[hsl(var(--header-fg))] hover:bg-white/10 text-xs min-h-[44px] px-3 active:scale-95 transition-transform">
              <Shield className="w-4 h-4 mr-1 shrink-0" /> Admin
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => { logout(); navigate('/'); }} className="shrink-0 text-[hsl(var(--header-fg))] hover:bg-white/10 text-xs min-h-[44px] px-3 active:scale-95 transition-transform">
            <LogOut className="w-4 h-4 mr-1 shrink-0" /> Logout
          </Button>
        </>
      ) : (
        <span className="hidden sm:block text-xs text-[hsl(var(--header-muted))] max-w-[120px] truncate shrink-0 ml-2">
          {currentUser?.fullName}
        </span>
      )}
    </div>
  );

  return (
    <>
      <header className="app-header px-4 sm:px-6 py-3 shadow-lg z-40 relative">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-2">
          
          {/* Left Side: Logo/Back & Titles */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {variant === 'page' ? (
              <>
                <Button
                  variant="ghost" size="icon"
                  onClick={() => navigate('/dashboard')}
                  className="text-[hsl(var(--header-fg))] hover:bg-white/10 flex-shrink-0 min-w-[44px] min-h-[44px] p-2 active:scale-95 transition-transform"
                  aria-label="Back to Dashboard"
                >
                  <ArrowLeft className="w-6 h-6 shrink-0" />
                </Button>

                {settings.logoUrl ? (
                  <img
                    src={settings.logoUrl}
                    alt="Logo"
                    className="w-8 h-8 object-contain rounded flex-shrink-0"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <Activity className="w-6 h-6 app-header-accent flex-shrink-0" />
                )}

                <h1 className="text-base sm:text-lg font-bold font-heading text-[hsl(var(--header-fg))] truncate pr-2">
                  {title}
                </h1>
              </>
            ) : (
              <>
                <div className="hidden sm:block">
                  <Activity className="w-7 h-7 app-header-accent shrink-0" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-lg sm:text-xl font-bold font-heading text-[hsl(var(--header-fg))] truncate">Medical Caravan</h1>
                  <p className="text-xs text-[hsl(var(--header-muted))] truncate">Welcome, {currentUser?.fullName}</p>
                </div>
              </>
            )}
          </div>

          <DesktopToolbar />

          {/* Mobile Hamburger Button */}
          <div className="md:hidden flex items-center shrink-0 gap-1">
            {variant === 'dashboard' && pendingRequestsCount > 0 && (
               <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-1"></div>
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-[hsl(var(--header-fg))] hover:bg-white/10 min-w-[44px] min-h-[44px] p-2 active:scale-95 transition-transform" 
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open Mobile Menu"
            >
              <Menu className="w-6 h-6 shrink-0" />
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-md md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed top-0 right-0 h-[100dvh] w-[85%] max-w-sm bg-card border-l shadow-2xl z-[101] md:hidden flex flex-col"
            >
              <div className="p-4 border-b flex items-center justify-between bg-muted/30">
                <span className="font-bold font-heading text-lg text-foreground truncate">Menu</span>
                <Button variant="ghost" size="icon" className="min-w-[44px] min-h-[44px] active:scale-95 shrink-0 text-muted-foreground transition-transform" onClick={() => setMobileMenuOpen(false)}>
                  <X className="w-6 h-6 shrink-0" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-5">
                {currentUser && remainingText && (
                  <div className={`p-4 rounded-2xl flex flex-col gap-2 ${isSessionEnded ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20' : 'bg-primary/5 border border-primary/10'}`}>
                    <div className="flex items-center gap-2 font-semibold">
                      <Timer className="w-4 h-4 shrink-0" /> Rotation Timer
                    </div>
                    {variant === 'dashboard' && elapsed && (
                      <div className="text-sm font-mono opacity-80">
                        Elapsed: {elapsed}
                      </div>
                    )}
                    <div className="text-sm font-mono font-medium">
                      Remaining: {remainingText}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border/50">
                  <span className="text-sm font-semibold text-muted-foreground">App Theme</span>
                  <ThemeToggle />
                </div>

                <div className="h-px bg-border/50 my-2" />

                <div className="space-y-2">
                  {variant === 'dashboard' && (
                    <>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start h-12 text-base rounded-xl active:scale-95 transition-transform"
                        onClick={() => { onNotificationsClick?.(); setMobileMenuOpen(false); }}
                      >
                        <div className="relative">
                          <Bell className="w-5 h-5 mr-3 shrink-0" />
                          {pendingRequestsCount > 0 && (
                            <span className="absolute -top-1 -right-2 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                          )}
                        </div>
                        <span className="flex-1 text-left">Notifications</span>
                        {pendingRequestsCount > 0 && (
                          <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                            {pendingRequestsCount} New
                          </span>
                        )}
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start h-12 text-base rounded-xl active:scale-95 transition-transform"
                        onClick={() => { navigate('/profile'); setMobileMenuOpen(false); }}
                      >
                        <UserCog className="w-5 h-5 mr-3 shrink-0" /> Profile Settings
                      </Button>
                      
                      {isAdmin && (
                        <Button 
                          variant="ghost" 
                          className="w-full justify-start h-12 text-base rounded-xl active:scale-95 transition-transform text-blue-600 dark:text-blue-400"
                          onClick={() => { navigate('/admin'); setMobileMenuOpen(false); }}
                        >
                          <Shield className="w-5 h-5 mr-3 shrink-0" /> Admin Panel
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="p-4 border-t bg-muted/10">
                <Button 
                  variant="destructive" 
                  className="w-full h-12 text-base shadow-sm active:scale-95 transition-transform rounded-xl"
                  onClick={() => { logout(); navigate('/'); }}
                >
                  <LogOut className="w-5 h-5 mr-2 shrink-0" /> Logout
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;
