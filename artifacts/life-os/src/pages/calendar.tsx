import { useState } from "react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from "date-fns";
import { uz } from "date-fns/locale";
import { 
  useGetTasks, 
  getGetTasksQueryKey,
} from "@workspace/api-client-react";
import { ChevronLeft, ChevronRight, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  
  // Format API query dates
  const startDateStr = format(monthStart, "yyyy-MM-dd");
  const endDateStr = format(monthEnd, "yyyy-MM-dd");

  const { data: tasks, isLoading } = useGetTasks({
    // We would ideally filter by date range here if the API supported it
    // For now we get all and filter client-side
  }, { 
    query: { queryKey: getGetTasksQueryKey() } 
  });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  // Generate calendar days
  const startDate = startOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: startDate, end: endOfMonth(currentDate) });
  
  // Padding days for first week
  const startDay = startDate.getDay();
  const emptyDays = Array(startDay === 0 ? 6 : startDay - 1).fill(null);

  // Filter tasks for selected date
  const selectedDateTasks = tasks?.filter(t => {
    if (!t.scheduledDate) return false;
    return isSameDay(new Date(t.scheduledDate), selectedDate);
  }) || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto h-[calc(100vh-6rem)] flex flex-col">
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Taqvim</h1>
          <p className="text-muted-foreground">O'z vaqtingizni qadrlang va rejalashtiring</p>
        </div>
        <div className="flex items-center gap-4 bg-background/50 backdrop-blur-sm p-1 rounded-lg border border-border/50">
          <Button variant="ghost" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="w-32 text-center font-semibold capitalize text-lg">
            {format(currentDate, "MMMM yyyy", { locale: uz })}
          </div>
          <Button variant="ghost" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        {/* Calendar Grid */}
        <Card className="flex-1 glass-panel overflow-hidden flex flex-col border-border/50">
          <CardHeader className="bg-muted/10 pb-4 border-b border-border/50 shrink-0">
            <div className="grid grid-cols-7 gap-1 text-center">
              {['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'].map(day => (
                <div key={day} className="text-sm font-bold text-muted-foreground uppercase">{day}</div>
              ))}
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0 grid grid-cols-7 grid-rows-5 md:grid-rows-6 gap-[1px] bg-border/50">
            {emptyDays.map((_, i) => (
              <div key={`empty-${i}`} className="bg-background/40 p-2 opacity-50" />
            ))}
            
            {daysInMonth.map((date, i) => {
              const isSelected = isSameDay(date, selectedDate);
              const isCurrentMonth = isSameMonth(date, currentDate);
              const isCurrentDay = isToday(date);
              
              // Find tasks for this day
              const dayTasks = tasks?.filter(t => t.scheduledDate && isSameDay(new Date(t.scheduledDate), date)) || [];
              const completedCount = dayTasks.filter(t => t.status === 'completed').length;
              const hasUncompleted = dayTasks.length > completedCount;

              return (
                <div 
                  key={i} 
                  onClick={() => setSelectedDate(date)}
                  className={`bg-background p-2 cursor-pointer transition-colors relative group min-h-[80px] md:min-h-0 ${
                    isSelected ? 'ring-2 ring-primary ring-inset bg-primary/5' : 'hover:bg-muted/30'
                  } ${!isCurrentMonth ? 'opacity-40' : ''}`}
                >
                  <div className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full mb-1 ${
                    isCurrentDay ? 'bg-primary text-primary-foreground shadow-md' : 
                    isSelected ? 'text-primary font-bold' : ''
                  }`}>
                    {format(date, "d")}
                  </div>
                  
                  <div className="space-y-1 w-full flex flex-col mt-2">
                    {dayTasks.slice(0, 3).map(task => (
                      <div key={task.id} className={`text-[10px] truncate px-1.5 py-0.5 rounded flex items-center gap-1 ${
                        task.status === 'completed' ? 'bg-success/10 text-success line-through' :
                        task.status === 'missed' ? 'bg-destructive/10 text-destructive' :
                        'bg-primary/10 text-primary font-medium'
                      }`}>
                        <div className={`w-1 h-1 rounded-full shrink-0 ${
                          task.priority === 'urgent' ? 'bg-destructive' :
                          task.priority === 'high' ? 'bg-warning' : 'bg-primary'
                        }`} />
                        <span className="truncate">{task.title}</span>
                      </div>
                    ))}
                    {dayTasks.length > 3 && (
                      <div className="text-[10px] text-muted-foreground pl-1 font-medium">
                        +{dayTasks.length - 3} ta yana
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Selected Day Tasks */}
        <Card className="w-full lg:w-80 xl:w-96 glass-panel flex flex-col shrink-0 border-border/50">
          <CardHeader className="bg-muted/10 border-b border-border/50">
            <CardTitle className="flex justify-between items-center">
              <span>{format(selectedDate, "d MMMM", { locale: uz })}</span>
              {isToday(selectedDate) && (
                <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full font-bold">Bugun</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full rounded-lg" />
                <Skeleton className="h-16 w-full rounded-lg" />
                <Skeleton className="h-16 w-full rounded-lg" />
              </div>
            ) : selectedDateTasks.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-center py-10 opacity-70">
                <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <p className="font-medium">Bu kunga vazifalar yo'q</p>
                <p className="text-sm mt-1">Dam oling yoki yangi vazifa qo'shing</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDateTasks.map(task => (
                  <div key={task.id} className={`p-3 rounded-xl border ${
                    task.status === 'completed' ? 'bg-success/5 border-success/20' :
                    task.status === 'missed' ? 'bg-destructive/5 border-destructive/20' :
                    'bg-background border-border shadow-sm'
                  }`}>
                    <div className="flex justify-between items-start mb-1">
                      <h4 className={`font-semibold text-sm ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                        {task.title}
                      </h4>
                      {task.priority === 'urgent' && <AlertCircle className="w-4 h-4 text-destructive shrink-0" />}
                    </div>
                    {task.scheduledDate && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                        <Clock className="w-3 h-3" />
                        {format(new Date(task.scheduledDate), "HH:mm")}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
