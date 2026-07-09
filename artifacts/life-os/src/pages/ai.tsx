import { useState, useRef, useEffect } from "react";
import { 
  useGetAiMessages, 
  getGetAiMessagesQueryKey,
  useSendAiMessage,
  useGetAiDailyReport,
  getGetAiDailyReportQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Bot, Send, User, AlertTriangle, Lightbulb, Zap, TrendingUp, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";

export default function AiCoach() {
  const queryClient = useQueryClient();
  const [inputMessage, setInputMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: messages, isLoading: messagesLoading } = useGetAiMessages({
    query: { queryKey: getGetAiMessagesQueryKey() }
  });

  const { data: dailyReport, isLoading: reportLoading } = useGetAiDailyReport(
    { date: format(new Date(), "yyyy-MM-dd") },
    { query: { queryKey: getGetAiDailyReportQueryKey({ date: format(new Date(), "yyyy-MM-dd") }) } }
  );

  const sendMessage = useSendAiMessage();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || sendMessage.isPending) return;

    const message = inputMessage;
    setInputMessage("");

    sendMessage.mutate({ data: { content: message } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetAiMessagesQueryKey() });
      }
    });
  };

  const getMessageColor = (type?: string) => {
    switch (type) {
      case 'warning': return 'bg-destructive/10 border-destructive/30 text-destructive-foreground/90';
      case 'encouragement': return 'bg-success/10 border-success/30 text-success-foreground/90';
      case 'advice': return 'bg-primary/10 border-primary/30 text-primary-foreground/90';
      case 'daily_report': return 'bg-info/10 border-info/30 text-info-foreground/90';
      default: return 'bg-background/80 border-border/50 text-foreground';
    }
  };

  const getMessageIcon = (type?: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="w-4 h-4 text-destructive" />;
      case 'encouragement': return <Zap className="w-4 h-4 text-success" />;
      case 'advice': return <Lightbulb className="w-4 h-4 text-primary" />;
      case 'daily_report': return <TrendingUp className="w-4 h-4 text-info" />;
      default: return <Sparkles className="w-4 h-4 text-primary/70" />;
    }
  };

  return (
    <div className="h-[calc(100vh-6rem)] md:h-[calc(100vh-4rem)] max-w-5xl mx-auto flex flex-col md:flex-row gap-6">
      
      {/* Daily Report Sidebar */}
      <div className="w-full md:w-1/3 flex flex-col gap-4 order-2 md:order-1">
        <h1 className="text-3xl font-bold tracking-tight mb-2">AI Murabbiy</h1>
        
        {reportLoading ? (
          <Skeleton className="h-64 w-full rounded-xl" />
        ) : dailyReport ? (
          <Card className={`glass-panel border-l-4 ${
            dailyReport.mood === 'critical' || dailyReport.mood === 'poor' ? 'border-l-destructive' :
            dailyReport.mood === 'excellent' || dailyReport.mood === 'good' ? 'border-l-success' :
            'border-l-warning'
          }`}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5" /> Kunlik Tahlil
              </CardTitle>
              <div className="text-sm text-muted-foreground">{format(new Date(dailyReport.date), "dd MMMM, yyyy")}</div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-background/50 rounded-lg text-sm border border-border/50 leading-relaxed">
                {dailyReport.analysis}
              </div>

              {dailyReport.warnings && dailyReport.warnings.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-destructive uppercase tracking-wider flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> E'tibor qarating
                  </h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    {dailyReport.warnings.map((w, i) => <li key={i}>• {w}</li>)}
                  </ul>
                </div>
              )}

              {dailyReport.compliments && dailyReport.compliments.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-success uppercase tracking-wider flex items-center gap-1">
                    <Zap className="w-3 h-3" /> Yutuqlar
                  </h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    {dailyReport.compliments.map((c, i) => <li key={i}>• {c}</li>)}
                  </ul>
                </div>
              )}

              <div className="pt-2 border-t border-border/50">
                <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Lightbulb className="w-3 h-3" /> Maslahat
                </h4>
                <p className="text-sm italic text-muted-foreground">{dailyReport.recommendation}</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="glass-panel">
            <CardContent className="p-6 text-center text-muted-foreground">
              Bugun uchun tahlil hali mavjud emas. Vazifalarni bajaring.
            </CardContent>
          </Card>
        )}
      </div>

      {/* Chat Interface */}
      <Card className="flex-1 flex flex-col overflow-hidden glass-panel border-primary/20 shadow-[0_0_30px_rgba(var(--primary),0.05)] order-1 md:order-2">
        <CardHeader className="bg-background/80 backdrop-blur-sm border-b py-3 px-4 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
              <Bot className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Murosasiz Murabbiy</CardTitle>
              <div className="text-xs text-success flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse" /> Onlayn
              </div>
            </div>
          </div>
        </CardHeader>

        <div className="flex-1 overflow-hidden relative bg-muted/5">
          {/* Background texture */}
          <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at center, hsl(var(--primary)) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          
          <ScrollArea className="h-full px-4 py-6" ref={scrollRef}>
            {messagesLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-16 w-3/4 rounded-2xl rounded-tl-sm ml-auto" />
                <Skeleton className="h-24 w-3/4 rounded-2xl rounded-tr-sm" />
                <Skeleton className="h-16 w-3/4 rounded-2xl rounded-tl-sm ml-auto" />
              </div>
            ) : messages?.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-50 space-y-4 pt-20">
                <Bot className="w-16 h-16 text-muted-foreground" />
                <p>Murabbiy bilan suhbatni boshlang.<br/>U sizga to'g'ri yo'l ko'rsatishga tayyor.</p>
              </div>
            ) : (
              <div className="space-y-6 flex flex-col justify-end min-h-full">
                <AnimatePresence>
                  {messages?.filter(m => m.role !== 'system').map((msg, i) => {
                    const isUser = msg.role === 'user';
                    
                    return (
                      <motion.div
                        key={msg.id || i}
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className={`flex gap-3 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                      >
                        <div className={`w-8 h-8 rounded-full flex shrink-0 items-center justify-center ${isUser ? 'bg-secondary text-secondary-foreground' : 'bg-primary/20 text-primary border border-primary/30'}`}>
                          {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                        </div>
                        
                        <div className={`p-4 rounded-2xl border ${isUser ? 'bg-primary text-primary-foreground rounded-tr-sm border-primary' : `rounded-tl-sm ${getMessageColor(msg.messageType)}`}`}>
                          {!isUser && msg.messageType && msg.messageType !== 'chat' && (
                            <div className="mb-2 flex items-center gap-1.5 opacity-80 font-bold text-xs uppercase tracking-wider">
                              {getMessageIcon(msg.messageType)}
                              {msg.messageType === 'warning' ? 'Ogohlantirish' :
                               msg.messageType === 'encouragement' ? 'Dalda' :
                               msg.messageType === 'advice' ? 'Maslahat' : 'Tahlil'}
                            </div>
                          )}
                          <div className="text-sm leading-relaxed whitespace-pre-wrap">
                            {msg.content}
                          </div>
                          <div className={`text-[10px] mt-2 opacity-50 text-right`}>
                            {format(new Date(msg.createdAt), "HH:mm")}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                
                {sendMessage.isPending && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-3 max-w-[85%] mr-auto"
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-primary/20 text-primary border border-primary/30">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="p-4 rounded-2xl rounded-tl-sm bg-background/80 border border-border/50">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" />
                        <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0.2s' }} />
                        <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0.4s' }} />
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </ScrollArea>
        </div>

        <div className="p-4 bg-background border-t border-border/50 shrink-0">
          <form onSubmit={handleSend} className="flex gap-2">
            <Input 
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Murabbiyga xabar yozish..." 
              className="bg-muted/50 border-border/50 focus-visible:ring-primary/50 flex-1"
              disabled={sendMessage.isPending}
            />
            <Button 
              type="submit" 
              size="icon" 
              className="shrink-0 rounded-xl"
              disabled={!inputMessage.trim() || sendMessage.isPending}
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
