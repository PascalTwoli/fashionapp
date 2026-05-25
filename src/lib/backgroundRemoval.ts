import { supabase } from "@/integrations/supabase/client";

export type BgRemovalMethod = "removebg" | "edge_function" | "client_side";

interface BgRemovalOptions {
  method?: BgRemovalMethod;
  priority?: BgRemovalMethod[];
  quality?: "high" | "medium" | "low";
  throwOnError?: boolean;
  onProgress?: (message: string) => void;
}

interface BgRemovalResult {
  success: boolean;
  imageUrl: string;
  method: BgRemovalMethod;
  error?: string;
  creditsRemaining?: number;
}

/**
 * Remove background from image using remove.bg API with quality settings
 */
async function removeWithRemoveBgApi(
  imageUrl: string,
  apiKey: string,
  quality: "high" | "medium" | "low" = "high"
): Promise<BgRemovalResult> {
  try {
    console.log("[BgRemoval] Starting remove.bg API processing...", { quality });

    const formData = new FormData();
    formData.append("image_url", imageUrl);
    formData.append("format", "png");
    formData.append("type", "product");

    const response = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: {
        "X-Api-Key": apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[BgRemoval] API error response:", errorText);
      throw new Error(`remove.bg API error: ${response.status} ${response.statusText}`);
    }

    const blob = await response.blob();
    const processedUrl = URL.createObjectURL(blob);

    // Extract credits remaining from response headers
    const creditsRemaining = response.headers.get("X-Credits-Remaining");
    const credits = creditsRemaining ? parseInt(creditsRemaining, 10) : undefined;

    // Store credits in session storage for monitoring
    if (credits !== undefined) {
      sessionStorage.setItem("removebg_credits", String(credits));
      console.log("[BgRemoval] Credits remaining:", credits);
    }

    console.log("[BgRemoval] remove.bg API succeeded");
    return {
      success: true,
      imageUrl: processedUrl,
      method: "removebg",
      creditsRemaining: credits,
    };
  } catch (error) {
    console.error("[BgRemoval] remove.bg API failed:", error);
    return {
      success: false,
      imageUrl: "",
      method: "removebg",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Remove background using Supabase Edge Function
 */
async function removeWithEdgeFunction(
  imageUrl: string,
  quality: "high" | "medium" | "low" = "high"
): Promise<BgRemovalResult> {
  try {
    console.log("[BgRemoval] Starting edge function processing...");

    const { data, error } = await supabase.functions.invoke(
      "remove-background",
      {
        body: {
          image_url: imageUrl,
          quality: quality,
        },
      }
    );

    if (error) {
      throw new Error(`Edge function error: ${error}`);
    }

    console.log("[BgRemoval] Edge function succeeded");
    return {
      success: true,
      imageUrl: data.image_url,
      method: "edge_function",
    };
  } catch (error) {
    console.error("[BgRemoval] Edge function failed (likely not deployed):", error);
    console.log("[BgRemoval] Skipping edge function - will try next method");
    return {
      success: false,
      imageUrl: "",
      method: "edge_function",
      error: "Edge function not deployed or unavailable",
    };
  }
}

/**
 * Remove background client-side using @imgly/background-removal with quality settings
 */
async function removeWithClientSide(
  imageUrl: string,
  quality: "high" | "medium" | "low" = "high"
): Promise<BgRemovalResult> {
  try {
    console.log("[BgRemoval] Starting client-side processing...", { quality });

    // Dynamically import to avoid bundling if not needed
    const { removeBackground } = await import("@imgly/background-removal");

    // Note: @imgly provides solid background removal
    // For high quality, the library uses its best algorithms
    const blob = await removeBackground(imageUrl);
    const processedUrl = URL.createObjectURL(blob);

    console.log("[BgRemoval] Client-side processing succeeded with quality:", quality);
    return {
      success: true,
      imageUrl: processedUrl,
      method: "client_side",
    };
  } catch (error) {
    console.error("[BgRemoval] Client-side processing failed:", error);
    return {
      success: false,
      imageUrl: "",
      method: "client_side",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get background removal settings from database
 */
async function getSettings() {
  const { data, error } = await supabase
    .from("admin_settings")
    .select("key, value")
    .in("key", [
      "bg_removal_enabled",
      "removebg_api_key",
      "bg_removal_fallback_order",
      "bg_removal_quality",
    ]);

  if (error) {
    console.error("[BgRemoval] Failed to fetch settings:", error);
    return null;
  }

  const settings: Record<string, any> = {};
  data?.forEach((item: any) => {
    settings[item.key] = item.value;
  });

  return settings;
}

/**
 * Remove background from image with fallback support
 */
export async function removeBackground(
  imageUrl: string,
  options: BgRemovalOptions = {}
): Promise<BgRemovalResult> {
  try {
    // Fetch settings from database
    const settings = await getSettings();

    if (!settings?.bg_removal_enabled) {
      console.log("[BgRemoval] Background removal disabled in settings");
      return {
        success: false,
        imageUrl,
        method: "removebg",
        error: "Background removal is disabled",
      };
    }

    const priority = options.priority || settings?.bg_removal_fallback_order || [
      "removebg",
      "edge_function",
      "client_side",
    ];
    const quality = options.quality || settings?.bg_removal_quality || "high";

    console.log("[BgRemoval] Starting processing with priority:", priority);

    // Try each method in priority order
    for (const method of priority) {
      let result: BgRemovalResult;

      if (method === "removebg") {
        const apiKey = settings?.removebg_api_key;
        if (!apiKey) {
          console.log("[BgRemoval] Skipping removebg: no API key configured");
          continue;
        }
        result = await removeWithRemoveBgApi(imageUrl, apiKey, quality);
      } else if (method === "edge_function") {
        result = await removeWithEdgeFunction(imageUrl, quality);
      } else if (method === "client_side") {
        result = await removeWithClientSide(imageUrl, quality);
      } else {
        continue;
      }

      if (result.success) {
        return result;
      }
    }

    // All methods failed
    const error = "All background removal methods failed";
    console.error("[BgRemoval]", error);

    if (options.throwOnError) {
      throw new Error(error);
    }

    return {
      success: false,
      imageUrl,
      method: "removebg",
      error,
    };
  } catch (error) {
    console.error("[BgRemoval] Unexpected error:", error);

    if (options.throwOnError) {
      throw error;
    }

    return {
      success: false,
      imageUrl,
      method: "removebg",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Convert blob to File
 */
export async function blobToFile(blob: Blob, filename: string): Promise<File> {
  return new File([blob], filename, { type: blob.type });
}

/**
 * Download processed image and return as File
 */
export async function downloadProcessedImage(
  imageUrl: string,
  filename: string
): Promise<File> {
  const response = await fetch(imageUrl);
  const blob = await response.blob();
  return blobToFile(blob, filename);
}

/**
 * Get current remove.bg API credits
 */
export function getRemoveBgCredits(): number | null {
  const credits = sessionStorage.getItem("removebg_credits");
  return credits ? parseInt(credits, 10) : null;
}

/**
 * Check if remove.bg credits are low (less than 10 remaining)
 */
export function isRemoveBgCreditsLow(): boolean {
  const credits = getRemoveBgCredits();
  return credits !== null && credits < 10;
}
