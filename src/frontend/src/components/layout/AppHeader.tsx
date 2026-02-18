import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import LoginButton from '../auth/LoginButton';
import { Users, Home, PlusCircle, Shield, Mail } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useGetInbox } from '../../hooks/useQueries';

export default function AppHeader() {
  const { identity } = useInternetIdentity();
  const { data: inbox } = useGetInbox();
  const isAuthenticated = !!identity;

  const unreadCount = inbox?.filter(mail => !mail.isRead).length || 0;

  const navigate = (path: string) => {
    window.location.hash = path;
  };

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <button onClick={() => navigate('/')} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <img 
                src="/assets/generated/beyblade-x-teams-logo.dim_512x512.png" 
                alt="Bey Hub X" 
                className="h-10 w-10"
              />
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-chart-1 bg-clip-text text-transparent">
                Bey Hub X
              </span>
            </button>
            
            <nav className="hidden md:flex items-center gap-6">
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <Home className="h-4 w-4" />
                Home
              </button>
              <button
                onClick={() => navigate('/teams')}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <Users className="h-4 w-4" />
                Teams
              </button>
              {isAuthenticated && (
                <>
                  <button
                    onClick={() => navigate('/create-team')}
                    className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <PlusCircle className="h-4 w-4" />
                    Create Team
                  </button>
                  <button
                    onClick={() => navigate('/leader-dashboard')}
                    className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Shield className="h-4 w-4" />
                    My Teams
                  </button>
                  <button
                    onClick={() => navigate('/inbox')}
                    className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors relative"
                  >
                    <Mail className="h-4 w-4" />
                    Inbox
                    {unreadCount > 0 && (
                      <Badge variant="destructive" className="h-5 min-w-5 px-1 text-xs absolute -top-2 -right-2">
                        {unreadCount}
                      </Badge>
                    )}
                  </button>
                </>
              )}
            </nav>
          </div>

          <LoginButton />
        </div>
      </div>
    </header>
  );
}
