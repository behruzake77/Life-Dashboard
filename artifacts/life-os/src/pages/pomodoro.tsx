import { useState, useEffect } from "react";
import { 
  useGetPomodoroSessions, 
  getGetPomodoroSessionsQueryKey,
  useCreatePomodoroSession,
  PomodoroSessionInputType
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Play, Pause, Square, SkipForward, Coffee, Brain, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { playSound } from "@/lib/sound";
import { notifyPomodoroComplete } from "@/lib/notifications";

export default function Pomodoro() {
  const queryClient = useQueryClient();
  const createSession = useCreatePomodoroSession();

  const [mode, setMode] = useState<PomodoroSessionInputType>("focus");
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 mins default
  
  const { data: sessions } = useGetPomodoroSessions(undefined, {
    query: { queryKey: getGetPomodoroSessionsQueryKey() }
  });

  const getInitialTime = (m: PomodoroSessionInputType) => {
    if (m === "focus") return 25 * 60;
    if (m === "short_break") return 5 * 60;
    if (m === "long_break") return 15 * 60;
    return 25 * 60;
  };

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      handleComplete();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const handleModeChange = (newMode: PomodoroSessionInputType) => {
    setIsActive(false);
    setMode(newMode);
    setTimeLeft(getInitialTime(newMode));
  };

  const toggleTimer = () => {
    playSound('click');
    setIsActive(!isActive);
  };

  const handleStop = () => {
    playSound('click');
    setIsActive(false);
    setTimeLeft(getInitialTime(mode));
  };

  const handleComplete = () => {
    setIsActive(false);
    
    // Play sound and send notification
    playSound('complete');
    notifyPomodoroComplete(mode);

    toast.success(mode === "focus" ? "Fokus seansi yakunlandi!" : "Tanaffus tugadi!", {
      icon: mode === "focus" ? <Brain className="h-5 w-5 text-primary" /> : <Coffee className="h-5 w-5 text-warning" />
    });

    // Log the session to API
    createSession.mutate({ 
      data: { 
        type: mode, 
        durationMinutes: getInitialTime(mode) / 60 
      } 
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetPomodoroSessionsQueryKey() });
        // Auto-switch modes
        if (mode === "focus") handleModeChange("short_break");
        else handleModeChange("focus");
      }
    });
  };

  // Format MM:SS
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Calculate progress circle stroke dashoffset
  const totalTime = getInitialTime(mode);
  const progressPercent = ((totalTime - timeLeft) / totalTime) * 100;
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="space-y-8 max-w-4xl mx-auto flex flex-col items-center pt-8">
      
      <div className="w-full flex justify-center gap-2 p-1 bg-muted/30 rounded-xl max-w-md mx-auto backdrop-blur-md border border-border/50">
        <Button 
          variant={mode === "focus" ? "default" : "ghost"} 
          className={`flex-1 rounded-lg transition-all ${mode === "focus" ? 'bg-primary text-primary-foreground shadow-md' : ''}`}
          onClick={() => handleModeChange("focus")}
        >
          <Brain className="mr-2 h-4 w-4" /> Fokus
        </Button>
        <Button 
          variant={mode === "short_break" ? "default" : "ghost"} 
          className={`flex-1 rounded-lg transition-all ${mode === "short_break" ? 'bg-warning text-warning-foreground shadow-md' : ''}`}
          onClick={() => handleModeChange("short_break")}
        >
          <Coffee className="mr-2 h-4 w-4" /> Qisqa tanaffus
        </Button>
        <Button 
          variant={mode === "long_break" ? "default" : "ghost"} 
          className={`flex-1 rounded-lg transition-all ${mode === "long_break" ? 'bg-info text-info-foreground shadow-md' : ''}`}
          onClick={() => handleModeChange("long_break")}
        >
          <Coffee className="mr-2 h-4 w-4" /> Uzoq tanaffus
        </Button>
      </div>

      {/* Timer Circle */}
      <div className="relative flex justify-center items-center py-10">
        {/* Glow effect behind timer */}
        <div className={`absolute w-72 h-72 rounded-full blur-3xl opacity-20 animate-pulse-slow ${
          mode === "focus" ? "bg-primary" : 
          mode === "short_break" ? "bg-warning" : "bg-info"
        }`} />
        
        <svg width="300" height="300" viewBox="0 0 300 300" className="transform -rotate-90 drop-shadow-xl z-10 relative">
          <circle
            cx="150"
            cy="150"
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth="8"
            className="text-muted/30"
          />
          <motion.circle
            cx="150"
            cy="150"
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth="12"
            strokeLinecap="round"
            className={`transition-colors duration-1000 ${
              mode === "focus" ? "text-primary" : 
              mode === "short_break" ? "text-warning" : "text-info"
            }`}
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: strokeDashoffset,
            }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: "linear" }}
          />
        </svg>

        <div className="absolute flex flex-col items-center justify-center z-20">
          <div className="text-7xl font-black font-mono tracking-tighter text-foreground drop-shadow-md">
            {formatTime(timeLeft)}
          </div>
          <p className="text-muted-foreground font-medium uppercase tracking-[0.2em] text-sm mt-2">
            {mode === "focus" ? "Diqqatni jamlang" : "Tanaffus vaqti"}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-4">
        <Button 
          size="lg" 
          className={`h-16 w-32 rounded-2xl text-lg shadow-lg font-bold ${
            isActive ? 'bg-background border-2 border-primary text-primary hover:bg-primary/10' : 'bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 transition-transform'
          }`}
          onClick={toggleTimer}
        >
          {isActive ? (
            <><Pause className="mr-2 h-6 w-6" /> Pauza</>
          ) : (
            <><Play className="mr-2 h-6 w-6" /> Boshlash</>
          )}
        </Button>

        <Button 
          size="icon" 
          variant="outline" 
          className="h-16 w-16 rounded-2xl border-2 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 transition-colors"
          onClick={handleStop}
          disabled={timeLeft === getInitialTime(mode) && !isActive}
        >
          <Square className="h-6 w-6" />
        </Button>
        
        <Button 
          size="icon" 
          variant="outline" 
          className="h-16 w-16 rounded-2xl border-2 hover:bg-primary/10 hover:text-primary transition-colors"
          onClick={handleComplete}
          disabled={!isActive && timeLeft === getInitialTime(mode)}
        >
          <SkipForward className="h-6 w-6" />
        </Button>
      </div>

      {/* History */}
      <div className="w-full mt-12">
        <Card className="glass-panel border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <History className="h-5 w-5 text-muted-foreground" />
              Bugungi Seanslar
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sessions && sessions.length > 0 ? (
              <div className="space-y-3">
                {sessions.slice(0, 5).map((session: any) => (
                  <div key={session.id} className="flex justify-between items-center p-3 rounded-lg bg-background/50 border border-border/30">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-md ${
                        session.type === 'focus' ? 'bg-primary/10 text-primary' : 'bg-warning/10 text-warning'
                      }`}>
                        {session.type === 'focus' ? <Brain className="h-4 w-4" /> : <Coffee className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="font-medium capitalize">{session.type.replace('_', ' ')}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(session.startedAt), "HH:mm")}
                        </p>
                      </div>
                    </div>
                    <div className="font-mono font-bold text-lg">
                      {session.durationMinutes}m
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                Bugun hali seanslar o'tkazilmadi
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
