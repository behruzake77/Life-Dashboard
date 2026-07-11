import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { AppShell } from '@/components/app-shell';
import Dashboard from '@/pages/dashboard';
import Tasks from '@/pages/tasks';
import Habits from '@/pages/habits';
import Goals from '@/pages/goals';
import Calendar from '@/pages/calendar';
import Stats from '@/pages/stats';
import Reports from '@/pages/reports';
import Pomodoro from '@/pages/pomodoro';
import Gamification from '@/pages/gamification';
import AiCoach from '@/pages/ai';
import Settings from '@/pages/settings';
import { useEffect } from 'react';

const queryClient = new QueryClient();

// Initial dark mode setup
function ThemeInit() {
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);
  return null;
}

function Router() {
  return (
    <AppShell>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/tasks" component={Tasks} />
        <Route path="/habits" component={Habits} />
        <Route path="/goals" component={Goals} />
        <Route path="/calendar" component={Calendar} />
        <Route path="/stats" component={Stats} />
        <Route path="/reports" component={Reports} />
        <Route path="/pomodoro" component={Pomodoro} />
        <Route path="/gamification" component={Gamification} />
        <Route path="/ai" component={AiCoach} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </AppShell>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeInit />
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
