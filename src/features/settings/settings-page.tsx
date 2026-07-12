import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Palette,
  Globe,
  Bell,
  Shield,
  Download,
  Trash2,
  Save,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { useAuth } from '../../hooks/useAuth';
import { useProfile } from '../../hooks/useTrips';
import { ThemeToggle } from '../../components/layout/theme-toggle';
import { CURRENCIES } from '../../types/itinerary';

function SectionCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof Palette;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-border/50 transition-all duration-200 hover:border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="rounded-lg bg-primary/10 p-1.5">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function SettingsPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile, upsertProfile } = useProfile();
  const [saving, setSaving] = useState(false);
  const [currency, setCurrency] = useState(profile?.currency || 'USD');
  const [language, setLanguage] = useState('en');

  const handleSave = async () => {
    setSaving(true);
    try {
      await upsertProfile.mutateAsync({
        name: profile?.name || 'Traveler',
        currency,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8"
    >
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-gradient-to-br from-primary to-secondary p-2.5">
            <Palette className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Settings</h1>
            <p className="text-sm text-muted-foreground">
              Manage your application preferences
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {/* Appearance */}
        <SectionCard title="Appearance" icon={Palette}>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-border/50 p-3">
              <div>
                <p className="text-sm font-medium text-foreground">Theme</p>
                <p className="text-xs text-muted-foreground">Switch between light and dark mode</p>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </SectionCard>

        {/* Preferences */}
        <SectionCard title="Preferences" icon={Globe}>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm text-muted-foreground">Preferred Currency</label>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {CURRENCIES.slice(0, 12).map((c) => (
                  <button
                    key={c.code}
                    onClick={() => setCurrency(c.code)}
                    className={`cursor-pointer rounded-xl border p-2 text-center transition-all duration-200 ${
                      currency === c.code
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border hover:border-muted-foreground/30'
                    }`}
                  >
                    <div className="text-lg font-bold">{c.symbol}</div>
                    <div className="text-[10px] text-muted-foreground">{c.code}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Account */}
        <SectionCard title="Account" icon={Shield}>
          <div className="space-y-3">
            <div className="rounded-xl border border-border/50 p-3">
              <p className="text-sm text-muted-foreground">
                Signed in as <span className="font-medium text-foreground">{user?.email}</span>
              </p>
            </div>
            <button
              onClick={() => navigate('/profile')}
              className="flex w-full cursor-pointer items-center justify-between rounded-xl border border-border/50 p-3 text-left transition-colors hover:bg-muted/50"
            >
              <div>
                <p className="text-sm font-medium text-foreground">Travel Profile</p>
                <p className="text-xs text-muted-foreground">Manage travel preferences and style</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
            </button>
          </div>
        </SectionCard>

        {/* Data */}
        <SectionCard title="Data" icon={Download}>
          <div className="space-y-3">
            <button
              className="flex w-full cursor-pointer items-center justify-between rounded-xl border border-border/50 p-3 text-left transition-colors hover:bg-muted/50"
            >
              <div>
                <p className="text-sm font-medium text-foreground">Export My Data</p>
                <p className="text-xs text-muted-foreground">Download all your trips and preferences</p>
              </div>
              <Download className="h-4 w-4 text-muted-foreground/40" />
            </button>
          </div>
        </SectionCard>

        {/* Danger Zone */}
        <Card className="border-destructive/30">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-destructive">
              <div className="rounded-lg bg-destructive/10 p-1.5">
                <Trash2 className="h-4 w-4" />
              </div>
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <button
              onClick={handleSignOut}
              className="flex w-full cursor-pointer items-center justify-between rounded-xl border border-border/50 p-3 text-left transition-colors hover:bg-destructive/5"
            >
              <div>
                <p className="text-sm font-medium text-foreground">Sign Out</p>
                <p className="text-xs text-muted-foreground">Sign out of your account</p>
              </div>
              <LogOut className="h-4 w-4 text-destructive" />
            </button>
          </CardContent>
        </Card>

        {/* Save */}
        <div className="flex items-center justify-between border-t border-border/30 pt-6">
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
