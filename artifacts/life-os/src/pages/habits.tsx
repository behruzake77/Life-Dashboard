import { useState } from "react";
import { 
  useGetHabits, 
  getGetHabitsQueryKey,
  useCreateHabit,
  useUpdateHabit,
  useDeleteHabit,
  useLogHabit,
  HabitTargetDays,
  HabitInputTargetDays
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format, subDays } from "date-fns";
import { uz } from "date-fns/locale";
import { Plus, Check, Flame, Trophy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { playSound } from "@/lib/sound";
import { notifyHabitDone } from "@/lib/notifications";

export default function Habits() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: habits, isLoading } = useGetHabits({
    query: { queryKey: getGetHabitsQueryKey() }
  });

  const createHabit = useCreateHabit();
  const deleteHabit = useDeleteHabit();
  const logHabit = useLogHabit();

  const [newHabit, setNewHabit] = useState({
    name: "",
    description: "",
    icon: "💧",
    color: "#7C3AED",
    targetDays: "daily" as HabitInputTargetDays,
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabit.name) return;

    createHabit.mutate({ data: newHabit }, {
      onSuccess: () => {
        toast.success("Odat muvaffaqiyatli yaratildi");
        setIsCreateOpen(false);
        setNewHabit({ name: "", description: "", icon: "💧", color: "#7C3AED", targetDays: "daily" });
        queryClient.invalidateQueries({ queryKey: getGetHabitsQueryKey() });
      }
    });
  };

  const handleLog = (habitId: number, habitName?: string) => {
    const dateStr = format(new Date(), "yyyy-MM-dd");
    logHabit.mutate({ id: habitId, data: { date: dateStr, completed: true } }, {
      onSuccess: () => {
        playSound('habitDone');
        if (habitName) notifyHabitDone(habitName);
        toast.success("Barakalla! Odat bajarildi. 🔥");
        queryClient.invalidateQueries({ queryKey: getGetHabitsQueryKey() });
      }
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Rostdan ham bu odatni o'chirmoqchimisiz?")) {
      deleteHabit.mutate({ id }, {
        onSuccess: () => {
          toast.success("Odat o'chirildi");
          queryClient.invalidateQueries({ queryKey: getGetHabitsQueryKey() });
        }
      });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Odatlar</h1>
          <p className="text-muted-foreground">Kichik odatlar — katta o'zgarishlar asosi</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Yangi Odat
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] glass-panel">
            <DialogHeader>
              <DialogTitle>Yangi Odat Qo'shish</DialogTitle>
              <DialogDescription>
                Qanday ijobiy odatni shakllantirmoqchisiz?
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 pt-4">
              <div className="flex gap-4">
                <Input 
                  className="w-16 text-center text-xl" 
                  value={newHabit.icon}
                  onChange={e => setNewHabit({...newHabit, icon: e.target.value})}
                  maxLength={2}
                />
                <Input 
                  placeholder="Odat nomi (masalan: Suv ichish)" 
                  value={newHabit.name}
                  onChange={e => setNewHabit({...newHabit, name: e.target.value})}
                  required
                  className="flex-1"
                />
              </div>
              <Textarea 
                placeholder="Nega bu muhim? (ixtiyoriy)" 
                value={newHabit.description}
                onChange={e => setNewHabit({...newHabit, description: e.target.value})}
                rows={2}
              />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Rangi</label>
                  <div className="flex gap-2">
                    {["#7C3AED", "#10B981", "#3B82F6", "#F59E0B", "#EC4899"].map(color => (
                      <button
                        key={color}
                        type="button"
                        className={`w-8 h-8 rounded-full border-2 transition-all ${newHabit.color === color ? 'border-foreground scale-110' : 'border-transparent opacity-80'}`}
                        style={{ backgroundColor: color }}
                        onClick={() => setNewHabit({...newHabit, color})}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)}>Bekor qilish</Button>
                <Button type="submit" disabled={createHabit.isPending}>
                  {createHabit.isPending ? "Saqlanmoqda..." : "Saqlash"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-xl" />)
        ) : habits?.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-card/30 rounded-xl border border-dashed border-border/50">
            <h3 className="text-xl font-medium text-foreground mb-2">Hali hech qanday odat qo'shilmagan</h3>
            <p className="text-muted-foreground mb-6">Yangi odat qo'shish orqali hayotingizni o'zgartirishni boshlang</p>
            <Button onClick={() => setIsCreateOpen(true)}>Odat yaratish</Button>
          </div>
        ) : (
          habits?.map((habit, i) => (
            <motion.div
              key={habit.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="h-full glass-panel overflow-hidden relative group border-border/40 hover:border-border/80 transition-colors">
                <div 
                  className="absolute top-0 left-0 w-1 h-full" 
                  style={{ backgroundColor: habit.color || 'var(--primary)' }}
                />
                
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl bg-background/50 p-2 rounded-xl border border-border/50 shadow-sm">
                        {habit.icon}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{habit.name}</CardTitle>
                        <CardDescription className="line-clamp-1">{habit.description || 'Har kungi vazifa'}</CardDescription>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(habit.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent className="pb-4">
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="bg-background/40 p-3 rounded-lg border border-border/50 text-center">
                      <div className="flex justify-center mb-1">
                        <Flame className="w-5 h-5 text-warning" />
                      </div>
                      <div className="text-2xl font-bold font-mono">{habit.currentStreak}</div>
                      <div className="text-xs text-muted-foreground">Ketma-ket (kun)</div>
                    </div>
                    <div className="bg-background/40 p-3 rounded-lg border border-border/50 text-center">
                      <div className="flex justify-center mb-1">
                        <Trophy className="w-5 h-5 text-primary" />
                      </div>
                      <div className="text-2xl font-bold font-mono">{habit.bestStreak}</div>
                      <div className="text-xs text-muted-foreground">Eng yaxshi natija</div>
                    </div>
                  </div>
                  
                  {/* Heatmap visualization mockup */}
                  <div className="mt-4 flex gap-1 justify-between px-1">
                    {[6, 5, 4, 3, 2, 1, 0].map(daysAgo => {
                      // Fake data for visualization purposes
                      const isCompleted = daysAgo > 0 ? Math.random() > 0.3 : false;
                      const date = subDays(new Date(), daysAgo);
                      
                      return (
                        <div 
                          key={daysAgo} 
                          title={format(date, "d MMM", { locale: uz })}
                          className={`w-6 h-6 rounded-sm ${
                            daysAgo === 0 
                              ? 'border-2 border-primary border-dashed bg-transparent' 
                              : isCompleted 
                                ? 'opacity-80' 
                                : 'bg-muted'
                          }`}
                          style={isCompleted ? { backgroundColor: habit.color || 'var(--primary)' } : {}}
                        />
                      );
                    })}
                  </div>
                </CardContent>
                
                <CardFooter className="pt-0 border-t border-border/30 px-6 py-4 mt-auto">
                  <Button 
                    className="w-full h-12 text-md font-bold shadow-[0_0_15px_rgba(0,0,0,0.1)] hover:shadow-[0_0_20px_rgba(var(--primary),0.3)] transition-all"
                    onClick={() => handleLog(habit.id, habit.name)}
                    style={{ 
                      backgroundColor: habit.color ? `${habit.color}20` : 'transparent',
                      color: habit.color || 'inherit',
                      borderColor: habit.color || 'var(--border)'
                    }}
                    variant="outline"
                  >
                    <Check className="mr-2 h-5 w-5" /> Bajarildi
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
