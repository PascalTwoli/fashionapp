import { supabase } from "@/integrations/supabase/client";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
// For Picker API, we can use the CLIENT_ID or create a simple API key reference
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GOOGLE_DRIVE_SCOPES = [
  "https://www.googleapis.com/auth/drive.readonly",
  "https://www.googleapis.com/auth/drive.file",
];

// Flags to track if libraries are loaded
let gapiLoaded = false;
let pickerLibraryLoaded = false;

interface GoogleAuthToken {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  createdTime: string;
}

/**
 * Initialize Google OAuth flow
 * Opens popup for user to authenticate with their Google account
 */
export const initiateGoogleOAuth = (): Promise<GoogleAuthToken> => {
  return new Promise((resolve, reject) => {
    const clientId = GOOGLE_API_KEY;
    const redirectUri = `${window.location.origin}/auth/google-callback`;
    const scope = GOOGLE_DRIVE_SCOPES.join(" ");
    const state = generateRandomState();

    // Store state in sessionStorage for verification on callback
    sessionStorage.setItem("google_oauth_state", state);

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: scope,
      state: state,
      access_type: "offline",
      prompt: "consent",
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    // Open popup window
    const width = 500;
    const height = 600;
    const left = window.screenLeft + (window.outerWidth - width) / 2;
    const top = window.screenTop + (window.outerHeight - height) / 2;

    const popup = window.open(
      authUrl,
      "google_oauth",
      `width=${width},height=${height},left=${left},top=${top}`
    );

    if (!popup) {
      reject(new Error("Failed to open authentication popup"));
      return;
    }

    // Listen for messages from callback
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data.type === "GOOGLE_AUTH_SUCCESS") {
        window.removeEventListener("message", handleMessage);
        popup.close();
        resolve(event.data.token);
      } else if (event.data.type === "GOOGLE_AUTH_ERROR") {
        window.removeEventListener("message", handleMessage);
        popup.close();
        reject(new Error(event.data.error));
      }
    };

    window.addEventListener("message", handleMessage);

    // Timeout after 10 minutes
    setTimeout(() => {
      window.removeEventListener("message", handleMessage);
      popup?.close();
      reject(new Error("Google OAuth timeout"));
    }, 10 * 60 * 1000);
  });
};

/**
 * Store Google OAuth tokens
 * Primary: Try to store in profiles table
 * Fallback: Store in localStorage with user ID key
 */
export const storeGoogleTokens = async (
  userId: string,
  token: GoogleAuthToken
) => {
  try {
    const expiresAt = new Date(Date.now() + token.expires_in * 1000).toISOString();

    // Try to store in database first
    const { error } = await supabase
      .from("profiles")
      .update({
        google_drive_access_token: token.access_token,
        google_drive_refresh_token: token.refresh_token || null,
        google_drive_token_expires_at: expiresAt,
      } as any)
      .eq("id", userId);

    if (!error) {
      console.log("[storeGoogleTokens] Tokens stored in database successfully");
      return;
    }

    // Fallback: Store in localStorage
    console.warn(
      "[storeGoogleTokens] Database storage failed, using localStorage fallback:",
      error.message
    );
    
    const tokenData = {
      access_token: token.access_token,
      refresh_token: token.refresh_token,
      expires_at: expiresAt,
    };
    
    localStorage.setItem(
      `google_drive_token_${userId}`,
      JSON.stringify(tokenData)
    );
    console.log("[storeGoogleTokens] Tokens stored in localStorage as fallback");
  } catch (err) {
    console.error("[storeGoogleTokens] Unexpected error:", err);
    // Still try localStorage as last resort
    try {
      const expiresAt = new Date(Date.now() + token.expires_in * 1000).toISOString();
      const tokenData = {
        access_token: token.access_token,
        refresh_token: token.refresh_token,
        expires_at: expiresAt,
      };
      localStorage.setItem(
        `google_drive_token_${userId}`,
        JSON.stringify(tokenData)
      );
    } catch (storageErr) {
      console.error("[storeGoogleTokens] localStorage also failed:", storageErr);
    }
  }
};

