import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Smartphone, CreditCard, Plus, Star, Trash2, Check, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  useSavedPaymentMethods,
  useAddPaymentMethod,
  useUpdatePaymentMethod,
  useDeletePaymentMethod,
  useSetDefaultPaymentMethod,
  SavedPaymentMethod,
} from '@/hooks/useSavedPaymentMethods';
import BottomNavigation from '@/components/BottomNavigation';

type MethodType = 'mpesa' | 'card';

const emptyForm = {
  type: 'mpesa' as MethodType,
  label: '',
  // mpesa
  phone: '',
  // card
  card_holder: '',
  card_last4: '',
  card_expiry: '',
  is_default: false,
};

const PaymentMethods = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const { data: methods = [], isLoading } = useSavedPaymentMethods();
  const addMethod = useAddPaymentMethod();
  const updateMethod = useUpdatePaymentMethod();
  const deleteMethod = useDeletePaymentMethod();
  const setDefault = useSetDefaultPaymentMethod();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [methodToDelete, setMethodToDelete] = useState<SavedPaymentMethod | null>(null);

  React.useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [user, authLoading, navigate]);

  const openAdd = () => { setEditingId(null); setForm(emptyForm); setSheetOpen(true); };
  const openEdit = (m: SavedPaymentMethod) => {
    setEditingId(m.id);
    setForm({
      type: m.type,
      label: m.label,
      phone: m.phone || '',
      card_holder: m.card_holder || '',
      card_last4: m.card_last4 || '',
      card_expiry: m.card_expiry || '',
      is_default: m.is_default,
    });
    setSheetOpen(true);
  };

  const set = (field: string, value: string | boolean) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.label) {
      toast({ title: 'Label is required', variant: 'destructive' });
      return;
    }
    if (form.type === 'mpesa') {
      if (!form.phone) { toast({ title: 'Phone number is required', variant: 'destructive' }); return; }
      if (form.phone.replace(/\D/g, '').length < 10) {
        toast({ title: 'Enter a valid phone number (min. 10 digits)', variant: 'destructive' }); return;
      }
    } else {
      if (!form.card_holder) { toast({ title: 'Cardholder name is required', variant: 'destructive' }); return; }
      if (!form.card_last4 || !/^\d{4}$/.test(form.card_last4)) {
        toast({ title: 'Enter the last 4 digits of your card', variant: 'destructive' }); return;
      }
      if (!form.card_expiry || !/^\d{2}\/\d{2}$/.test(form.card_expiry)) {
        toast({ title: 'Enter expiry as MM/YY', variant: 'destructive' }); return;
      }
    }

    const payload: any = {
      type: form.type,
      label: form.label,
      is_default: form.is_default,
      phone: form.type === 'mpesa' ? form.phone : null,
      card_holder: form.type === 'card' ? form.card_holder : null,
      card_last4: form.type === 'card' ? form.card_last4 : null,
      card_expiry: form.type === 'card' ? form.card_expiry : null,
    };

    try {
      if (editingId) {
        await updateMethod.mutateAsync({ id: editingId, ...payload });
        toast({ title: 'Payment method updated' });
      } else {
        await addMethod.mutateAsync(payload);
        toast({ title: 'Payment method saved' });
      }
      setSheetOpen(false);
      setForm(emptyForm);
      setEditingId(null);
    } catch {
      toast({ title: 'Failed to save', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!methodToDelete) return;
    try {
      await deleteMethod.mutateAsync(methodToDelete.id);
      toast({ title: 'Payment method deleted' });
    } catch {
      toast({ title: 'Failed to delete', variant: 'destructive' });
    } finally {
      setMethodToDelete(null);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefault.mutateAsync(id);
      toast({ title: 'Default updated' });
    } catch {
      toast({ title: 'Failed to update default', variant: 'destructive' });
    }
  };

  if (authLoading) return null;

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="border-b border-border">
        <div className="flex items-center gap-3 p-4">
          <button onClick={() => navigate('/profile')} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display text-xl">Payment methods</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-3">
        <button
          onClick={openAdd}
          className="w-full flex items-center gap-3 p-4 border border-dashed border-border rounded-none hover:border-foreground/40 hover:bg-secondary/30 transition-colors group"
        >
          <Plus className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
          <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground">
            Add payment method
          </span>
        </button>

        {isLoading && <div className="text-center py-8 text-sm text-muted-foreground">Loading…</div>}

        {!isLoading && methods.length === 0 && (
          <div className="text-center py-12 space-y-2">
            <CreditCard className="w-8 h-8 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">No saved payment methods yet</p>
            <p className="text-xs text-muted-foreground">Save a method to speed up checkout</p>
          </div>
        )}

        {methods.map((m) => (
          <div
            key={m.id}
            className={`border rounded-none p-4 ${m.is_default ? 'border-foreground' : 'border-border'}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className={`w-9 h-9 flex items-center justify-center flex-shrink-0 mt-0.5 ${m.type === 'mpesa' ? 'bg-green-600' : 'bg-blue-600'}`}>
                  {m.type === 'mpesa'
                    ? <Smartphone className="w-4 h-4 text-white" />
                    : <CreditCard className="w-4 h-4 text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm">{m.label}</p>
                    {m.is_default && (
                      <span className="text-[10px] uppercase tracking-wider font-semibold bg-foreground text-background px-1.5 py-0.5">
                        Default
                      </span>
                    )}
                  </div>
                  {m.type === 'mpesa' && <p className="text-xs text-muted-foreground mt-0.5">{m.phone}</p>}
                  {m.type === 'card' && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {m.card_holder} · **** {m.card_last4} · {m.card_expiry}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">
                    {m.type === 'mpesa' ? 'M-Pesa' : 'Card'}
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-1 flex-shrink-0">
                {!m.is_default
                  ? <button onClick={() => handleSetDefault(m.id)} title="Set as default" className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"><Star className="w-4 h-4" /></button>
                  : <span className="p-1.5 text-foreground"><Check className="w-4 h-4" /></span>}
                <button onClick={() => openEdit(m)} title="Edit" className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => setMethodToDelete(m)} title="Delete" className="p-1.5 text-muted-foreground hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        ))}

        <p className="text-xs text-muted-foreground text-center pt-4">
          The default method will be pre-selected at checkout.
        </p>
      </main>

      {/* Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle>{editingId ? 'Edit payment method' : 'Add payment method'}</SheetTitle>
          </SheetHeader>

          <form onSubmit={handleSave} className="space-y-4">
            {/* Type selector */}
            {!editingId && (
              <div>
                <Label className="text-xs uppercase tracking-wider">Type</Label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {(['mpesa', 'card'] as MethodType[]).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => set('type', t)}
                      className={`flex items-center gap-2 p-3 border text-sm transition-colors ${form.type === t ? 'border-foreground bg-foreground text-background' : 'border-border hover:border-foreground/40'}`}
                    >
                      {t === 'mpesa' ? <Smartphone className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
                      {t === 'mpesa' ? 'M-Pesa' : 'Card'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <Label className="text-xs uppercase tracking-wider">Label *</Label>
              <Input
                className="mt-1 rounded-none h-10"
                placeholder={form.type === 'mpesa' ? 'e.g. My Phone' : 'e.g. Visa Personal'}
                value={form.label}
                onChange={e => set('label', e.target.value)}
                required
              />
            </div>

            {/* M-Pesa fields */}
            {form.type === 'mpesa' && (
              <div>
                <Label className="text-xs uppercase tracking-wider">M-Pesa phone *</Label>
                <Input
                  className="mt-1 rounded-none h-10"
                  type="tel"
                  placeholder="07XXXXXXXX"
                  value={form.phone}
                  onChange={e => set('phone', e.target.value)}
                  required
                />
              </div>
            )}

            {/* Card fields */}
            {form.type === 'card' && (
              <>
                <div>
                  <Label className="text-xs uppercase tracking-wider">Cardholder name *</Label>
                  <Input
                    className="mt-1 rounded-none h-10"
                    placeholder="As on card"
                    value={form.card_holder}
                    onChange={e => set('card_holder', e.target.value)}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs uppercase tracking-wider">Last 4 digits *</Label>
                    <Input
                      className="mt-1 rounded-none h-10"
                      placeholder="4242"
                      maxLength={4}
                      value={form.card_last4}
                      onChange={e => set('card_last4', e.target.value.replace(/\D/g, ''))}
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-xs uppercase tracking-wider">Expiry *</Label>
                    <Input
                      className="mt-1 rounded-none h-10"
                      placeholder="MM/YY"
                      maxLength={5}
                      value={form.card_expiry}
                      onChange={e => {
                        let v = e.target.value.replace(/\D/g, '');
                        if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2, 4);
                        set('card_expiry', v);
                      }}
                      required
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  We only store the last 4 digits for identification. Your full card number is never saved.
                </p>
              </>
            )}

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="pm_default"
                checked={form.is_default}
                onChange={e => set('is_default', e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="pm_default" className="text-sm cursor-pointer">Set as default</Label>
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-foreground text-background hover:bg-foreground/90 rounded-none text-xs uppercase tracking-wider mt-2"
              disabled={addMethod.isPending || updateMethod.isPending}
            >
              {(addMethod.isPending || updateMethod.isPending) ? 'Saving…' : editingId ? 'Update' : 'Save'}
            </Button>
          </form>
        </SheetContent>
      </Sheet>

      {/* Delete dialog */}
      <AlertDialog open={!!methodToDelete} onOpenChange={open => { if (!open) setMethodToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete payment method?</AlertDialogTitle>
            <AlertDialogDescription>
              "{methodToDelete?.label}" will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BottomNavigation />
    </div>
  );
};

export default PaymentMethods;
