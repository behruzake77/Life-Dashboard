import { 
  useGetDashboardStats, 
  getGetDashboardStatsQueryKey,
  useGetTodayTasks,
  getGetTodayTasksQueryKey,
  useFailTask,
  useUpdateTask,
  useCreatePomodoroSession
} from "@workspace/api-client-react";
import { format } from "date-fns";
import { uz } from "date-fns/locale";
import { Trophy, CheckCircle, XCircle, Flame, Clock, BrainCircuit, Play } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats({
    query: { queryKey: getGetDashboardStatsQueryKey() }
  });
  
  const { data: todayTasksData, isLoading: tasksLoading } = useGetTodayTasks({
    query: { queryKey: getGetTodayTasksQueryKey() }
  });

  const failTask = useFailTask();
  const updateTask = useUpdateTask();

  const [animatingTask, setAnimatingTask] = useState<{id: number, type: 'complete' | 'fail'} | null>(null);

  const handleCompleteTask = (id: number) => {
    setAnimatingTask({ id, type: 'complete' });
    updateTask.mutate({ id, data: { status: "completed" } }, {
      onSuccess: () => {
        toast.success("Ajoyib! Vazifa bajarildi!");
        queryClient.invalidateQueries({ queryKey: getGetTodayTasksQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
        setTimeout(() => setAnimatingTask(null), 500);
      }
    });
  };

  const handleFailTask = (id: number) => {
    setAnimatingTask({ id, type: 'fail' });
    failTask.mutate({ id, data: { reason: "Vaqtni to'g'ri taqsimlay olmadim" } }, {
      onSuccess: () => {
        toast.error("Rejangdan ortda qolding. Diqqatni jamla!", {
          style: { backgroundColor: 'hsl(var(--destructive))', color: 'white' }
        });
        queryClient.invalidateQueries({ queryKey: getGetTodayTasksQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
        setTimeout(() => setAnimatingTask(null), 500);
      }
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mission Control</h1>
          <p className="text-muted-foreground">
            {format(new Date(), "EEEE, d-MMMM", { locale: uz })} • Bugungi kuningni boshqar.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setLocation("/pomodoro")} className="bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30">
            <Play className="mr-2 h-4 w-4" /> Fokusni Boshlash
          </Button>
          <Button onClick={() => setLocation("/tasks")} variant="outline">
            Barcha Vazifalar
          </Button>
        </div>
      </div>

      {/* Warning display only when user has tasks but performance is low */}
      {stats && stats.today.total > 0 && (stats.today.grade === "D" || stats.today.grade === "F") && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-destructive/10 border-l-4 border-destructive p-4 rounded-r-md flex items-start gap-3"
        >
          <XCircle className="text-destructive h-5 w-5 mt-0.5" />
          <div>
            <h3 className="font-semibold text-destructive">Intizom pasaymoqda!</h3>
            <p className="text-sm text-destructive/80">Bugun sust ishlading. Vazifalarni yakunlash orqali darajangni tikla.</p>
          </div>
        </motion.div>
      )}

      {/* Top Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsLoading ? (
          Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)
        ) : stats ? (
          <>
            <Card className="glass-panel relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Intizom Bahosi</CardTitle>
                <Trophy className="h-4 w-4 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold font-mono">{stats.today.grade}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Baho {stats.scores.disciplineScore}/100 dan
                </p>
              </CardContent>
            </Card>
            
            <Card className="glass-panel">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Bugungi Bajarilish</CardTitle>
                <CheckCircle className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-mono">
                  {stats.today.completed}/{stats.today.total}
                </div>
                <Progress 
                  value={stats.today.progressPercent} 
                  className="h-2 mt-3" 
                  style={{
                    '--progress-background': 'hsl(var(--success))'
                  } as any}
                />
              </CardContent>
            </Card>

            <Card className="glass-panel">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Davomiylik (Streak)</CardTitle>
                <Flame className="h-4 w-4 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-mono">
                  {stats.streaks.currentTaskStreak} <span className="text-lg text-muted-foreground">kun</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Eng yaxshi natija: {stats.streaks.bestTaskStreak} kun
                </p>
              </CardContent>
            </Card>

            <Card className="glass-panel">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Samarali Vaqt</CardTitle>
                <Clock className="h-4 w-4 text-info" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-mono">
                  {Math.floor(stats.time.todayPomodoroMinutes / 60)}s {stats.time.todayPomodoroMinutes % 60}d
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Jami: {Math.floor(stats.time.totalPomodoroMinutes! / 60)} soat
                </p>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Today's Tasks */}
        <Card className="glass-panel col-span-1 border-border/50">
          <CardHeader>
            <CardTitle>Bugungi Vazifalar</CardTitle>
            <CardDescription>O'z ustingda ishlashdan to'xtama</CardDescription>
          </CardHeader>
          <CardContent>
            {tasksLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            ) : todayTasksData?.tasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Bugun uchun vazifalar yo'q.</p>
                <Button variant="link" onClick={() => setLocation("/tasks")} className="mt-2">
                  Yangi vazifa qo'shish
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {todayTasksData?.tasks.map((task) => (
                    <motion.div 
                      key={task.id}
                      layout
                      initial={{ opacity: 1, scale: 1 }}
                      animate={
                        animatingTask?.id === task.id 
                          ? { opacity: 0, scale: 0.95, x: animatingTask.type === 'complete' ? 50 : -50 } 
                          : { opacity: 1, scale: 1, x: 0 }
                      }
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        task.status === 'completed' ? 'bg-success/5 border-success/20' :
                        task.status === 'missed' || task.status === 'repeatedly_missed' ? 'bg-destructive/5 border-destructive/20' :
                        task.status === 'in_progress' ? 'bg-warning/5 border-warning/20' :
                        'bg-background/40 border-border/50 hover:bg-background/60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          task.priority === 'urgent' ? 'bg-destructive' :
                          task.priority === 'high' ? 'bg-warning' :
                          task.priority === 'medium' ? 'bg-info' : 'bg-muted'
                        }`} />
                        <div>
                          <div className={`font-medium ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                            {task.title}
                          </div>
                          {task.scheduledDate && (
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(task.scheduledDate), "HH:mm")}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {task.status === 'pending' || task.status === 'in_progress' ? (
                        <div className="flex gap-2">
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-success hover:text-success hover:bg-success/10" onClick={() => handleCompleteTask(task.id)}>
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleFailTask(task.id)}>
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          task.status === 'completed' ? 'bg-success/20 text-success' :
                          'bg-destructive/20 text-destructive'
                        }`}>
                          {task.status === 'completed' ? 'Bajarildi' : 'Muvaffaqiyatsiz'}
                        </span>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Insight */}
        <Card className="glass-panel col-span-1 border-primary/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <BrainCircuit className="w-48 h-48" />
          </div>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <BotIcon className="w-5 h-5" />
              AI Murabbiy Tahlili
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-primary/5 border border-primary/10 p-4 rounded-lg text-sm leading-relaxed">
                {stats?.gamification?.grade === 'F' || stats?.gamification?.grade === 'D' ? (
                  <span className="text-destructive font-medium">Siz o'z potensialingizdan foydalanmayapsiz. Intizom yo'qolgan. Darhol hozirning o'zida bitta vazifani bajaring!</span>
                ) : stats?.today?.progressPercent === 100 ? (
                  <span className="text-success font-medium">Ajoyib ish! Bugungi reja to'liq bajarildi. O'z ustingda ishlashda davom et, sen eng yaxshisiga loyiqsan.</span>
                ) : (
                  <span>Sizda hali bajarilmagan {stats?.today?.pending} ta vazifa bor. Diqqatni jamlang. Har bir bajarilgan ish sizni katta maqsadingizga yaqinlashtiradi.</span>
                )}
              </div>
              <Button className="w-full" variant="outline" onClick={() => setLocation("/ai")}>
                Murabbiy bilan suhbat
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function BotIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 8V4H8" />
      <rect width="16" height="12" x="4" y="8" rx="2" />
      <path d="M2 14h2" />
      <path d="M20 14h2" />
      <path d="M15 13v2" />
      <path d="M9 13v2" />
    </svg>
  );
}
