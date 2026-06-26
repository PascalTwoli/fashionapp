import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Info, MessageCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { WhatsAppSettings } from "@/hooks/useWhatsAppSettings";

const LOCATION_OPTIONS = [
  { value: "product_page", label: "Product Page" },
  { value: "quick_view", label: "Product Quick View" },
  { value: "wishlist", label: "Wishlist" },
  { value: "search", label: "Search Results" },
  { value: "cart", label: "Cart Page" },
];

const DEFAULT_TEMPLATE = `Hello FashionUp! 👋

I'm interested in this product:

📦 Product: {{product_name}}
💰 Price: {{price}}
🎨 Color: {{color}}
📏 Size: {{size}}

🔗 View Product:
{{product_link}}

Can I get more details?`;

export default function AdminSettingsWhatsApp() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [settings, setSettings] = useState<WhatsAppSettings>({
    enabled: false,
    number: "254759981287",
    template: DEFAULT_TEMPLATE,
    buttonText: "Chat on WhatsApp",
    locations: ["product_page", "quick_view", "wishlist", "search"],
    openMode: "new_tab",
  });
  
  const [original, setOriginal] = useState<WhatsAppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("admin_settings")
        .select("key, value")
        .in("key", [
          "whatsapp_enabled",
          "whatsapp_number",
          "whatsapp_message_template",
          "whatsapp_button_text",
          "whatsapp_locations",
          "whatsapp_open_mode",
        ]);

      if (error) throw error;

      if (data && data.length > 0) {
        const loadedSettings: Partial<WhatsAppSettings> = {};
        
        data.forEach((item) => {
          const value = item.value;
          
          switch (item.key) {
            case "whatsapp_enabled":
              loadedSettings.enabled = value === true || value === "true";
              break;
            case "whatsapp_number":
              loadedSettings.number = typeof value === "string" ? value : String(value);
              break;
            case "whatsapp_message_template":
              loadedSettings.template = typeof value === "string" ? value : String(value);
              break;
            case "whatsapp_button_text":
              loadedSettings.buttonText = typeof value === "string" ? value : String(value);
              break;
            case "whatsapp_locations":
              loadedSettings.locations = Array.isArray(value) ? value : [];
              break;
            case "whatsapp_open_mode":
              loadedSettings.openMode = (value === "new_tab" || value === "same_tab") ? value : "new_tab";
              break;
          }
        });

        const merged = { ...settings, ...loadedSettings };
        setSettings(merged);
        setOriginal(merged);
      } else {
        setOriginal(settings);
      }
    } catch (error) {
      console.error("[AdminSettingsWhatsApp] Load error:", error);
      toast({ title: "Failed to load settings", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = [
        { key: "whatsapp_enabled", value: settings.enabled },
        { key: "whatsapp_number", value: settings.number },
        { key: "whatsapp_message_template", value: settings.template },
        { key: "whatsapp_button_text", value: settings.buttonText },
        { key: "whatsapp_locations", value: settings.locations },
        { key: "whatsapp_open_mode", value: settings.openMode },
      ];

      for (const update of updates) {
        const { error } = await supabase
          .from("admin_settings")
          .update({ 
            value: update.value, 
            updated_at: new Date().toISOString() 
          })
          .eq("key", update.key);

        if (error) throw error;
      }

      setOriginal(settings);
      toast({ title: "WhatsApp settings saved successfully" });
      
      // Invalidate cache to force immediate refetch across all pages
      queryClient.invalidateQueries({ queryKey: ["whatsapp-settings"] });
      
      // Force refetch settings after save
      await loadSettings();
    } catch (error: any) {
      console.error("[AdminSettingsWhatsApp] Save error:", error);
      toast({ 
        title: "Failed to save settings", 
        description: error?.message || "Unknown error",
        variant: "destructive" 
      });
    } finally {
      setSaving(false);
    }
  };

  const isDirty = JSON.stringify(settings) !== JSON.stringify(original);

  const toggleLocation = (location: string) => {
    setSettings((prev) => ({
      ...prev,
      locations: prev.locations.includes(location)
        ? prev.locations.filter((l) => l !== location)
        : [...prev.locations, location],
    }));
  };

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
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/admin", { state: { tab: "settings" } })}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-base font-bold">WhatsApp Chat</h1>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Product inquiry via WhatsApp
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Enable WhatsApp */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              WhatsApp Settings
            </CardTitle>
            <CardDescription>
              Enable customers to inquire about products via WhatsApp
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Enable Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Enable WhatsApp Chat</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Show WhatsApp button across the platform
                </p>
              </div>
              <Button
                size="sm"
                variant={settings.enabled ? "default" : "outline"}
                onClick={() => setSettings({ ...settings, enabled: !settings.enabled })}
              >
                {settings.enabled ? "Enabled" : "Disabled"}
              </Button>
            </div>

            {/* Business Number */}
            <div className="space-y-2">
              <Label htmlFor="whatsapp-number">WhatsApp Business Number</Label>
              <Input
                id="whatsapp-number"
                type="text"
                value={settings.number}
                onChange={(e) => setSettings({ ...settings, number: e.target.value })}
                placeholder="254759981287"
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Include country code without + sign (e.g., 254759981287 for Kenya)
              </p>
            </div>

            {/* Button Text */}
            <div className="space-y-2">
              <Label htmlFor="button-text">Button Text</Label>
              <Input
                id="button-text"
                type="text"
                value={settings.buttonText}
                onChange={(e) => setSettings({ ...settings, buttonText: e.target.value })}
                placeholder="Chat on WhatsApp"
              />
              <p className="text-xs text-muted-foreground">
                Text displayed on the WhatsApp button
              </p>
            </div>

            {/* Message Template */}
            <div className="space-y-2">
              <Label htmlFor="message-template">Message Template</Label>
              <Textarea
                id="message-template"
                value={settings.template}
                onChange={(e) => setSettings({ ...settings, template: e.target.value })}
                rows={10}
                className="font-mono text-sm"
              />
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  <strong>Available variables:</strong> {"{"}{"{"} product_name {"}"}{"}"}
                  , {"{"}{"{"} price {"}"}{"}"}
                  , {"{"}{"{"} color {"}"}{"}"}
                  , {"{"}{"{"} size {"}"}{"}"}
                  , {"{"}{"{"} product_link {"}"}{"}"}
                  <br />
                  These will be replaced with actual product details.
                </AlertDescription>
              </Alert>
            </div>

            {/* Show Button On */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Show WhatsApp Button On</Label>
              <div className="space-y-2">
                {LOCATION_OPTIONS.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={option.value}
                      checked={settings.locations.includes(option.value)}
                      onCheckedChange={() => toggleLocation(option.value)}
                    />
                    <label
                      htmlFor={option.value}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {option.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Open Behavior */}
            <div className="space-y-2">
              <Label className="text-base font-medium">Open Behavior</Label>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={settings.openMode === "new_tab" ? "default" : "outline"}
                  onClick={() => setSettings({ ...settings, openMode: "new_tab" })}
                >
                  New Tab
                </Button>
                <Button
                  size="sm"
                  variant={settings.openMode === "same_tab" ? "default" : "outline"}
                  onClick={() => setSettings({ ...settings, openMode: "same_tab" })}
                >
                  Same Tab
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                How WhatsApp should open when button is clicked
              </p>
            </div>

            {/* Save Button */}
            <div className="flex justify-between items-center pt-4 border-t">
              {isDirty && (
                <p className="text-sm text-amber-600">You have unsaved changes</p>
              )}
              <div className={isDirty ? "ml-auto" : "w-full flex justify-end"}>
                <Button onClick={handleSave} disabled={!isDirty || saving}>
                  {saving ? "Saving..." : "Save Settings"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
