import { useState } from "react";
import { format, subDays } from "date-fns";
import { uz } from "date-fns/locale";
import { 
  useGetDailyReport, 
  getGetDailyReportQueryKey,
  useGetWeeklyReport,
  getGetWeeklyReportQueryKey
} from "@workspace/api-client-react";
import { 
  FileText, Activity, CheckCircle, XCircle, BrainCircuit, 
  TrendingUp, Award, AlertTriangle, Calendar 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

export default function Reports() {
  const [activeTab, setActiveTab] = useState("daily");
  const todayStr = format(new Date(), "yyyy-MM-dd");
  
  const { data: dailyReport, isLoading: dailyLoading } = useGetDailyReport(
    { date: todayStr },
    { query: { queryKey: getGetDailyReportQueryKey({ date: todayStr }) } }
  );

  const { data: weeklyReport, isLoading: weeklyLoading } = useGetWeeklyReport(
    { week: todayStr }, // API uses week string, assuming date string for current week works based on backend
    { query: { queryKey: getGetWeeklyReportQueryKey({ week: todayStr }) } }
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Hisobotlar</h1>
        <p className="text-muted-foreground">Tahlil va xulosalar. O'zingizni obyektiv baholang.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 glass-panel">
          <TabsTrigger value="daily">Kunlik</TabsTrigger>
          <TabsTrigger value="weekly">Haftalik</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="daily" className="space-y-6 mt-0">
            {dailyLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-40 w-full rounded-xl" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Skeleton className="h-64 rounded-xl" />
                  <Skeleton className="h-64 rounded-xl" />
                </div>
              </div>
            ) : dailyReport ? (
              <>
                <Card className={`glass-panel border-l-4 ${
                  dailyReport.grade === 'A+' || dailyReport.grade === 'A' ? 'border-l-success' :
                  dailyReport.grade === 'B' || dailyReport.grade === 'C' ? 'border-l-warning' :
                  'border-l-destructive'
                }`}>
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-6 justify-between items-center">
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <div className={`text-6xl font-black font-mono ${
                            dailyReport.grade === 'A+' || dailyReport.grade === 'A' ? 'text-success' :
                            dailyReport.grade === 'B' || dailyReport.grade === 'C' ? 'text-warning' :
                            'text-destructive'
                          }`}>{dailyReport.grade}</div>
                          <div className="text-sm font-medium text-muted-foreground uppercase tracking-widest mt-1">Baho</div>
                        </div>
                        <div className="space-y-2">
                          <h2 className="text-2xl font-bold">{format(new Date(dailyReport.date), "dd MMMM, yyyy", { locale: uz })}</h2>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1 text-success">
                              <CheckCircle className="w-4 h-4" /> {dailyReport.completed} bajarildi
                            </div>
                            <div className="flex items-center gap-1 text-destructive">
                              <XCircle className="w-4 h-4" /> {dailyReport.missed} muvaffaqiyatsiz
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="w-full md:w-48 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-bold">{dailyReport.progressPercent}%</span>
                        </div>
                        <Progress value={dailyReport.progressPercent} className="h-3" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="glass-panel border-border/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <BrainCircuit className="w-5 h-5 text-primary" /> AI Xulosa
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm leading-relaxed">{dailyReport.aiSummary}</p>
                      
                      <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg">
                        <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Ertaga qilinishi kerak:</h4>
                        <p className="text-sm italic">{dailyReport.aiTomorrow}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="space-y-6">
                    <Card className="glass-panel border-border/50 bg-success/5 border-success/20">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-lg text-success">
                          <Award className="w-5 h-5" /> Eng yaxshi natijalar
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {dailyReport.topCompletions.length > 0 ? (
                          <ul className="space-y-2">
                            {dailyReport.topCompletions.map((item, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm">
                                <CheckCircle className="w-4 h-4 text-success shrink-0 mt-0.5" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">Bugun maqtanishga arzigulik natija yo'q.</p>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="glass-panel border-border/50 bg-destructive/5 border-destructive/20">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-lg text-destructive">
                          <AlertTriangle className="w-5 h-5" /> Kamchiliklar
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {dailyReport.topMisses.length > 0 ? (
                          <ul className="space-y-2">
                            {dailyReport.topMisses.map((item, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm">
                                <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">Bugun muvaffaqiyatsizliklar yo'q. Ajoyib!</p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </>
            ) : (
              <Card className="glass-panel p-12 text-center text-muted-foreground border-dashed">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>Bugun uchun hisobot hali shakllanmadi.</p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="weekly" className="space-y-6 mt-0">
            {weeklyLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-40 w-full rounded-xl" />
                <Skeleton className="h-64 w-full rounded-xl" />
              </div>
            ) : weeklyReport ? (
              <>
                <Card className="glass-panel border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-primary" /> 
                      Hafta Sarhisobi
                    </CardTitle>
                    <CardDescription>
                      {format(new Date(weeklyReport.weekStart), "d MMM", { locale: uz })} - {format(new Date(weeklyReport.weekEnd), "d MMM, yyyy", { locale: uz })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-background/50 p-4 rounded-xl border border-border/50 text-center">
                        <div className="text-3xl font-bold text-success">{weeklyReport.stats.summary.totalCompleted}</div>
                        <div className="text-xs text-muted-foreground mt-1">Bajarildi</div>
                      </div>
                      <div className="bg-background/50 p-4 rounded-xl border border-border/50 text-center">
                        <div className="text-3xl font-bold text-destructive">{weeklyReport.stats.summary.totalMissed}</div>
                        <div className="text-xs text-muted-foreground mt-1">Muvaffaqiyatsiz</div>
                      </div>
                      <div className="bg-background/50 p-4 rounded-xl border border-border/50 text-center">
                        <div className="text-3xl font-bold text-primary">{Math.round(weeklyReport.stats.summary.avgCompletion)}%</div>
                        <div className="text-xs text-muted-foreground mt-1">O'rtacha Samaradorlik</div>
                      </div>
                      <div className="bg-background/50 p-4 rounded-xl border border-border/50 text-center">
                        <div className="text-3xl font-bold text-info">
                          {weeklyReport.stats.summary.totalPomodoroMinutes ? Math.floor(weeklyReport.stats.summary.totalPomodoroMinutes / 60) : 0}s
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">Fokus Vaqti</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-panel border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BrainCircuit className="w-5 h-5 text-primary" /> AI Tahlil va Maslahatlar
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <p className="leading-relaxed">{weeklyReport.aiAnalysis}</p>
                    
                    {weeklyReport.recommendations && weeklyReport.recommendations.length > 0 && (
                      <div>
                        <h4 className="font-bold text-primary mb-3">Keyingi hafta uchun maslahatlar:</h4>
                        <ul className="space-y-3">
                          {weeklyReport.recommendations.map((rec, i) => (
                            <li key={i} className="flex gap-3 bg-muted/20 p-3 rounded-lg border border-border/30">
                              <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 text-xs font-bold">
                                {i + 1}
                              </span>
                              <span className="text-sm pt-0.5">{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="glass-panel p-12 text-center text-muted-foreground border-dashed">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>Ushbu hafta uchun hisobot hali mavjud emas.</p>
              </Card>
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
