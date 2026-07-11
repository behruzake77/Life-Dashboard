import { useState } from "react";
import { 
  useGetTasks, 
  getGetTasksQueryKey,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  useFailTask,
  Task,
  TaskPriority,
  TaskStatus,
  TaskInputPriority,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { uz } from "date-fns/locale";
import { 
  Plus, CheckCircle, XCircle, Trash2, Edit, CalendarIcon, 
  Clock, AlertCircle, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { playSound } from "@/lib/sound";
import { notifyTaskComplete } from "@/lib/notifications";

export default function Tasks() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const { data: tasks, isLoading } = useGetTasks({}, { 
    query: { queryKey: getGetTasksQueryKey() } 
  });

  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const failTask = useFailTask();

  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    category: "work",
    priority: "medium" as TaskInputPriority,
    startTime: "",
    endTime: "",
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title) return;

    if (newTask.startTime && newTask.endTime && newTask.endTime <= newTask.startTime) {
      toast.error("Tugash vaqti boshlanish vaqtidan keyin bo'lishi kerak");
      return;
    }

    const { startTime, endTime, ...rest } = newTask;
    createTask.mutate({
      data: {
        ...rest,
        ...(startTime ? { startTime } : {}),
        ...(endTime ? { endTime } : {}),
      },
    }, {
      onSuccess: () => {
        toast.success("Vazifa muvaffaqiyatli qo'shildi");
        setIsCreateOpen(false);
        setNewTask({ title: "", description: "", category: "work", priority: "medium", startTime: "", endTime: "" });
        queryClient.invalidateQueries({ queryKey: getGetTasksQueryKey() });
      }
    });
  };

  const handleStatusUpdate = (id: number, status: TaskStatus, title?: string) => {
    updateTask.mutate({ id, data: { status } }, {
      onSuccess: () => {
        if (status === 'completed') {
          playSound('success');
          if (title) notifyTaskComplete(title);
          toast.success("Vazifa bajarildi! ✅");
        } else {
          playSound('click');
          toast.success("Vazifa holati yangilandi");
        }
        queryClient.invalidateQueries({ queryKey: getGetTasksQueryKey() });
      }
    });
  };

  const handleFail = (id: number) => {
    failTask.mutate({ id, data: { reason: "Muvaffaqiyatsiz bajarildi" } }, {
      onSuccess: () => {
        playSound('error');
        toast.error("Vazifa muvaffaqiyatsiz yakunlandi", {
          style: { backgroundColor: 'hsl(var(--destructive))', color: 'white' }
        });
        queryClient.invalidateQueries({ queryKey: getGetTasksQueryKey() });
      }
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Rostdan ham bu vazifani o'chirmoqchimisiz?")) {
      deleteTask.mutate({ id }, {
        onSuccess: () => {
          toast.success("Vazifa o'chirildi");
          queryClient.invalidateQueries({ queryKey: getGetTasksQueryKey() });
        }
      });
    }
  };

  const filteredTasks = tasks?.filter(t => filterStatus === "all" || t.status === filterStatus) || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vazifalar</h1>
          <p className="text-muted-foreground">Barcha rejalashtirilgan vazifalaringizni boshqaring</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px] bg-background/50 backdrop-blur-sm">
              <SelectValue placeholder="Holat bo'yicha filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barcha vazifalar</SelectItem>
              <SelectItem value="pending">Kutilayotgan</SelectItem>
              <SelectItem value="in_progress">Bajarilmoqda</SelectItem>
              <SelectItem value="completed">Bajarilgan</SelectItem>
              <SelectItem value="missed">Muvaffaqiyatsiz</SelectItem>
            </SelectContent>
          </Select>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 shadow-lg hover:shadow-xl transition-all">
                <Plus className="h-4 w-4" /> Yangi Vazifa
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] glass-panel">
              <DialogHeader>
                <DialogTitle>Yangi Vazifa Qo'shish</DialogTitle>
                <DialogDescription>
                  Vazifa haqida ma'lumotlarni kiriting.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Input 
                    placeholder="Vazifa nomi" 
                    value={newTask.title}
                    onChange={e => setNewTask({...newTask, title: e.target.value})}
                    required
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Textarea 
                    placeholder="Batafsil ma'lumot (ixtiyoriy)" 
                    value={newTask.description}
                    onChange={e => setNewTask({...newTask, description: e.target.value})}
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Select 
                    value={newTask.category} 
                    onValueChange={(v) => setNewTask({...newTask, category: v})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Kategoriya" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="work">Ish</SelectItem>
                      <SelectItem value="personal">Shaxsiy</SelectItem>
                      <SelectItem value="health">Salomatlik</SelectItem>
                      <SelectItem value="education">Ta'lim</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select 
                    value={newTask.priority} 
                    onValueChange={(v: TaskInputPriority) => setNewTask({...newTask, priority: v})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Muhimlik" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Past</SelectItem>
                      <SelectItem value="medium">O'rta</SelectItem>
                      <SelectItem value="high">Yuqori</SelectItem>
                      <SelectItem value="urgent">O'ta muhim</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Boshlanish vaqti
                    </label>
                    <Input
                      type="time"
                      value={newTask.startTime}
                      onChange={e => setNewTask({...newTask, startTime: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Tugash vaqti
                    </label>
                    <Input
                      type="time"
                      value={newTask.endTime}
                      onChange={e => setNewTask({...newTask, endTime: e.target.value})}
                    />
                  </div>
                </div>
                <div className="pt-4 flex justify-end gap-2">
                  <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)}>
                    Bekor qilish
                  </Button>
                  <Button type="submit" disabled={createTask.isPending}>
                    {createTask.isPending ? "Saqlanmoqda..." : "Saqlash"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-card/50 backdrop-blur-xl border rounded-xl overflow-hidden shadow-sm">
        <div className="grid grid-cols-12 gap-4 p-4 border-b bg-muted/20 text-sm font-medium text-muted-foreground">
          <div className="col-span-6 md:col-span-5">Vazifa</div>
          <div className="hidden md:block col-span-2">Kategoriya / Vaqt</div>
          <div className="col-span-3 md:col-span-2 text-center">Muhimlik</div>
          <div className="col-span-3 text-right">Amallar</div>
        </div>
        
        <div className="divide-y divide-border/50">
          {isLoading ? (
            Array(5).fill(0).map((_, i) => (
              <div key={i} className="p-4">
                <Skeleton className="h-10 w-full" />
              </div>
            ))
          ) : filteredTasks.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              Vazifalar topilmadi.
            </div>
          ) : (
            filteredTasks.map((task, i) => (
              <motion.div 
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`grid grid-cols-12 gap-4 p-4 items-center transition-colors hover:bg-muted/10 ${
                  task.status === 'completed' ? 'opacity-60' : ''
                }`}
              >
                <div className="col-span-6 md:col-span-5 flex flex-col gap-1">
                  <div className={`font-medium ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                    {task.title}
                  </div>
                  {task.description && (
                    <div className="text-xs text-muted-foreground line-clamp-1">
                      {task.description}
                    </div>
                  )}
                  {task.status !== 'pending' && task.status !== 'in_progress' && (
                    <div className="text-xs mt-1">
                      <span className={`px-2 py-0.5 rounded-full ${
                        task.status === 'completed' ? 'bg-success/20 text-success' :
                        'bg-destructive/20 text-destructive'
                      }`}>
                        {task.status === 'completed' ? 'Bajarilgan' : 'Muvaffaqiyatsiz'}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="hidden md:flex flex-col gap-1 col-span-2 text-sm text-muted-foreground">
                  <div className="capitalize flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                    {task.category}
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    <CalendarIcon className="w-3 h-3" />
                    {format(new Date(task.createdAt), "dd MMM")}
                  </div>
                  {(task.startTime || task.endTime) && (
                    <div className="flex items-center gap-1 text-xs">
                      <Clock className="w-3 h-3" />
                      {task.startTime}
                      {task.startTime && task.endTime ? " – " : ""}
                      {task.endTime}
                    </div>
                  )}
                </div>
                
                <div className="col-span-3 md:col-span-2 flex justify-center">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5 ${
                    task.priority === 'urgent' ? 'bg-destructive/20 text-destructive' :
                    task.priority === 'high' ? 'bg-warning/20 text-warning-foreground' :
                    task.priority === 'medium' ? 'bg-info/20 text-info' : 
                    'bg-muted text-muted-foreground'
                  }`}>
                    {task.priority === 'urgent' && <AlertCircle className="w-3 h-3" />}
                    {task.priority === 'urgent' ? "O'ta muhim" :
                     task.priority === 'high' ? "Yuqori" :
                     task.priority === 'medium' ? "O'rta" : "Past"}
                  </span>
                </div>
                
                <div className="col-span-3 flex justify-end gap-1">
                  {(task.status === 'pending' || task.status === 'in_progress') && (
                    <>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 text-success hover:text-success hover:bg-success/10"
                        onClick={() => handleStatusUpdate(task.id, 'completed', task.title)}
                        title="Bajarildi"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleFail(task.id)}
                        title="Muvaffaqiyatsiz"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(task.id)}
                    title="O'chirish"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
