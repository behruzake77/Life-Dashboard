import { useState, useEffect } from "react";
import { Moon, Sun, Monitor, Bell, Shield, Lock, Smartphone, Globe, EyeOff, Save, Palette } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useTheme } from "next-themes";

const SETTINGS_KEY = "life_os_settings";

const defaultSettings = {
  pushNotifications: true,
  emailReports: false,
  aiStrictness: "high",
  language: "uz",
  soundEffects: true,
  pomodoroAutoBreak: false,
  publicProfile: false,
};

function loadSettings() {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;
  } catch {
    return defaultSettings;
  }
}

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [settings, setSettings] = useState(defaultSettings);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setMounted(true);
    setSettings(loadSettings());
  }, []);

  const updateSetting = (key: keyof typeof settings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const handleSave = () => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      setIsDirty(false);
      toast.success("Sozlamalar saqlandi ✓");
    } catch {
      toast.error("Saqlashda xatolik yuz berdi");
    }
  };

  if (!mounted) return null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sozlamalar</h1>
          <p className="text-muted-foreground">Tizimni o'zingizga moslashtiring</p>
        </div>
        <Button onClick={handleSave} className="gap-2" disabled={!isDirty}>
          <Save className="w-4 h-4" /> {isDirty ? "Saqlash" : "Saqlandi ✓"}
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Theme Settings */}
        <Card className="glass-panel border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Palette className="w-5 h-5 text-primary" /> Tashqi Ko'rinish
            </CardTitle>
            <CardDescription>Ilova dizayni va interfeys sozlamalari</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div>
                <p className="font-medium">Mavzu (Tema)</p>
                <p className="text-sm text-muted-foreground">Yorug' yoki qorong'u rejimni tanlang</p>
              </div>
              <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg border border-border/50 w-fit">
                <Button
                  variant={theme === 'light' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setTheme('light')}
                  className="gap-1.5"
                >
                  <Sun className="w-3.5 h-3.5" /> Yorug'
                </Button>
                <Button
                  variant={theme === 'dark' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setTheme('dark')}
                  className="gap-1.5"
                >
                  <Moon className="w-3.5 h-3.5" /> Qorong'u
                </Button>
                <Button
                  variant={theme === 'system' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setTheme('system')}
                  className="gap-1.5"
                >
                  <Monitor className="w-3.5 h-3.5" /> Tizim
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
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="uz">🇺🇿 O'zbekcha</SelectItem>
                  <SelectItem value="en">🇺🇸 English</SelectItem>
                  <SelectItem value="ru">🇷🇺 Русский</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Pomodoro Settings */}
        <Card className="glass-panel border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Monitor className="w-5 h-5 text-primary" /> Pomodoro Sozlamalari
            </CardTitle>
            <CardDescription>Fokus sessiyalarini sozlang</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">Avtomatik tanaffus</p>
                <p className="text-sm text-muted-foreground">Fokus tugaganda tanaffusni avtomatik boshlash</p>
              </div>
              <Switch
                checked={settings.pomodoroAutoBreak}
                onCheckedChange={(v) => updateSetting('pomodoroAutoBreak', v)}
              />
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
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div>
                <p className="font-medium">Qat'iylik darajasi</p>
                <p className="text-sm text-muted-foreground">Murabbiy sizni qanchalik qattiq nazorat qilishi</p>
              </div>
              <Select value={settings.aiStrictness} onValueChange={(v) => updateSetting('aiStrictness', v)}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="extreme">🔥 Murosasiz (Juda qattiq)</SelectItem>
                  <SelectItem value="high">💪 Qattiqqo'l</SelectItem>
                  <SelectItem value="medium">⚖️ O'rtacha</SelectItem>
                  <SelectItem value="supportive">🤝 Qo'llab-quvvatlovchi</SelectItem>
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
                  <p className="text-sm text-muted-foreground">Brauzerda bildirishnomalar olish</p>
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
                  <p className="font-medium">Haftalik hisobotlar</p>
                  <p className="text-sm text-muted-foreground">Hafta oxirida pochtaga tahlil yuborish</p>
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

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                className="border-destructive/50 text-destructive hover:bg-destructive/10"
                onClick={() => {
                  localStorage.removeItem(SETTINGS_KEY);
                  setSettings(defaultSettings);
                  setIsDirty(false);
                  toast.success("Sozlamalar qayta o'rnatildi");
                }}
              >
                Sozlamalarni tiklash
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
