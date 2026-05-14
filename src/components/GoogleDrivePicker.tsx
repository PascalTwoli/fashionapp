import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getGoogleDriveImagesSimple, switchGoogleAccount } from "@/lib/googleDriveIntegration";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface GoogleDrivePickerProps {
  onFilesSelected: (files: File[]) => Promise<void>;
}

const GoogleDrivePicker: React.FC<GoogleDrivePickerProps> = ({
  onFilesSelected,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSwitchGoogleAccount = async () => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to switch accounts",
        variant: "destructive",
      });
      return;
    }

    setIsSwitching(true);
    setError(null);

    try {
      console.log("[GoogleDrivePicker] Switching Google account");
      
      const newToken = await switchGoogleAccount(user.id);
      
      // Store the new token
      const { storeGoogleTokens } = await import("@/lib/googleDriveIntegration");
      await storeGoogleTokens(user.id, newToken);
      
      toast({
        title: "Success",
        description: "Google account switched successfully",
      });

      // Automatically open picker with new account
      setTimeout(() => {
        handleOpenGoogleDrivePicker();
      }, 500);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to switch account";
      setError(errorMessage);
      console.error("[GoogleDrivePicker] Error switching account:", err);

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSwitching(false);
    }
  };

  const handleOpenGoogleDrivePicker = async () => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to access Google Drive",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log("[GoogleDrivePicker] Opening Google Drive Picker");

      // Use the simple API to fetch files directly from Google Drive
      // No external Picker UI library - just API calls
      const selectedFiles = await getGoogleDriveImagesSimple(user.id);

      if (selectedFiles.length === 0) {
        console.log("[GoogleDrivePicker] No files selected");
        return;
      }

      console.log(
        `[GoogleDrivePicker] Retrieved ${selectedFiles.length} files`
      );

      toast({
        title: "Success",
        description: `Retrieved ${selectedFiles.length} image(s) from Google Drive`,
      });

      // Notify parent component with downloaded files
      if (onFilesSelected && selectedFiles.length > 0) {
        await onFilesSelected(selectedFiles);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to access Google Drive";
      setError(errorMessage);
      console.error("[GoogleDrivePicker] Error:", err);

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button
        onClick={handleOpenGoogleDrivePicker}
        disabled={isLoading || isSwitching}
        className="w-full"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Opening Google Drive...
          </>
        ) : (
          "Upload from Google Drive"
        )}
      </Button>

      <div className="flex gap-2 items-center justify-between">
        <p className="text-sm text-muted-foreground flex-1">
          Select images from your Google Drive
        </p>
        
        <Button
          onClick={handleSwitchGoogleAccount}
          disabled={isLoading || isSwitching}
          variant="ghost"
          size="sm"
          className="text-xs"
          title="Switch to a different Google account"
        >
          {isSwitching ? (
            <>
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              Switching...
            </>
          ) : (
            <>
              <LogOut className="mr-1 h-3 w-3" />
              Switch Account
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default GoogleDrivePicker;
