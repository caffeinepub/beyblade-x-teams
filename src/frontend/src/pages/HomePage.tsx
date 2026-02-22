import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Users, PlusCircle, Trophy, Video } from 'lucide-react';
import { SiCaffeine } from 'react-icons/si';

export default function HomePage() {
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;

  const navigate = (path: string) => {
    window.location.hash = path;
  };

  return (
    <div className="space-y-12 sm:space-y-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-xl sm:rounded-2xl">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: 'url(/assets/generated/beyblade-x-arena-hero-bg.dim_1600x900.png)' }}
        />
        <div className="relative bg-gradient-to-br from-primary/20 via-chart-1/10 to-transparent backdrop-blur-sm">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-24 text-center">
            <div className="flex justify-center mb-4 sm:mb-6">
              <div className="p-3 sm:p-4 bg-primary/10 rounded-full">
                <Trophy className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 text-primary" />
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-foreground via-primary to-chart-1 bg-clip-text text-transparent">
              Bey Hub X
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
              Form your ultimate team of 1-3 bladers, share your team footage, and connect with the Beyblade X community!
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 justify-center px-4">
              <Button size="lg" onClick={() => navigate('/teams')} className="gap-2 text-base sm:text-lg px-6 sm:px-8 min-h-11 w-full sm:w-auto">
                <Users className="h-5 w-5" />
                Browse Teams
              </Button>
              {isAuthenticated && (
                <Button size="lg" variant="outline" onClick={() => navigate('/create-team')} className="gap-2 text-base sm:text-lg px-6 sm:px-8 min-h-11 w-full sm:w-auto">
                  <PlusCircle className="h-5 w-5" />
                  Create Team
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card className="border-primary/20 hover:border-primary/40 transition-colors">
          <CardContent className="pt-6 pb-6 px-4 sm:px-6 text-center space-y-3">
            <div className="flex justify-center">
              <div className="p-3 bg-primary/10 rounded-full">
                <Users className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
              </div>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold">Build Your Team</h3>
            <p className="text-sm sm:text-base text-muted-foreground">
              Create teams of 1-3 members and invite other bladers to join your squad.
            </p>
          </CardContent>
        </Card>

        <Card className="border-chart-1/20 hover:border-chart-1/40 transition-colors">
          <CardContent className="pt-6 pb-6 px-4 sm:px-6 text-center space-y-3">
            <div className="flex justify-center">
              <div className="p-3 bg-chart-1/10 rounded-full">
                <Video className="h-7 w-7 sm:h-8 sm:w-8 text-chart-1" />
              </div>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold">Upload Team Footage</h3>
            <p className="text-sm sm:text-base text-muted-foreground">
              Share videos of your team training, battling, and revealing new Beys with the community.
            </p>
          </CardContent>
        </Card>

        <Card className="border-chart-2/20 hover:border-chart-2/40 transition-colors sm:col-span-2 lg:col-span-1">
          <CardContent className="pt-6 pb-6 px-4 sm:px-6 text-center space-y-3">
            <div className="flex justify-center">
              <div className="p-3 bg-chart-2/10 rounded-full">
                <Trophy className="h-7 w-7 sm:h-8 sm:w-8 text-chart-2" />
              </div>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold">Connect & Compete</h3>
            <p className="text-sm sm:text-base text-muted-foreground">
              Join Bey Hub X community and showcase your team's skills and achievements.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* CTA Section */}
      {!isAuthenticated && (
        <section className="text-center py-8 sm:py-12">
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="py-8 sm:py-12 px-4 sm:px-6 space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold">Ready to Join the Battle?</h2>
              <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto">
                Sign in to create your team and start sharing your Beyblade X journey!
              </p>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Footer */}
      <footer className="text-center py-6 sm:py-8 border-t border-border">
        <p className="text-xs sm:text-sm text-muted-foreground px-4">
          © {new Date().getFullYear()} Bey Hub X. Built with{' '}
          <SiCaffeine className="inline h-3 w-3 sm:h-4 sm:w-4 text-primary" /> using{' '}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