/**
 * Get stored Google tokens from database or localStorage fallback
 */
export const getStoredGoogleTokens = async (userId: string) => {
  try {
    // Try database first
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "google_drive_access_token, google_drive_refresh_token, google_drive_token_expires_at"
      )
      .eq("id", userId);

    if (!error && data && data.length > 0) {
      const profile = data[0];
      console.log("[getStoredGoogleTokens] Found tokens in database");
      return {
        access_token: (profile as any)?.google_drive_access_token,
        refresh_token: (profile as any)?.google_drive_refresh_token,
        expires_at: (profile as any)?.google_drive_token_expires_at,
      };
    }

    console.log("[getStoredGoogleTokens] No tokens in database, checking localStorage");
  } catch (err) {
    console.warn("[getStoredGoogleTokens] Database query error:", err);
  }

  // Fallback: Check localStorage
  try {
    const stored = localStorage.getItem(`google_drive_token_${userId}`);
    if (stored) {
      const tokenData = JSON.parse(stored);
      console.log("[getStoredGoogleTokens] Found tokens in localStorage");
      return tokenData;
    }
  } catch (err) {
    console.warn("[getStoredGoogleTokens] localStorage error:", err);
  }

  console.log("[getStoredGoogleTokens] No tokens found anywhere");
  return null;
};

/**
 * Check if stored token is expired
 */
export const isTokenExpired = (expiresAt: string | null): boolean => {
  if (!expiresAt) return true;
  return new Date(expiresAt) < new Date();
};

/**
 * Refresh Google OAuth token using refresh token
 * Note: This requires backend implementation to avoid exposing client secret
 * For now, we'll prompt user to re-authenticate
 */
export const refreshGoogleToken = async (
  userId: string,
  refreshToken: string
): Promise<GoogleAuthToken> => {
  // In a production app, this should be done server-side
  // For now, we'll trigger re-authentication
  console.warn(
    "[refreshGoogleToken] Token refresh requires re-authentication"
  );
  throw new Error(
    "Token expired. Please re-authenticate with Google Drive."
  );
};

/**
 * Fetch image files from user's Google Drive
 * Filters for image MIME types only
 */
export const fetchGoogleDriveImages = async (
  accessToken: string,
  pageSize: number = 50
): Promise<GoogleDriveFile[]> => {
  const query = encodeURIComponent(
    "mimeType contains 'image/' and trashed = false"
  );
  const fields = encodeURIComponent(
    "files(id, name, mimeType, webViewLink, createdTime, thumbnailLink)"
  );

  try {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${query}&spaces=drive&fields=${fields}&pageSize=${pageSize}&orderBy=createdTime desc`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `Google Drive API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    console.log(
      "[fetchGoogleDriveImages] Fetched",
      data.files?.length || 0,
      "images"
    );

    return data.files || [];
  } catch (error) {
    console.error("[fetchGoogleDriveImages] Error:", error);
    throw error;
  }
};

/**
 * Download image from Google Drive as a File object
 * This is necessary because we need to upload the file to Supabase
 */
