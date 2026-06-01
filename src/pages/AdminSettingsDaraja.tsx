import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, AlertCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface DarajaSettings {
  mpesa_consumer_key: string;
  mpesa_consumer_secret: string;
  mpesa_shortcode: string;
  mpesa_passkey: string;
  mpesa_callback_url: string;
  mpesa_env: "sandbox" | "production";
}

const KEYS = ["mpesa_consumer_key","mpesa_consumer_secret","mpesa_shortcode","mpesa_passkey","mpesa_callback_url","mpesa_env"] as const;

const FIELDS = [
  { key: "mpesa_consumer_key",    label: "Consumer Key",    secret: true,  placeholder: "" },
  { key: "mpesa_consumer_secret", label: "Consumer Secret", secret: true,  placeholder: "" },
  { key: "mpesa_shortcode",       label: "Short Code",      secret: false, placeholder: "e.g. 174379" },
  { key: "mpesa_passkey",         label: "Passkey",         secret: true,  placeholder: "" },
  { key: "mpesa_callback_url",    label: "Callback URL",    secret: false, placeholder: "https://your-project.supabase.co/functions/v1/payment-webhook" },
] as const;

export default function AdminSettingsDaraja() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [settings, setSettings] = useState<DarajaSettings | null>(null);
  const [original, setOriginal] = useState<DarajaSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [visible, setVisible] = useState<Record<string, boolean>>({});

  useEffect(() => {
    supabase.from("admin_settings").select("key, value").in("key", [...KEYS]).then(({ data }) => {
      if (data) {
        const map: any = {};
        data.forEach((r: any) => (map[r.key] = r.value));
        const loaded: DarajaSettings = {
          mpesa_consumer_key:    map.mpesa_consumer_key    ?? "",
          mpesa_consumer_secret: map.mpesa_consumer_secret ?? "",
          mpesa_shortcode:       map.mpesa_shortcode       ?? "",
          mpesa_passkey:         map.mpesa_passkey         ?? "",
          mpesa_callback_url:    map.mpesa_callback_url    ?? "",
          mpesa_env:             map.mpesa_env             ?? "sandbox",
        };
        setSettings(loaded);
        setOriginal(loaded);
      }
      setLoading(false);
    });
  }, []);

  const isDirty = JSON.stringify(settings) !== JSON.stringify(original);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const updates = [
        { key: "mpesa_consumer_key",    value: settings.mpesa_consumer_key    || null },
        { key: "mpesa_consumer_secret", value: settings.mpesa_consumer_secret || null },
        { key: "mpesa_shortcode",       value: settings.mpesa_shortcode       || null },
        { key: "mpesa_passkey",         value: settings.mpesa_passkey         || null },
        { key: "mpesa_callback_url",    value: settings.mpesa_callback_url    || null },
        { key: "mpesa_env",             value: settings.mpesa_env },
      ];
      for (const u of updates) {
        await supabase.from("admin_settings")
          .update({ value: u.value, updated_at: new Date().toISOString() })
          .eq("key", u.key);
      }
      setOriginal(settings);
      toast({ title: "Daraja credentials saved" });
    } catch {
      toast({ title: "Failed to save", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-secondary flex items-center justify-center text-sm text-muted-foreground">
      Loading...
    </div>
  );

  return (
    <div className="min-h-screen bg-secondary">
      <header className="sticky top-0 z-30 h-14 bg-background border-b border-border flex items-center">
        <div className="max-w-7xl mx-auto px-6 w-full flex items-center gap-3">
          <Button variant="ghost" size="icon"
            onClick={() => navigate("/admin", { state: { tab: "settings" } })}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-base font-bold">M-Pesa / Daraja</h1>
            <p className="text-xs text-muted-foreground hidden sm:block">Safaricom STK Push API credentials</p>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Daraja API Credentials</CardTitle>
            <CardDescription>
              From{" "}
              <a href="https://developer.safaricom.co.ke" target="_blank" rel="noopener noreferrer"
                className="text-primary hover:underline">
                developer.safaricom.co.ke
              </a>
              . Stored securely and used only by server-side payment edge functions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Environment */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Environment</Label>
                <p className="text-sm text-muted-foreground mt-1">Use sandbox for testing, production when going live</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm"
                  variant={settings?.mpesa_env === "sandbox" ? "default" : "outline"}
                  onClick={() => settings && setSettings({ ...settings, mpesa_env: "sandbox" })}>
                  Sandbox
                </Button>
                <Button size="sm"
                  variant={settings?.mpesa_env === "production" ? "default" : "outline"}
                  onClick={() => settings && setSettings({ ...settings, mpesa_env: "production" })}>
                  Production
                </Button>
              </div>
            </div>

            {settings?.mpesa_env === "production" && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Production mode charges real M-Pesa accounts. Confirm your credentials before saving.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {FIELDS.map(({ key, label, secret, placeholder }) => (
                <div key={key} className="space-y-1.5">
                  <Label className="text-sm font-medium">{label}</Label>
                  <div className="flex gap-2">
                    <Input
                      type={secret && !visible[key] ? "password" : "text"}
                      value={(settings as any)?.[key] ?? ""}
                      onChange={(e) => settings && setSettings({ ...settings, [key]: e.target.value })}
                      placeholder={placeholder}
                      className="font-mono text-sm"
                    />
                    {secret && (
                      <Button variant="outline" size="icon"
                        onClick={() => setVisible((p) => ({ ...p, [key]: !p[key] }))}>
                        {visible[key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                The Callback URL must be your deployed <strong>payment-webhook</strong> edge function URL.
                Safaricom POSTs payment results to it.
              </AlertDescription>
            </Alert>

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={!isDirty || saving}>
                {saving ? "Saving..." : "Save Credentials"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
