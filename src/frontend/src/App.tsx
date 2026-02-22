import { useState, useEffect, useMemo } from 'react';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useCurrentUser';
import { Toaster } from '@/components/ui/sonner';
import AppHeader from './components/layout/AppHeader';
import HomePage from './pages/HomePage';
import CreateTeamPage from './pages/CreateTeamPage';
import TeamListPage from './pages/TeamListPage';
import TeamDetailPage from './pages/TeamDetailPage';
import ProfilePage from './pages/ProfilePage';
import InboxPage from './pages/InboxPage';
import LeaderDashboardPage from './pages/LeaderDashboardPage';
import ProfileSetupModal from './components/auth/ProfileSetupModal';

function getTeamIdFromHash(): string | null {
  const hash = window.location.hash.slice(1);
  if (hash.startsWith('/team/')) {
    const teamId = hash.substring(6).split('?')[0];
    return teamId || null;
  }
  return null;
}

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<string>('/');
  const [teamId, setTeamId] = useState<string | null>(null);
  const { identity, isInitializing } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();

  const isAuthenticated = useMemo(() => !!identity, [identity]);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1) || '/';
      const teamIdFromUrl = getTeamIdFromHash();
      
      if (hash.startsWith('/team/')) {
        if (teamIdFromUrl && teamIdFromUrl !== 'undefined' && teamIdFromUrl !== 'null') {
          setCurrentRoute('/team');
          setTeamId(teamIdFromUrl);
        } else {
          console.warn('Invalid team ID in URL, redirecting to teams list');
          window.location.hash = '/teams';
        }
      } else {
        setCurrentRoute(hash);
        setTeamId(null);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  let pageContent;
  switch (currentRoute) {
    case '/':
      pageContent = <HomePage />;
      break;
    case '/create-team':
      pageContent = <CreateTeamPage />;
      break;
    case '/teams':
      pageContent = <TeamListPage />;
      break;
    case '/team':
      pageContent = teamId ? <TeamDetailPage teamId={teamId} /> : <TeamListPage />;
      break;
    case '/profile':
      pageContent = <ProfilePage />;
      break;
    case '/inbox':
      pageContent = <InboxPage />;
      break;
    case '/leader-dashboard':
      pageContent = <LeaderDashboardPage />;
      break;
    default:
      pageContent = <HomePage />;
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto px-4 py-8">
        {pageContent}
      </main>
      <footer className="border-t mt-16 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()} Beyblade X Teams. Built with ❤️ using{' '}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </footer>
      {showProfileSetup && <ProfileSetupModal />}
      <Toaster />
    </div>
  );
}