export const downloadGoogleDriveImage = async (
  fileId: string,
  fileName: string,
  accessToken: string
): Promise<File> => {
  try {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to download file: ${response.status} ${response.statusText}`
      );
    }

    const blob = await response.blob();
    const file = new File([blob], fileName, { type: blob.type });

    console.log("[downloadGoogleDriveImage] Downloaded:", fileName);
    return file;
  } catch (error) {
    console.error("[downloadGoogleDriveImage] Error downloading", fileName);
    throw error;
  }
};

/**
 * Download multiple images from Google Drive
 */
export const downloadMultipleGoogleDriveImages = async (
  files: GoogleDriveFile[],
  accessToken: string
): Promise<File[]> => {
  const downloadedFiles: File[] = [];
  const errors: string[] = [];

  for (const file of files) {
    try {
      const downloadedFile = await downloadGoogleDriveImage(
        file.id,
        file.name,
        accessToken
      );
      downloadedFiles.push(downloadedFile);
    } catch (error) {
      console.error(`Failed to download ${file.name}:`, error);
      errors.push(`${file.name}: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  if (errors.length > 0) {
    console.warn("[downloadMultipleGoogleDriveImages] Download errors:", errors);
  }

  return downloadedFiles;
};

/**
 * Check if user has valid Google Drive access
 */
export const hasValidGoogleDriveAccess = async (userId: string): Promise<boolean> => {
  const tokens = await getStoredGoogleTokens(userId);
  
  if (!tokens?.access_token) {
    return false;
  }

  if (isTokenExpired(tokens.expires_at)) {
    return false;
  }

  return true;
};

/**
 * Generate random state for OAuth security
 */
const generateRandomState = (): string => {
  return Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
};

/**
 * Main entry point: Get Google Drive images for admin
 * Handles authentication, token checking, and image fetching
 */
export const getGoogleDriveImages = async (
  userId: string
): Promise<GoogleDriveFile[]> => {
  try {
    // Check for stored tokens
    const tokens = await getStoredGoogleTokens(userId);

    let accessToken = tokens?.access_token;

    // If no token or expired, prompt for re-authentication
    if (!accessToken || isTokenExpired(tokens?.expires_at || null)) {
      console.log("[getGoogleDriveImages] No valid token, initiating OAuth");
      const newToken = await initiateGoogleOAuth();
      await storeGoogleTokens(userId, newToken);
      accessToken = newToken.access_token;
    }

    // Fetch and return images
    return fetchGoogleDriveImages(accessToken);
  } catch (error) {
    console.error("[getGoogleDriveImages] Error:", error);
    throw error;
  }
};

/**
 * Load Google API client library (gapi)
 */
const loadGapiLibrary = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const w = window as any;
    
    if (gapiLoaded && w.gapi) {
      console.log("[loadGapiLibrary] gapi already loaded");
      resolve();
      return;
    }

    console.log("[loadGapiLibrary] Loading gapi library...");
    const script = document.createElement("script");
    script.src = "https://apis.google.com/js/api.js";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      gapiLoaded = true;
      console.log("[loadGapiLibrary] gapi library onload fired");
      resolve();
    };
    script.onerror = () => {
      console.error("[loadGapiLibrary] Failed to load gapi");
      reject(new Error("Failed to load Google API library"));
    };
    document.head.appendChild(script);
  });
};

/**
 * Load Google Picker library (one-time per page load)
 */
const loadGooglePickerLibrary = (): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      const w = window as any;
      
      if (pickerLibraryLoaded && w.google?.picker) {
        console.log("[loadGooglePickerLibrary] Picker library already loaded");
        resolve();
        return;
      }

      // First load gapi if not already loaded
      if (!gapiLoaded) {
        await loadGapiLibrary();
      }

      // Then load the picker library
      console.log("[loadGooglePickerLibrary] Loading picker library...");
      const script = document.createElement("script");
      script.src = "https://apis.google.com/js/picker.js";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        pickerLibraryLoaded = true;
        console.log("[loadGooglePickerLibrary] Picker library onload fired");
        resolve();
      };
      script.onerror = () => {
        console.error("[loadGooglePickerLibrary] Failed to load picker");
        reject(new Error("Failed to load Google Picker library"));
      };
      document.head.appendChild(script);
    } catch (error) {
      console.error("[loadGooglePickerLibrary] Error:", error);
      reject(error);
    }
  });
};

/**
 * Open Google Picker for file selection
 * Shows native Google Drive interface with full folder browsing
 */
