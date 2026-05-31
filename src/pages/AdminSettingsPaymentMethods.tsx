import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CreditCard, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAllPaymentProviders, useUpdatePaymentProvider } from "@/hooks/usePaymentConfig";
import type { PaymentProvider } from "@/types/payments";

export default function AdminSettingsPaymentMethods() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: providers = [], isLoading } = useAllPaymentProviders();
  const { mutate: updateProvider, isPending: updating } = useUpdatePaymentProvider();

  return (
    <div className="min-h-screen bg-secondary">
      <header className="sticky top-0 z-30 h-14 bg-background border-b border-border flex items-center">
        <div className="max-w-7xl mx-auto px-6 w-full flex items-center gap-3">
          <Button variant="ghost" size="icon"
            onClick={() => navigate("/admin", { state: { tab: "settings" } })}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-base font-bold">Payment Methods</h1>
            <p className="text-xs text-muted-foreground hidden sm:block">Control which payment options appear at checkout</p>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              <CardTitle>Checkout Payment Methods</CardTitle>
            </div>
            <CardDescription>
              Enabled methods appear in checkout. Changes are instant — no deployment required.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : providers.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No providers found. Run the latest database migration.
              </p>
            ) : (
              providers.map((provider: PaymentProvider) => (
                <div
                  key={provider.provider_code}
                  className="flex items-center justify-between p-4 border rounded-lg bg-background"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{provider.provider_name}</p>
                      {!provider.enabled && provider.configuration?.note && (
                        <Badge variant="outline" className="text-xs">
                          {provider.configuration.note}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {provider.configuration?.description}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant={provider.enabled ? "default" : "outline"}
                    disabled={updating}
                    onClick={() =>
                      updateProvider(
                        { code: provider.provider_code, enabled: !provider.enabled },
                        {
                          onSuccess: () =>
                            toast({
                              title: provider.enabled
                                ? `${provider.provider_name} disabled`
                                : `${provider.provider_name} enabled`,
                            }),
                          onError: (err: Error) =>
                            toast({
                              title: `Failed to ${provider.enabled ? "disable" : "enable"} ${provider.provider_name}`,
                              description: err.message,
                              variant: "destructive",
                            }),
                        }
                      )
                    }
                  >
                    {provider.enabled ? "Enabled" : "Disabled"}
                  </Button>
                </div>
              ))
            )}

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                M-Pesa and Cash on Delivery are enabled by default. Card and PayPal require
                additional integration before enabling.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
