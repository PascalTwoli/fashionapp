import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Eye, EyeOff, Send, CheckCircle, XCircle, Loader2, Info, Plus, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

interface NotificationToggle {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
  category: "customer" | "admin";
}

interface SmtpSettings {
  smtp_host: string;
  smtp_port: string;
  smtp_secure: boolean;
  smtp_username: string;
  smtp_password: string;
  smtp_sender_name: string;
  smtp_sender_email: string;
  smtp_reply_to: string;
}

const SMTP_KEYS = [
  "smtp_host", "smtp_port", "smtp_secure", "smtp_username", "smtp_password",
  "smtp_sender_name", "smtp_sender_email", "smtp_reply_to",
] as const;

const SMTP_DEFAULTS: SmtpSettings = {
  smtp_host: "", smtp_port: "587", smtp_secure: false,
  smtp_username: "", smtp_password: "",
  smtp_sender_name: "FashionUp", smtp_sender_email: "", smtp_reply_to: "",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminSettingsNotifications() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [toggles, setToggles] = useState<NotificationToggle[]>([]);
  const [smtp, setSmtp] = useState<SmtpSettings>(SMTP_DEFAULTS);
  const [originalSmtp, setOriginalSmtp] = useState<SmtpSettings>(SMTP_DEFAULTS);
  const [adminRecipients, setAdminRecipients] = useState<string[]>([]);
  const [recipientInput, setRecipientInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingSmtp, setSavingSmtp] = useState(false);
  const [savingRecipients, setSavingRecipients] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [testStatus, setTestStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [testError, setTestError] = useState("");

  // ── Load ──────────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    setLoading(true);
    const [togglesRes, smtpRes, recipientsRes] = await Promise.all([
      supabase.from("notification_settings").select("key, label, description, enabled, category").order("category").order("key"),
      supabase.from("admin_settings").select("key, value").in("key", [...SMTP_KEYS]),
      supabase.from("admin_settings").select("value").eq("key", "admin_email_recipients").maybeSingle(),
    ]);

    if (togglesRes.data) {
      setToggles(
        togglesRes.data.map((r: any) => ({
          key: r.key, label: r.label, description: r.description ?? "",
          enabled: r.enabled, category: r.category as "customer" | "admin",
        }))
      );
    }

    if (smtpRes.data) {
      const map: Record<string, unknown> = {};
      smtpRes.data.forEach((r: any) => (map[r.key] = r.value));
      const loaded: SmtpSettings = {
        smtp_host:         (map.smtp_host as string)         ?? "",
        smtp_port:         String(map.smtp_port ?? "587"),
        smtp_secure:       (map.smtp_secure as boolean)      ?? false,
        smtp_username:     (map.smtp_username as string)     ?? "",
        smtp_password:     (map.smtp_password as string)     ?? "",
        smtp_sender_name:  (map.smtp_sender_name as string)  ?? "FashionUp",
        smtp_sender_email: (map.smtp_sender_email as string) ?? "",
        smtp_reply_to:     (map.smtp_reply_to as string)     ?? "",
      };
      setSmtp(loaded);
      setOriginalSmtp(loaded);
    }

    if (recipientsRes.data?.value && Array.isArray(recipientsRes.data.value)) {
      setAdminRecipients(recipientsRes.data.value as string[]);
    }

    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Toggle notification setting ───────────────────────────────────────────

  const handleToggle = async (key: string, enabled: boolean) => {
    setToggles(prev => prev.map(t => t.key === key ? { ...t, enabled } : t));
    const { error } = await supabase
      .from("notification_settings")
      .update({ enabled, updated_at: new Date().toISOString() })
      .eq("key", key);
    if (error) {
      toast({ title: "Failed to save", variant: "destructive" });
      setToggles(prev => prev.map(t => t.key === key ? { ...t, enabled: !enabled } : t));
    }
  };

  // ── Save SMTP ─────────────────────────────────────────────────────────────

  const saveSmtp = async () => {
    setSavingSmtp(true);
    try {
      const updates: Array<{ key: string; value: unknown }> = [
        { key: "smtp_host",         value: smtp.smtp_host         || null },
        { key: "smtp_port",         value: parseInt(smtp.smtp_port) || 587 },
        { key: "smtp_secure",       value: smtp.smtp_secure },
        { key: "smtp_username",     value: smtp.smtp_username     || null },
        { key: "smtp_password",     value: smtp.smtp_password     || null },
        { key: "smtp_sender_name",  value: smtp.smtp_sender_name  || "FashionUp" },
        { key: "smtp_sender_email", value: smtp.smtp_sender_email || null },
        { key: "smtp_reply_to",     value: smtp.smtp_reply_to     || null },
      ];
      for (const u of updates) {
        await supabase.from("admin_settings")
          .update({ value: u.value, updated_at: new Date().toISOString() })
          .eq("key", u.key);
      }
      setOriginalSmtp(smtp);
      toast({ title: "Email configuration saved" });
    } catch {
      toast({ title: "Failed to save configuration", variant: "destructive" });
    } finally {
      setSavingSmtp(false);
    }
  };

  // ── Admin recipients ──────────────────────────────────────────────────────

  const addRecipient = () => {
    const email = recipientInput.trim().toLowerCase();
    if (!email || !email.includes("@")) return;
    if (adminRecipients.includes(email)) { setRecipientInput(""); return; }
    setAdminRecipients(prev => [...prev, email]);
    setRecipientInput("");
  };

  const removeRecipient = (email: string) => {
    setAdminRecipients(prev => prev.filter(e => e !== email));
  };

  const saveRecipients = async () => {
    setSavingRecipients(true);
    try {
      await supabase.from("admin_settings")
        .update({ value: adminRecipients, updated_at: new Date().toISOString() })
        .eq("key", "admin_email_recipients");
      toast({ title: "Admin recipients saved" });
    } catch {
      toast({ title: "Failed to save recipients", variant: "destructive" });
    } finally {
      setSavingRecipients(false);
    }
  };

  // ── Test email ────────────────────────────────────────────────────────────

  const sendTestEmail = async () => {
    if (!testEmail || !testEmail.includes("@")) return;
    setTestStatus("sending");
    setTestError("");
    try {
      const { data, error } = await supabase.functions.invoke("send-notification", {
        body: { testEmail },
      });
      if (error || data?.success === false) {
        setTestStatus("error");
        setTestError(data?.error ?? error?.message ?? "Unknown error");
      } else {
        setTestStatus("success");
      }
    } catch (err) {
      setTestStatus("error");
      setTestError(err instanceof Error ? err.message : "Unknown error");
    }
    setTimeout(() => setTestStatus("idle"), 6000);
  };

  // ── Derived state ─────────────────────────────────────────────────────────

  const isDirtySmtp = JSON.stringify(smtp) !== JSON.stringify(originalSmtp);
  const customerToggles = toggles.filter(t => t.category === "customer");
  const adminToggles    = toggles.filter(t => t.category === "admin");

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center text-sm text-muted-foreground">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary">
      <header className="sticky top-0 z-30 h-14 bg-background border-b border-border flex items-center">
        <div className="max-w-7xl mx-auto px-6 w-full flex items-center gap-3">
          <Button variant="ghost" size="icon"
            onClick={() => navigate("/admin", { state: { tab: "settings" } })}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-base font-bold">Notifications</h1>
            <p className="text-xs text-muted-foreground hidden sm:block">Email notification settings</p>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">

        {/* ── Email Configuration ──────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Email Configuration</CardTitle>
            <CardDescription>
              SMTP credentials for outgoing emails. Supports Gmail, SendGrid, Resend, Mailgun, or any SMTP server.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                For Gmail, use an <strong>App Password</strong> (not your account password).
                Enable 2FA on your Google account, then generate one at{" "}
                <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer"
                  className="underline">myaccount.google.com/apppasswords</a>.
              </AlertDescription>
            </Alert>

            {/* Secure toggle */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">SSL / TLS</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Enable for port 465 (SSL). Leave off for port 587 (STARTTLS).
                </p>
              </div>
              <Switch
                checked={smtp.smtp_secure}
                onCheckedChange={v => setSmtp(s => ({ ...s, smtp_secure: v }))}
              />
            </div>

            <Separator />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">SMTP Host</Label>
                <Input
                  value={smtp.smtp_host}
                  onChange={e => setSmtp(s => ({ ...s, smtp_host: e.target.value }))}
                  placeholder="smtp.gmail.com"
                  className="font-mono text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">SMTP Port</Label>
                <Input
                  value={smtp.smtp_port}
                  onChange={e => setSmtp(s => ({ ...s, smtp_port: e.target.value }))}
                  placeholder="587"
                  className="font-mono text-sm"
                  type="number"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Username</Label>
                <Input
                  value={smtp.smtp_username}
                  onChange={e => setSmtp(s => ({ ...s, smtp_username: e.target.value }))}
                  placeholder="you@gmail.com"
                  className="font-mono text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Password / App Password</Label>
                <div className="flex gap-2">
                  <Input
                    type={passwordVisible ? "text" : "password"}
                    value={smtp.smtp_password}
                    onChange={e => setSmtp(s => ({ ...s, smtp_password: e.target.value }))}
                    placeholder="App password"
                    className="font-mono text-sm"
                  />
                  <Button variant="outline" size="icon"
                    onClick={() => setPasswordVisible(v => !v)}>
                    {passwordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Sender Name</Label>
                <Input
                  value={smtp.smtp_sender_name}
                  onChange={e => setSmtp(s => ({ ...s, smtp_sender_name: e.target.value }))}
                  placeholder="FashionUp"
                  className="text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Sender Email</Label>
                <Input
                  value={smtp.smtp_sender_email}
                  onChange={e => setSmtp(s => ({ ...s, smtp_sender_email: e.target.value }))}
                  placeholder="orders@fashionup.co.ke"
                  className="font-mono text-sm"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-sm font-medium">Reply-To (optional)</Label>
                <Input
                  value={smtp.smtp_reply_to}
                  onChange={e => setSmtp(s => ({ ...s, smtp_reply_to: e.target.value }))}
                  placeholder="support@fashionup.co.ke"
                  className="font-mono text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={saveSmtp} disabled={!isDirtySmtp || savingSmtp}>
                {savingSmtp ? "Saving..." : "Save Configuration"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── Test Email ───────────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Send Test Email</CardTitle>
            <CardDescription>
              Verify your SMTP configuration by sending a test email.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="recipient@example.com"
                value={testEmail}
                onChange={e => setTestEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendTestEmail()}
                className="text-sm"
              />
              <Button
                onClick={sendTestEmail}
                disabled={testStatus === "sending" || !testEmail}
                className="gap-2 shrink-0"
              >
                {testStatus === "sending" ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</>
                ) : (
                  <><Send className="h-4 w-4" /> Send Test</>
                )}
              </Button>
            </div>
            {testStatus === "success" && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="h-4 w-4 shrink-0" />
                Test email sent successfully.
              </div>
            )}
            {testStatus === "error" && (
              <div className="flex items-start gap-2 text-sm text-destructive">
                <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{testError || "Failed to send test email. Check your SMTP settings."}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Admin Recipients ─────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Admin Email Recipients</CardTitle>
            <CardDescription>
              These addresses receive admin notifications (new orders, payment alerts, cancellations).
              Add multiple addresses for different teams.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="orders@fashionup.co.ke"
                value={recipientInput}
                onChange={e => setRecipientInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addRecipient(); } }}
                className="text-sm"
              />
              <Button variant="outline" size="icon" onClick={addRecipient}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {adminRecipients.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {adminRecipients.map(email => (
                  <Badge key={email} variant="secondary" className="gap-1.5 pr-1">
                    {email}
                    <button
                      onClick={() => removeRecipient(email)}
                      className="ml-0.5 hover:text-destructive transition-colors"
                      aria-label={`Remove ${email}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No admin recipients configured. Admin notifications will be skipped.</p>
            )}
            <div className="flex justify-end">
              <Button variant="outline" onClick={saveRecipients} disabled={savingRecipients}>
                {savingRecipients ? "Saving..." : "Save Recipients"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── Customer Notification Toggles ────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Notifications</CardTitle>
            <CardDescription>
              Control which emails are sent to customers when their order status changes.
            </CardDescription>
          </CardHeader>
          <CardContent className="divide-y divide-border">
            {customerToggles.map(toggle => (
              <div key={toggle.key} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                <div className="pr-4">
                  <p className="text-sm font-medium">{toggle.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{toggle.description}</p>
                </div>
                <Switch
                  checked={toggle.enabled}
                  onCheckedChange={v => handleToggle(toggle.key, v)}
                />
              </div>
            ))}
            {customerToggles.length === 0 && (
              <p className="text-sm text-muted-foreground py-2">No customer notification settings found.</p>
            )}
          </CardContent>
        </Card>

        {/* ── Admin Notification Toggles ───────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Admin Notifications</CardTitle>
            <CardDescription>
              Control which internal alerts are sent to your admin email recipients.
            </CardDescription>
          </CardHeader>
          <CardContent className="divide-y divide-border">
            {adminToggles.map(toggle => (
              <div key={toggle.key} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                <div className="pr-4">
                  <p className="text-sm font-medium">{toggle.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{toggle.description}</p>
                </div>
                <Switch
                  checked={toggle.enabled}
                  onCheckedChange={v => handleToggle(toggle.key, v)}
                />
              </div>
            ))}
            {adminToggles.length === 0 && (
              <p className="text-sm text-muted-foreground py-2">No admin notification settings found.</p>
            )}
          </CardContent>
        </Card>

        {/* ── Future ───────────────────────────────────────────────────────── */}
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-muted-foreground">Coming Soon</CardTitle>
            <CardDescription>
              These notification channels are planned for future releases.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { label: "SMS Notifications", desc: "Africa's Talking / Twilio" },
                { label: "Push Notifications", desc: "Web & mobile push via Firebase" },
                { label: "WhatsApp", desc: "WhatsApp Business API" },
              ].map(({ label, desc }) => (
                <div key={label} className="p-4 bg-secondary rounded-none border border-dashed border-border opacity-60">
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
