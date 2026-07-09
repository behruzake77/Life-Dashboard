import { ReactNode } from "react";
import { useAuth } from "@workspace/replit-auth-web";
import { LifeBuoy, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AuthGate({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated, login } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Yuklanmoqda...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm rounded-xl border border-border/50 bg-background/50 backdrop-blur-xl p-8 text-center">
          <LifeBuoy className="mx-auto h-10 w-10 text-primary mb-4" />
          <h1 className="text-xl font-bold mb-2">Ultimate Life OS</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Shaxsiy ma'lumotlaringizga kirish uchun tizimga kiring.
          </p>
          <Button className="w-full gap-2" onClick={login} data-testid="button-login">
            <LogIn className="h-4 w-4" />
            Kirish
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
