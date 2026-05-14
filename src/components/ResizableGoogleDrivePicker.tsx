import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getGoogleDriveImagesSimple, switchGoogleAccount } from "@/lib/googleDriveIntegration";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, LogOut, X, Maximize2, Minimize2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ResizableGoogleDrivePickerProps {
  onFilesSelected: (files: File[]) => Promise<void>;
  isOpen: boolean;
  onClose: () => void;
}

const ResizableGoogleDrivePicker: React.FC<ResizableGoogleDrivePickerProps> = ({
  onFilesSelected,
  isOpen,
  onClose,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const containerRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<HTMLDivElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  
  // State for position and size
  const [dimensions, setDimensions] = useState({
    width: 600,
    height: 700,
    top: 50,
    left: "50%",
  });

  const [originalDimensions, setOriginalDimensions] = useState(dimensions);

  // Handle resizing from bottom-right corner
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const newWidth = Math.max(400, e.clientX - rect.left);
      const newHeight = Math.max(300, e.clientY - rect.top);

      setDimensions((prev) => ({
        ...prev,
        width: newWidth,
        height: newHeight,
      }));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isResizing]);

  // Handle sticky positioning when reaching top
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      
      // Sticky behavior: when container reaches top, fix it
      if (rect.top <= 20) {
        containerRef.current.style.position = "fixed";
        containerRef.current.style.top = "20px";
      } else if (dimensions.top < window.scrollY) {
        containerRef.current.style.position = "fixed";
        containerRef.current.style.top = "20px";
      } else {
        containerRef.current.style.position = "absolute";
        containerRef.current.style.top = `${dimensions.top}px`;
      }
    };

    if (isOpen) {
      window.addEventListener("scroll", handleScroll);
      return () => window.removeEventListener("scroll", handleScroll);
    }
  }, [isOpen, dimensions.top]);

  const toggleMaximize = () => {
    if (isMaximized) {
      setDimensions(originalDimensions);
      setIsMaximized(false);
    } else {
      setOriginalDimensions(dimensions);
      setDimensions({
        width: window.innerWidth - 40,
        height: window.innerHeight - 100,
        top: 50,
        left: "50%",
      });
      setIsMaximized(true);
    }
  };

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
      console.log("[ResizableGoogleDrivePicker] Switching Google account");

      const newToken = await switchGoogleAccount(user.id);

      const { storeGoogleTokens } = await import("@/lib/googleDriveIntegration");
      await storeGoogleTokens(user.id, newToken);

      toast({
        title: "Success",
        description: "Google account switched successfully",
      });

      setTimeout(() => {
        handleOpenGoogleDrivePicker();
      }, 500);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to switch account";
      setError(errorMessage);
      console.error("[ResizableGoogleDrivePicker] Error switching account:", err);

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
      console.log("[ResizableGoogleDrivePicker] Opening Google Drive Picker");

      const selectedFiles = await getGoogleDriveImagesSimple(user.id);

      if (selectedFiles.length === 0) {
        console.log("[ResizableGoogleDrivePicker] No files selected");
        return;
      }

      console.log(
        `[ResizableGoogleDrivePicker] Retrieved ${selectedFiles.length} files`
      );

      toast({
        title: "Success",
        description: `Retrieved ${selectedFiles.length} image(s) from Google Drive`,
      });

      if (onFilesSelected && selectedFiles.length > 0) {
        await onFilesSelected(selectedFiles);
      }

      // Close the modal after successful selection
      onClose();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to access Google Drive";
      setError(errorMessage);
      console.error("[ResizableGoogleDrivePicker] Error:", err);

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Resizable Modal Container */}
      <div
        ref={containerRef}
        className="fixed bg-white rounded-lg shadow-lg z-50 flex flex-col"
        style={{
          width: `${dimensions.width}px`,
          height: `${dimensions.height}px`,
          top: `${dimensions.top}px`,
          left:
            dimensions.left === "50%"
              ? `calc(50% - ${dimensions.width / 2}px)`
              : dimensions.left,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <h2 className="text-lg font-semibold">Google Drive Picker</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMaximize}
              className="p-1 hover:bg-gray-200 rounded transition"
              title={isMaximized ? "Restore" : "Maximize"}
            >
              {isMaximized ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-200 rounded transition"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
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
                "Browse and Select Images"
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

            <div className="text-xs text-muted-foreground space-y-2 mt-6 pt-4 border-t">
              <p>💡 <strong>Tips:</strong></p>
              <ul className="list-disc list-inside space-y-1">
                <li>Drag the bottom-right corner to resize</li>
                <li>Use maximize button to fullscreen</li>
                <li>Modal will stick when reaching the top</li>
                <li>Hold Ctrl/Cmd to select multiple images</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Resize Handle */}
        <div
          ref={resizeRef}
          onMouseDown={() => setIsResizing(true)}
          className={`absolute bottom-0 right-0 w-6 h-6 cursor-se-resize hover:bg-blue-500 transition rounded-tl-lg ${
            isResizing ? "bg-blue-500" : "bg-gray-300"
          }`}
          title="Drag to resize (min: 400x300)"
        />
      </div>
    </>
  );
};

export default ResizableGoogleDrivePicker;
