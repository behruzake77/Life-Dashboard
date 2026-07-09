import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  CheckSquare, 
  CalendarDays, 
  Target, 
  BarChart2, 
  FileText, 
  Timer, 
  Trophy, 
  Bot, 
  Settings,
  Menu,
  LifeBuoy
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useGetGamificationProfile, useGetDashboardStats } from "@workspace/api-client-react";

export function AppShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  const navigation = [
    { name: "Asosiy", href: "/", icon: LayoutDashboard },
    { name: "Vazifalar", href: "/tasks", icon: CheckSquare },
    { name: "Odatlar", href: "/habits", icon: CalendarDays },
    { name: "Maqsadlar", href: "/goals", icon: Target },
    { name: "Taqvim", href: "/calendar", icon: CalendarDays },
    { name: "Statistika", href: "/stats", icon: BarChart2 },
    { name: "Hisobotlar", href: "/reports", icon: FileText },
    { name: "Pomodoro", href: "/pomodoro", icon: Timer },
    { name: "Gamifikatsiya", href: "/gamification", icon: Trophy },
    { name: "AI Murabbiy", href: "/ai", icon: Bot },
    { name: "Sozlamalar", href: "/settings", icon: Settings },
  ];

  const { data: gamification } = useGetGamificationProfile({ query: { enabled: true, queryKey: ['gamificationProfile'] } });
  const { data: stats } = useGetDashboardStats({ query: { enabled: true, queryKey: ['dashboardStats'] } });

  return (
    <div className="flex min-h-screen flex-col bg-background/95 dark:bg-background">
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="hidden w-64 flex-col border-r border-border/50 bg-background/50 backdrop-blur-xl md:flex">
          <div className="flex h-16 items-center gap-2 border-b border-border/50 px-6">
            <LifeBuoy className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold tracking-tight">Ultimate Life OS</span>
          </div>

          {gamification && (
            <div className="px-6 py-4 border-b border-border/50">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium">Daraja {gamification.level}</div>
                <div className="text-xs text-warning font-bold">{gamification.grade}</div>
              </div>
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary" 
                  style={{ width: `${Math.min(100, Math.max(0, (gamification.xp / (gamification.xp + gamification.xpToNextLevel)) * 100))}%` }} 
                />
              </div>
              <div className="text-xs text-muted-foreground mt-1 text-right">
                {gamification.xpToNextLevel} XP qoldi
              </div>
            </div>
          )}

          <nav className="flex-1 space-y-1 px-4 py-4 overflow-y-auto scrollbar-none">
            {navigation.map((item) => {
              const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
              return (
                <Link key={item.name} href={item.href} className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-200 hover:bg-primary/10 hover:text-primary",
                  isActive ? "bg-primary/15 text-primary shadow-[inset_2px_0_0_0_hsl(var(--primary))]" : "text-muted-foreground"
                )}>
                  <item.icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground")} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col relative min-w-0 overflow-hidden">
          {/* Mobile Header */}
          <header className="flex h-16 items-center border-b border-border/50 px-4 md:hidden bg-background/50 backdrop-blur-xl shrink-0 z-10 relative">
            <Button variant="ghost" size="icon" className="mr-2 md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
            <LifeBuoy className="h-5 w-5 text-primary mr-2" />
            <span className="font-bold">Life OS</span>
          </header>

          <div className="flex-1 overflow-y-auto relative p-4 md:p-6 lg:p-8 custom-scrollbar">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
