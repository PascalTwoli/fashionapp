import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, CheckCircle, Info, ArrowLeft } from "lucide-react";
import { getRemoveBgCredits, isRemoveBgCreditsLow } from "@/lib/backgroundRemoval";

interface SettingsData {
  bg_removal_enabled: boolean;
  removebg_api_key: string;
  bg_removal_fallback_order: string[];
  bg_removal_quality: "high" | "medium" | "low";
  require_white_bg_for_recommendations: boolean;
}

export default function AdminSettings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [apiKeyVisible, setApiKeyVisible] = useState(false);
  const [creditsRemaining, setCreditsRemaining] = useState<number | null>(null);
  const creditsLow = creditsRemaining !== null && isRemoveBgCreditsLow();

  // Load settings on mount
  useEffect(() => {
    loadSettings();
    checkCredits();
  }, []);

  const checkCredits = () => {
    const credits = getRemoveBgCredits();
    setCreditsRemaining(credits);
  };

  const loadSettings = async () => {
    try {
      setLoading(true);
      console.log("[AdminSettings] Loading settings...");

      const { data, error } = await supabase
        .from("admin_settings")
        .select("key, value")
        .in("key", [
          "bg_removal_enabled",
          "removebg_api_key",
          "bg_removal_fallback_order",
          "bg_removal_quality",
          "require_white_bg_for_recommendations",
        ]);

      if (error) throw error;

      const settingsMap: any = {};
      data?.forEach((item: any) => {
        settingsMap[item.key] = item.value;
      });

      setSettings({
        bg_removal_enabled: settingsMap.bg_removal_enabled ?? true,
        removebg_api_key: settingsMap.removebg_api_key ?? "",
        bg_removal_fallback_order: settingsMap.bg_removal_fallback_order ?? [
          "removebg",
          "edge_function",
          "client_side",
        ],
        bg_removal_quality: settingsMap.bg_removal_quality ?? "high",
        require_white_bg_for_recommendations: settingsMap.require_white_bg_for_recommendations ?? true,
      });

      console.log("[AdminSettings] Settings loaded:", settingsMap);
    } catch (error) {
      console.error("[AdminSettings] Failed to load settings:", error);
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;

    try {
      setSaving(true);
      console.log("[AdminSettings] Saving settings...", settings);

      const updates = [
        {
          key: "bg_removal_enabled",
          value: settings.bg_removal_enabled,
        },
        {
          key: "removebg_api_key",
          value: settings.removebg_api_key || null,
        },
        {
          key: "bg_removal_fallback_order",
          value: settings.bg_removal_fallback_order,
        },
        {
          key: "bg_removal_quality",
          value: settings.bg_removal_quality,
        },
        {
          key: "require_white_bg_for_recommendations",
          value: settings.require_white_bg_for_recommendations,
        },
      ];

      for (const update of updates) {
        const { error } = await supabase
          .from("admin_settings")
          .update({
            value: update.value,
            updated_at: new Date().toISOString(),
          })
          .eq("key", update.key);

        if (error) throw error;
      }

      console.log("[AdminSettings] Settings saved successfully");
      toast({
        title: "Success",
        description: "Settings saved successfully",
      });
    } catch (error) {
      console.error("[AdminSettings] Failed to save settings:", error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleFallback = (method: string) => {
    if (!settings) return;

    const updated = settings.bg_removal_fallback_order.includes(method)
      ? settings.bg_removal_fallback_order.filter((m) => m !== method)
      : [...settings.bg_removal_fallback_order, method];

    setSettings({
      ...settings,
      bg_removal_fallback_order: updated,
    });
  };

  if (loading) {
    return <div className="p-8 text-center">Loading settings...</div>;
  }

  if (!settings) {
    return <div className="p-8 text-center">Failed to load settings</div>;
  }

  return (
    <div className="space-y-6 p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/admin")}
          className="h-10 w-10"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-2">
            Configure application behavior and integrations
          </p>
        </div>
      </div>

      {/* Background Removal Section */}
      <Card>
        <CardHeader>
          <CardTitle>Background Removal for Products</CardTitle>
          <CardDescription>
            Configure automatic background removal for white background product images
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable/Disable */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Enable Background Removal</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Automatically remove backgrounds from marked product images
              </p>
            </div>
            <Button
              variant={settings.bg_removal_enabled ? "default" : "outline"}
              onClick={() =>
                setSettings({
                  ...settings,
                  bg_removal_enabled: !settings.bg_removal_enabled,
                })
              }
            >
              {settings.bg_removal_enabled ? "Enabled" : "Disabled"}
            </Button>
          </div>

          {settings.bg_removal_enabled && (
            <>
              {/* API Key */}
              <div className="space-y-3 pt-4 border-t">
                <Label className="text-base font-medium">Remove.bg API Key</Label>
                <p className="text-sm text-muted-foreground">
                  Get your free API key from{" "}
                  <a
                    href="https://www.remove.bg/api"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    remove.bg
                  </a>
                </p>
                <div className="flex gap-2">
                  <Input
                    type={apiKeyVisible ? "text" : "password"}
                    value={settings.removebg_api_key}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        removebg_api_key: e.target.value,
                      })
                    }
                    placeholder="Enter your remove.bg API key"
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    onClick={() => setApiKeyVisible(!apiKeyVisible)}
                  >
                    {apiKeyVisible ? "Hide" : "Show"}
                  </Button>
                </div>
                {!settings.removebg_api_key && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Remove.bg API key is not configured. The remove.bg method will be skipped.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Credits Display */}
              <div className="space-y-3 pt-4 border-t">
                <Label className="text-base font-medium">API Credits Status</Label>
                <div className="flex items-center gap-3">
                  {creditsRemaining !== null ? (
                    <>
                      <Badge 
                        variant={creditsLow ? "destructive" : "secondary"}
                        className="text-lg px-3 py-2"
                      >
                        {creditsRemaining} Credits Remaining
                      </Badge>
                      {creditsLow && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            Running low on credits! Consider upgrading your plan.
                          </AlertDescription>
                        </Alert>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Credits will be tracked after the first background removal request
                    </p>
                  )}
                </div>
              </div>

              {/* Quality */}
              <div className="space-y-3 pt-4 border-t">
                <Label htmlFor="quality" className="text-base font-medium">
                  Processing Quality
                </Label>
                <Select
                  value={settings.bg_removal_quality}
                  onValueChange={(value: any) =>
                    setSettings({
                      ...settings,
                      bg_removal_quality: value,
                    })
                  }
                >
                  <SelectTrigger id="quality">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High (Best quality, slower)</SelectItem>
                    <SelectItem value="medium">Medium (Balanced)</SelectItem>
                    <SelectItem value="low">Low (Faster, lower quality)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Fallback Order */}
              <div className="space-y-4 pt-4 border-t">
                <div>
                  <Label className="text-base font-medium">
                    Processing Methods (Priority Order)
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    If the first method fails, it will automatically try the next one
                  </p>
                </div>

                <div className="space-y-2">
                  {["removebg", "edge_function", "client_side"].map((method) => (
                    <div
                      key={method}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium capitalize">
                          {method === "removebg" && "Remove.bg API"}
                          {method === "edge_function" && "Supabase Edge Function"}
                          {method === "client_side" && "Client-Side Processing"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {method === "removebg" && "Cloud-based, most accurate"}
                          {method === "edge_function" && "Server-side processing"}
                          {method === "client_side" && "Browser-based, free but slower"}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {settings.bg_removal_fallback_order.includes(method) && (
                          <Badge variant="outline">
                            #{settings.bg_removal_fallback_order.indexOf(method) + 1}
                          </Badge>
                        )}
                        <Button
                          size="sm"
                          variant={
                            settings.bg_removal_fallback_order.includes(method)
                              ? "default"
                              : "outline"
                          }
                          onClick={() => handleToggleFallback(method)}
                        >
                          {settings.bg_removal_fallback_order.includes(method)
                            ? "Enabled"
                            : "Disabled"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Enabled methods will be tried in order. Ensure at least one method is
                    enabled and properly configured.
                  </AlertDescription>
                </Alert>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Recommendations Section */}
      <Card>
        <CardHeader>
          <CardTitle>Product Recommendations</CardTitle>
          <CardDescription>
            Control what products appear in recommendation sections
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* White Background Requirement */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Require White Background Images</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Only show products with white background images in recommendation sections. 
                When disabled, all products can appear.
              </p>
            </div>
            <Button
              variant={settings.require_white_bg_for_recommendations ? "default" : "outline"}
              onClick={() =>
                setSettings({
                  ...settings,
                  require_white_bg_for_recommendations: !settings.require_white_bg_for_recommendations,
                })
              }
            >
              {settings.require_white_bg_for_recommendations ? "Required" : "Optional"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={loadSettings} disabled={saving}>
          Reset
        </Button>
        <Button onClick={saveSettings} disabled={saving}>
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}
