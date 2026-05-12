import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getGoogleDriveImagesSimple } from "@/lib/googleDriveIntegration";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";
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
  const [error, setError] = useState<string | null>(null);

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
        disabled={isLoading}
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

      <p className="text-sm text-muted-foreground text-center">
        Click to browse and select images from your Google Drive
      </p>
    </div>
  );
};

export default GoogleDrivePicker;
