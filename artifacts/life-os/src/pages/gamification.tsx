import { useState } from "react";
import { 
  useGetGamificationProfile, 
  getGetGamificationProfileQueryKey,
  useGetAchievements,
  getGetAchievementsQueryKey
} from "@workspace/api-client-react";
import { Trophy, Star, Medal, Zap, Crown, Target, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

export default function Gamification() {
  const { data: profile, isLoading: profileLoading } = useGetGamificationProfile({
    query: { queryKey: getGetGamificationProfileQueryKey() }
  });

  const { data: achievements, isLoading: achievementsLoading } = useGetAchievements({
    query: { queryKey: getGetAchievementsQueryKey() }
  });

  const getRarityColor = (rarity?: string) => {
    switch(rarity) {
      case 'legendary': return 'from-orange-500 to-amber-300 text-orange-600 border-orange-500/50 shadow-[0_0_15px_rgba(245,158,11,0.3)]';
      case 'epic': return 'from-purple-600 to-indigo-400 text-purple-500 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.3)]';
      case 'rare': return 'from-blue-500 to-cyan-300 text-blue-500 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.3)]';
      case 'common':
      default: return 'from-slate-400 to-gray-300 text-slate-500 border-slate-500/30';
    }
  };

  const getRarityBg = (rarity?: string) => {
    switch(rarity) {
      case 'legendary': return 'bg-orange-500/10';
      case 'epic': return 'bg-purple-500/10';
      case 'rare': return 'bg-blue-500/10';
      case 'common':
      default: return 'bg-slate-500/10';
    }
  };

  const getRarityLabel = (rarity?: string) => {
    switch(rarity) {
      case 'legendary': return 'Afsonaviy';
      case 'epic': return 'Dostoniy';
      case 'rare': return 'Noyob';
      case 'common':
      default: return 'Oddiy';
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">O'yin Va Darajalar</h1>
        <p className="text-muted-foreground">O'z hayotingizning qahramoniga aylaning</p>
      </div>

      {profileLoading ? (
        <Skeleton className="h-64 w-full rounded-2xl" />
      ) : profile ? (
        <Card className="glass-panel overflow-hidden border-primary/30 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-warning/5" />
          <CardContent className="p-8 relative z-10">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="relative">
                <div className="w-32 h-32 rounded-full border-4 border-primary/30 flex items-center justify-center bg-background shadow-[0_0_30px_rgba(var(--primary),0.2)]">
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Level</div>
                    <div className="text-5xl font-black text-primary">{profile.level}</div>
                  </div>
                </div>
                <div className="absolute -bottom-2 -right-2 bg-warning text-warning-foreground w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-lg border-2 border-background">
                  {profile.grade}
                </div>
              </div>

              <div className="flex-1 w-full space-y-4 text-center md:text-left">
                <div>
                  <h2 className="text-2xl font-bold mb-1">Tajriba Ballari (XP)</h2>
                  <div className="flex justify-between text-sm text-muted-foreground mb-2">
                    <span>{profile.xp} XP</span>
                    <span>{profile.xp + profile.xpToNextLevel} XP (Keyingi daraja)</span>
                  </div>
                  <Progress 
                    value={(profile.xp / (profile.xp + profile.xpToNextLevel)) * 100} 
                    className="h-4"
                    style={{ '--progress-background': 'hsl(var(--primary))' } as any}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Jami to'plangan: <span className="font-bold text-foreground">{profile.totalXp} XP</span>
                  </p>
                </div>

                <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-2">
                  <div className="bg-background/50 border border-border/50 rounded-lg px-4 py-2 flex items-center gap-3">
                    <Star className="w-5 h-5 text-warning" />
                    <div>
                      <div className="text-sm font-bold">{profile.coins}</div>
                      <div className="text-xs text-muted-foreground">Tangalar</div>
                    </div>
                  </div>
                  <div className="bg-background/50 border border-border/50 rounded-lg px-4 py-2 flex items-center gap-3">
                    <Zap className="w-5 h-5 text-info" />
                    <div>
                      <div className="text-sm font-bold">{profile.consecutiveDays || 0} kun</div>
                      <div className="text-xs text-muted-foreground">Ketma-ketlik</div>
                    </div>
                  </div>
                  <div className="bg-background/50 border border-border/50 rounded-lg px-4 py-2 flex items-center gap-3">
                    <Trophy className="w-5 h-5 text-success" />
                    <div>
                      <div className="text-sm font-bold">{profile.disciplineScore}/100</div>
                      <div className="text-xs text-muted-foreground">Intizom</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="space-y-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Medal className="w-6 h-6 text-primary" /> Yutuqlar (Achievements)
        </h2>
        
        {achievementsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array(8).fill(0).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {achievements?.map((achievement, i) => (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className={`h-full relative overflow-hidden transition-all ${
                  achievement.unlocked 
                    ? `border-2 glass-panel ${getRarityColor(achievement.rarity).split(' ').find(c => c.startsWith('border-'))} ${getRarityColor(achievement.rarity).split(' ').find(c => c.startsWith('shadow-'))}` 
                    : 'bg-muted/10 border-dashed opacity-70 grayscale-[0.5]'
                }`}>
                  {!achievement.unlocked && (
                    <div className="absolute top-2 right-2">
                      <Lock className="w-4 h-4 text-muted-foreground opacity-50" />
                    </div>
                  )}
                  
                  {achievement.unlocked && (
                    <div className={`absolute top-0 right-0 px-2 py-0.5 rounded-bl-lg text-[10px] font-bold uppercase tracking-wider ${getRarityBg(achievement.rarity)} ${getRarityColor(achievement.rarity).split(' ').find(c => c.startsWith('text-'))}`}>
                      {getRarityLabel(achievement.rarity)}
                    </div>
                  )}

                  <CardContent className="p-5 flex flex-col items-center text-center h-full">
                    <div className={`text-4xl mb-3 p-3 rounded-2xl ${
                      achievement.unlocked 
                        ? `bg-gradient-to-br ${getRarityColor(achievement.rarity).split(' ').filter(c => c.startsWith('from-') || c.startsWith('to-')).join(' ')} shadow-lg` 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {achievement.unlocked ? achievement.icon : '❓'}
                    </div>
                    
                    <h3 className={`font-bold mb-1 ${achievement.unlocked ? '' : 'text-muted-foreground'}`}>
                      {achievement.unlocked ? achievement.name : 'Yashirin Yutuq'}
                    </h3>
                    
                    <p className="text-xs text-muted-foreground mt-auto">
                      {achievement.unlocked ? achievement.description : achievement.condition}
                    </p>

                    {!achievement.unlocked && achievement.progress !== undefined && achievement.maxProgress && (
                      <div className="w-full mt-4">
                        <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                          <span>Progress</span>
                          <span>{achievement.progress}/{achievement.maxProgress}</span>
                        </div>
                        <Progress value={(achievement.progress / achievement.maxProgress) * 100} className="h-1" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {profile?.dailyQuests && profile.dailyQuests.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Target className="w-6 h-6 text-primary" /> Kunlik Topshiriqlar
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {profile.dailyQuests.map((quest) => (
              <Card key={quest.id} className={`glass-panel ${quest.completed ? 'border-success/50 bg-success/5' : ''}`}>
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className={`font-bold ${quest.completed ? 'line-through text-muted-foreground' : ''}`}>
                      {quest.title}
                    </h3>
                    <div className="flex items-center gap-1 bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded-full">
                      +{quest.xpReward} XP
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4">{quest.description}</p>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{quest.completed ? 'Bajarildi!' : 'Jarayon'}</span>
                      <span>{quest.progress}/{quest.target}</span>
                    </div>
                    <Progress 
                      value={(quest.progress / quest.target) * 100} 
                      className="h-2"
                      style={quest.completed ? { '--progress-background': 'hsl(var(--success))' } as any : undefined}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
