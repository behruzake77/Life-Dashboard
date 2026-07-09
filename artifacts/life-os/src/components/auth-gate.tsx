import { FormEvent, ReactNode, useState } from 'react';
import { LifeBuoy, LogIn, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth';

export function AuthGate({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Yuklanmoqda...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return <>{children}</>;
}

function LoginScreen() {
  const { login, register, error } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    if (mode === 'login') {
      await login(username, password);
    } else {
      await register(username, password);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-xl border border-border/50 bg-background/50 backdrop-blur-xl p-8">
        <div className="text-center mb-6">
          <LifeBuoy className="mx-auto h-10 w-10 text-primary mb-4" />
          <h1 className="text-xl font-bold mb-2">Ultimate Life OS</h1>
          <p className="text-sm text-muted-foreground">
            {mode === 'login'
              ? 'Shaxsiy ma\'lumotlaringizga kirish uchun tizimga kiring.'
              : "Yangi hisob yaratib, tizimdan foydalanishni boshlang."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2 text-left">
            <Label htmlFor="username">Login</Label>
            <Input
              id="username"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              data-testid="input-username"
              required
            />
          </div>
          <div className="space-y-2 text-left">
            <Label htmlFor="password">Parol</Label>
            <Input
              id="password"
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              data-testid="input-password"
              required
            />
          </div>

          {error && (
            <p className="text-sm text-destructive" data-testid="text-auth-error">
              {error}
            </p>
          )}

          <Button
            type="submit"
            className="w-full gap-2"
            disabled={isSubmitting}
            data-testid="button-submit-auth"
          >
            {mode === 'login' ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
            {mode === 'login' ? 'Kirish' : "Ro'yxatdan o'tish"}
          </Button>
        </form>

        <button
          type="button"
          className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
          data-testid="button-toggle-auth-mode"
        >
          {mode === 'login'
            ? "Hisobingiz yo'q? Ro'yxatdan o'ting"
            : 'Hisobingiz bor? Kirish'}
        </button>
      </div>
    </div>
  );
}
