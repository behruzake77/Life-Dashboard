import { useState } from "react";
import { 
  useGetGoals, 
  getGetGoalsQueryKey,
  useCreateGoal,
  useUpdateGoal,
  useDeleteGoal,
  useCreateGoalStep,
  useUpdateGoalStep,
  GoalInputPriority
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Target, Plus, CheckCircle, Circle, MountainSnow, CalendarIcon, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
import { motion, AnimatePresence } from "framer-motion";

export default function Goals() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null);

  const { data: goalsData, isLoading } = useGetGoals({
    query: { queryKey: getGetGoalsQueryKey() }
  });

  const createGoal = useCreateGoal();
  const createStep = useCreateGoalStep();
  const updateStep = useUpdateGoalStep();

  const [newGoal, setNewGoal] = useState({
    title: "",
    description: "",
    priority: "high" as GoalInputPriority,
  });

  const [newStepTitle, setNewStepTitle] = useState("");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.title) return;

    createGoal.mutate({ data: newGoal }, {
      onSuccess: () => {
        toast.success("Maqsad muvaffaqiyatli qo'shildi!");
        setIsCreateOpen(false);
        setNewGoal({ title: "", description: "", priority: "high" });
        queryClient.invalidateQueries({ queryKey: getGetGoalsQueryKey() });
      }
    });
  };

  const handleAddStep = (e: React.FormEvent, goalId: number) => {
    e.preventDefault();
    if (!newStepTitle) return;

    createStep.mutate({ id: goalId, data: { title: newStepTitle } }, {
      onSuccess: () => {
        toast.success("Qadam qo'shildi");
        setNewStepTitle("");
        queryClient.invalidateQueries({ queryKey: getGetGoalsQueryKey() });
      }
    });
  };

  const toggleStep = (goalId: number, stepId: number, completed: boolean) => {
    updateStep.mutate({ id: goalId, stepId, data: { completed: !completed } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetGoalsQueryKey() });
      }
    });
  };

  // Safe fallback if goals is undefined
  const goals = goalsData || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Katta Maqsadlar</h1>
          <p className="text-muted-foreground">Orzularni aniq qadamlarga aylantiramiz</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-lg">
              <Plus className="h-4 w-4" /> Yangi Maqsad
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] glass-panel">
            <DialogHeader>
              <DialogTitle>Katta Maqsad Qo'yish</DialogTitle>
              <DialogDescription>
                Yangi maqsadingiz qanday? Qanchalik katta bo'lsa, shuncha yaxshi.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 pt-4">
              <Input 
                placeholder="Maqsad nomi (masalan: C1 Daraja olish)" 
                value={newGoal.title}
                onChange={e => setNewGoal({...newGoal, title: e.target.value})}
                required
                className="text-lg"
              />
              <Textarea 
                placeholder="Batafsil tavsif (Nima uchun bu muhim?)" 
                value={newGoal.description}
                onChange={e => setNewGoal({...newGoal, description: e.target.value})}
                rows={3}
              />
              <div className="pt-4 flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)}>Bekor qilish</Button>
                <Button type="submit" disabled={createGoal.isPending}>
                  {createGoal.isPending ? "Saqlanmoqda..." : "Maqsadni O'rnatish"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Goals List */}
        <div className="lg:col-span-4 space-y-4">
          <h2 className="font-semibold text-lg flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-primary" /> Active Maqsadlar
          </h2>
          
          {isLoading ? (
            Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)
          ) : goals.length === 0 ? (
            <div className="text-center py-10 bg-muted/20 rounded-xl border border-dashed border-border/50">
              <MountainSnow className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground font-medium">Hali maqsadlar yo'q.</p>
            </div>
          ) : (
            goals.map((g: any) => (
              <motion.div key={g.goal.id} layout>
                <Card 
                  className={`cursor-pointer transition-all hover:border-primary/50 ${selectedGoalId === g.goal.id ? 'border-primary shadow-[0_0_15px_rgba(var(--primary),0.15)] bg-primary/5' : 'glass-panel'}`}
                  onClick={() => setSelectedGoalId(g.goal.id)}
                >
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-base flex justify-between items-start">
                      <span className="line-clamp-2">{g.goal.title}</span>
                      {selectedGoalId === g.goal.id && <ChevronRight className="w-4 h-4 text-primary shrink-0 ml-2" />}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="flex justify-between items-center text-xs mb-2 text-muted-foreground">
                      <span>Progress</span>
                      <span className="font-bold text-foreground">{g.goal.progressPercent || 0}%</span>
                    </div>
                    <Progress value={g.goal.progressPercent || 0} className="h-1.5" />
                    <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-success" />
                        {g.steps?.filter((s:any) => s.completed).length || 0} / {g.steps?.length || 0} qadam
                      </div>
                      {g.goal.deadline && (
                        <div className="flex items-center gap-1 text-warning">
                          <CalendarIcon className="w-3 h-3" />
                          {format(new Date(g.goal.deadline), "dd MMM, yyyy")}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>

        {/* Selected Goal Details */}
        <div className="lg:col-span-8">
          {!selectedGoalId ? (
            <div className="hidden lg:flex flex-col items-center justify-center h-full min-h-[400px] border border-dashed border-border/50 rounded-xl bg-muted/10">
              <Target className="w-16 h-16 text-muted-foreground opacity-20 mb-4" />
              <p className="text-muted-foreground text-lg">Batafsil ko'rish uchun maqsadni tanlang</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {goals.filter((g:any) => g.goal.id === selectedGoalId).map((g:any) => (
                <motion.div
                  key={g.goal.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <Card className="glass-panel border-primary/20">
                    <CardHeader>
                      <div className="flex justify-between items-start mb-2">
                        <span className="px-3 py-1 bg-primary/20 text-primary text-xs font-semibold rounded-full uppercase tracking-wider">
                          {g.goal.priority || 'Maqsad'}
                        </span>
                        <div className="text-3xl font-black font-mono text-primary/80">
                          {g.goal.progressPercent || 0}%
                        </div>
                      </div>
                      <CardTitle className="text-2xl">{g.goal.title}</CardTitle>
                      {g.goal.description && (
                        <CardDescription className="text-base mt-2">{g.goal.description}</CardDescription>
                      )}
                    </CardHeader>
                    
                    {g.goal.aiAdvice && (
                      <CardContent>
                        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-sm relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                          <p className="italic text-muted-foreground mb-1 font-semibold">AI Murabbiy maslahati:</p>
                          <p>{g.goal.aiAdvice}</p>
                        </div>
                      </CardContent>
                    )}
                  </Card>

                  <Card className="glass-panel">
                    <CardHeader>
                      <CardTitle className="text-lg">Kichik Qadamlar</CardTitle>
                      <CardDescription>Katta maqsadga yetishish uchun reja</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        {g.steps?.length === 0 ? (
                          <div className="text-center py-6 text-muted-foreground text-sm border border-dashed rounded-lg">
                            Qadamlar hali qo'shilmagan. Qayerdan boshlaysiz?
                          </div>
                        ) : (
                          g.steps?.map((step: any) => (
                            <div 
                              key={step.id} 
                              className={`flex items-start gap-3 p-3 rounded-lg transition-colors border ${
                                step.completed ? 'bg-success/5 border-success/20 opacity-70' : 'bg-background/50 border-border/50 hover:bg-background/80'
                              }`}
                            >
                              <button 
                                onClick={() => toggleStep(g.goal.id, step.id, step.completed)}
                                className="mt-0.5 shrink-0"
                              >
                                {step.completed ? (
                                  <CheckCircle className="w-5 h-5 text-success" />
                                ) : (
                                  <Circle className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
                                )}
                              </button>
                              <div className={step.completed ? 'line-through text-muted-foreground' : 'font-medium'}>
                                {step.title}
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      <form onSubmit={(e) => handleAddStep(e, g.goal.id)} className="flex gap-2 pt-4 border-t border-border/50">
                        <Input 
                          placeholder="Yangi qadam..." 
                          value={newStepTitle}
                          onChange={(e) => setNewStepTitle(e.target.value)}
                          className="bg-background/50"
                        />
                        <Button type="submit" variant="secondary" disabled={!newStepTitle || createStep.isPending}>
                          Qo'shish
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
