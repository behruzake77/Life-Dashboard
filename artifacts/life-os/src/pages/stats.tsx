import { useState } from "react";
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from "date-fns";
import { uz } from "date-fns/locale";
import { 
  useGetWeeklyStats, 
  getGetWeeklyStatsQueryKey,
  useGetMonthlyStats,
  getGetMonthlyStatsQueryKey,
  useGetHeatmap,
  getGetHeatmapQueryKey
} from "@workspace/api-client-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from "recharts";
import { Activity, TrendingUp, TrendingDown, Target, Clock, CalendarDays, Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";

export default function Stats() {
  const [activeTab, setActiveTab] = useState("weekly");
  const today = new Date();
  
  const { data: weeklyData, isLoading: weeklyLoading } = useGetWeeklyStats(
    { week: format(startOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd") },
    { query: { queryKey: getGetWeeklyStatsQueryKey({ week: format(startOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd") }) } }
  );

  const { data: monthlyData, isLoading: monthlyLoading } = useGetMonthlyStats(
    { month: format(today, "yyyy-MM") },
    { query: { queryKey: getGetMonthlyStatsQueryKey({ month: format(today, "yyyy-MM") }) } }
  );

  const { data: heatmapData, isLoading: heatmapLoading } = useGetHeatmap(
    { days: 90 },
    { query: { queryKey: getGetHeatmapQueryKey({ days: 90 }) } }
  );

  // Radar chart dummy data based on domain model
  const categoryData = [
    { subject: 'Ish', A: 80, fullMark: 100 },
    { subject: 'Sog\'liq', A: 60, fullMark: 100 },
    { subject: 'Ta\'lim', A: 90, fullMark: 100 },
    { subject: 'Oila', A: 70, fullMark: 100 },
    { subject: 'Sport', A: 40, fullMark: 100 },
    { subject: 'Dam olish', A: 50, fullMark: 100 },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Statistika</h1>
        <p className="text-muted-foreground">Raqamlar aldamaydi. Natijalaringizni tahlil qiling.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 glass-panel">
          <TabsTrigger value="weekly">Haftalik Tahlil</TabsTrigger>
          <TabsTrigger value="monthly">Oylik Tahlil</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="weekly" className="space-y-6 mt-0">
            {weeklyLoading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
              </div>
            ) : weeklyData ? (
              <>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card className="glass-panel">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Bajarildi</CardTitle>
                      <Target className="h-4 w-4 text-success" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold font-mono">{weeklyData.summary.totalCompleted}</div>
                      <p className="text-xs text-muted-foreground mt-1 text-success flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" /> O'tgan haftadan yaxshiroq
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="glass-panel">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">O'rtacha Samaradorlik</CardTitle>
                      <Activity className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold font-mono">{Math.round(weeklyData.summary.avgCompletion)}%</div>
                      <p className="text-xs text-muted-foreground mt-1 text-warning flex items-center gap-1">
                        Yaxshilash mumkin
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="glass-panel">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Fokus Vaqti</CardTitle>
                      <Clock className="h-4 w-4 text-info" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold font-mono">
                        {Math.floor((weeklyData.summary.totalPomodoroMinutes || 0) / 60)}s {(weeklyData.summary.totalPomodoroMinutes || 0) % 60}d
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 text-success flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" /> +20% o'sish
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="glass-panel">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Eng Yaxshi Kun</CardTitle>
                      <Award className="h-4 w-4 text-warning" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold capitalize">
                        {weeklyData.summary.bestDay ? format(new Date(weeklyData.summary.bestDay), "EEEE", { locale: uz }) : 'Yo\'q'}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        100% bajarilish
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <Card className="glass-panel border-border/50">
                    <CardHeader>
                      <CardTitle>Kunlik Samaradorlik</CardTitle>
                      <CardDescription>Hafta davomida vazifalarning bajarilish darajasi (%)</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={weeklyData.days} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                          <XAxis 
                            dataKey="date" 
                            tickFormatter={(val) => format(new Date(val), "E", { locale: uz })} 
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis 
                            stroke="hsl(var(--muted-foreground))" 
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            domain={[0, 100]}
                          />
                          <Tooltip 
                            contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                            itemStyle={{ color: 'hsl(var(--foreground))' }}
                            labelFormatter={(val) => format(new Date(val), "EEEE, d MMM", { locale: uz })}
                          />
                          <Bar 
                            dataKey="percent" 
                            fill="hsl(var(--primary))" 
                            radius={[4, 4, 0, 0]} 
                            barSize={30}
                            name="Samaradorlik"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card className="glass-panel border-border/50">
                    <CardHeader>
                      <CardTitle>Balans tahlili</CardTitle>
                      <CardDescription>Turli yo'nalishlardagi faolligingiz</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={categoryData}>
                          <PolarGrid stroke="hsl(var(--border))" />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                          <Radar name="Faollik" dataKey="A" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.4} />
                          <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </>
            ) : null}
          </TabsContent>

          <TabsContent value="monthly" className="space-y-6 mt-0">
             {monthlyLoading ? (
               <Skeleton className="h-[400px] w-full rounded-xl" />
             ) : monthlyData ? (
               <Card className="glass-panel border-border/50">
                 <CardHeader>
                   <CardTitle>Oylik Progress Treki</CardTitle>
                   <CardDescription>Oylik maqsadlaringizga erishish dinamikasi</CardDescription>
                 </CardHeader>
                 <CardContent className="h-[400px] w-full">
                   <ResponsiveContainer width="100%" height="100%">
                     <AreaChart data={monthlyData.weeks} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                       <defs>
                         <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                           <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                         </linearGradient>
                       </defs>
                       <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                       <XAxis 
                         dataKey="weekStart" 
                         tickFormatter={(val, i) => `${i + 1}-Hafta`} 
                         stroke="hsl(var(--muted-foreground))"
                         fontSize={12}
                         tickLine={false}
                         axisLine={false}
                       />
                       <YAxis 
                         stroke="hsl(var(--muted-foreground))" 
                         fontSize={12}
                         tickLine={false}
                         axisLine={false}
                       />
                       <Tooltip 
                         contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                       />
                       <Area 
                         type="monotone" 
                         dataKey="avgCompletion" 
                         stroke="hsl(var(--primary))" 
                         fillOpacity={1} 
                         fill="url(#colorValue)" 
                         name="Samaradorlik %"
                       />
                     </AreaChart>
                   </ResponsiveContainer>
                 </CardContent>
               </Card>
             ) : null}
          </TabsContent>
        </div>
      </Tabs>

      {/* Heatmap Activity */}
      <Card className="glass-panel overflow-hidden border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-primary" /> 
            Faollik Xaritasi (So'nggi 90 kun)
          </CardTitle>
          <CardDescription>Qancha quyuq bo'lsa, shuncha yaxshi</CardDescription>
        </CardHeader>
        <CardContent className="pb-6">
          {heatmapLoading ? (
            <Skeleton className="h-32 w-full rounded-md" />
          ) : heatmapData ? (
            <div className="flex flex-wrap gap-[3px] sm:gap-1 p-2 bg-background/50 rounded-lg overflow-x-auto">
              {heatmapData.map((day, i) => {
                const date = new Date(day.date);
                // Calculate color intensity based on level
                let colorClass = "bg-muted/50";
                if (day.level === 1) colorClass = "bg-primary/20 border border-primary/20";
                if (day.level === 2) colorClass = "bg-primary/40 border border-primary/30";
                if (day.level === 3) colorClass = "bg-primary/70 border border-primary/50 text-white";
                if (day.level === 4) colorClass = "bg-primary text-primary-foreground shadow-[0_0_8px_rgba(var(--primary),0.6)]";
                if (day.level === 5) colorClass = "bg-primary text-primary-foreground shadow-[0_0_12px_rgba(var(--primary),0.8)]";

                return (
                  <div
                    key={i}
                    title={`${format(date, "d MMM, yyyy", { locale: uz })}: ${day.count} vazifa`}
                    className={`w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 rounded-sm sm:rounded-[3px] ${colorClass} transition-all hover:scale-125 hover:z-10`}
                  />
                );
              })}
            </div>
          ) : (
             <div className="text-center py-6 text-muted-foreground">Ma'lumot topilmadi</div>
          )}
          <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground justify-end pr-2">
            <span>Sust</span>
            <div className="w-3 h-3 rounded-sm bg-muted/50"></div>
            <div className="w-3 h-3 rounded-sm bg-primary/30"></div>
            <div className="w-3 h-3 rounded-sm bg-primary/60"></div>
            <div className="w-3 h-3 rounded-sm bg-primary"></div>
            <div className="w-3 h-3 rounded-sm bg-primary shadow-[0_0_8px_rgba(var(--primary),0.6)]"></div>
            <span>Faol</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
