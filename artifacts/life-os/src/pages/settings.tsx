import { useState, useEffect } from "react";
import { Moon, Sun, Monitor, Bell, Shield, Lock, Smartphone, Globe, EyeOff, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useTheme } from "next-themes";

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // Settings state
  const [settings, setSettings] = useState({
    pushNotifications: true,
    emailReports: true,
    aiStrictness: "high",
    language: "uz",
    soundEffects: true,
    pomodoroAutoBreak: false,
    publicProfile: false
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSave = () => {
    toast.success("Sozlamalar saqlandi");
  };

  const updateSetting = (key: keyof typeof settings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (!mounted) return null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sozlamalar</h1>
          <p className="text-muted-foreground">Tizimni o'zingizga moslashtiring</p>
        </div>
        <Button onClick={handleSave} className="gap-2">
          <Save className="w-4 h-4" /> Saqlash
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Appearance Settings */}
        <Card className="glass-panel border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Monitor className="w-5 h-5 text-primary" /> Tashqi ko'rinish
            </CardTitle>
            <CardDescription>Ilova dizayni va interfeys sozlamalari</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">Mavzu (Theme)</p>
                <p className="text-sm text-muted-foreground">Yorug' yoki qorong'u rejimni tanlang</p>
              </div>
              <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg border border-border/50">
                <Button 
                  variant={theme === 'light' ? 'default' : 'ghost'} 
                  size="sm" 
                  className={theme === 'light' ? 'shadow-sm' : ''}
                  onClick={() => setTheme('light')}
                >
                  <Sun className="w-4 h-4 mr-2" /> Yorug'
                </Button>
                <Button 
                  variant={theme === 'dark' ? 'default' : 'ghost'} 
                  size="sm"
                  className={theme === 'dark' ? 'shadow-sm' : ''}
                  onClick={() => setTheme('dark')}
                >
                  <Moon className="w-4 h-4 mr-2" /> Qorong'u
                </Button>
                <Button 
                  variant={theme === 'system' ? 'default' : 'ghost'} 
                  size="sm"
                  className={theme === 'system' ? 'shadow-sm' : ''}
                  onClick={() => setTheme('system')}
                >
                  <Monitor className="w-4 h-4 mr-2" /> Tizim
                </Button>
              </div>
            </div>

            <Separator />

            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">Ovoz effektlari</p>
                <p className="text-sm text-muted-foreground">Tugmalar va bildirishnomalar uchun ovozlar</p>
              </div>
              <Switch 
                checked={settings.soundEffects} 
                onCheckedChange={(v) => updateSetting('soundEffects', v)} 
              />
            </div>
            
            <Separator />

            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">Til</p>
                <p className="text-sm text-muted-foreground">Interfeys tilini o'zgartirish</p>
              </div>
              <Select value={settings.language} onValueChange={(v) => updateSetting('language', v)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tilni tanlang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="uz">O'zbekcha</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ru">Русский</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* AI Settings */}
        <Card className="glass-panel border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="w-5 h-5 text-primary" /> AI Murabbiy Sozlamalari
            </CardTitle>
            <CardDescription>AI siz bilan qanday muomalada bo'lishini belgilang</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">Qat'iylik darajasi</p>
                <p className="text-sm text-muted-foreground">Murabbiy sizni qanchalik qattiq nazorat qilishi</p>
              </div>
              <Select value={settings.aiStrictness} onValueChange={(v) => updateSetting('aiStrictness', v)}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Darajani tanlang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="extreme">Murosasiz (Juda qattiq)</SelectItem>
                  <SelectItem value="high">Qattiqqo'l</SelectItem>
                  <SelectItem value="medium">O'rtacha</SelectItem>
                  <SelectItem value="supportive">Qo'llab-quvvatlovchi</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="glass-panel border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bell className="w-5 h-5 text-primary" /> Bildirishnomalar
            </CardTitle>
            <CardDescription>Eslatmalar va xabarlar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex items-start gap-3">
                <Smartphone className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Push bildirishnomalar</p>
                  <p className="text-sm text-muted-foreground">Brauzerda va qurilmada bildirishnomalar olish</p>
                </div>
              </div>
              <Switch 
                checked={settings.pushNotifications} 
                onCheckedChange={(v) => updateSetting('pushNotifications', v)} 
              />
            </div>
            
            <Separator />

            <div className="flex justify-between items-center">
              <div className="flex items-start gap-3">
                <Globe className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Haftalik Email hisobotlar</p>
                  <p className="text-sm text-muted-foreground">Hafta oxirida pochtangizga tahlil yuborish</p>
                </div>
              </div>
              <Switch 
                checked={settings.emailReports} 
                onCheckedChange={(v) => updateSetting('emailReports', v)} 
              />
            </div>
          </CardContent>
        </Card>

        {/* Privacy */}
        <Card className="glass-panel border-border/50 border-destructive/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-destructive">
              <Lock className="w-5 h-5" /> Maxfiylik va Xavfsizlik
            </CardTitle>
            <CardDescription>Ma'lumotlaringiz xavfsizligi</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex items-start gap-3">
                <EyeOff className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Ommaviy profil</p>
                  <p className="text-sm text-muted-foreground">Yutuqlaringiz va darajangiz boshqalarga ko'rinishi</p>
                </div>
              </div>
              <Switch 
                checked={settings.publicProfile} 
                onCheckedChange={(v) => updateSetting('publicProfile', v)} 
              />
            </div>

            <Separator />
            
            <div className="pt-2">
              <Button variant="destructive" className="w-full sm:w-auto">
                Hisobni o'chirish (Barcha ma'lumotlar o'chadi)
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
