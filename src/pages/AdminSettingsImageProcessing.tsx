import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, AlertCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getRemoveBgCredits, isRemoveBgCreditsLow } from "@/lib/backgroundRemoval";

interface ImageSettings {
  bg_removal_enabled: boolean;
  removebg_api_key: string;
  bg_removal_fallback_order: string[];
  bg_removal_quality: "high" | "medium" | "low";
  require_white_bg_for_recommendations: boolean;
}

const KEYS = ["bg_removal_enabled","removebg_api_key","bg_removal_fallback_order","bg_removal_quality","require_white_bg_for_recommendations"] as const;

const METHOD_LABELS: Record<string, { name: string; desc: string }> = {
  removebg:      { name: "Remove.bg API",          desc: "Cloud-based, most accurate" },
  edge_function: { name: "Supabase Edge Function",  desc: "Server-side processing" },
  client_side:   { name: "Client-Side Processing",  desc: "Browser-based, free but slower" },
};

export default function AdminSettingsImageProcessing() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [settings, setSettings] = useState<ImageSettings | null>(null);
  const [original, setOriginal] = useState<ImageSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [apiKeyVisible, setApiKeyVisible] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);
  const creditsLow = credits !== null && isRemoveBgCreditsLow();

  useEffect(() => {
    setCredits(getRemoveBgCredits());
    supabase.from("admin_settings").select("key, value").in("key", [...KEYS]).then(({ data }) => {
      if (data) {
        const map: any = {};
        data.forEach((r: any) => (map[r.key] = r.value));
        const loaded: ImageSettings = {
          bg_removal_enabled:                  map.bg_removal_enabled ?? true,
          removebg_api_key:                    map.removebg_api_key ?? "",
          bg_removal_fallback_order:           map.bg_removal_fallback_order ?? ["removebg","edge_function","client_side"],
          bg_removal_quality:                  map.bg_removal_quality ?? "high",
          require_white_bg_for_recommendations: map.require_white_bg_for_recommendations ?? true,
        };
        setSettings(loaded);
        setOriginal(loaded);
      }
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const updates = [
        { key: "bg_removal_enabled",                  value: settings.bg_removal_enabled },
        { key: "removebg_api_key",                    value: settings.removebg_api_key || null },
        { key: "bg_removal_fallback_order",           value: settings.bg_removal_fallback_order },
        { key: "bg_removal_quality",                  value: settings.bg_removal_quality },
        { key: "require_white_bg_for_recommendations", value: settings.require_white_bg_for_recommendations },
      ];
      for (const u of updates) {
        await supabase.from("admin_settings")
          .update({ value: u.value, updated_at: new Date().toISOString() })
          .eq("key", u.key);
      }
      setOriginal(settings);
      toast({ title: "Image processing settings saved" });
    } catch {
      toast({ title: "Failed to save", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const isDirty = JSON.stringify(settings) !== JSON.stringify(original);

  const toggleFallback = (method: string) => {
    if (!settings) return;
    const updated = settings.bg_removal_fallback_order.includes(method)
      ? settings.bg_removal_fallback_order.filter((m) => m !== method)
      : [...settings.bg_removal_fallback_order, method];
    setSettings({ ...settings, bg_removal_fallback_order: updated });
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
            <h1 className="text-base font-bold">Image Processing</h1>
            <p className="text-xs text-muted-foreground hidden sm:block">Background removal and product recommendations</p>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Background Removal */}
        <Card>
          <CardHeader>
            <CardTitle>Background Removal</CardTitle>
            <CardDescription>Automatically remove backgrounds from marked product images</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Enable Background Removal</Label>
                <p className="text-sm text-muted-foreground mt-1">Process marked product images automatically</p>
              </div>
              <Button
                variant={settings?.bg_removal_enabled ? "default" : "outline"}
                onClick={() => settings && setSettings({ ...settings, bg_removal_enabled: !settings.bg_removal_enabled })}>
                {settings?.bg_removal_enabled ? "Enabled" : "Disabled"}
              </Button>
            </div>

            {settings?.bg_removal_enabled && (
              <>
                <div className="space-y-3 pt-4 border-t">
                  <Label className="text-base font-medium">Remove.bg API Key</Label>
                  <p className="text-sm text-muted-foreground">
                    Get a free key at{" "}
                    <a href="https://www.remove.bg/api" target="_blank" rel="noopener noreferrer"
                      className="text-primary hover:underline">remove.bg</a>
                  </p>
                  <div className="flex gap-2">
                    <Input
                      type={apiKeyVisible ? "text" : "password"}
                      value={settings?.removebg_api_key ?? ""}
                      onChange={(e) => settings && setSettings({ ...settings, removebg_api_key: e.target.value })}
                      placeholder="Enter your remove.bg API key"
                      className="font-mono text-sm"
                    />
                    <Button variant="outline" onClick={() => setApiKeyVisible(!apiKeyVisible)}>
                      {apiKeyVisible ? "Hide" : "Show"}
                    </Button>
                  </div>
                  {!settings?.removebg_api_key && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>API key not configured — remove.bg method will be skipped.</AlertDescription>
                    </Alert>
                  )}
                </div>

                <div className="space-y-2 pt-4 border-t">
                  <Label className="text-base font-medium">Credits Remaining</Label>
                  {credits !== null ? (
                    <Badge variant={creditsLow ? "destructive" : "secondary"} className="text-base px-3 py-1">
                      {credits} credits
                    </Badge>
                  ) : (
                    <p className="text-sm text-muted-foreground">Tracked after the first request</p>
                  )}
                </div>

                <div className="space-y-3 pt-4 border-t">
                  <Label className="text-base font-medium">Processing Quality</Label>
                  <Select
                    value={settings?.bg_removal_quality}
                    onValueChange={(v: any) => settings && setSettings({ ...settings, bg_removal_quality: v })}>
                    <SelectTrigger className="max-w-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High — best quality, slower</SelectItem>
                      <SelectItem value="medium">Medium — balanced</SelectItem>
                      <SelectItem value="low">Low — faster, lower quality</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <div>
                    <Label className="text-base font-medium">Processing Methods (Priority Order)</Label>
                    <p className="text-sm text-muted-foreground mt-1">If the first method fails, the next is tried automatically</p>
                  </div>
                  <div className="space-y-2">
                    {(["removebg","edge_function","client_side"] as const).map((method) => {
                      const active = settings?.bg_removal_fallback_order.includes(method);
                      const rank   = settings?.bg_removal_fallback_order.indexOf(method);
                      return (
                        <div key={method} className="flex items-center justify-between p-3 border rounded-lg bg-background">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{METHOD_LABELS[method].name}</p>
                            <p className="text-xs text-muted-foreground">{METHOD_LABELS[method].desc}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {active && <Badge variant="outline">#{rank! + 1}</Badge>}
                            <Button size="sm" variant={active ? "default" : "outline"}
                              onClick={() => toggleFallback(method)}>
                              {active ? "Enabled" : "Disabled"}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>At least one enabled method is required.</AlertDescription>
                  </Alert>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Product Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle>Product Recommendations</CardTitle>
            <CardDescription>Control which products appear in recommendation sections</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Require White Background Images</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  When enabled, only products with white background images appear in recommendations.
                </p>
              </div>
              <Button
                variant={settings?.require_white_bg_for_recommendations ? "default" : "outline"}
                onClick={() => settings && setSettings({ ...settings, require_white_bg_for_recommendations: !settings.require_white_bg_for_recommendations })}>
                {settings?.require_white_bg_for_recommendations ? "Required" : "Optional"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => navigate("/admin", { state: { tab: "settings" } })}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!isDirty || saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