export const openGoogleFilePicker = (
  accessToken: string
): Promise<GoogleDriveFile[]> => {
  return new Promise(async (resolve, reject) => {
    try {
      const w = window as any;
      
      // Load the Picker library if not already loaded
      console.log("[openGoogleFilePicker] Loading picker library...");
      await loadGooglePickerLibrary();

      // Wait for google.picker to be available
      let attempts = 0;
      const maxAttempts = 20;
      while (attempts < maxAttempts) {
        if (w.google && w.google.picker) {
          console.log("[openGoogleFilePicker] google.picker is available");
          break;
        }
        console.log(`[openGoogleFilePicker] Waiting for google.picker... attempt ${attempts + 1}/${maxAttempts}`);
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }

      if (!w.google || !w.google.picker) {
        console.error("[openGoogleFilePicker] google object:", w.google);
        throw new Error("Google Picker API not available after loading library");
      }

      console.log("[openGoogleFilePicker] Creating picker instance");

      // Create the picker instance
      const picker = new w.google.picker.PickerBuilder()
        .addView(w.google.picker.ViewId.DOCS)  // Show Drive files/folders
        .setOAuthToken(accessToken)            // Use the user's access token
        .setCallback(async (data: any) => {
          console.log("[openGoogleFilePicker] Picker callback:", data);
          
          if (data.action === w.google.picker.Action.PICKED) {
            const selectedFiles: GoogleDriveFile[] = [];
            
            // Process each selected document
            for (const doc of data.docs) {
              // Only process image files
              if (doc.mimeType?.startsWith("image/")) {
                selectedFiles.push({
                  id: doc.id,
                  name: doc.name,
                  mimeType: doc.mimeType,
                  webViewLink: doc.url,
                  createdTime: new Date().toISOString(),
                });
              }
            }

            console.log(
              `[openGoogleFilePicker] Selected ${selectedFiles.length} image files`
            );
            resolve(selectedFiles);
          } else if (data.action === w.google.picker.Action.CANCEL) {
            console.log("[openGoogleFilePicker] Picker canceled by user");
            resolve([]);
          }
        })
        .build();

      console.log("[openGoogleFilePicker] Showing picker");
      picker.setVisible(true);
    } catch (error) {
      console.error("[openGoogleFilePicker] Error:", error);
      reject(error);
    }
  });
};

/**
 * Main entry point: Get Google Drive images with Picker interface
 * Shows actual Google Drive UI for browsing and selecting files
 */
export const getGoogleDriveImagesSimple = async (
  userId: string
): Promise<File[]> => {
  try {
    console.log("[getGoogleDriveImagesSimple] Starting...");

    // Check for stored tokens
    const tokens = await getStoredGoogleTokens(userId);

    let accessToken = tokens?.access_token;

    // If no token or expired, prompt for re-authentication
    if (!accessToken || isTokenExpired(tokens?.expires_at || null)) {
      console.log(
        "[getGoogleDriveImagesSimple] No valid token, initiating OAuth"
      );
      const newToken = await initiateGoogleOAuth();
      await storeGoogleTokens(userId, newToken);
      accessToken = newToken.access_token;
    }

    console.log("[getGoogleDriveImagesSimple] Opening Google Picker interface...");
    
    // Use Google Picker to let user select files interactively
    const selectedFiles = await openGoogleFilePicker(accessToken);

    if (selectedFiles.length === 0) {
      console.log("[getGoogleDriveImagesSimple] No files selected");
      return [];
    }

    console.log(
      `[getGoogleDriveImagesSimple] User selected ${selectedFiles.length} files, downloading...`
    );
    
    // Download ONLY the files user selected
    const downloadedFiles = await downloadMultipleGoogleDriveImages(
      selectedFiles,
      accessToken
    );

    return downloadedFiles;
  } catch (error) {
    console.error("[getGoogleDriveImagesSimple] Error:", error);
    throw error;
  }
};
