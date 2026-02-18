import { useEffect, useState } from 'react';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useActor } from './hooks/useActor';
import { useGetCallerUserProfile } from './hooks/useCurrentUser';
import AppHeader from './components/layout/AppHeader';
import ProfileSetupModal from './components/auth/ProfileSetupModal';
import HomePage from './pages/HomePage';
import CreateTeamPage from './pages/CreateTeamPage';
import TeamListPage from './pages/TeamListPage';
import TeamDetailPage from './pages/TeamDetailPage';
import LeaderDashboardPage from './pages/LeaderDashboardPage';
import InboxPage from './pages/InboxPage';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from 'next-themes';

type Route = 'home' | 'create-team' | 'teams' | 'team-detail' | 'leader-dashboard' | 'inbox';

function App() {
  const { identity } = useInternetIdentity();
  const { actor } = useActor();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  
  const [currentRoute, setCurrentRoute] = useState<Route>('home');
  const [teamId, setTeamId] = useState<string | null>(null);

  const isAuthenticated = !!identity;
  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  // Simple hash-based routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1) || '/';
      const [path, query] = hash.split('?');
      
      if (path === '/' || path === '') {
        setCurrentRoute('home');
      } else if (path === '/create-team') {
        setCurrentRoute('create-team');
      } else if (path === '/teams') {
        setCurrentRoute('teams');
      } else if (path.startsWith('/team/')) {
        const id = path.split('/')[2];
        setTeamId(id);
        setCurrentRoute('team-detail');
      } else if (path === '/leader-dashboard') {
        setCurrentRoute('leader-dashboard');
      } else if (path === '/inbox') {
        setCurrentRoute('inbox');
      } else {
        setCurrentRoute('home');
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const renderPage = () => {
    switch (currentRoute) {
      case 'home':
        return <HomePage />;
      case 'create-team':
        return <CreateTeamPage />;
      case 'teams':
        return <TeamListPage />;
      case 'team-detail':
        return teamId ? <TeamDetailPage teamId={teamId} /> : <HomePage />;
      case 'leader-dashboard':
        return <LeaderDashboardPage />;
      case 'inbox':
        return <InboxPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="container mx-auto px-4 py-8">
          {renderPage()}
        </main>
        {showProfileSetup && <ProfileSetupModal />}
        <Toaster />
      </div>
    </ThemeProvider>
  );
}

export default App;
