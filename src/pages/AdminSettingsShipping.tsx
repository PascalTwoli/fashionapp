import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useShippingSettings, useUpdateShippingSettings } from "@/hooks/useShippingSettings";

export default function AdminSettingsShipping() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: shippingData } = useShippingSettings();
  const { mutate: saveShipping, isPending: saving } = useUpdateShippingSettings();

  const [shippingFee, setShippingFee] = useState("");
  const [threshold, setThreshold] = useState("");
  const [savedFee, setSavedFee] = useState("");
  const [savedThreshold, setSavedThreshold] = useState("");

  useEffect(() => {
    if (shippingData) {
      const fee = String(shippingData.shipping_fee);
      const thr = String(shippingData.free_shipping_threshold);
      setShippingFee(fee);
      setThreshold(thr);
      setSavedFee(fee);
      setSavedThreshold(thr);
    }
  }, [shippingData]);

  const isDirty = shippingFee !== savedFee || threshold !== savedThreshold;

  const handleSave = () =>
    saveShipping(
      {
        shipping_fee:            Math.max(0, Number(shippingFee) || 0),
        free_shipping_threshold: Math.max(0, Number(threshold) || 0),
      },
      {
        onSuccess: () => {
          setSavedFee(shippingFee);
          setSavedThreshold(threshold);
          toast({ title: "Shipping settings saved" });
        },
        onError: () => toast({ title: "Failed to save", variant: "destructive" }),
      }
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
            <h1 className="text-base font-bold">Shipping</h1>
            <p className="text-xs text-muted-foreground hidden sm:block">Delivery fees and free shipping rules</p>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              <CardTitle>Delivery Fees</CardTitle>
            </div>
            <CardDescription>
              Changes take effect immediately for all new orders.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Standard Delivery Fee (KES)</Label>
                <Input
                  type="number"
                  min="0"
                  value={shippingFee}
                  onChange={(e) => setShippingFee(e.target.value)}
                  placeholder="500"
                />
                <p className="text-xs text-muted-foreground">Set to 0 for always-free delivery</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Free Shipping Threshold (KES)</Label>
                <Input
                  type="number"
                  min="0"
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                  placeholder="10000"
                />
                <p className="text-xs text-muted-foreground">
                  Orders at or above this get free delivery. Set to 0 to always charge.
                </p>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={!isDirty || saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
