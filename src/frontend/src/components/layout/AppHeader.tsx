import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import LoginButton from '../auth/LoginButton';
import ThemeToggle from '../theme/ThemeToggle';
import { Users, Home, PlusCircle, Shield, Mail, Menu, X, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useGetInbox } from '../../hooks/useQueries';
import { useState } from 'react';

export default function AppHeader() {
  const { identity } = useInternetIdentity();
  const { data: inbox } = useGetInbox();
  const isAuthenticated = !!identity;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const unreadCount = inbox?.filter(mail => !mail.isRead).length || 0;

  const navigate = (path: string) => {
    window.location.hash = path;
    setMobileMenuOpen(false);
  };

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14 sm:h-16">
          <div className="flex items-center gap-4 sm:gap-8">
            <button onClick={() => navigate('/')} className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity">
              <img 
                src="/assets/generated/bey-hub-x-logo.dim_200x200.png" 
                alt="Bey Hub X logo" 
                className="h-8 w-8 sm:h-10 sm:w-10"
              />
              <span className="text-base sm:text-xl font-bold bg-gradient-to-r from-primary to-chart-1 bg-clip-text text-transparent">
                Bey Hub X
              </span>
            </button>
            
            <nav className="hidden md:flex items-center gap-4 lg:gap-6">
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors min-h-11 px-2"
              >
                <Home className="h-4 w-4" />
                Home
              </button>
              <button
                onClick={() => navigate('/teams')}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors min-h-11 px-2"
              >
                <Users className="h-4 w-4" />
                Teams
              </button>
              {isAuthenticated && (
                <>
                  <button
                    onClick={() => navigate('/create-team')}
                    className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors min-h-11 px-2"
                  >
                    <PlusCircle className="h-4 w-4" />
                    Create Team
                  </button>
                  <button
                    onClick={() => navigate('/leader-dashboard')}
                    className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors min-h-11 px-2"
                  >
                    <Shield className="h-4 w-4" />
                    My Teams
                  </button>
                  <button
                    onClick={() => navigate('/inbox')}
                    className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors relative min-h-11 px-2"
                  >
                    <Mail className="h-4 w-4" />
                    Inbox
                    {unreadCount > 0 && (
                      <Badge variant="destructive" className="h-5 min-w-5 px-1 text-xs absolute -top-1 -right-1">
                        {unreadCount}
                      </Badge>
                    )}
                  </button>
                  <button
                    onClick={() => navigate('/profile')}
                    className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors min-h-11 px-2"
                  >
                    <User className="h-4 w-4" />
                    Profile
                  </button>
                </>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <div className="hidden md:block">
              <LoginButton />
            </div>
            
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden min-h-11 min-w-11"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border py-4 space-y-1">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors min-h-11"
            >
              <Home className="h-5 w-5" />
              Home
            </button>
            <button
              onClick={() => navigate('/teams')}
              className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors min-h-11"
            >
              <Users className="h-5 w-5" />
              Teams
            </button>
            {isAuthenticated && (
              <>
                <button
                  onClick={() => navigate('/create-team')}
                  className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors min-h-11"
                >
                  <PlusCircle className="h-5 w-5" />
                  Create Team
                </button>
                <button
                  onClick={() => navigate('/leader-dashboard')}
                  className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors min-h-11"
                >
                  <Shield className="h-5 w-5" />
                  My Teams
                </button>
                <button
                  onClick={() => navigate('/inbox')}
                  className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors relative min-h-11"
                >
                  <Mail className="h-5 w-5" />
                  Inbox
                  {unreadCount > 0 && (
                    <Badge variant="destructive" className="h-5 min-w-5 px-1 text-xs ml-auto">
                      {unreadCount}
                    </Badge>
                  )}
                </button>
                <button
                  onClick={() => navigate('/profile')}
                  className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors min-h-11"
                >
                  <User className="h-5 w-5" />
                  Profile
                </button>
              </>
            )}
            <div className="pt-3 px-4">
              <LoginButton />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
