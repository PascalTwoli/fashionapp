import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface WhatsAppSettings {
  enabled: boolean;
  number: string;
  template: string;
  buttonText: string;
  locations: string[];
  openMode: "new_tab" | "same_tab";
}

const DEFAULT_SETTINGS: WhatsAppSettings = {
  enabled: false,
  number: "254759981287",
  template: `Hello FashionUp! 👋

I'm interested in this product:

📦 Product: {{product_name}}
💰 Price: {{price}}
🎨 Color: {{color}}
📏 Size: {{size}}

🔗 View Product:
{{product_link}}

Can I get more details?`,
  buttonText: "Chat on WhatsApp",
  locations: ["product_page", "quick_view", "wishlist", "search"],
  openMode: "new_tab",
};

/**
 * Fetch WhatsApp settings from admin_settings table
 */
export const useWhatsAppSettings = () => {
  return useQuery({
    queryKey: ["whatsapp-settings"],
    queryFn: async (): Promise<WhatsAppSettings> => {
      const { data, error } = await supabase
        .from("admin_settings" as any)
        .select("key, value")
        .in("key", [
          "whatsapp_enabled",
          "whatsapp_number",
          "whatsapp_template",
          "whatsapp_button_text",
          "whatsapp_locations",
          "whatsapp_open_mode",
          "whatsapp_message_template",
        ]) as any;

      if (error) {
        console.error("[useWhatsAppSettings] Error fetching settings:", error);
        return DEFAULT_SETTINGS;
      }

      if (!data || data.length === 0) {
        return DEFAULT_SETTINGS;
      }

      // Parse settings from database
      const settings: Partial<WhatsAppSettings> = {};

      data.forEach((item) => {
        const value = item.value;

        switch (item.key) {
          case "whatsapp_enabled":
            settings.enabled = value === true || value === "true";
            break;
          case "whatsapp_number":
            settings.number = typeof value === "string" ? value : String(value || DEFAULT_SETTINGS.number);
            break;
          case "whatsapp_message_template":
          case "whatsapp_template":
            settings.template = typeof value === "string" ? value : String(value || DEFAULT_SETTINGS.template);
            break;
          case "whatsapp_button_text":
            settings.buttonText = typeof value === "string" ? value : String(value || DEFAULT_SETTINGS.buttonText);
            break;
          case "whatsapp_locations":
            settings.locations = Array.isArray(value) ? value : DEFAULT_SETTINGS.locations;
            break;
          case "whatsapp_open_mode":
            settings.openMode = (value === "new_tab" || value === "same_tab") ? value : DEFAULT_SETTINGS.openMode;
            break;
        }
      });

      return {
        ...DEFAULT_SETTINGS,
        ...settings,
      };
    },
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache
    refetchOnWindowFocus: true, // Refetch when window gains focus
  });
};
